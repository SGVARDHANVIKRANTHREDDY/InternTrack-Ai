import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Briefcase, 
  FileText, 
  Bot, 
  Command, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  X 
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Welcome to InternTrack AI',
    tagline: 'Your AI-powered career cockpit',
    description: 'Track applications with Attio-grade precision, streamline recruitment pipelines with Linear-level speed, and analyze interview yield with PostHog-style metrics.',
    icon: Sparkles,
    badge: 'Overview',
  },
  {
    title: 'Track Applications & Recruiter Follow-ups',
    tagline: 'Never drop an opportunity',
    description: 'Log jobs across LinkedIn, Handshake, and referrals. Record next follow-up dates and receive proactive action alerts right on your dashboard.',
    icon: Briefcase,
    badge: 'Pipeline',
    actionRoute: '/applications?action=new',
    actionLabel: 'Add First Application',
  },
  {
    title: 'Version Your Resumes & Audit ATS',
    tagline: 'Targeted resumes for every application',
    description: 'Keep specialized versions for Frontend, Backend, or Machine Learning roles. Scan ATS compatibility and surface missing recruiter keywords.',
    icon: FileText,
    badge: 'Resumes',
    actionRoute: '/resumes',
    actionLabel: 'Go to Resume Workspace',
  },
  {
    title: 'AI Recruiter & Interview Prep',
    tagline: 'Custom company prep in seconds',
    description: 'Open any application drawer to generate tailor-made technical and behavioral interview flashcards calibrated to the job requirements.',
    icon: Bot,
    badge: 'AI Coach',
  },
  {
    title: 'Keyboard-First Superpowers',
    tagline: 'Raycast-style speed at your fingertips',
    description: 'Press ⌘K (or Ctrl+K) anywhere to quickly search across companies, jobs, and jump between views without lifting your fingers from the keyboard.',
    icon: Command,
    badge: 'Productivity',
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleAction = () => {
    if (step.actionRoute) {
      onClose();
      navigate(step.actionRoute);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Top ambient glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
          title="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge & Step indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
            {step.badge}
          </span>
          <span className="text-xs font-mono text-stone-400">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step Icon & Content */}
        <div className="space-y-4 my-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <StepIcon className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {step.title}
            </h3>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              {step.tagline}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
              {step.description}
            </p>
          </div>

          {step.actionRoute && (
            <button
              onClick={handleAction}
              className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Progression Dots */}
        <div className="flex items-center justify-center gap-1.5 my-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-amber-600'
                  : 'w-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-xs font-medium text-stone-500 disabled:opacity-30 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 rounded-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 px-3 py-1.5"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all"
            >
              <span>{isLast ? 'Get Started' : 'Next'}</span>
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
