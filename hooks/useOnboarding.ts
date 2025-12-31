/**
 * Onboarding Hook
 * 
 * Manages onboarding state and provides utilities for checking
 * onboarding completion status.
 */

import { useState, useEffect } from 'react';

export interface OnboardingState {
  isCompleted: boolean;
  wasSkipped: boolean;
  completedAt: number | null;
}

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('onboarding_completed') === 'true';
};

/**
 * Check if user skipped onboarding
 */
export const wasOnboardingSkipped = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('onboarding_skipped') === 'true';
};

/**
 * Get onboarding completion timestamp
 */
export const getOnboardingCompletedAt = (): number | null => {
  if (typeof window === 'undefined') return null;
  const timestamp = localStorage.getItem('onboarding_completed_at');
  return timestamp ? parseInt(timestamp, 10) : null;
};

/**
 * Reset onboarding (for testing or re-showing)
 */
export const resetOnboarding = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('onboarding_completed');
  localStorage.removeItem('onboarding_skipped');
  localStorage.removeItem('onboarding_completed_at');
};

/**
 * Hook to manage onboarding state
 */
export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isCompleted: false,
    wasSkipped: false,
    completedAt: null,
  });

  useEffect(() => {
    setOnboardingState({
      isCompleted: hasCompletedOnboarding(),
      wasSkipped: wasOnboardingSkipped(),
      completedAt: getOnboardingCompletedAt(),
    });
  }, []);

  const markCompleted = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_at', Date.now().toString());
    setOnboardingState({
      isCompleted: true,
      wasSkipped: false,
      completedAt: Date.now(),
    });
  };

  const markSkipped = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    setOnboardingState({
      isCompleted: true,
      wasSkipped: true,
      completedAt: Date.now(),
    });
  };

  return {
    ...onboardingState,
    markCompleted,
    markSkipped,
    reset: resetOnboarding,
  };
};

