import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { logActivity } from '../lib/activity.js';
import { callGeminiWithFallback } from '../lib/gemini.js';

const prisma = new PrismaClient();
const router = Router();

const InterviewPrepUpdateSchema = z.object({
  dsaTopics: z.union([z.string(), z.array(z.string())]).optional(),
  technicalQuestions: z.union([z.string(), z.array(z.any())]).optional(),
  hrQuestions: z.union([z.string(), z.array(z.any())]).optional(),
  resumeQuestions: z.union([z.string(), z.array(z.any())]).optional(),
  companyResearch: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
});

const TailorResumeSchema = z.object({
  resumeContent: z.string().optional(),
  jobDescription: z.string().optional(),
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

router.get('/analytics', authenticate, async (req: any, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      include: { company: true }
    });
    
    const totalApplications = applications.length;
    
    const statusCounts = applications.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    
    const offerRate = totalApplications > 0 ? ((statusCounts['Offer Received'] || 0) / totalApplications) * 100 : 0;
    
    const bySource: any = {};
    const byResume: any = {};
    const byIndustry: any = {};
    const monthlyTrends: any = {};
    let followUpsSent = 0;
    let followUpsReplied = 0;

    // Initialize sources
    const sources = ['LINKEDIN', 'INTERNSHALA', 'WELLFOUND', 'COMPANY_CAREERS', 'REFERRAL', 'OTHER'];
    sources.forEach(src => {
      bySource[src] = { count: 0, interviews: 0, offers: 0, interviewRate: 0, offerRate: 0 };
    });

    const resumes = await prisma.resumeVersion.findMany({ where: { userId: req.userId } });
    const resumeMap = resumes.reduce((acc: any, r: any) => {
      acc[r.id] = `${r.resumeName} (v${r.versionNumber})`;
      return acc;
    }, {});

    applications.forEach((app: any) => {
      const isInterview = ['Interview Scheduled', 'Interview Completed', 'Offer Received'].includes(app.status);
      const isOffer = app.status === 'Offer Received';

      const src = app.source || 'OTHER';
      if (!bySource[src]) {
        bySource[src] = { count: 0, interviews: 0, offers: 0, interviewRate: 0, offerRate: 0 };
      }
      bySource[src].count++;
      if (isInterview) bySource[src].interviews++;
      if (isOffer) bySource[src].offers++;

      if (app.resumeVersionId) {
        const resumeId = app.resumeVersionId;
        if (!byResume[resumeId]) {
          byResume[resumeId] = { id: resumeId, name: resumeMap[resumeId] || 'Unknown', count: 0, interviews: 0, offers: 0, interviewRate: 0, offerRate: 0 };
        }
        byResume[resumeId].count++;
        if (isInterview) byResume[resumeId].interviews++;
        if (isOffer) byResume[resumeId].offers++;
      }

      const ind = app.company?.industry || 'Other';
      if (!byIndustry[ind]) {
        byIndustry[ind] = { count: 0, interviews: 0, offers: 0, interviewRate: 0, offerRate: 0 };
      }
      byIndustry[ind].count++;
      if (isInterview) byIndustry[ind].interviews++;
      if (isOffer) byIndustry[ind].offers++;

      const date = app.applicationDate || app.createdAt;
      const monthStr = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyTrends[monthStr] = (monthlyTrends[monthStr] || 0) + 1;

      if (app.followUpSent) {
        followUpsSent++;
        if (app.recruiterReplied || app.followUpStatus === 'REPLIED') {
          followUpsReplied++;
        }
      }
    });

    sources.forEach(src => {
      const stats = bySource[src];
      stats.interviewRate = stats.count > 0 ? (stats.interviews / stats.count) * 100 : 0;
      stats.offerRate = stats.count > 0 ? (stats.offers / stats.count) * 100 : 0;
    });

    Object.keys(byResume).forEach(id => {
      const stats = byResume[id];
      stats.interviewRate = stats.count > 0 ? (stats.interviews / stats.count) * 100 : 0;
      stats.offerRate = stats.count > 0 ? (stats.offers / stats.count) * 100 : 0;
    });

    Object.keys(byIndustry).forEach(ind => {
      const stats = byIndustry[ind];
      stats.interviewRate = stats.count > 0 ? (stats.interviews / stats.count) * 100 : 0;
      stats.offerRate = stats.count > 0 ? (stats.offers / stats.count) * 100 : 0;
    });

    const followUpSuccessRate = followUpsSent > 0 ? (followUpsReplied / followUpsSent) * 100 : 0;

    res.json({
      totalApplications,
      statusCounts,
      offerRate,
      bySource,
      byResume: Object.values(byResume),
      byIndustry,
      monthlyTrends: Object.entries(monthlyTrends).map(([month, count]) => ({ month, count })),
      followUpSuccessRate
    });
  } catch (err) {
    logger.error('Error compiling dashboard metrics', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/analytics/ai-insights', authenticate, async (req: any, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      include: { company: true }
    });

    if (applications.length === 0) {
      res.status(400).json({ error: 'No applications found to analyze. Please add some applications first!' });
      return;
    }

    const appsSummary = applications.map((app, index) => {
      return `${index + 1}. Company: ${app.company.companyName}, Role: ${app.role}, Industry: ${app.company.industry || 'Tech'}, Status: ${app.status}, Source: ${app.source || 'OTHER'}, Priority: ${app.priority}`;
    }).join('\n');

    const prompt = `You are a professional career coach and data analyst. Below is a list of the candidate's internship/job applications:
       
    Applications:
    ${appsSummary}
    
    Analyze this data and return a JSON object containing deep career analysis:
    {
      "mostSuccessfulIndustry": "e.g. Software / Fintech",
      "mostSuccessfulSource": "e.g. LinkedIn",
      "mostCommonRejectionStage": "e.g. Resume Screen",
      "highestConversionFunnel": "e.g. LinkedIn -> Interview",
      "weakestFunnelStage": "e.g. OA -> Technical Screen",
      "recommendations": ["Tip 1", "Tip 2"]
    }`;

    const textResponse = await callGeminiWithFallback('ai-insights', prompt, { applications }, req.id);
    const json = JSON.parse(textResponse || '{}');

    const insight = await prisma.aiInsight.create({
      data: {
        userId: req.userId,
        mostSuccessfulIndustry: json.mostSuccessfulIndustry || 'N/A',
        mostSuccessfulSource: json.mostSuccessfulSource || 'N/A',
        mostCommonRejectionStage: json.mostCommonRejectionStage || 'N/A',
        highestConversionFunnel: json.highestConversionFunnel || 'N/A',
        weakestFunnelStage: json.weakestFunnelStage || 'N/A',
        recommendations: JSON.stringify(json.recommendations || []),
      }
    });

    await logActivity(req.userId, 'AI Insights Generated', 'Generated personalized career application insights', 'AiInsight', insight.id, null, req.id);
    res.json(insight);
  } catch (err) {
    logger.error('Error generating AI analytics insights', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Failed to generate career insights' });
  }
});

router.get('/analytics/ai-insights', authenticate, async (req: any, res) => {
  try {
    const insight = await prisma.aiInsight.findFirst({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(insight);
  } catch (err) {
    logger.error('Error fetching analytics insights', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// INTERVIEW PREPARATION
// ==========================================

router.post('/applications/:appId/interview-prep', authenticate, async (req: any, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: { id: req.params.appId, userId: req.userId },
      include: { company: true }
    });
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    let resumeContext = '';
    if (application.resumeVersionId) {
      const resume = await prisma.resumeVersion.findUnique({ where: { id: application.resumeVersionId } });
      if (resume && resume.notes) {
        resumeContext = `Candidate Resume Content:\n${resume.notes}`;
      }
    }

    const companyName = application.company.companyName;
    const role = application.role;
    const industry = application.company.industry || 'Tech';
    const jobDescription = application.notes || '';

    const prompt = `You are an expert AI interviewer preparing a candidate for an interview at ${companyName} for the role of ${role}.
    Company Details:
    - Name: ${companyName}
    - Industry: ${industry}
    ${jobDescription ? `- Job Description / Notes: ${jobDescription}` : ''}
    ${resumeContext ? `${resumeContext}` : ''}
    
    Generate structured interview preparation material in a JSON object strictly following this schema:
    {
      "dsaTopics": ["topic1", "topic2"],
      "technicalQuestions": [{ "question": "Question text...", "answer": "Answer key..." }],
      "hrQuestions": [{ "question": "Question text...", "answer": "Response..." }],
      "resumeQuestions": [{ "question": "Question text...", "answer": "Highlight..." }],
      "companyResearch": {
        "overview": "Overview...",
        "products": ["Product 1"],
        "recentNews": "News...",
        "interviewTips": "Tips..."
      }
    }`;

    const textResponse = await callGeminiWithFallback('interview-prep', prompt, { companyName, role }, req.id);
    const json = JSON.parse(textResponse || '{}');

    const prep = await prisma.interviewPreparation.create({
      data: {
        applicationId: application.id,
        dsaTopics: JSON.stringify(json.dsaTopics || []),
        technicalQuestions: JSON.stringify(json.technicalQuestions || []),
        hrQuestions: JSON.stringify(json.hrQuestions || []),
        resumeQuestions: JSON.stringify(json.resumeQuestions || []),
        companyResearch: JSON.stringify(json.companyResearch || {}),
      }
    });

    await logActivity(req.userId, 'Interview Prep Generated', `Generated interview preparation for ${role} at ${companyName}`, 'Application', application.id, null, req.id);
    res.json(prep);
  } catch (err) {
    logger.error('Error generating AI interview prep', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Failed to generate interview preparation material' });
  }
});

router.get('/applications/:appId/interview-prep', authenticate, async (req: any, res) => {
  try {
    const preps = await prisma.interviewPreparation.findMany({
      where: { applicationId: req.params.appId, application: { userId: req.userId } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(preps);
  } catch (err) {
    logger.error('Error fetching interview prep', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/interview-prep/:id', authenticate, validate(InterviewPrepUpdateSchema), async (req: any, res) => {
  try {
    const { dsaTopics, technicalQuestions, hrQuestions, resumeQuestions, companyResearch } = req.body;
    const prep = await prisma.interviewPreparation.update({
      where: { id: req.params.id, application: { userId: req.userId } },
      data: {
        dsaTopics: typeof dsaTopics === 'string' ? dsaTopics : JSON.stringify(dsaTopics),
        technicalQuestions: typeof technicalQuestions === 'string' ? technicalQuestions : JSON.stringify(technicalQuestions),
        hrQuestions: typeof hrQuestions === 'string' ? hrQuestions : JSON.stringify(hrQuestions),
        resumeQuestions: typeof resumeQuestions === 'string' ? resumeQuestions : JSON.stringify(resumeQuestions),
        companyResearch: typeof companyResearch === 'string' ? companyResearch : JSON.stringify(companyResearch),
      }
    });
    res.json(prep);
  } catch (err) {
    logger.error('Error updating interview prep details', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// RESUME TAILORING
// ==========================================

router.post('/applications/:appId/tailor-resume', authenticate, validate(TailorResumeSchema), async (req: any, res) => {
  try {
    const { resumeContent, jobDescription } = req.body || {};
    const application = await prisma.application.findFirst({
      where: { id: req.params.appId, userId: req.userId },
      include: { company: true }
    });
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    let resumeText = resumeContent || '';
    if (!resumeText && application.resumeVersionId) {
      const resume = await prisma.resumeVersion.findUnique({ where: { id: application.resumeVersionId } });
      if (resume) {
        resumeText = resume.notes || '';
      }
    }

    const jd = jobDescription || application.notes || 'Frontend/Software Developer position details.';

    const prompt = `You are an expert resume writer and career coach. Your task is to analyze the candidate's resume against the job description for the role: ${application.role} at ${application.company.companyName}.
       
    Candidate Resume:
    ${resumeText || 'No resume content is currently linked.'}
    Job Description:
    ${jd}
    
    Provide tailored match in JSON schema:
    {
      "atsScore": 75,
      "missingKeywords": ["React Native"],
      "recommendedSkills": ["Zustand"],
      "suggestedChanges": [{ "section": "Experience", "original": "Work...", "revised": "Rewrite..." }],
      "projectsToHighlight": [{ "projectName": "E-Commerce", "reason": "Reason..." }]
    }`;

    const textResponse = await callGeminiWithFallback('tailor-resume', prompt, {}, req.id);
    const json = JSON.parse(textResponse || '{}');

    const tailoring = await prisma.resumeTailoringAnalysis.create({
      data: {
        applicationId: application.id,
        atsScore: json.atsScore || 70,
        missingKeywords: JSON.stringify(json.missingKeywords || []),
        recommendedSkills: JSON.stringify(json.recommendedSkills || []),
        suggestions: JSON.stringify({
          suggestedChanges: json.suggestedChanges || [],
          projectsToHighlight: json.projectsToHighlight || []
        }),
      }
    });

    await logActivity(req.userId, 'Resume Tailored', `Tailored resume for ${application.role} at ${application.company.companyName}`, 'Application', application.id, null, req.id);
    res.json(tailoring);
  } catch (err) {
    logger.error('Error generating AI resume tailoring', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Failed to tailor resume' });
  }
});

router.get('/applications/:appId/tailor-resume', authenticate, async (req: any, res) => {
  try {
    const analysis = await prisma.resumeTailoringAnalysis.findFirst({
      where: { applicationId: req.params.appId, application: { userId: req.userId } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(analysis);
  } catch (err) {
    logger.error('Error fetching tailor resume history', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
