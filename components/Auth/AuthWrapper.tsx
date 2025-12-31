/**
 * Authentication Wrapper Component
 * 
 * Manages authentication state and displays appropriate UI (login, signup, or app).
 */

import React, { useState, useEffect } from 'react';
import { getCurrentUser, onAuthStateChange } from '../../services/authService';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ResetPasswordForm from './ResetPasswordForm';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'reset' | 'loading';

interface AuthWrapperProps {
  children: React.ReactNode;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, onAuthChange }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setLoading(false);
        onAuthChange?.(!!currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false);
        onAuthChange?.(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      onAuthChange?.(!!currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onAuthChange]);

  // Check if we're on a password reset or magic link callback
  useEffect(() => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for magic link callback
    if (hash.includes('access_token') || urlParams.get('token_hash')) {
      // Handle magic link authentication
      const handleMagicLinkCallback = async () => {
        try {
          // Supabase automatically handles the callback via onAuthStateChange
          // Just clean up the URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (error) {
          console.error('Error handling magic link callback:', error);
        }
      };
      
      handleMagicLinkCallback();
    }
    
    // Check for password reset callback
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      setAuthView('reset');
      // Clean up the hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#577AFF] animate-spin mx-auto mb-4" />
          <p className="text-[#595657]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth forms if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF] py-12 px-4">
        {authView === 'login' && (
          <LoginForm
            onSuccess={() => {
              // Auth state change will be handled by onAuthStateChange
              window.location.reload();
            }}
            onSwitchToSignup={() => setAuthView('signup')}
            onSwitchToReset={() => setAuthView('reset')}
          />
        )}

        {authView === 'signup' && (
          <SignupForm
            onSuccess={() => {
              // Auth state change will be handled by onAuthStateChange
              window.location.reload();
            }}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}

        {authView === 'reset' && (
          <ResetPasswordForm
            isResetMode={!window.location.hash.includes('type=recovery')}
            onSuccess={() => {
              setAuthView('login');
            }}
            onBack={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
};

export default AuthWrapper;

