import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { AlertCircle, Lightbulb } from 'lucide-react';
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
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Simulate smooth progress based on report length and time
  useEffect(() => {
    // Estimate: typical report is ~8000-15000 characters
    // Use report length to estimate progress (0-85%)
    const lengthBasedProgress = Math.min((reportLength / 15000) * 85, 85);
    
    // Also simulate time-based progress (slowly increases)
    const startTime = Date.now();
    let lastProgress = 0;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const elapsedSeconds = Math.floor(elapsed / 1000);
      
      // More aggressive time-based progress for smoother experience
      // After 30 seconds, we're at ~15% time-based progress
      // After 60 seconds, we're at ~30% time-based progress
      const timeBasedProgress = Math.min((elapsed / 60000) * 30, 30);
      
      // Combine both (length-based is more accurate, but time provides smoothness)
      const totalProgress = Math.min(lengthBasedProgress + timeBasedProgress, 95);
      
      // Smooth the progress updates using requestAnimationFrame-like smoothing
      setProgress(prev => {
        const targetProgress = Math.floor(totalProgress);
        const diff = targetProgress - prev;
        
        // Smooth interpolation - move gradually towards target
        if (Math.abs(diff) > 0.5) {
          // Move 10% of the difference each update for smooth animation
          const step = diff * 0.1;
          return Math.min(prev + step, targetProgress);
        }
        return targetProgress;
      });
      
      // Better time estimation - use both length and time
      if (elapsedSeconds > 5) {
        // Calculate estimated total time based on current progress rate
        const currentProgress = Math.min(lengthBasedProgress + timeBasedProgress, 95);
        
        if (currentProgress > 5) {
          // Estimate total time: elapsed * (100 / currentProgress)
          const estimatedTotalSeconds = Math.max(60, Math.floor((elapsedSeconds / currentProgress) * 100));
          const remaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
          setEstimatedTimeRemaining(remaining);
          
          // Set countdown timer
          if (remaining > 0 && remaining <= 300) { // Show countdown for last 5 minutes
            setCountdownSeconds(remaining);
          } else {
            setCountdownSeconds(null);
          }
        }
      }
      
      // Show force complete button after 3 minutes (180 seconds)
      if (elapsed > 180000) {
        setShowForceComplete(true);
      }
      
      // If stuck for more than 4 minutes, also check for draft recovery
      if (elapsed > 240000 && reportLength === 0) {
        // Report appears stuck - no content generated after 4 minutes
      }
      
      lastProgress = totalProgress;
    }, 100); // Update more frequently for smoother animation

    // Separate interval for countdown timer
    const countdownInterval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev === null || prev <= 0) return null;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [reportLength]);

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
                className="h-full bg-gradient-to-r from-[#577AFF] to-[#4CAF50] rounded-full transition-all duration-300 ease-linear flex items-center justify-end pr-2"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {progress > 10 && (
                  <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-[#595657] dark:text-[#9ca3af] max-w-md mx-auto mb-4">
              <span>Generating report...</span>
              <div className="flex items-center gap-3">
                {countdownSeconds !== null && countdownSeconds > 0 ? (
                  <span className="font-semibold text-[#577AFF] dark:text-[#A1B4FF]">
                    {Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, '0')}
                  </span>
                ) : estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 ? (
                  <span className="text-[#595657] dark:text-[#9ca3af]">
                    ~{Math.ceil(estimatedTimeRemaining / 60)} min remaining
                  </span>
                ) : null}
                <span className="font-semibold text-[#577AFF] dark:text-[#A1B4FF]">{Math.round(progress)}%</span>
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
        
        {/* Tip - Below dialog with lightbulb icon */}
        <div className="flex items-start gap-2 max-w-2xl mx-auto mt-4 p-4 bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded-lg border border-[#D5DDFF] dark:border-[#374151]">
          <Lightbulb className="w-5 h-5 text-[#577AFF] dark:text-[#93C5FD] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
            Your report can take up to 5 minutes to complete. We're generating deep board feedback.
          </p>
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


