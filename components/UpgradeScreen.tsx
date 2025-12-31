import React, { useState } from 'react';
import { CheckCircle, Zap, Shield, TrendingUp, ArrowRight, X, Sparkles } from 'lucide-react';
import { redirectToCheckout } from '../services/stripeService';
import { logSubscriptionEvent } from '../services/subscriptionService';
import { getCurrentUser } from '../services/authService';

interface UpgradeScreenProps {
  onClose?: () => void;
  reportsRemaining?: number;
  isTrial?: boolean;
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ onClose, reportsRemaining = 0, isTrial = true }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('Please sign in to upgrade');
        setIsLoading(false);
        return;
      }

      // Log upgrade initiated event
      await logSubscriptionEvent(user.id, null, 'upgrade_initiated', {});

      // Redirect to Stripe Checkout
      await redirectToCheckout(user.id);
    } catch (err: any) {
      console.error('Error initiating upgrade:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Run 10 Reports/Month!',
      description: 'Run up to 10 complete board analyses of any type every month',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Enjoy Unlimited Access',
      description: 'No restrictions, no limits, no cap on complexity or output',
      color: 'from-blue-400 to-purple-500',
    },
    {
      icon: TrendingUp,
      title: 'Get Priority Support',
      description: 'Get faster responses, support, & priority feature requests',
      color: 'from-green-400 to-emerald-500',
    },
  ];

  const usps = [
    { text: 'Get <b>IPC Profile & Persona</b> details with every report' },
    { text: 'Enjoy fresh <b>Branding, Positioning, & Messaging</b> ideas' },
    { text: 'Work through <b>Pricing & Packaging</b> with your ideal buyers' },
    { text: 'Vet <b>New Features or Services</b> before you build them' },
    { text: 'Get structured <b>Brainstorm & Ideation</b> with your AI ICP' },
    { text: 'And much more...' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(87,122,255,0.3)] overflow-y-auto max-h-[95vh] my-auto animate-in slide-in-from-bottom-4 duration-500">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1f2e] transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
          </button>
        )}

        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 border-2 border-blue-400 dark:border-blue-500 mb-8 sm:mb-10 shadow-xl dark:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              <span className="text-sm sm:text-base font-bold text-white">Free Trial Complete</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#051A53] dark:text-[#f3f4f6] mb-3 sm:mb-4 tracking-tight px-2">
              You've Used Your Free Report!
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#31458F] dark:text-[#A1B4FF] mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Upgrade now to continue getting expert AI Board insights
            </p>

            {/* Pricing */}
            <div className="inline-flex items-baseline gap-2 sm:gap-3 mb-8 sm:mb-10">
              <span className="text-5xl sm:text-6xl md:text-7xl font-black text-[#051A53] dark:text-[#f3f4f6]">$99</span>
              <span className="text-xl sm:text-2xl text-[#595657] dark:text-[#9ca3af]">/month</span>
            </div>

            {/* Small CTA Button */}
            <div className="flex justify-center mb-12 sm:mb-16">
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold tracking-wide shadow-lg shadow-green-300 dark:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-0.5 hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Upgrade Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="relative p-6 rounded-2xl bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] border-2 border-[#D5DDFF] dark:border-[#374151] overflow-hidden"
                >
                  <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Unique Selling Points */}
          <div className="bg-gradient-to-r from-[#EEF2FF] via-[#D5DDFF] to-[#EEF2FF] dark:from-[#1a1f2e] dark:via-[#111827] dark:to-[#1a1f2e] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-10 border-2 border-[#A1B4FF] dark:border-[#577AFF]/50">
            <h3 className="text-2xl font-bold text-[#051A53] dark:text-[#f3f4f6] mb-6 text-center">
              Why You Should Upgrade Today!
            </h3>
            <ul className="space-y-4">
              {usps.map((usp, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mt-0.5 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg text-[#221E1F] dark:text-[#f3f4f6] font-semibold pt-1" dangerouslySetInnerHTML={{ __html: usp.text }} />
                </li>
              ))}
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-4 sm:px-6 md:px-10 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-wide shadow-2xl shadow-green-300 dark:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(34,197,94,0.8)] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 md:gap-4"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-7 h-7" />
                <span>Unlock Your Monthly Reports</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>

          {/* Trust indicators */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#595657] dark:text-[#9ca3af]">
              🔒 Secure payment via Stripe • Cancel anytime • No credit card required for trial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeScreen;

