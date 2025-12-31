import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { AlertCircle } from 'lucide-react';
import IndustryDataVisualization from './IndustryDataVisualization';

interface LoadingProgressBarProps {
  userInput: UserInput | null;
  reportLength: number;
  onForceComplete?: () => void;
}

const LoadingProgressBar: React.FC<LoadingProgressBarProps> = ({ userInput, reportLength, onForceComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showForceComplete, setShowForceComplete] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Simulate smooth progress based on report length and time
  useEffect(() => {
    // Estimate: typical report is ~5000-10000 characters
    // Use report length to estimate progress (0-80%)
    const lengthBasedProgress = Math.min((reportLength / 10000) * 80, 80);
    
    // Also simulate time-based progress (slowly increases)
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const elapsedSeconds = Math.floor(elapsed / 1000);
      
      // Smooth progress calculation
      // After 60 seconds, we're at ~25% time-based progress
      const timeBasedProgress = Math.min((elapsed / 60000) * 25, 25);
      
      // Combine both (length-based is more accurate, but time provides smoothness)
      const totalProgress = Math.min(lengthBasedProgress + timeBasedProgress, 95);
      
      // Smooth the progress updates (avoid choppy jumps)
      setProgress(prev => {
        const diff = totalProgress - prev;
        // If difference is large, move gradually (smooth animation)
        if (Math.abs(diff) > 2) {
          return prev + (diff > 0 ? 1 : -1);
        }
        return Math.floor(totalProgress);
      });
      
      // Estimate time remaining based on current progress
      if (elapsedSeconds > 10 && progress > 5) {
        // Estimate: if we're at X% after Y seconds, total time should be Y * (100/X)
        const estimatedTotalSeconds = Math.floor((elapsedSeconds / progress) * 100);
        const remaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
        setEstimatedTimeRemaining(remaining);
      }
      
      // Show force complete button after 2 minutes (120 seconds) - reduced from 4 minutes
      if (elapsed > 120000) {
        setShowForceComplete(true);
      }
      
      // If stuck for more than 3 minutes, also check for draft recovery
      if (elapsed > 180000 && reportLength === 0) {
        // Report appears stuck - no content generated after 3 minutes
        // This will trigger draft recovery check on next render
      }
    }, 200); // Update more frequently for smoother animation

    return () => clearInterval(interval);
  }, [reportLength, progress]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in">
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <div className="w-full max-w-2xl mb-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 md:p-12 shadow-lg dark:shadow-[0_0_30px_rgba(87,122,255,0.2)] border border-[#EEF2FF] dark:border-[#374151]">
            <h2 className="text-2xl md:text-3xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">We're Compiling Your Board Report...</h2>
            <p className="text-[#595657] dark:text-[#9ca3af] text-center max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-6">
              Your AI Board is doing deep research, analyzing your input, and debating your ask to build a comprehensive, contextually accurate report.
            </p>
            
            {/* Progress Bar - Tighter horizontally */}
            <div className="w-full max-w-md mx-auto bg-[#EEF2FF] dark:bg-[#374151] rounded-full h-4 md:h-6 mb-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#577AFF] to-[#4CAF50] rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && (
                  <span className="text-xs font-bold text-white">{progress}%</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-[#595657] dark:text-[#9ca3af] max-w-md mx-auto mb-4">
              <span>Generating report...</span>
              <div className="flex items-center gap-3">
                {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                  <span className="text-[#595657] dark:text-[#9ca3af]">
                    ~{Math.ceil(estimatedTimeRemaining / 60)} min remaining
                  </span>
                )}
                <span className="font-semibold text-[#577AFF] dark:text-[#A1B4FF]">{progress}%</span>
              </div>
            </div>
            
            {/* Force Complete Button - Show if stuck */}
            {showForceComplete && onForceComplete && (
              <div className="mt-4 pt-4 border-t border-[#EEF2FF] dark:border-[#374151]">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm mb-3 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>Report generation is taking longer than expected</span>
                </div>
                <button
                  onClick={onForceComplete}
                  className="w-full px-4 py-2 bg-[#577AFF] dark:bg-[#577AFF] text-white rounded-lg hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors font-semibold text-sm"
                >
                  Complete Report Now ({reportLength > 0 ? 'Use Current Content' : 'Cancel'})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Industry Info Cards */}
      {userInput && (
        <div className="mt-8">
          <IndustryDataVisualization 
            userInput={userInput} 
            autoFetch={true}
          />
        </div>
      )}
    </div>
  );
};

export default LoadingProgressBar;


