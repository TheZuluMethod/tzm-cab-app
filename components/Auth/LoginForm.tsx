/**
 * Login Form Component
 * 
 * Handles user login with email/password and OAuth providers.
 */

import React, { useState } from 'react';
import { signIn, signInWithGoogle, signInWithMicrosoft, sendMagicLink } from '../../services/authService';
import { Mail, Lock, AlertCircle, Loader2, Send, CheckCircle } from 'lucide-react';
import { getLogoUrl } from '../../services/logoService';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onSwitchToReset?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignup, onSwitchToReset }) => {
  // Load saved email from localStorage on mount
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('zulu_saved_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const logoUrl = getLogoUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { user, session, error: authError } = await signIn({ email, password });

      if (authError) {
        setError(authError.message || 'Failed to sign in. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (user && session) {
        // Save email to localStorage for future logins
        try {
          localStorage.setItem('zulu_saved_email', email);
        } catch (e) {
          // Silently fail if localStorage is not available
          console.warn('Could not save email to localStorage:', e);
        }
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading('google');
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        // Check if it's a provider not enabled error
        const errorMessage = error.message || '';
        if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
          setError('Google OAuth is not enabled. Please contact your administrator to enable Google sign-in in Supabase.');
        } else {
          setError(errorMessage || 'Failed to sign in with Google');
        }
        setIsOAuthLoading(null);
      }
      // If no error, the redirect will happen automatically
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while signing in with Google');
      setIsOAuthLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsOAuthLoading('microsoft');
    setError(null);
    try {
      const { error } = await signInWithMicrosoft();
      if (error) {
        // Check if it's a provider not enabled error
        const errorMessage = error.message || '';
        if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
          setError('Microsoft OAuth is not enabled. Please contact your administrator to enable Microsoft sign-in in Supabase.');
        } else {
          setError(errorMessage || 'Failed to sign in with Microsoft');
        }
        setIsOAuthLoading(null);
      }
      // If no error, the redirect will happen automatically
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while signing in with Microsoft');
      setIsOAuthLoading(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsMagicLinkLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsMagicLinkLoading(false);
      return;
    }

    try {
      const { error: magicError } = await sendMagicLink(email);
      if (magicError) {
        setError(magicError.message || 'Failed to send magic link. Please try again.');
        setIsMagicLinkLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setIsMagicLinkLoading(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsMagicLinkLoading(false);
    }
  };

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
        <h2 className="text-2xl font-bold text-[#221E1F] mb-6 text-center">Sign In</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {magicLinkSent && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-800 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Magic link sent!</p>
              <p>Check your email ({email}) for a login link. Click the link to sign in instantly.</p>
            </div>
          </div>
        )}

        {!magicLinkSent && (
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseMagicLink(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                !useMagicLink
                  ? 'bg-[#577AFF] text-white'
                  : 'bg-[#F8F9FF] text-[#595657] hover:bg-[#EEF2FF]'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setUseMagicLink(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                useMagicLink
                  ? 'bg-[#577AFF] text-white'
                  : 'bg-[#F8F9FF] text-[#595657] hover:bg-[#EEF2FF]'
              }`}
            >
              Magic Link
            </button>
          </div>
        )}

        {useMagicLink && !magicLinkSent ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium text-[#221E1F] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
                <input
                  id="magic-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg bg-white text-[#221E1F] focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent placeholder:text-[#9CA3AF]"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isMagicLinkLoading}
              className="w-full bg-[#577AFF] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMagicLinkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Magic Link
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setUseMagicLink(false);
                setMagicLinkSent(false);
                setError(null);
              }}
              className="w-full text-sm text-[#595657] hover:text-[#221E1F]"
            >
              Back to password login
            </button>
          </form>
        ) : !magicLinkSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#221E1F] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg bg-white text-[#221E1F] focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent placeholder:text-[#9CA3AF]"
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
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] rounded-lg bg-white text-[#221E1F] focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent placeholder:text-[#9CA3AF]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onSwitchToReset}
              className="text-sm text-[#577AFF] hover:text-[#4A6CF7] text-right w-full"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#577AFF] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : null}

        {!magicLinkSent && !useMagicLink && (
          <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EEF2FF]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#F8F9FF] text-[#595657]">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!!isOAuthLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#EEF2FF] rounded-lg bg-white hover:bg-[#F8F9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#221E1F] text-sm"
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
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#EEF2FF] rounded-lg bg-white hover:bg-[#F8F9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#221E1F] text-sm"
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
        )}

        <div className="mt-6 text-center text-sm text-[#595657]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-[#577AFF] hover:text-[#4A6CF7] font-semibold"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

