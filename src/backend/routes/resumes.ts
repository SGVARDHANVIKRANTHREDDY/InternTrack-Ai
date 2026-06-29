import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { callGeminiWithFallback } from '../lib/gemini.js';

const prisma = new PrismaClient();
const router = Router();

const ResumeUploadSchema = z.object({
  resumeName: z.string().min(1, 'Resume name is required').max(255),
  targetRole: z.string().max(200).optional().nullable(),
  fileContent: z.string().optional().nullable(),
  fileUrl: z.string().url().or(z.string().length(0)).optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

const ResumeRenameSchema = z.object({
  resumeName: z.string().min(1, 'Resume name is required').max(255),
});

const ResumeAnalyzeSchema = z.object({
  targetRole: z.string().min(1, 'Target role is required').max(200),
});

const QuickResumeAnalyzeSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  targetRole: z.string().min(1, 'Target role is required').max(200),
});

function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      logger.warn('Validation failed', { requestId: req.id, errors });
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ==========================================
// ROUTES
// ==========================================

router.get('/', authenticate, async (req: any, res) => {
  try {
    const resumes = await prisma.resumeVersion.findMany({ 
      where: { userId: req.userId }, 
      orderBy: { createdAt: 'desc' },
      include: { applications: true }
    });
    res.json(resumes);
  } catch (err) {
    logger.error('Error listing resumes', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const resumes = await prisma.resumeVersion.findMany({
      where: { userId: req.userId },
      include: { applications: true }
    });

    const totalResumes = resumes.length;
    let bestAtsScore = 0;
    let mostUsedResume: any = null;
    let maxUsedCount = -1;
    let latestUpload: Date | null = null;

    resumes.forEach(r => {
      if (r.atsScore && r.atsScore > bestAtsScore) {
        bestAtsScore = r.atsScore;
      }
      const count = r.applications.length;
      if (count > maxUsedCount) {
        maxUsedCount = count;
        mostUsedResume = r;
      }
      if (!latestUpload || r.createdAt > latestUpload) {
        latestUpload = r.createdAt;
      }
    });

    let highestInterviewRate = 0;
    let highestOfferRate = 0;

    resumes.forEach(r => {
      const apps = r.applications;
      if (apps.length > 0) {
        const interviews = apps.filter((app: any) => 
          ['Interview Scheduled', 'Interview Completed', 'Offer Received'].includes(app.status)
        ).length;
        const offers = apps.filter((app: any) => app.status === 'Offer Received').length;

        const intRate = (interviews / apps.length) * 100;
        const offRate = (offers / apps.length) * 100;

        if (intRate > highestInterviewRate) {
          highestInterviewRate = intRate;
        }
        if (offRate > highestOfferRate) {
          highestOfferRate = offRate;
        }
      }
    });

    res.json({
      totalResumes,
      bestAtsScore,
      mostUsedResume: mostUsedResume ? `${mostUsedResume.resumeName} (v${mostUsedResume.versionNumber})` : 'None',
      latestUpload,
      highestInterviewRate: Math.round(highestInterviewRate),
      highestOfferRate: Math.round(highestOfferRate)
    });
  } catch (err) {
    logger.error('Error fetching resume stats', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/compare', authenticate, async (req: any, res) => {
  try {
    const { id1, id2 } = req.query;
    if (!id1 || !id2) {
      res.status(400).json({ error: 'Parameters id1 and id2 are required' });
      return;
    }

    const resume1 = await prisma.resumeVersion.findFirst({
      where: { id: id1 as string, userId: req.userId }
    });
    const resume2 = await prisma.resumeVersion.findFirst({
      where: { id: id2 as string, userId: req.userId }
    });

    if (!resume1 || !resume2) {
      res.status(404).json({ error: 'One or both resumes not found' });
      return;
    }

    res.json({ resume1, resume2 });
  } catch (err) {
    logger.error('Error comparing resumes', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/analyze', authenticate, validate(QuickResumeAnalyzeSchema), async (req: any, res) => {
  try {
    const { resumeText, targetRole } = req.body;
    
    const prompt = `You are an expert technical recruiter analyzing a resume for the role of: "${targetRole}".
    
    Resume Text:
    ${resumeText}
    
    Analyze the resume and return a JSON object ONLY with the following structure:
    {
      "score": 85, // integer 0-100 representing ATS match and overall quality
      "strengths": ["Strength 1", "Strength 2"], // 3-4 bullet points
      "missingKeywords": ["keyword1", "keyword2"], // 3-5 keywords missing from the resume but expected for this role
      "suggestions": ["Suggestion 1", "Suggestion 2"] // 2-3 actionable suggestions
    }`;

    const textResponse = await callGeminiWithFallback('resume-analyze', prompt, { targetRole }, req.id);
    const result = JSON.parse(textResponse || '{}');
    res.json(result);
  } catch (err) {
    logger.error('AI Error during quick resume analyze', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

router.get('/:id/analyses', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const resume = await prisma.resumeVersion.findFirst({
      where: { id, userId: req.userId }
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found or unauthorized' });
      return;
    }

    const analyses = await prisma.aiAnalysisHistory.findMany({
      where: { resumeVersionId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(analyses);
  } catch (err) {
    logger.error('Error fetching resume analysis history', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/analyze', authenticate, validate(ResumeAnalyzeSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { targetRole } = req.body;

    const resume = await prisma.resumeVersion.findFirst({
      where: { id, userId: req.userId }
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const contentToAnalyze = resume.fileContent || resume.notes || 'No content provided';

    const prompt = `You are an expert technical recruiter analyzing a resume for the role of: "${targetRole || resume.targetRole || 'Software Engineer'}".
    
    Resume Text:
    ${contentToAnalyze}
    
    Analyze the resume and return a JSON object ONLY with the following structure:
    {
      "score": 85, // integer 0-100 representing ATS match and overall quality
      "strengths": ["Strength 1", "Strength 2"], // 3-4 bullet points
      "missingKeywords": ["keyword1", "keyword2"], // 3-5 keywords missing from the resume but expected for this role
      "weaknesses": ["Weakness 1", "Weakness 2"], // 2-3 weaknesses or areas of improvement
      "recommendedSkills": ["skill1", "skill2"], // 3-4 skills to add
      "formattingIssues": ["Formatting issue 1"], // 1-2 formatting issues
      "suggestions": ["Suggestion 1", "Suggestion 2"], // 2-3 actionable suggestions
      "aiSummary": "A concise 2-sentence summary of the candidate's experience and fit."
    }`;

    const textResponse = await callGeminiWithFallback('resume-analyze', prompt, { targetRole: targetRole || resume.targetRole }, req.id);
    const result = JSON.parse(textResponse || '{}');

    const updatedResume = await prisma.resumeVersion.update({
      where: { id },
      data: {
        targetRole: targetRole || resume.targetRole || 'Software Engineer',
        atsScore: result.score || 70,
        aiSummary: result.aiSummary || 'Analysis completed successfully.',
        strengths: JSON.stringify(result.strengths || []),
        weaknesses: JSON.stringify(result.weaknesses || []),
        missingKeywords: JSON.stringify(result.missingKeywords || []),
        recommendedSkills: JSON.stringify(result.recommendedSkills || []),
        formattingIssues: JSON.stringify(result.formattingIssues || []),
        suggestions: JSON.stringify(result.suggestions || [])
      }
    });

    await prisma.aiAnalysisHistory.create({
      data: {
        resumeVersionId: id,
        targetRole: targetRole || resume.targetRole || 'Software Engineer',
        atsScore: result.score || 70,
        aiSummary: result.aiSummary || 'Analysis completed.',
        strengths: JSON.stringify(result.strengths || []),
        weaknesses: JSON.stringify(result.weaknesses || []),
        missingKeywords: JSON.stringify(result.missingKeywords || []),
        recommendedSkills: JSON.stringify(result.recommendedSkills || []),
        formattingIssues: JSON.stringify(result.formattingIssues || []),
        suggestions: JSON.stringify(result.suggestions || [])
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId,
        action: 'Resume Analyzed',
        details: `Analyzed ${resume.resumeName} v${resume.versionNumber} for ${targetRole || resume.targetRole || 'Software Engineer'} (Score: ${result.score || 70}%)`
      }
    });

    res.json(updatedResume);
  } catch (err) {
    logger.error('AI Error during resume analyze persistence', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

router.post('/:id/duplicate', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const source = await prisma.resumeVersion.findFirst({
      where: { id, userId: req.userId }
    });

    if (!source) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const duplicated = await prisma.resumeVersion.create({
      data: {
        userId: req.userId,
        resumeName: `${source.resumeName} (Copy)`,
        versionNumber: 1,
        notes: source.notes,
        fileUrl: source.fileUrl,
        fileContent: source.fileContent,
        mimeType: source.mimeType,
        fileSize: source.fileSize,
        targetRole: source.targetRole,
        atsScore: source.atsScore,
        aiSummary: source.aiSummary,
        strengths: source.strengths,
        weaknesses: source.weaknesses,
        missingKeywords: source.missingKeywords,
        recommendedSkills: source.recommendedSkills,
        formattingIssues: source.formattingIssues,
        suggestions: source.suggestions,
        status: 'Active'
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId,
        action: 'Resume Duplicated',
        details: `Duplicated ${source.resumeName} as ${duplicated.resumeName}`
      }
    });

    res.json(duplicated);
  } catch (err) {
    logger.error('Error duplicating resume', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/rename', authenticate, validate(ResumeRenameSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { resumeName } = req.body;
    const resume = await prisma.resumeVersion.update({
      where: { id, userId: req.userId },
      data: { resumeName }
    });
    res.json(resume);
  } catch (err) {
    logger.error('Error renaming resume', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    await prisma.resumeVersion.delete({
      where: { id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting resume', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, validate(ResumeUploadSchema), async (req: any, res) => {
  try {
    const { resumeName, targetRole, fileContent, fileUrl, mimeType, fileSize, notes } = req.body;
    
    if (!resumeName || typeof resumeName !== 'string' || resumeName.trim() === '') {
      res.status(400).json({ error: 'Resume name is required' });
      return;
    }

    const calculatedSize = fileSize || (fileContent ? Buffer.byteLength(fileContent) : 0);
    if (calculatedSize > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds the 10MB maximum limit' });
      return;
    }

    const allowedExtensions = ['pdf', 'docx', 'txt'];
    const parts = resumeName.split('.');
    const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
    if (extension && !allowedExtensions.includes(extension)) {
      res.status(400).json({ error: 'Only PDF, DOCX, and TXT file formats are accepted' });
      return;
    }

    const existingVersions = await prisma.resumeVersion.findMany({
      where: { userId: req.userId, resumeName },
      orderBy: { versionNumber: 'desc' },
      take: 1
    });

    const nextVersion = existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1;

    const resume = await prisma.resumeVersion.create({
      data: {
        userId: req.userId,
        resumeName,
        versionNumber: nextVersion,
        targetRole,
        fileContent,
        fileUrl,
        mimeType: mimeType || 'text/plain',
        fileSize: calculatedSize,
        notes,
        status: 'Active',
        atsScore: null,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId,
        action: 'Resume Uploaded',
        details: `Uploaded ${resumeName} v${nextVersion} for role ${targetRole || 'Not specified'}`
      }
    });

    res.json(resume);
  } catch (err) {
    logger.error('Error uploading resume', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
