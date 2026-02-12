import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Users, FileText, Zap } from 'lucide-react';
import { getDarkLogoUrl } from '../services/logoService';
import { getAllExampleReports } from '../data/exampleReports';
import { SavedSession } from '../types';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  target?: string; // CSS selector for element to highlight
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  onUseTemplate?: (template: SavedSession) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip, onUseTemplate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const logoUrl = getDarkLogoUrl();
  const exampleReports = getAllExampleReports().slice(0, 6); // Get first 6 templates

  useEffect(() => {
    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
    if (hasCompletedOnboarding) {
      setIsVisible(false);
      return;
    }

    // Show onboarding after a brief delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your AI Advisory Board',
      description: 'Get instant feedback from 20 expert AI personas built on your exact ICP',
      content: (
        <div className="space-y-4">
          {logoUrl && (
            <div className="flex items-center justify-center mx-auto mb-6">
              <img 
                src={logoUrl} 
                alt="The Zulu Method Logo" 
                className="h-20 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-black text-[#051A53] dark:text-[#f3f4f6] mb-3 text-center">
            Welcome to Your AI Advisory Board
          </h2>
          <p className="text-lg text-[#595657] dark:text-[#9ca3af] text-center">
            In just 3 simple steps, you'll have a complete board analysis with actionable insights from 20 expert personas.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] dark:bg-[#1a1f2e] flex items-center justify-center mx-auto mb-2">
                <span className="text-[#577AFF] dark:text-[#93C5FD] font-bold text-lg">1</span>
              </div>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">Define ICP</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] dark:bg-[#1a1f2e] flex items-center justify-center mx-auto mb-2">
                <span className="text-[#577AFF] dark:text-[#93C5FD] font-bold text-lg">2</span>
              </div>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">What to Test</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] dark:bg-[#1a1f2e] flex items-center justify-center mx-auto mb-2">
                <span className="text-[#577AFF] dark:text-[#93C5FD] font-bold text-lg">3</span>
              </div>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">Get Insights</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'examples',
      title: 'See It In Action',
      description: 'Check out example reports to see what you\'ll get',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mx-auto mb-6 shadow-lg dark:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#051A53] dark:text-[#f3f4f6] mb-3 text-center">
            See It In Action
          </h2>
          <p className="text-lg text-[#595657] dark:text-[#9ca3af] text-center mb-6">
            Check out these example reports showcasing different use cases. Click any template to use it and get started instantly.
          </p>
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
            {exampleReports.map((report, index) => {
              const iconGradients = [
                'bg-gradient-to-br from-[#577AFF] to-[#A1B4FF]',
                'bg-gradient-to-br from-green-500 to-green-600',
                'bg-gradient-to-br from-purple-500 to-purple-600',
                'bg-gradient-to-br from-orange-500 to-orange-600',
                'bg-gradient-to-br from-pink-500 to-pink-600',
                'bg-gradient-to-br from-cyan-500 to-cyan-600',
              ];
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    if (onUseTemplate) {
                      onUseTemplate(report);
                      handleComplete();
                    }
                  }}
                  className="bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151] p-4 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(87,122,255,0.3)] transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg ${iconGradients[index % iconGradients.length]} flex items-center justify-center mb-2`}>
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1 line-clamp-2">
                    {report.title}
                  </h4>
                  <p className="text-xs text-[#595657] dark:text-[#9ca3af] line-clamp-2">
                    {report.input.feedbackItem}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg p-4 mt-4 border border-[#EEF2FF] dark:border-[#374151]">
            <p className="text-sm text-[#595657] dark:text-[#9ca3af] text-center">
              💡 <strong>Tip:</strong> Click any template above to pre-fill the form and start in seconds!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Key CAB Benefits',
      description: 'What makes your AI Advisory Board so powerful...',
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#577AFF] flex items-center justify-center flex-shrink-0 shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)]">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1">20 Expert AI Personas</h4>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
                Each AI persona is built on your exact ICP with unique perspectives, expertise, and decision-making styles for ultimate customer feedback.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg dark:shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1">Deep Insights, instantly</h4>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
                Get comprehensive Board analysis in just minutes, not weeks & tens of thousands of dollars. Perfect for understanding your TAM, vetting your pricing & packaging, testing messaging, and more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg dark:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1">Run & Share Multiple Reports</h4>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
                Run multiple CAB research reports and share the detailed reports with your team in one click.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ready',
      title: 'Ready to Get Started?',
      description: 'You\'re all set! Let\'s create your first board.',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mx-auto mb-6 shadow-lg dark:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <Check className="w-10 h-10 text-white" />
          </div>
          <p className="text-lg text-[#595657] dark:text-[#9ca3af] text-center">
            Click "Assemble My Board" below to start, or explore the example reports first to see what you'll get.
          </p>
          <div className="bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg p-4 mt-6 border border-[#EEF2FF] dark:border-[#374151]">
            <p className="text-sm text-[#595657] dark:text-[#9ca3af] text-center">
              💡 <strong>Pro Tip:</strong> Use an example template to see the full process in action!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_at', Date.now().toString());
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(87,122,255,0.3)] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1f2e] transition-colors z-10"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
        </button>

        {/* Progress bar with step indicators */}
        <div className="relative">
          <div className="h-1 bg-[#EEF2FF] dark:bg-[#1a1f2e]">
            <div
              className="h-full bg-gradient-to-r from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#577AFF] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="absolute top-0 left-0 right-0 flex justify-between px-2 -mt-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  index <= currentStep
                    ? 'bg-[#577AFF] dark:bg-[#577AFF] text-white shadow-lg dark:shadow-[0_0_10px_rgba(87,122,255,0.5)]'
                    : 'bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#9CA3AF] dark:text-[#6B7280]'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          {/* Step indicator */}
          <div className="text-center mb-6">
            <span className="text-sm font-semibold text-[#577AFF] dark:text-[#93C5FD]">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Title - Hide for step 1, step 2, and step 4 */}
          {currentStep !== 0 && currentStep !== 1 && currentStep !== 3 && (
            <h2 className="text-3xl md:text-4xl font-black text-[#051A53] dark:text-[#f3f4f6] mb-3 text-center">
              {step.title}
            </h2>
          )}

          {/* Description - Hide for step 4 */}
          {currentStep !== 3 && (
            <p className="text-lg text-[#595657] dark:text-[#9ca3af] text-center mb-8">
              {step.description}
            </p>
          )}

          {/* Content */}
          <div className="mb-8 min-h-[200px]">
            {step.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#EEF2FF] dark:border-[#374151] bg-white dark:bg-[#111827] text-[#577AFF] dark:text-[#93C5FD] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleSkip}
              className="text-sm text-[#595657] dark:text-[#9ca3af] hover:text-[#577AFF] dark:hover:text-[#93C5FD] transition-colors font-medium"
            >
              Skip tutorial
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#577AFF] dark:bg-[#577AFF] text-white hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors font-semibold shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)]"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

