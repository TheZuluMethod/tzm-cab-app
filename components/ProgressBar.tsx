import React from 'react';
import { Check, PartyPopper } from 'lucide-react';
import { AppState } from '../types';

interface ProgressBarProps {
  currentState: AppState;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentState }) => {
  
  const steps = [
    { id: AppState.ICP_SETUP, label: 'Define ICP' },
    { id: AppState.SETUP, label: 'CAB Set Up' },
    { id: AppState.ASSEMBLING, label: 'Recruit My Board!' },
    { id: AppState.BOARD_READY, label: 'Review Cohort' },
    { id: AppState.ANALYZING, label: 'Deep Research' },
    { id: AppState.COMPLETE, label: 'Final CAB Report' }
  ];

  const getStepStatus = (stepId: AppState) => {
    const stateOrder = [
      AppState.ICP_SETUP,
      AppState.SETUP, 
      AppState.ASSEMBLING, 
      AppState.BOARD_READY, 
      AppState.ANALYZING, 
      AppState.COMPLETE
    ];
    
    const currentIndex = stateOrder.indexOf(currentState);
    const stepIndex = stateOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-10 px-[50px] no-print">
      <div className="flex items-center w-full gap-1">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isLast = idx === steps.length - 1;

          // Special logic for final step completion (Celebration)
          const isFinalCompleted = isLast && status === 'current' && currentState === AppState.COMPLETE;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div className="relative flex flex-col items-center z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                    ${isFinalCompleted 
                        ? 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-[0_0_0_4px_rgba(217,70,239,0.3)] dark:shadow-[0_0_0_4px_rgba(217,70,239,0.5)] scale-110' 
                        : ''
                    }
                    ${!isFinalCompleted && status === 'completed' ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${!isFinalCompleted && status === 'current' ? 'bg-white dark:bg-[#111827] border-[#577AFF] dark:border-[#577AFF] text-[#577AFF] dark:text-[#577AFF] shadow-[0_0_0_4px_rgba(87,122,255,0.2)] dark:shadow-[0_0_0_4px_rgba(87,122,255,0.4)] scale-110' : ''}
                    ${status === 'pending' ? 'bg-[#F9FAFD] dark:bg-[#1a1f2e] border-[#D5DDFF] dark:border-[#374151] text-[#A1B4FF] dark:text-[#9ca3af]' : ''}
                  `}
                >
                  {isFinalCompleted ? (
                      <PartyPopper className="w-5 h-5" />
                  ) : status === 'completed' ? (
                      <Check className="w-6 h-6" /> 
                  ) : (
                      <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                {/* Labels hidden on mobile to prevent horizontal overflow */}
                <span 
                    className={`absolute -bottom-8 whitespace-nowrap text-xs font-bold tracking-wide transition-colors duration-300 hidden sm:block
                    ${isFinalCompleted ? 'text-fuchsia-500 dark:text-fuchsia-400' : ''}
                    ${!isFinalCompleted && status === 'current' ? 'text-[#577AFF] dark:text-[#A1B4FF]' : ''}
                    ${status === 'completed' ? 'text-green-500 dark:text-green-400' : ''}
                    ${status === 'pending' ? 'text-[#A1B4FF] dark:text-[#9ca3af]' : ''}
                    `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-[2px] mx-0.5 bg-[#EEF2FF] dark:bg-[#374151] relative">
                    <div 
                        className={`absolute inset-0 bg-green-500 dark:bg-green-500 transition-all duration-700 ease-out origin-left
                        ${status === 'completed' ? 'scale-x-100' : 'scale-x-0'}
                        `}
                    />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;