import React from 'react';
import { Users, Target, MessageSquareWarning, Sparkles, ArrowRight, ChevronDown, Check, Zap, LayoutGrid } from 'lucide-react';
import { isAppMaker } from '../services/analyticsService';
import ExampleReportsGallery from './ExampleReportsGallery';
import { SavedSession } from '../types';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onUpgrade?: () => void;
  onUseTemplate?: (template: SavedSession) => void;
  subscriptionStatus?: {
    isTrial: boolean;
    reportsRemaining: number;
    needsUpgrade: boolean;
  };
  userEmail?: string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onUpgrade, onUseTemplate, subscriptionStatus, userEmail }) => {
  const isAdmin = userEmail ? isAppMaker(userEmail) : false;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Trial Status Banner - Hidden for admin users */}
      {subscriptionStatus && !isAdmin && (
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          subscriptionStatus.needsUpgrade 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800/50' 
            : subscriptionStatus.isTrial 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800/50'
            : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800/50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {subscriptionStatus.needsUpgrade ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">!</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-red-900 dark:text-red-200">Trial Expired</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">You've used all your free reports. Upgrade to continue.</p>
                  </div>
                </>
              ) : subscriptionStatus.isTrial ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-blue-900 dark:text-blue-200">Free Trial Active</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {subscriptionStatus.reportsRemaining === 1 
                        ? '1 report remaining in your free trial'
                        : `${subscriptionStatus.reportsRemaining} reports remaining in your free trial`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-green-900 dark:text-green-200">Active Subscription</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {subscriptionStatus.reportsRemaining === 1 
                        ? '1 report remaining this month'
                        : `${subscriptionStatus.reportsRemaining} reports remaining this month`}
                    </p>
                  </div>
                </>
              )}
            </div>
            {subscriptionStatus.needsUpgrade && onUpgrade && (
              <button
                onClick={onUpgrade}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 text-white font-bold rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#EEF2FF] to-[#D5DDFF] dark:from-[#1a1f2e] dark:to-[#111827] border border-[#A1B4FF] dark:border-[#577AFF]/50 mb-8 shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.3)]">
          <Sparkles className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
          <span className="text-sm font-semibold text-[#577AFF] dark:text-[#A1B4FF]">AI-Powered Deep Customer Insights</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-[#051A53] dark:text-[#f3f4f6] mb-6 tracking-tight leading-[1.1]">
          Your AI Advisory Board
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-[#31458F] dark:text-[#A1B4FF] mb-12 max-w-3xl mx-auto">
          Get instant feedback from 20 expert AI personas built on your information
        </h2>

        <button
          onClick={onGetStarted}
          className="group bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 text-white px-8 py-5 rounded-2xl text-lg md:text-xl font-bold tracking-wide shadow-xl shadow-green-200 dark:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-300 dark:hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] active:scale-95 flex items-center justify-center gap-3 mx-auto"
          autoFocus
        >
          <Users className="w-6 h-6" />
          Assemble My Board
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Three Benefit Statements */}
      <div className="mb-16 md:mb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#EEF2FF] to-[#D5DDFF] dark:from-[#1a1f2e] dark:to-[#111827] border border-[#A1B4FF] dark:border-[#577AFF]/50 mb-4 shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.3)]">
            <Zap className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
            <span className="text-sm font-semibold text-[#577AFF] dark:text-[#A1B4FF]">Why Use The AI CAB</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Benefit 1 */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-white dark:from-[#1a1f2e] dark:to-[#111827] border border-[#D5DDFF] dark:border-[#374151] flex flex-col items-center text-center shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 dark:from-green-500 dark:via-emerald-500 dark:to-green-500 flex items-center justify-center mb-6 shadow-lg dark:shadow-[0_0_20px_rgba(34,197,94,0.5)]">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">An Instant AI Advisory Board</h3>
          <p className="text-[#595657] dark:text-[#9ca3af] text-sm">Access 20 expert AI personas in seconds. Stop the real-world struggle</p>
        </div>

        {/* Benefit 2 */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-white dark:from-[#1a1f2e] dark:to-[#111827] border border-[#D5DDFF] dark:border-[#374151] flex flex-col items-center text-center shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-500 dark:via-blue-600 dark:to-blue-500 flex items-center justify-center mb-6 shadow-lg dark:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">Your Exact ICP Cohort Every Time</h3>
          <p className="text-[#595657] dark:text-[#9ca3af] text-sm">A group of perfect AI customers always excited to give deep feedback</p>
        </div>

        {/* Benefit 3 */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-white dark:from-[#1a1f2e] dark:to-[#111827] border border-[#D5DDFF] dark:border-[#374151] flex flex-col items-center text-center shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-500 dark:via-amber-500 dark:to-orange-500 flex items-center justify-center mb-6 shadow-lg dark:shadow-[0_0_20px_rgba(249,115,22,0.5)]">
            <MessageSquareWarning className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">Brutally Honest Feedback</h3>
          <p className="text-[#595657] dark:text-[#9ca3af] text-sm">The real feedback you need, but your customers struggle to tell you</p>
        </div>
        </div>
      </div>

      {/* App Process Stages Section - 2x2 Grid */}
      <div className="mb-16 md:mb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#EEF2FF] to-[#D5DDFF] dark:from-[#1a1f2e] dark:to-[#111827] border border-[#A1B4FF] dark:border-[#577AFF]/50 mb-4 shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.3)]">
            <LayoutGrid className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
            <span className="text-sm font-semibold text-[#577AFF] dark:text-[#A1B4FF]">How It Works</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage 1 - ICP Setup */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#D5DDFF] dark:border-[#374151] bg-gradient-to-br from-white to-[#EEF2FF] dark:from-[#111827] dark:to-[#1a1f2e] shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="p-4">
            <h3 className="text-lg font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">Stage 1: Define Your ICP</h3>
            <div className="bg-white dark:bg-[#0a0e1a] rounded-lg border border-[#A1B4FF] dark:border-[#577AFF]/50 overflow-hidden shadow-inner" style={{ minHeight: '320px' }}>
              {/* Mock ICP Setup View */}
              <div className="p-4 space-y-3">
                <div className="border-b border-[#D5DDFF] dark:border-[#374151] pb-2">
                  <h4 className="text-sm font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1">Tell us about your ideal customer</h4>
                  <p className="text-[10px] text-[#595657] dark:text-[#9ca3af]">We'll use this to build your perfect advisory board</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#577AFF] dark:text-[#A1B4FF]">Industry</label>
                    <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded p-2 border border-[#D5DDFF] dark:border-[#374151]">
                      <div className="text-[10px] text-[#595657] dark:text-[#d1d5db]">SaaS Technology</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#577AFF] dark:text-[#A1B4FF]">Company Size</label>
                    <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded p-2 border border-[#D5DDFF] dark:border-[#374151]">
                      <div className="text-[10px] text-[#595657] dark:text-[#d1d5db]">50-200 employees</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#577AFF] dark:text-[#A1B4FF]">ICP Definition</label>
                  <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded p-2 border border-[#D5DDFF] dark:border-[#374151] min-h-[80px]">
                    <div className="text-[10px] text-[#595657] dark:text-[#d1d5db] leading-relaxed">
                      CMOs, VPs of Marketing, and Marketing Directors at B2B SaaS companies...
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-green-500 dark:bg-green-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-lg dark:shadow-[0_0_15px_rgba(34,197,94,0.5)]">Continue</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2 - Setup Form */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#D5DDFF] dark:border-[#374151] bg-gradient-to-br from-white to-[#EEF2FF] dark:from-[#111827] dark:to-[#1a1f2e] shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="p-4">
            <h3 className="text-lg font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">Stage 2: What to Test</h3>
            <div className="bg-white dark:bg-[#0a0e1a] rounded-lg border border-[#A1B4FF] dark:border-[#577AFF]/50 overflow-hidden shadow-inner" style={{ minHeight: '320px' }}>
              {/* Mock Setup Form View */}
              <div className="p-4 space-y-3">
                <div className="border-b border-[#D5DDFF] dark:border-[#374151] pb-2">
                  <h4 className="text-sm font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1">What would you like feedback on?</h4>
                  <p className="text-[10px] text-[#595657] dark:text-[#9ca3af]">Tell us what you want your board to analyze</p>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#577AFF] dark:text-[#A1B4FF]">Feedback Type</label>
                    <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded p-2 border border-[#D5DDFF] dark:border-[#374151] flex items-center justify-between">
                      <div className="text-[10px] text-[#595657] dark:text-[#d1d5db]">Pricing Strategy</div>
                      <ChevronDown className="w-3 h-3 text-[#577AFF] dark:text-[#A1B4FF]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#577AFF] dark:text-[#A1B4FF]">Feedback Item</label>
                    <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded p-2 border border-[#D5DDFF] dark:border-[#374151] min-h-[60px]">
                      <div className="text-[10px] text-[#595657] dark:text-[#d1d5db] leading-relaxed">
                        We're considering a new pricing model with three tiers...
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-green-500 dark:bg-green-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-lg dark:shadow-[0_0_15px_rgba(34,197,94,0.5)]">Assemble Board</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 3 - Board Assembly */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#D5DDFF] dark:border-[#374151] bg-gradient-to-br from-white to-[#EEF2FF] dark:from-[#111827] dark:to-[#1a1f2e] shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="p-4">
            <h3 className="text-lg font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">Stage 3: Board Assembly</h3>
            <div className="bg-white dark:bg-[#0a0e1a] rounded-lg border border-[#A1B4FF] dark:border-[#577AFF]/50 overflow-hidden shadow-inner" style={{ minHeight: '320px' }}>
              {/* Mock Board Assembly View */}
              <div className="p-4 space-y-3">
                <div className="text-center border-b border-[#D5DDFF] dark:border-[#374151] pb-2">
                  <h4 className="text-sm font-bold text-[#051A53] dark:text-[#f3f4f6] mb-1">Your Advisory Board is Assembled!</h4>
                  <p className="text-[10px] text-[#595657] dark:text-[#9ca3af]">Review your cohort and swap individuals to nail you board!</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {/* Board Member Cards */}
                  {[
                    { role: 'VP Marketing', name: 'Sarah Chen' },
                    { role: 'CMO', name: 'Michael Rodriguez' },
                    { role: 'VP Sales', name: 'Emily Thompson' },
                    { role: 'CRO', name: 'David Kim' },
                    { role: 'Marketing Director', name: 'Jessica Walsh' },
                    { role: 'VP Product', name: 'James Martinez' },
                    { role: 'Head of Growth', name: 'Amanda Lee' },
                    { role: 'VP Revenue', name: 'Robert Chen' }
                  ].map((member, i) => (
                    <div key={i} className={`rounded-lg border border-[#D5DDFF] dark:border-[#374151] p-1.5 flex flex-col items-center ${i % 3 === 0 ? 'bg-purple-50 dark:bg-purple-900/20' : i % 3 === 1 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${i % 2 === 0 ? 'from-[#577AFF] to-[#31458F]' : 'from-[#A1B4FF] to-[#577AFF]'} flex items-center justify-center text-white text-[10px] font-bold mb-1 shadow-lg dark:shadow-[0_0_10px_rgba(87,122,255,0.5)]`}>
                        {String.fromCharCode(65 + (i % 26))}
                      </div>
                      <div className="text-[8px] font-bold text-[#577AFF] dark:text-[#A1B4FF] truncate w-full text-center mb-0.5">{member.role}</div>
                      <div className="text-[7px] text-[#595657] dark:text-[#d1d5db] truncate w-full text-center">{member.name}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center pt-1">
                  <div className="bg-green-500 dark:bg-green-500 text-white px-6 py-2 rounded-xl text-[10px] font-bold shadow-lg dark:shadow-[0_0_15px_rgba(34,197,94,0.5)]">Start Board Session</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 4 - Comprehensive Analysis Report */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#D5DDFF] dark:border-[#374151] bg-gradient-to-br from-white to-[#EEF2FF] dark:from-[#111827] dark:to-[#1a1f2e] shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)]">
          <div className="p-4">
            <h3 className="text-lg font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">Stage 4: Comprehensive Analysis</h3>
            <div className="bg-white dark:bg-[#0a0e1a] rounded-lg border border-[#A1B4FF] dark:border-[#577AFF]/50 overflow-hidden shadow-inner" style={{ minHeight: '320px' }}>
              {/* Mock Report View */}
              <div className="p-4 space-y-3">
                <div className="border-b border-[#D5DDFF] dark:border-[#374151] pb-2 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-[#051A53] dark:text-[#f3f4f6] mb-0.5">Board Session Report</h4>
                    <p className="text-[10px] text-[#595657] dark:text-[#9ca3af]">Pricing Strategy Feedback</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] px-2 py-0.5 rounded text-[9px] font-semibold text-[#577AFF] dark:text-[#A1B4FF] border border-[#D5DDFF] dark:border-[#374151]">Print</div>
                    <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] px-2 py-0.5 rounded text-[9px] font-semibold text-[#577AFF] dark:text-[#A1B4FF] border border-[#D5DDFF] dark:border-[#374151]">Export</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded-lg p-3 border border-[#D5DDFF] dark:border-[#374151]">
                    <div className="text-xs font-bold text-[#577AFF] dark:text-[#A1B4FF] mb-1">Executive Dashboard</div>
                    <div className="text-[10px] text-[#595657] dark:text-[#d1d5db] space-y-0.5">
                      <div>• Pricing Model: 85% approval</div>
                      <div>• Competitive Positioning: Strong</div>
                    </div>
                  </div>
                  <div className="bg-[#D5DDFF] dark:bg-[#111827] rounded-lg p-3 border border-[#A1B4FF] dark:border-[#577AFF]/50">
                    <div className="text-xs font-bold text-[#31458F] dark:text-[#A1B4FF] mb-1">Deep Dive Analysis</div>
                    <div className="text-[10px] text-[#595657] dark:text-[#d1d5db] space-y-0.5">
                      <div>• Feedback from 20 experts</div>
                      <div>• Key insights on pricing tiers</div>
                    </div>
                  </div>
                  <div className="bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded-lg p-3 border border-[#D5DDFF] dark:border-[#374151]">
                    <div className="text-xs font-bold text-[#577AFF] dark:text-[#A1B4FF] mb-1">The Roast & The Gold</div>
                    <div className="text-[10px] text-[#595657] dark:text-[#d1d5db] space-y-0.5">
                      <div>• Brutally honest feedback</div>
                      <div>• Strategic recommendations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Example Reports Gallery */}
      {onUseTemplate && (
        <div className="mb-16 md:mb-20">
          <ExampleReportsGallery
            onUseTemplate={onUseTemplate}
          />
        </div>
      )}

    </div>
  );
};

export default WelcomeScreen;
