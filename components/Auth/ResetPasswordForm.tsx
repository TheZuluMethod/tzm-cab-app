/**
 * Reset Password Form Component
 * 
 * Handles password reset requests and password updates.
 */

import React, { useState, useEffect } from 'react';
import { resetPassword, updatePassword } from '../../services/authService';
import { Mail, Lock, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { getLogoUrl } from '../../services/logoService';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  isResetMode?: boolean; // true = request reset, false = update password
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ 
  onSuccess, 
  onBack,
  isResetMode = true 
}) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const logoUrl = getLogoUrl();

  useEffect(() => {
    // Check if we're in password update mode (after clicking reset link)
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      // User came from password reset email
      // Supabase will handle the token automatically
    }
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*[0-9])/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        setError(updateError.message || 'Failed to update password. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  if (success && isResetMode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[#F8F9FF] rounded-2xl shadow-lg border border-[#EEF2FF] p-8 text-center">
          {logoUrl && (
            <div className="flex justify-center mb-6">
              <img 
                src={logoUrl} 
                alt="The Zulu Method Logo" 
                className="h-12 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#221E1F] mb-2">Check Your Email</h2>
          <p className="text-[#595657] mb-4">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-[#595657]">
            Click the link in the email to reset your password.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-6 text-[#577AFF] hover:text-[#4A6CF7] font-semibold flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}
        </div>
      </div>
    );
  }

  if (success && !isResetMode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[#F8F9FF] rounded-2xl shadow-lg border border-[#EEF2FF] p-8 text-center">
          {logoUrl && (
            <div className="flex justify-center mb-6">
              <img 
                src={logoUrl} 
                alt="The Zulu Method Logo" 
                className="h-12 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#221E1F] mb-2">Password Updated!</h2>
          <p className="text-[#595657] mb-4">
            Your password has been successfully updated.
          </p>
          {onSuccess && (
            <button
              onClick={onSuccess}
              className="mt-4 bg-[#577AFF] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#4A6CF7] transition-colors"
            >
              Continue to App
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#F8F9FF] rounded-2xl shadow-lg border border-[#EEF2FF] p-8">
        {logoUrl && (
          <div className="flex justify-center mb-6">
            <img 
              src={logoUrl} 
              alt="The Zulu Method Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <h2 className="text-2xl font-bold text-[#221E1F] mb-6 text-center">
          {isResetMode ? 'Reset Password' : 'Set New Password'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {isResetMode ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#221E1F] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg bg-white text-[#221E1F] focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent placeholder:text-[#9CA3AF]"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#577AFF] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#221E1F] mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg bg-white text-[#221E1F] focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent placeholder:text-[#9CA3AF]"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-[#595657] mt-1">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#221E1F] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg bg-white text-[#221E1F] focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent placeholder:text-[#9CA3AF]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#577AFF] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 w-full text-[#577AFF] hover:text-[#4A6CF7] font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;

