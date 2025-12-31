/**
 * Signup Form Component
 * 
 * Handles new user registration with email/password and OAuth providers.
 */

import React, { useState } from 'react';
import { signUp, signInWithGoogle, signInWithMicrosoft } from '../../services/authService';
import { Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const { user, session, error: authError } = await signUp({
        email,
        password,
        fullName: fullName || undefined,
      });

      if (authError) {
        setError(authError.message || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      if (user) {
        setSuccess(true);
        // If session exists, user is automatically logged in
        if (session) {
          setTimeout(() => {
            onSuccess?.();
          }, 1500);
        } else {
          // Email confirmation required
          setError(null);
          setSuccess(true);
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading('google');
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message || 'Failed to sign up with Google');
      setIsOAuthLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsOAuthLoading('microsoft');
    setError(null);
    const { error } = await signInWithMicrosoft();
    if (error) {
      setError(error.message || 'Failed to sign up with Microsoft');
      setIsOAuthLoading(null);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-[#EEF2FF] p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#221E1F] mb-2">Account Created!</h2>
          <p className="text-[#595657] mb-4">
            Please check your email to verify your account.
          </p>
          <p className="text-sm text-[#595657]">
            You can sign in once your email is verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-[#EEF2FF] p-8">
        <h2 className="text-2xl font-bold text-[#221E1F] mb-6 text-center">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[#221E1F] mb-1">
              Full Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#221E1F] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
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
                className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EEF2FF]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#595657]">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!!isOAuthLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#EEF2FF] rounded-lg hover:bg-[#F8F9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOAuthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={!!isOAuthLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#EEF2FF] rounded-lg hover:bg-[#F8F9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOAuthLoading === 'microsoft' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#f25022" d="M0 0h11v11H0z" />
                    <path fill="#00a4ef" d="M12 0h11v11H12z" />
                    <path fill="#7fba00" d="M0 12h11v11H0z" />
                    <path fill="#ffb900" d="M12 12h11v11H12z" />
                  </svg>
                  Microsoft
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-[#595657]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#577AFF] hover:text-[#4A6CF7] font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;

