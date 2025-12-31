import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, BoardMember, UserInput, SavedSession, PersonaBreakdown } from './types';
import { AppUser, QCStatus } from './types/supabase';
import { generateBoardMembers, streamAnalysis, regenerateBoardMember, generateICPProfile, generatePersonaBreakdowns } from './services/geminiService';
import { analyzeCompetitors } from './services/competitorAnalysisService';
import { performQualityControl } from './services/qualityControlService';
import { reportError, getOrCreateSessionId } from './services/errorReportingService';
import { normalizePersonaBreakdowns, normalizeICPProfile } from './services/dataNormalizer';
import { getSessions, saveSession, deleteSession, migrateLocalStorageSessions } from './services/sessionService';
import { saveDraftSession, getLatestDraftSession, markSessionComplete, deleteDraftSession, DraftSessionData } from './services/draftSessionService';
import { signOut, getCurrentUser } from './services/authService';
import { supabase } from './services/supabaseClient';
import { getSubscriptionStatus, incrementReportsUsed, SubscriptionStatus } from './services/subscriptionService';
import { isAppMaker } from './services/analyticsService';
import { handleCheckoutSuccess } from './services/checkoutSuccessHandler';
import WelcomeScreen from './components/WelcomeScreen';
import UpgradeScreen from './components/UpgradeScreen';
import TrialNagModal from './components/TrialNagModal';
import DraftRecoveryModal from './components/DraftRecoveryModal';
import OnboardingFlow from './components/OnboardingFlow';
import ICPSetupForm from './components/ICPSetupForm';
import SetupForm from './components/SetupForm';
import BoardAssembly from './components/BoardAssembly';
import ProgressBar from './components/ProgressBar';
import ZuluLogo from './components/ZuluLogo';
import LoadingProgressBar from './components/LoadingProgressBar';
import { SectionErrorBoundary } from './components/SectionErrorBoundary';
import { ArrowLeft, Loader2 } from 'lucide-react';
import UserDropdown from './components/UserDropdown';
import AccountPanel from './components/AccountPanel';
import SavedReportsList from './components/SavedReportsList';
import ShortcutsModal from './components/ShortcutsModal';
import ShareReportModal from './components/ShareReportModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Lazy load heavy components for better performance
const ReportDisplayWrapper = React.lazy(() => import('./components/ReportDisplayWrapper'));
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard'));

/**
 * Generate a report title from feedback item and type
 */
const generateReportTitle = (feedbackItem: string, feedbackType?: string): string => {
  if (!feedbackItem) return 'Board Report';
  
  // Remove URLs and clean up text
  let cleaned = feedbackItem
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();
  
  if (!cleaned) return 'Board Report';
  
  // Analyze the feedback to create a 3-6 word summary
  const words = cleaned.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Common action verbs and key phrases to identify intent
  const actionPatterns = [
    { pattern: /test|validate|verify|check/i, type: 'Testing' },
    { pattern: /launch|release|introduce|rollout/i, type: 'Launch' },
    { pattern: /improve|enhance|optimize|refine/i, type: 'Improvement' },
    { pattern: /pricing|price|cost|fee|subscription/i, type: 'Pricing' },
    { pattern: /messaging|message|copy|content|communication/i, type: 'Messaging' },
    { pattern: /branding|brand|identity|visual/i, type: 'Branding' },
    { pattern: /positioning|position|market|competitive/i, type: 'Positioning' },
    { pattern: /feature|functionality|capability|tool/i, type: 'Feature' },
    { pattern: /product|solution|service|offering/i, type: 'Product' },
    { pattern: /strategy|plan|approach|direction/i, type: 'Strategy' },
    { pattern: /website|site|page|landing/i, type: 'Website' },
    { pattern: /campaign|marketing|promotion|ad/i, type: 'Campaign' }
  ];
  
  // Find the primary intent
  let primaryIntent = '';
  for (const { pattern, type } of actionPatterns) {
    if (pattern.test(cleaned)) {
      primaryIntent = type;
      break;
    }
  }
  
  // Extract key nouns/subjects (skip common words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'where', 'when', 'why', 'how', 'about', 'into', 'through', 'during', 'including', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'including', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'per', 'plus', 'except', 'but', 'minus', 'like', 'unlike', 'circa', 'vs', 'versus', 'via', 'until', 'unless', 'regarding', 'concerning', 'considering', 'following', 'across', 'behind', 'beyond', 'near', 'plus', 'round', 'since', 'than', 'under', 'within', 'without']);
  
  // Get meaningful words (nouns, adjectives, verbs) - typically longer words
  const meaningfulWords = words
    .filter(w => !stopWords.has(w) && w.length > 3)
    .slice(0, 5); // Take first 5 meaningful words
  
  // Build summary based on feedback type if available
  if (feedbackType) {
    const typeMap: Record<string, string> = {
      'Branding, Positioning, & Messaging': 'Brand Messaging Review',
      'Competitor Breakdown': 'Competitor Analysis Report',
      'Pricing & Packaging': 'Pricing Strategy Review',
      'Product Feature or Idea': 'Product Feature Analysis',
      'Brainstorming Session': 'Brainstorming Session',
      'Website CRO & Funnel Analysis': 'Website CRO & Funnel Analysis',
      'Other': primaryIntent || 'Feedback Review'
    };
    
    if (typeMap[feedbackType]) {
      const title = `${typeMap[feedbackType]} Board Report`;
      // Prevent double "Website" - if primaryIntent is "Website" and title already contains "Website", don't add it again
      if (primaryIntent === 'Website' && title.includes('Website')) {
        return title; // Already has Website, return as-is
      }
      return title;
    }
  }
  
  // Build a 3-6 word summary
  let summaryWords: string[] = [];
  
  // Prevent double "Website" - if primaryIntent is "Website" and feedbackType already contains "Website", skip primaryIntent
  if (primaryIntent && !(primaryIntent === 'Website' && feedbackType?.toLowerCase().includes('website'))) {
    summaryWords.push(primaryIntent);
  }
  
  // Add key subject words (limit to 2-3 to keep total 3-6 words)
  const maxSubjectWords = primaryIntent ? 3 : 4;
  const subjectWords = meaningfulWords
    .filter(w => !summaryWords.includes(w))
    .slice(0, maxSubjectWords)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)); // Capitalize
  
  summaryWords = summaryWords.concat(subjectWords);
  
  // Ensure we have 3-6 words
  if (summaryWords.length < 3) {
    // Add generic terms if needed
    if (summaryWords.length === 0) {
      summaryWords = ['Customer', 'Feedback', 'Review'];
    } else if (summaryWords.length === 1) {
      summaryWords.push('Strategy', 'Review');
    } else {
      summaryWords.push('Review');
    }
  } else if (summaryWords.length > 6) {
    summaryWords = summaryWords.slice(0, 6);
  }
  
  const summary = summaryWords.join(' ');
  return `${summary} Board Report`;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [report, setReport] = useState<string>('');
  const [icpProfile, setIcpProfile] = useState<SavedSession['icpProfile']>(undefined);
  const [personaBreakdowns, setPersonaBreakdowns] = useState<SavedSession['personaBreakdowns']>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  // Clear errors when navigating to initial states
  useEffect(() => {
    if (appState === AppState.WELCOME || appState === AppState.ICP_SETUP) {
      setError(null);
    }
  }, [appState]);
  
  // Cleanup timeout when leaving ANALYZING state or unmounting
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    };
  }, [appState]);
  const [qcStatus, setQcStatus] = useState<QCStatus | null>(null);
  // Industry dashboard data removed - no longer used
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
  const [showTrialNagModal, setShowTrialNagModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSessionId, setShareSessionId] = useState<string | null>(null);
  const [showDraftRecoveryModal, setShowDraftRecoveryModal] = useState(false);
  const [draftSessionToRecover, setDraftSessionToRecover] = useState<DraftSessionData | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analysisStartTimeRef = useRef<number | null>(null);
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    onQuickSearch: () => {
      if (appState === AppState.WELCOME || appState === AppState.COMPLETE) {
        setShowHistory(true);
      }
    },
    onNewReport: () => {
      if (appState === AppState.WELCOME || appState === AppState.COMPLETE) {
        handleReset();
      }
    },
    onClose: () => {
      if (showHistory) setShowHistory(false);
      if (showAccountPanel) setShowAccountPanel(false);
      if (showAnalyticsDashboard) setShowAnalyticsDashboard(false);
      if (showUpgradeScreen) setShowUpgradeScreen(false);
      if (showTrialNagModal) setShowTrialNagModal(false);
      if (showShortcutsModal) setShowShortcutsModal(false);
    },
    onShowHelp: () => {
      setShowShortcutsModal(true);
    },
    enabled: true,
  });
  
  // Memoized values - must be at top level, not conditional
  const filteredMembers = useMemo(() => 
    Array.isArray(members) 
      ? members.filter(m => m && typeof m === 'object' && m.id && m.name) 
      : [],
    [members]
  );

  const normalizedIcpProfile = useMemo(() => 
    icpProfile ? normalizeICPProfile(icpProfile) || undefined : undefined,
    [icpProfile]
  );

  const normalizedPersonaBreakdowns = useMemo(() => 
    personaBreakdowns ? normalizePersonaBreakdowns(personaBreakdowns) : undefined,
    [personaBreakdowns]
  );
  
  // History State
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [, setIsLoadingSessions] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Regeneration State
  const [isRegeneratingMemberId, setIsRegeneratingMemberId] = useState<string | null>(null);
  const [newlySwappedMemberId, setNewlySwappedMemberId] = useState<string | null>(null);

  // Load user and sessions on mount
  useEffect(() => {
    const loadUserAndSessions = async () => {
      // Run database migrations first
      const { runMigrations } = await import('./services/migrationService');
      await runMigrations();
      
      // Clear any stale errors on mount
      setError(null);
      
      // Check if onboarding should be shown (only on welcome screen)
      if (appState === AppState.WELCOME) {
        const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
        }
      }
      
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          // Load subscription status
          try {
            const subStatus = await getSubscriptionStatus(currentUser.id);
            setSubscriptionStatus(subStatus);
            
            // Show trial nag modal if trial is complete (reports remaining === 0 and isTrial === true)
            if (subStatus.isTrial && subStatus.reportsRemaining === 0 && subStatus.needsUpgrade) {
              // Check if modal was dismissed in this session (don't show if dismissed)
              const dismissed = localStorage.getItem('trial_nag_dismissed');
              // Show modal if not dismissed, or if dismissed more than 1 hour ago (show again)
              if (!dismissed || (Date.now() - parseInt(dismissed)) > 3600000) {
                setShowTrialNagModal(true);
              }
            }
          } catch (error) {
            console.error('Error loading subscription status:', error);
            // Allow access on error (graceful degradation)
          }
          
          // Load user avatar from database
          if (supabase) {
            const { data: profileData } = await supabase
              .from('users')
              .select('avatar_url')
              .eq('id', currentUser.id)
              .single();
            
            const avatarUrl = profileData?.['avatar_url'] || currentUser.user_metadata?.['avatar_url'] || null;
            setUserAvatarUrl(avatarUrl);
          }
          
          // Load sessions from Supabase
          setIsLoadingSessions(true);
          try {
            const { sessions, error: sessionsError } = await getSessions();
            
            if (sessionsError) {
              console.error('Error loading sessions:', sessionsError);
              // Only show error if it's not a permission issue that might be expected
              // (e.g., if RLS policies haven't been set up yet)
              if (!sessionsError.includes('permission') && !sessionsError.includes('policy')) {
                setError(`Failed to load saved sessions: ${sessionsError}`);
              } else {
                // Permission/policy errors - just log, don't show to user
                console.warn('Session loading permission issue (this may be expected):', sessionsError);
                setSavedSessions([]);
              }
            } else {
              setSavedSessions(sessions || []);
              
              // Migrate localStorage sessions to Supabase (one-time migration)
              const localSessions = localStorage.getItem('zulu_sessions');
              if (localSessions) {
                const { migrated, errors } = await migrateLocalStorageSessions();
                if (migrated > 0 && import.meta.env.DEV) {
                  console.log(`✅ Migrated ${migrated} sessions from localStorage to Supabase`);
                  // Reload sessions after migration
                  const { sessions: updatedSessions } = await getSessions();
                  setSavedSessions(updatedSessions || []);
                }
                if (errors > 0) {
                  console.warn(`⚠️ Failed to migrate ${errors} sessions`);
                }
              }
            }
          } catch (loadError: any) {
            console.error('Unexpected error loading sessions:', loadError);
            // Don't show error for expected cases (no sessions, etc.)
            setSavedSessions([]);
          } finally {
            setIsLoadingSessions(false);
          }
        } else {
          // Fallback to localStorage if not authenticated (for backward compatibility)
          try {
            const saved = localStorage.getItem('zulu_sessions');
            if (saved) {
              const parsed = JSON.parse(saved);
              const validated = Array.isArray(parsed) ? parsed.filter((s: unknown): s is SavedSession => {
                return s !== null && 
                       typeof s === 'object' && 
                       'id' in s && 
                       'input' in s && 
                       'members' in s && 
                       'report' in s &&
                       Array.isArray((s as SavedSession).members) && 
                       typeof (s as SavedSession).report === 'string';
              }) : [];
              setSavedSessions(validated);
            }
          } catch (error) {
            console.error('Error loading localStorage sessions:', error);
            setSavedSessions([]);
          }
        }
      } catch (error) {
        console.error('Error loading user and sessions:', error);
        setSavedSessions([]);
      }
    };

    loadUserAndSessions();
    
    // Check for Stripe checkout success on mount
    handleCheckoutSuccess().then(result => {
      if (result.success && result.message) {
        // Show success message
        setError(null);
        // You could show a success toast here instead
        if (import.meta.env.DEV) {
          console.log('Checkout success:', result.message);
        }
      } else if (result.message && result.message.includes('canceled')) {
        if (import.meta.env.DEV) {
          console.log('Checkout canceled');
        }
      }
    });
    
    // Check for draft session recovery on mount
    const checkDraftRecovery = async () => {
      try {
        const { session } = await getLatestDraftSession();
        if (session && session.appState && session.appState !== AppState.COMPLETE) {
          // Show custom modal instead of system confirm dialog
          setDraftSessionToRecover(session);
          setShowDraftRecoveryModal(true);
        }
      } catch (err) {
        console.error('Error checking draft recovery:', err);
        // Don't block app initialization
      }
    };
    
    checkDraftRecovery();
  }, []);

  // Show trial nag modal when navigating to welcome screen if trial is complete
  useEffect(() => {
    // Don't show nag modal for admin users unless they've enabled it
    const adminNagEnabled = localStorage.getItem('admin_nag_enabled') === 'true';
    const isAdmin = user?.email && isAppMaker(user.email);
    
    if (isAdmin && !adminNagEnabled) {
      // Admin has disabled nag screen - don't show it
      setShowTrialNagModal(false);
      return;
    }

    if (appState === AppState.WELCOME && subscriptionStatus && subscriptionStatus.isTrial && subscriptionStatus.reportsRemaining === 0 && subscriptionStatus.needsUpgrade) {
      const dismissed = localStorage.getItem('trial_nag_dismissed');
      // Show modal if not dismissed, or if dismissed more than 1 hour ago
      if (!dismissed || (Date.now() - parseInt(dismissed)) > 3600000) {
        setShowTrialNagModal(true);
      }
    } else if (appState !== AppState.WELCOME) {
      // Hide modal when navigating away from welcome screen
      setShowTrialNagModal(false);
    }
  }, [appState, subscriptionStatus, user]);

  // Log state transitions for debugging (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔄 App State Changed:', {
        appState,
        reportLength: report?.length || 0,
        membersCount: members?.length || 0,
        hasIcpProfile: !!icpProfile,
        personaBreakdownsCount: personaBreakdowns?.length || 0,
        hasError: !!error
      });
      
      if (appState === AppState.COMPLETE) {
        console.log('✅ COMPLETE State - Ready to render report:', {
          reportLength: report?.length || 0,
          reportPreview: report?.substring(0, 200),
          members: members,
          icpProfile: icpProfile,
          personaBreakdowns: personaBreakdowns
        });
      }
    }
  }, [appState, report, members, icpProfile, personaBreakdowns, error]);

  // Clear the "newly swapped" highlight after 5 seconds
  useEffect(() => {
    if (newlySwappedMemberId) {
      const timer = setTimeout(() => {
        setNewlySwappedMemberId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [newlySwappedMemberId]);


  // Save Session Automatically when Complete
  useEffect(() => {
    if (appState !== AppState.COMPLETE || !userInput || members.length === 0 || !report) {
      return;
    }

    // Check if exact same report exists to prevent dupes on re-renders
    const reportExists = savedSessions.some(s => s.report === report);
    if (reportExists) {
      return;
    }

    const now = new Date();
    const newSession: SavedSession = {
      id: Date.now().toString(),
      date: now.toLocaleDateString(),
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: generateReportTitle(userInput.feedbackItem, userInput.feedbackType),
      input: userInput,
      members,
      report,
      icpProfile,
      personaBreakdowns,
      appState: AppState.COMPLETE, // Ensure app state is saved
    };

    // Save to Supabase if authenticated, otherwise fallback to localStorage
    const saveToBackend = async () => {
      if (user) {
        // Save session with dashboard data, QC status, and competitor analysis
        // Use currentSessionId if available, otherwise create new
        const sessionToSave = currentSessionId ? { ...newSession, id: currentSessionId } : newSession;
        const result = await saveSession(sessionToSave, null, qcStatus, competitorAnalysis);
        if (result.success) {
          // Mark as complete
          if (currentSessionId) {
            await markSessionComplete(currentSessionId);
          }
          // Reload sessions from Supabase
          const { sessions } = await getSessions();
          setSavedSessions(sessions || []);
        } else {
          // Fallback to localStorage
          const updated = [newSession, ...savedSessions];
          setSavedSessions(updated);
          localStorage.setItem('zulu_sessions', JSON.stringify(updated));
        }
      } else {
        // Fallback to localStorage if not authenticated
        const updated = [newSession, ...savedSessions];
        setSavedSessions(updated);
        localStorage.setItem('zulu_sessions', JSON.stringify(updated));
      }
    };

    saveToBackend();
  }, [appState, userInput, members, report, icpProfile, personaBreakdowns, qcStatus, competitorAnalysis, savedSessions, user]);

  const handleLoadSession = useCallback((session: SavedSession) => {
    try {
      // Validate session data
      if (!session || !session.input || !Array.isArray(session.members) || typeof session.report !== 'string') {
        console.error('Invalid session data:', session);
        setError('Invalid session data. Please try loading a different session.');
        return;
      }

      // Normalize and validate members
      const validatedMembers = session.members.filter(m => 
        m && 
        typeof m === 'object' && 
        m.id && 
        m.name && 
        m.role
      );

      if (validatedMembers.length === 0) {
        console.error('No valid members in session');
        setError('Session has no valid board members. Please try a different session.');
        return;
      }

      // Normalize ICP Profile if present
      let normalizedIcpProfile = undefined;
      if (session.icpProfile) {
        normalizedIcpProfile = normalizeICPProfile(session.icpProfile);
        if (!normalizedIcpProfile) {
          console.warn('Failed to normalize ICP Profile, skipping');
        }
      }

      // Normalize Persona Breakdowns if present
      // IMPORTANT: For saved reports, we always want to show persona breakdowns
      // If they're missing, we'll create a placeholder or generate basic ones from members
      let normalizedPersonaBreakdowns = undefined;
      if (session.personaBreakdowns) {
        normalizedPersonaBreakdowns = normalizePersonaBreakdowns(session.personaBreakdowns);
        if (!normalizedPersonaBreakdowns || normalizedPersonaBreakdowns.length === 0) {
          console.warn('Failed to normalize Persona Breakdowns from saved session, will create placeholders');
          normalizedPersonaBreakdowns = undefined;
        }
      }
      
      // If persona breakdowns are missing, create basic placeholders from members
      // This ensures the personas section always appears for saved reports
      if (!normalizedPersonaBreakdowns || normalizedPersonaBreakdowns.length === 0) {
        console.log('Creating placeholder persona breakdowns for saved report');
        normalizedPersonaBreakdowns = validatedMembers.slice(0, 5).map((member, idx) => ({
          personaName: member.name || `Persona ${idx + 1}`,
          personaTitle: (member.role || 'BOARD MEMBER').toUpperCase(),
          buyerType: 'Decision Maker',
          ageRange: '35 - 55',
          preferredCommunicationChannels: ['Email', 'Video calls', 'In-person meetings'],
          titles: [member.role || 'Board Member'],
          otherRelevantInfo: [],
          attributes: ['Analytical', 'Strategic', 'Results-driven'],
          jobsToBeDone: ['Make informed strategic decisions', 'Drive business growth', 'Mitigate risks'],
          challenges: ['Balancing innovation with stability', 'Managing stakeholder expectations', 'Optimizing resource allocation'],
          decisionMakingProcess: {
            research: {
              description: 'Gathers comprehensive information before making decisions.',
              sources: ['Industry reports', 'Peer insights', 'Customer feedback']
            },
            evaluation: {
              description: 'Evaluates options based on strategic fit and ROI.',
              factors: ['Cost-benefit analysis', 'Strategic alignment', 'Risk assessment']
            },
            purchase: {
              description: 'Makes purchase decisions based on value and fit.',
              purchaseFactors: ['Clear value proposition', 'Proven results', 'Strong support'],
              hesitations: ['Unclear ROI', 'Implementation complexity', 'Vendor reliability']
            }
          }
        }));
      }

      // Ensure report is a string
      const safeReport = typeof session.report === 'string' ? session.report : String(session.report || '');

      // Set all state with normalized data
      setUserInput(session.input);
      setMembers(validatedMembers);
      setReport(safeReport);
      setIcpProfile(normalizedIcpProfile ?? undefined);
      setPersonaBreakdowns(normalizedPersonaBreakdowns); // Always set persona breakdowns (even if placeholders)
      setError(null); // Clear any previous errors
      setQcStatus(null); // Reset QC status when loading
      setAppState(AppState.COMPLETE);
      setShowHistory(false);
      
    } catch (error) {
      console.error('Error loading session:', error);
      setError(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reportError(error instanceof Error ? error : new Error('Session load error'), {
        appState: 'handleLoadSession',
        sessionId: getOrCreateSessionId()
      }).catch(() => {});
    }
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (user) {
      // Delete from Supabase
      const result = await deleteSession(sessionId);
      if (result.success) {
        // Reload sessions from Supabase
        const { sessions } = await getSessions();
        setSavedSessions(sessions || []);
      } else {
        console.error('Failed to delete session:', result.error);
        setError('Failed to delete session');
      }
    } else {
      // Fallback to localStorage if not authenticated
      const updated = savedSessions.filter(s => s.id !== sessionId);
      setSavedSessions(updated);
      localStorage.setItem('zulu_sessions', JSON.stringify(updated));
    }
  }, [user, savedSessions]);


  // Regenerate Single Member
  const handleRegenerateMember = useCallback(async (memberId: string) => {
    if (!userInput) return;
    setIsRegeneratingMemberId(memberId);
    
    try {
        const newMember = await regenerateBoardMember(userInput, members, memberId);
        setMembers(prev => prev.map(m => m.id === memberId ? newMember : m));
        setNewlySwappedMemberId(newMember.id); // Trigger highlight
    } catch (err) {
        console.error("Failed to swap member", err);
        
        // Report breaking error
        const error = err instanceof Error ? err : new Error(String(err));
        await reportError(error, {
          appState: AppState.BOARD_READY,
          userInput: {
            industry: userInput.industry,
            feedbackType: userInput.feedbackType,
            hasFiles: userInput.files && userInput.files.length > 0
          },
          sessionId: getOrCreateSessionId()
        });
        
        setError("Could not find a replacement member at this time.");
    } finally {
        setIsRegeneratingMemberId(null);
    }
  }, [userInput, members]);

  // Step 2: Start the Session Analysis
  const handleStartSession = useCallback(async () => {
    console.log('🚀 handleStartSession called', { 
      hasUserInput: !!userInput, 
      membersCount: members.length,
      userEmail: user?.email 
    });
    
    if (!userInput || members.length === 0) {
      console.error('❌ Cannot start session: missing userInput or members', {
        userInput: !!userInput,
        membersCount: members.length
      });
      setError('Cannot start session: Missing required data. Please go back and complete the setup.');
      return;
    }
    
    // Check subscription status before starting
    // Skip for admin users unless they've enabled nag
    const adminNagEnabled = localStorage.getItem('admin_nag_enabled') === 'true';
    const isAdmin = user?.email && isAppMaker(user.email);
    
    if (user) {
      const subStatus = await getSubscriptionStatus(user.id);
      setSubscriptionStatus(subStatus);
      
      console.log('📊 Subscription status:', {
        canRunReport: subStatus.canRunReport,
        isAdmin,
        adminNagEnabled,
        reportsRemaining: subStatus.reportsRemaining
      });
      
      // Admin users can bypass subscription check unless they've enabled nag
      if (!subStatus.canRunReport && !(isAdmin && !adminNagEnabled)) {
        console.log('⛔ Blocked by subscription check - showing upgrade screen');
        setShowUpgradeScreen(true);
        return;
      }
    }
    
    console.log('✅ Starting analysis...');

    setAppState(AppState.ANALYZING);
    setReport(''); // Clear previous if any
    setIcpProfile(undefined);
    setPersonaBreakdowns(undefined);
    setError(null); // Clear any previous errors
    setQcStatus(null); // Clear QC status
    setCompetitorAnalysis(null); // Clear competitor analysis
    
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Set start time
    analysisStartTimeRef.current = Date.now();
    
    // Set timeout to force complete after 3 minutes (reduced from 5 minutes)
    analysisTimeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Report generation timeout - forcing completion');
      handleForceComplete();
    }, 3 * 60 * 1000); // 3 minutes
    
    // Check for stuck reports after 2 minutes - show recovery options
    setTimeout(async () => {
      // Check if still analyzing and no report content
      if (appState === AppState.ANALYZING && (!report || report.trim().length === 0)) {
        try {
          const { session } = await getLatestDraftSession();
          if (session && session.appState === AppState.ANALYZING) {
            // Show recovery modal for stuck report
            setDraftSessionToRecover(session);
            setShowDraftRecoveryModal(true);
          }
        } catch (err) {
          console.error('Error checking for stuck report:', err);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    // Save draft session before starting analysis
    saveDraftSession({
      input: userInput,
      members: members,
      appState: AppState.ANALYZING,
      status: 'draft'
    }, currentSessionId || undefined).then(result => {
      if (result.success && result.sessionId) {
        setCurrentSessionId(result.sessionId);
        if (import.meta.env.DEV) {
          console.log('✅ Draft session saved before analysis:', result.sessionId);
        }
      }
    }).catch(err => {
      console.error('Error saving draft session:', err);
    });
    
    // Scroll to top when starting analysis
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let finalReport = '';
    let researchData = '';
    
    try {
      // Check if this is a competitor breakdown analysis
      const isCompetitorBreakdown = userInput.feedbackType?.toLowerCase().includes('competitor') && 
                                    userInput.feedbackType?.toLowerCase().includes('breakdown');
      
      // Perform competitor analysis if needed
      let competitorAnalysisResult = undefined;
      if (isCompetitorBreakdown) {
        try {
          if (import.meta.env.DEV) {
            console.log('🔍 Starting competitor analysis...');
          }
          competitorAnalysisResult = await analyzeCompetitors(userInput);
          setCompetitorAnalysis(competitorAnalysisResult); // Store for saving
          if (import.meta.env.DEV) {
            console.log('✅ Competitor analysis completed:', competitorAnalysisResult);
          }
        } catch (compError) {
          console.error('⚠️ Competitor analysis failed, continuing without competitor data:', compError);
          setCompetitorAnalysis(null); // Clear on error
          // Continue without competitor data - the analysis will still work
        }
      } else {
        setCompetitorAnalysis(null); // Clear if not competitor breakdown
      }
      
      // Start the main analysis report streaming first (don't wait for ICP/Persona)
      const analysisPromise = streamAnalysis(userInput, members, (chunk) => {
        finalReport += chunk;
        setReport(prev => prev + chunk);
        
        // Periodically save draft during streaming (every 5000 characters)
        if (finalReport.length % 5000 < chunk.length) {
          saveDraftSession({
            input: userInput,
            members: members,
            report: finalReport,
            competitorAnalysis: competitorAnalysisResult,
            appState: AppState.ANALYZING,
            status: 'draft'
          }, currentSessionId || undefined).catch(err => {
            console.error('Error saving draft during streaming:', err);
          });
        }
      }, competitorAnalysisResult).then(result => {
        finalReport = result.report;
        researchData = result.researchData;
        
        // Save draft after analysis completes
        saveDraftSession({
          input: userInput,
          members: members,
          report: finalReport,
          competitorAnalysis: competitorAnalysisResult,
          appState: AppState.ANALYZING,
          status: 'draft'
        }, currentSessionId || undefined).catch(err => {
          console.error('Error saving draft after analysis:', err);
        });
        
        return result;
      });

      // Generate ICP Profile and Persona Breakdowns in parallel (but don't block analysis)
      Promise.allSettled([
        generateICPProfile(userInput).then(profile => {
          try {
            // Normalize the profile to ensure it matches the expected structure
            const normalized = normalizeICPProfile(profile);
            if (normalized) {
              setIcpProfile(normalized);
            } else {
              // Always set a minimal profile to ensure it's always present
              setIcpProfile({
                titles: [],
                useCaseFit: [],
                signalsAndAttributes: []
              });
            }
          } catch (normalizeError) {
            console.error('❌ Error normalizing ICP profile:', normalizeError);
            // Always set a minimal profile to ensure it's always present even on error
            setIcpProfile({
              titles: [],
              useCaseFit: [],
              signalsAndAttributes: []
            });
          }
        }).catch(err => {
          console.error('❌ ICP Profile generation failed:', err);
          // Always set a minimal profile to ensure it's always present even on error
          setIcpProfile({
            titles: [],
            useCaseFit: [],
            signalsAndAttributes: []
          });
        }),
        generatePersonaBreakdowns(userInput, members).then(breakdowns => {
          try {
            // Normalize all personas to ensure they match expected structure
            const normalized = normalizePersonaBreakdowns(breakdowns);
            
            // CRITICAL: Always return exactly 5 unique personas by personaTitle (never duplicate titles)
            const uniquePersonas: PersonaBreakdown[] = [];
            const seenTitles = new Set<string>();
            
            // First pass: collect unique personas by title
            for (const persona of normalized) {
              if (uniquePersonas.length >= 5) break;
              const titleKey = persona.personaTitle?.toUpperCase().trim() || '';
              if (titleKey && !seenTitles.has(titleKey)) {
                seenTitles.add(titleKey);
                uniquePersonas.push(persona);
              }
            }
            
            // If we still need more, continue through remaining personas
            if (uniquePersonas.length < 5) {
              for (const persona of normalized) {
                if (uniquePersonas.length >= 5) break;
                const titleKey = persona.personaTitle?.toUpperCase().trim() || '';
                if (titleKey && !seenTitles.has(titleKey)) {
                  seenTitles.add(titleKey);
                  uniquePersonas.push(persona);
                }
              }
            }
            
            // Ensure we always have exactly 5 (generate placeholders if needed)
            if (uniquePersonas.length < 5) {
              const existingTitles = new Set(uniquePersonas.map(p => p.personaTitle?.toUpperCase().trim()));
              const availableMembers = members.filter(m => {
                const memberTitle = m.role?.toUpperCase().trim() || '';
                return memberTitle && !existingTitles.has(memberTitle);
              });
              
              for (let i = uniquePersonas.length; i < 5 && i < availableMembers.length; i++) {
                const member = availableMembers[i];
                if (!member || !member.role) continue;
                uniquePersonas.push({
                  personaName: member.name || `Persona ${i + 1}`,
                  personaTitle: (member.role || 'BOARD MEMBER').toUpperCase(),
                  buyerType: 'Decision Maker',
                  ageRange: '35 - 55',
                  preferredCommunicationChannels: ['Email', 'Video calls', 'In-person meetings'],
                  titles: [member.role || 'Board Member'],
                  otherRelevantInfo: [],
                  attributes: ['Analytical', 'Strategic', 'Results-driven'],
                  jobsToBeDone: ['Make informed strategic decisions', 'Drive business growth', 'Mitigate risks'],
                  challenges: ['Balancing innovation with stability', 'Managing stakeholder expectations', 'Optimizing resource allocation'],
                  decisionMakingProcess: {
                    research: {
                      description: 'Gathers comprehensive information before making decisions.',
                      sources: ['Industry reports', 'Peer insights', 'Customer feedback']
                    },
                    evaluation: {
                      description: 'Evaluates options based on strategic fit and ROI.',
                      factors: ['Cost-benefit analysis', 'Strategic alignment', 'Risk assessment']
                    },
                    purchase: {
                      description: 'Makes purchase decisions based on value and fit.',
                      purchaseFactors: ['Clear value proposition', 'Proven results', 'Strong support'],
                      hesitations: ['Unclear ROI', 'Implementation complexity', 'Vendor reliability']
                    }
                  }
                });
              }
            }
            
            setPersonaBreakdowns(uniquePersonas.slice(0, 5));
          } catch (normalizeError) {
            console.error('Error normalizing persona breakdowns:', normalizeError);
          }
        }).catch(err => {
          console.error('Persona breakdowns generation failed:', err);
        })
      ]).catch(err => {
        console.error('Background research generation failed:', err);
      });

      // Wait for the main analysis to complete
      await analysisPromise;
      
      // Ensure we have a report before proceeding
      if (!finalReport || finalReport.trim().length === 0) {
        throw new Error("Report generation completed but no content was generated");
      }
      
      // Perform Quality Control validation
      // CRITICAL: QC MUST always complete successfully - it uses retries and fallbacks
      
      const qcResult = await performQualityControl(
          finalReport,
          researchData || '', // Ensure researchData is always a string
          {
            industry: userInput.industry,
            icpTitles: userInput.icpTitles,
            competitors: userInput.competitors,
            feedbackItem: userInput.feedbackItem
          }
        );
        
      // QC always completes (uses fallback if needed), so we always have a result
      
      // Apply corrections if needed
      if (qcResult.corrections && qcResult.corrections.trim().length > 0) {
        setReport(qcResult.corrections);
        finalReport = qcResult.corrections;
      }
      
      // Store QC status for UI display
      // Always show QC badge - QC always completes (may use fallback)
      const qcStatusValue: QCStatus = {
        score: qcResult.accuracyScore, // This will be 100 if totalClaims === 0
        verified: qcResult.verifiedClaims,
        total: qcResult.totalClaims,
        issues: qcResult.issues.length
      };
      
      setQcStatus(qcStatusValue);
      
      // Clear timeout on successful completion
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      // Always set to complete if we have a report (even if QC failed)
      // This ensures the user always sees the report, even if there were issues
      if (finalReport && finalReport.trim().length > 0) {
        // Ensure report state is set first, then immediately set COMPLETE state
        // Set both states synchronously to avoid delays
        setReport(finalReport);
        setAppState(AppState.COMPLETE);
        
        // Increment reports used count
        if (user) {
          await incrementReportsUsed(user.id);
          // Refresh subscription status
          const updatedStatus = await getSubscriptionStatus(user.id);
          setSubscriptionStatus(updatedStatus);
          
          // Show trial nag modal if trial is now complete
          if (updatedStatus.isTrial && updatedStatus.reportsRemaining === 0 && updatedStatus.needsUpgrade) {
            setShowTrialNagModal(true);
          }
        }
        
        // Mark session as complete
        if (currentSessionId) {
          markSessionComplete(currentSessionId).catch(err => {
            console.error('Error marking session complete:', err);
          });
        }
      } else {
        // Only go to error state if we truly have no content
        throw new Error("Report generation completed but no content was available");
      }
    } catch (err) {
      // Clear timeout on error
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      console.error('Error in handleStartSession:', err);
      
      // Report breaking error (don't await - might fail)
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Check if it's a quota error for better user messaging (must be specific to avoid false positives)
      // First check if it's our own QuotaExceededError (most reliable)
      const errorString = JSON.stringify(error);
      const isQuotaError = error.name === 'QuotaExceededError' || 
                          // Check error string for actual API errors (not errorMessage to avoid matching our own messages)
                          errorString.includes('429') ||
                          errorString.includes('RESOURCE_EXHAUSTED') ||
                          errorString.includes('QuotaFailure') ||
                          (errorString.includes('quota') && (errorString.includes('exceeded') || errorString.includes('limit') || errorString.includes('reached')) && !errorString.includes('API Quota Exceeded'));
      
      reportError(error, {
        appState: AppState.ANALYZING,
        userInput: userInput ? {
          industry: userInput.industry,
          feedbackType: userInput.feedbackType,
          hasFiles: userInput.files && userInput.files.length > 0
        } : undefined,
        sessionId: getOrCreateSessionId()
      }).catch(reportErr => {
        console.error('Failed to report error:', reportErr);
      });
      
      // If we have any report content, show it even if there was an error
      if (finalReport && finalReport.trim().length > 0) {
        setReport(finalReport);
        setError(`Report generation encountered an issue: ${error.message || 'Unknown error'}. Showing partial results.`);
        setAppState(AppState.COMPLETE);
      } else {
        // Show user-friendly error message
        if (isQuotaError) {
          setError(error.message || 'API quota exceeded. Please wait a few minutes and try again, or upgrade your API plan.');
        } else {
          setError(`The session encountered an error: ${error.message || 'Unknown error'}. Please try again.`);
        }
        setAppState(AppState.ERROR);
      }
    }
  }, [userInput, members]);

  // Force complete report function - completes with whatever content we have
  const handleForceComplete = useCallback(async () => {
    if (appState !== AppState.ANALYZING) return;
    
    // Clear timeout if exists
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Get current report content
    const currentReport = report || '';
    
    // If we have content, complete the report
    if (currentReport.trim().length > 0) {
      setReport(currentReport);
      setAppState(AppState.COMPLETE);
      
      // Save the session
      if (currentSessionId && userInput && members.length > 0) {
        const qcStatusValue: QCStatus = {
          score: 100,
          verified: 0,
          total: 0,
          issues: 0
        };
        setQcStatus(qcStatusValue);
        
        // Save final session
        const newSession: SavedSession = {
          id: currentSessionId,
          input: userInput,
          members: members,
          report: currentReport,
          icpProfile: icpProfile,
          personaBreakdowns: personaBreakdowns,
          competitorAnalysis: competitorAnalysis,
          appState: AppState.COMPLETE,
          date: new Date().toLocaleDateString()
        };
        
        await saveSession(newSession, undefined, qcStatusValue).catch(err => {
          console.error('Error saving session on force complete:', err);
        });
        
        // Mark session as complete
        markSessionComplete(currentSessionId).catch(err => {
          console.error('Error marking session complete:', err);
        });
        
        // Increment reports used count
        if (user) {
          await incrementReportsUsed(user.id).catch(err => {
            console.error('Error incrementing reports used:', err);
          });
          const updatedStatus = await getSubscriptionStatus(user.id).catch(() => subscriptionStatus);
          if (updatedStatus) {
            setSubscriptionStatus(updatedStatus);
          }
        }
      }
    } else {
      // No content - cancel and go back
      setAppState(AppState.BOARD_READY);
      setError('Report generation was cancelled. You can try again.');
    }
  }, [appState, report, currentSessionId, userInput, members, icpProfile, personaBreakdowns, competitorAnalysis, user, subscriptionStatus]);

  // Back navigation handler
  const handleBack = useCallback(() => {
    // Clear any errors when navigating back
    setError(null);
    if (appState === AppState.ICP_SETUP) {
      setAppState(AppState.WELCOME);
    } else if (appState === AppState.SETUP) {
      setAppState(AppState.ICP_SETUP);
    } else if (appState === AppState.BOARD_READY) {
      setAppState(AppState.SETUP);
    } else if (appState === AppState.ANALYZING || appState === AppState.COMPLETE) {
      setAppState(AppState.BOARD_READY);
    }
  }, [appState]);

  // Welcome screen handler
  const handleWelcomeGetStarted = useCallback(async () => {
    try {
      // Check subscription status before allowing start
      // Skip upgrade screen for admin users unless they've enabled nag
      const adminNagEnabled = localStorage.getItem('admin_nag_enabled') === 'true';
      const isAdmin = user?.email && isAppMaker(user.email);
      
      if (user && subscriptionStatus?.needsUpgrade && !(isAdmin && !adminNagEnabled)) {
        setShowUpgradeScreen(true);
        return;
      }
      
      setAppState(AppState.ICP_SETUP);
      setError(null); // Clear any previous errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Add visual transition
      document.body.style.opacity = '0.7';
      setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.3s ease-in-out';
      }, 100);
    } catch (error) {
      console.error('Error in handleWelcomeGetStarted:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to start: ${errorMessage}`);
      reportError(error instanceof Error ? error : new Error(String(error)), {
        appState: AppState.WELCOME,
        sessionId: getOrCreateSessionId()
      }).catch(() => {
        // Silently fail - error already handled
      });
    }
  }, [user, subscriptionStatus]);

  // Handle template usage - pre-fill form with template data
  const handleUseTemplate = useCallback((template: SavedSession) => {
    try {
      // Pre-fill user input with template data
      if (template.input) {
        setUserInput(template.input);
        // Navigate to setup form (Step 2) since ICP is already filled
        setAppState(AppState.SETUP);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error using template:', error);
      setError('Failed to load template. Please try again.');
    }
  }, []);

  // ICP Setup handler (Step 1)
  const handleICPSetupSubmit = useCallback((data: Partial<UserInput>) => {
    try {
      // Validate and ensure required fields are present
      if (!data || typeof data !== 'object') {
        setError('Invalid form data. Please try again.');
        return;
      }
      
      if (!data.industry || typeof data.industry !== 'string' || data.industry.trim() === '') {
        setError('Industry is required. Please fill in the Industry field.');
        return;
      }
      
      if (!data.icpTitles || typeof data.icpTitles !== 'string' || data.icpTitles.trim() === '') {
        console.error('Missing or invalid icpTitles:', data.icpTitles);
        setError('ICP Titles are required. Please fill in the ICP Titles field.');
        return;
      }
      
      // Build complete UserInput object with required fields
      const completeUserInput: UserInput = {
        industry: data.industry.trim(),
        icpTitles: data.icpTitles.trim(),
        feedbackType: data.feedbackType || '',
        feedbackItem: data.feedbackItem || '',
        circumstances: data.circumstances || '',
        files: Array.isArray(data.files) ? data.files : [],
        companyWebsite: data.companyWebsite?.trim() || undefined,
        solutions: data.solutions?.trim() || undefined,
        coreProblems: data.coreProblems?.trim() || undefined,
        competitors: data.competitors?.trim() || undefined,
        seoKeywords: data.seoKeywords?.trim() || undefined,
        companySize: Array.isArray(data.companySize) && data.companySize.length > 0 ? data.companySize : undefined,
        companyRevenue: Array.isArray(data.companyRevenue) && data.companyRevenue.length > 0 ? data.companyRevenue : undefined
      };
      
      if (import.meta.env.DEV) {
        console.log('Complete user input prepared:', JSON.stringify(completeUserInput, null, 2));
        console.log('State update called - appState set to SETUP');
      }
      
      // Update state immediately - React will batch these
      setUserInput(completeUserInput);
      setAppState(AppState.SETUP);
      setError(null);
      
      // Save draft session after ICP Setup (Step 1)
      saveDraftSession({
        input: completeUserInput,
        appState: AppState.SETUP,
        status: 'draft'
      }, currentSessionId || undefined).then(result => {
        if (result.success && result.sessionId) {
          setCurrentSessionId(result.sessionId);
          if (import.meta.env.DEV) {
            console.log('✅ Draft session saved after ICP Setup:', result.sessionId);
          }
        } else if (result.error) {
          console.warn('⚠️ Failed to save draft session:', result.error);
        }
      }).catch(err => {
        console.error('Error saving draft session:', err);
      });
      
      // Use setTimeout instead of requestAnimationFrame for more reliable execution
      setTimeout(() => {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });
        // Add visual transition
        document.body.style.opacity = '0.7';
        setTimeout(() => {
          document.body.style.opacity = '1';
          document.body.style.transition = 'opacity 0.3s ease-in-out';
        }, 100);
      }, 0);
    } catch (error) {
      console.error('Error in handleICPSetupSubmit:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to proceed: ${errorMessage}. Please try again.`);
      reportError(error instanceof Error ? error : new Error(String(error)), {
        appState: AppState.ICP_SETUP,
        sessionId: getOrCreateSessionId(),
        userInput: {
          industry: data?.industry
        }
      }).catch(() => {
        // Silently fail - error already handled
      });
    }
  }, []);

  // Step 2: Handle Form Submit & Generate Personas
  const handleSetupSubmit = useCallback(async (data: UserInput) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Add visual transition
    document.body.style.opacity = '0.7';
    setTimeout(() => {
      document.body.style.opacity = '1';
      document.body.style.transition = 'opacity 0.3s ease-in-out';
    }, 100);
    // Merge with existing userInput from Step 1
    const completeData = { ...userInput, ...data } as UserInput;
    setUserInput(completeData);
    setAppState(AppState.ASSEMBLING);
    setError(null);
    
    // Save draft session after Setup Form (Step 2)
    saveDraftSession({
      input: completeData,
      appState: AppState.ASSEMBLING,
      status: 'draft'
    }, currentSessionId || undefined).then(result => {
      if (result.success && result.sessionId) {
        setCurrentSessionId(result.sessionId);
        if (import.meta.env.DEV) {
          console.log('✅ Draft session saved after Setup Form:', result.sessionId);
        }
      } else if (result.error) {
        console.warn('⚠️ Failed to save draft session:', result.error);
      }
    }).catch(err => {
      console.error('Error saving draft session:', err);
    });
    
    try {
      const generatedMembers = await generateBoardMembers(completeData);
      setMembers(generatedMembers);
      setAppState(AppState.BOARD_READY);
      
      // Save draft session after Board Assembly (Step 3)
      saveDraftSession({
        input: completeData,
        members: generatedMembers,
        appState: AppState.BOARD_READY,
        status: 'draft'
      }, currentSessionId || undefined).then(result => {
        if (result.success && result.sessionId) {
          setCurrentSessionId(result.sessionId);
          if (import.meta.env.DEV) {
            console.log('✅ Draft session saved after Board Assembly:', result.sessionId);
          }
        } else if (result.error) {
          console.warn('⚠️ Failed to save draft session:', result.error);
        }
      }).catch(err => {
        console.error('Error saving draft session:', err);
      });
    } catch (err) {
      // Report breaking error (don't await to avoid blocking UI)
      const error = err instanceof Error ? err : new Error(String(err));
      const errorMessage = error.message || String(err);
      
      // Extract error details for better detection
      let errorStatus: number | undefined;
      let errorCode: string | undefined;
      try {
        const errorObj = err as Record<string, unknown>;
        errorStatus = (errorObj?.['status'] as number) || 
                     (errorObj?.['statusCode'] as number) || 
                     ((errorObj?.['response'] as Record<string, unknown>)?.['status'] as number) || 
                     ((errorObj?.['response'] as Record<string, unknown>)?.['statusCode'] as number);
        errorCode = (errorObj?.['code'] as string) || 
                   (((errorObj?.['response'] as Record<string, unknown>)?.['data'] as Record<string, unknown>)?.['error'] as Record<string, unknown>)?.['code'] as string || 
                   (((errorObj?.['response'] as Record<string, unknown>)?.['data'] as Record<string, unknown>)?.['code'] as string);
      } catch {
        // Ignore parsing errors
      }
      
      reportError(error, {
        appState: AppState.ASSEMBLING,
        userInput: {
          industry: completeData.industry,
          feedbackType: completeData.feedbackType,
          hasFiles: completeData.files && completeData.files.length > 0
        },
        sessionId: getOrCreateSessionId()
      }).catch(() => {
        // Silently fail - error already handled
      });
      
      // Check for quota/rate limit errors (must be VERY specific to avoid false positives)
      const isQuotaError = 
        (error.name === 'QuotaExceededError' && (errorStatus === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorCode === 'QuotaFailure')) ||
        errorStatus === 429 ||
        errorCode === 'RESOURCE_EXHAUSTED' ||
        errorCode === 'QuotaFailure';
      
      // NEVER treat as quota error if it's a stale error
      const isOurOwnError = errorMessage.includes('API Quota Exceeded: You\'ve reached the free tier limit');
      const isStaleError = isOurOwnError && !errorStatus && !errorCode;
      
      if (isStaleError) {
        setError(null);
        setAppState(AppState.SETUP);
        return;
      }
      
      // Check for API key errors
      const isApiKeyError = 
        errorMessage.includes('API_KEY') || 
        errorMessage.includes('GEMINI_API_KEY') ||
        errorMessage.includes('API Configuration Error') ||
        errorMessage.includes('not configured');
      
      // Provide specific error message based on error type
      const userFriendlyMessage = isQuotaError
        ? "API quota exceeded. You've reached the free tier limit. Please wait a few minutes and try again, or upgrade your API plan."
        : isApiKeyError
        ? "Failed to recruit the board. Please check your GEMINI_API_KEY in the .env file and restart the dev server."
        : `Failed to recruit the board: ${errorMessage}. Please try again.`;
      
      setError(userFriendlyMessage);
      setAppState(AppState.SETUP);
    }
  }, [userInput]);

  const handleReset = useCallback(() => {
    setAppState(AppState.WELCOME);
    setUserInput(null);
    setMembers([]);
    setReport('');
    setIcpProfile(undefined);
    setPersonaBreakdowns(undefined);
    setError(null);
    setCurrentSessionId(null); // Clear current session ID on reset
    // Industry dashboard data removed
    setQcStatus(null);
    setCompetitorAnalysis(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFD] dark:bg-[#0a0e1a] text-[#221E1F] dark:text-[#f3f4f6] selection:bg-[#D5DDFF] dark:selection:bg-[#577AFF]/30 transition-colors">
      
      {/* History Sidebar - Now using SavedReportsList component */}
      {showHistory && (
        <>
          <SavedReportsList
            sessions={savedSessions}
            onLoadSession={handleLoadSession}
            onDeleteSession={handleDeleteSession}
            onClose={() => setShowHistory(false)}
          />
          {/* Overlay for sidebar */}
          <div onClick={() => setShowHistory(false)} className="fixed inset-0 bg-[#383535]/20 dark:bg-black/50 z-40 backdrop-blur-sm no-print" />
        </>
      )}

      <main className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header Area */}
        <header className="w-full p-4 md:p-6 border-b border-[#EEF2FF] dark:border-[#374151] bg-[#EEF2FF]/80 dark:bg-[#111827]/90 backdrop-blur-sm sticky top-0 z-30 flex justify-between items-center no-print">
           
           {/* Left: Logo */}
           <div className="cursor-pointer group" onClick={handleReset}>
             <ZuluLogo showText={true} />
           </div>
           
           {/* Right: Controls */}
           <div className="flex items-center gap-3">
              {/* Back Button - Hidden during report generation and reports */}
              {appState !== AppState.WELCOME && appState !== AppState.ANALYZING && appState !== AppState.COMPLETE && (
                <button 
                  onClick={handleBack} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#595657] dark:text-[#9ca3af] hover:text-[#577AFF] dark:hover:text-[#577AFF] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-all border border-[#EEF2FF] dark:border-[#374151] hover:border-[#D5DDFF] dark:hover:border-[#577AFF]"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium text-sm hidden sm:inline">Back</span>
                </button>
              )}

              {user && (
                <UserDropdown
                  userEmail={user.email || ''}
                  userAvatarUrl={userAvatarUrl}
                  savedReportsCount={savedSessions.length}
                  onSavedReportsClick={() => setShowHistory(true)}
                  onSignOut={async () => {
                    await signOut();
                    window.location.reload();
                  }}
                  onAdminClick={() => setShowAccountPanel(true)}
                  onAnalyticsClick={() => setShowAnalyticsDashboard(true)}
                  onStartNewBoard={handleReset}
                  showStartNewBoard={true}
                />
              )}
           </div>
        </header>

        {/* Progress Bar - Visible after welcome */}
        {appState !== AppState.WELCOME && (
            <div className="pt-6 md:pt-8">
                <ProgressBar currentState={appState} />
            </div>
        )}

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col items-center justify-start px-2 md:px-4 pb-12 w-full">
            {error && (
              <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-center shadow-sm mt-8">
                {error}
              </div>
            )}

            {appState === AppState.WELCOME && (
              <div className="mt-4 md:mt-8 w-full">
                <WelcomeScreen 
                  onGetStarted={handleWelcomeGetStarted}
                  onUpgrade={() => {
                    setShowTrialNagModal(false);
                    setShowUpgradeScreen(true);
                  }}
                  onUseTemplate={handleUseTemplate}
                  subscriptionStatus={subscriptionStatus ? {
                    isTrial: subscriptionStatus.isTrial,
                    reportsRemaining: subscriptionStatus.reportsRemaining,
                    needsUpgrade: subscriptionStatus.needsUpgrade,
                  } : undefined}
                  userEmail={user?.email || undefined}
                />
              </div>
            )}

            {appState === AppState.ICP_SETUP && (
              <div className="mt-4 md:mt-8 w-full">
                <SectionErrorBoundary sectionName="ICP Setup Form">
                  <ICPSetupForm onSubmit={handleICPSetupSubmit} isSubmitting={false} />
                </SectionErrorBoundary>
              </div>
            )}

            {appState === AppState.SETUP && userInput && (
              <div className="mt-4 md:mt-8 w-full">
                <SectionErrorBoundary sectionName="Setup Form">
                  <SetupForm onSubmit={handleSetupSubmit} isSubmitting={false} initialData={userInput} />
                </SectionErrorBoundary>
              </div>
            )}
            {appState === AppState.SETUP && !userInput && (
              <div className="mt-4 md:mt-8 w-full max-w-2xl mx-auto p-4 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg">
                <p className="mb-4">Missing form data. Please go back and complete the ICP setup form.</p>
                <button
                  onClick={() => {
                    setAppState(AppState.ICP_SETUP);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium"
                >
                  Go Back to ICP Setup
                </button>
              </div>
            )}

            {appState === AppState.ASSEMBLING && (
               <div className="flex flex-col items-center justify-center h-[40vh] animate-in fade-in px-4 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-[#EEF2FF] dark:border-[#374151] border-t-[#577AFF] dark:border-t-[#577AFF] rounded-full animate-spin mb-8"></div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-3">Recruiting Board Members</h2>
                  <p className="text-[#595657] dark:text-[#9ca3af] text-center max-w-md text-base md:text-lg">
                    Analyzing {userInput?.industry} landscape and identifying key personas...
                  </p>
               </div>
            )}

            {(appState === AppState.BOARD_READY) && (
              <BoardAssembly 
                members={members} 
                onStartSession={handleStartSession}
                onRegenerateMember={handleRegenerateMember}
                isLoading={false} 
                isRegeneratingMemberId={isRegeneratingMemberId}
                newlySwappedMemberId={newlySwappedMemberId}
              />
            )}
            
            {(appState === AppState.ANALYZING) && userInput && (
                <LoadingProgressBar 
                  userInput={userInput} 
                  reportLength={report.length}
                  onForceComplete={handleForceComplete}
                />
            )}

            {(appState === AppState.COMPLETE) && userInput && report && report.trim().length > 0 && (
              <React.Suspense fallback={
                <div className="w-full flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#577AFF] dark:text-[#577AFF] mx-auto mb-4" />
                    <p className="text-[#595657] dark:text-[#9ca3af]">Loading report...</p>
                  </div>
                </div>
              }>
                <ReportDisplayWrapper 
                  key={`report-${report.length}-${members.length}`}
                  reportContent={typeof report === 'string' ? report : String(report || '')} 
                  isStreaming={false} 
                  onReset={handleReset} 
                  members={filteredMembers}
                  icpProfile={normalizedIcpProfile}
                  personaBreakdowns={normalizedPersonaBreakdowns}
                  qcStatus={qcStatus}
                  userInput={userInput}
                  sessionId={currentSessionId}
                  onShare={() => {
                    if (currentSessionId) {
                      setShareSessionId(currentSessionId);
                      setShowShareModal(true);
                    }
                  }}
                  isTrial={subscriptionStatus?.isTrial || false}
                  onUpgrade={() => {
                    setShowTrialNagModal(true);
                  }}
                  subscriptionStatus={subscriptionStatus ? {
                    isTrial: subscriptionStatus.isTrial,
                    reportsRemaining: subscriptionStatus.reportsRemaining,
                    needsUpgrade: subscriptionStatus.needsUpgrade,
                  } : undefined}
                />
              </React.Suspense>
            )}
        </div>
        
        <footer className="w-full p-6 text-center text-[#595657] dark:text-[#9ca3af] text-sm no-print mt-auto">
            The Zulu Method AI Customer Advisory Board &copy; 2026
        </footer>
      </main>

      {/* Account Panel Modal */}
      {showAccountPanel && (
        <AccountPanel
          onClose={async () => {
            setShowAccountPanel(false);
            // Reload avatar when account panel closes (in case user updated it)
            const currentUser = await getCurrentUser();
            if (currentUser && supabase) {
              const { data: profileData } = await supabase
                .from('users')
                .select('avatar_url')
                .eq('id', currentUser.id)
                .single();
              const avatarUrl = profileData?.['avatar_url'] || currentUser.user_metadata?.['avatar_url'] || null;
              setUserAvatarUrl(avatarUrl);
            }
          }} 
        />
      )}

      {showAnalyticsDashboard && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#577AFF] dark:text-[#577AFF] mx-auto mb-4" />
              <p className="text-[#595657] dark:text-[#9ca3af]">Loading analytics...</p>
            </div>
          </div>
        }>
          <AnalyticsDashboard
            onClose={() => setShowAnalyticsDashboard(false)}
          />
        </React.Suspense>
      )}

      {/* Onboarding Flow */}
      {showOnboarding && appState === AppState.WELCOME && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
          }}
          onSkip={() => {
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Upgrade Screen - Skip for admin unless they've enabled nag */}
      {showUpgradeScreen && (() => {
        const adminNagEnabled = localStorage.getItem('admin_nag_enabled') === 'true';
        const isAdmin = user?.email && isAppMaker(user.email);
        // Don't show for admin unless they've enabled it
        return !(isAdmin && !adminNagEnabled);
      })() && (
        <UpgradeScreen
          onClose={() => setShowUpgradeScreen(false)}
          reportsRemaining={subscriptionStatus?.reportsRemaining || 0}
          isTrial={subscriptionStatus?.isTrial || false}
        />
      )}

      {/* Trial Nag Modal - Shows when trial is complete (unless admin has disabled it) */}
      {showTrialNagModal && subscriptionStatus && subscriptionStatus.isTrial && subscriptionStatus.reportsRemaining === 0 && (() => {
        const adminNagEnabled = localStorage.getItem('admin_nag_enabled') === 'true';
        const isAdmin = user?.email && isAppMaker(user.email);
        // Don't show for admin unless they've enabled it
        if (isAdmin && !adminNagEnabled) {
          return false;
        }
        return true;
      })() && (
        <TrialNagModal
          onClose={() => setShowTrialNagModal(false)}
          onUpgrade={() => {
            setShowTrialNagModal(false);
            setShowUpgradeScreen(true);
          }}
          reportsRemaining={subscriptionStatus.reportsRemaining}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {/* Share Report Modal */}
      {showShareModal && shareSessionId && (
        <ShareReportModal
          sessionId={shareSessionId}
          reportTitle={savedSessions.find(s => s.id === shareSessionId)?.title || 'Board Report'}
          onClose={() => {
            setShowShareModal(false);
            setShareSessionId(null);
          }}
        />
      )}

      {/* Draft Recovery Modal */}
      {showDraftRecoveryModal && draftSessionToRecover && (
        <DraftRecoveryModal
          sessionTitle={draftSessionToRecover.input?.feedbackItem 
            ? generateReportTitle(draftSessionToRecover.input.feedbackItem, draftSessionToRecover.input.feedbackType)
            : undefined
          }
          onContinue={() => {
            const session = draftSessionToRecover;
            if (session && session.input) {
              setCurrentSessionId(session.id || null);
              setUserInput(session.input as UserInput);
              if (session.members) {
                setMembers(session.members);
              }
              if (session.report) {
                setReport(session.report);
              }
              if (session.icpProfile) {
                setIcpProfile(session.icpProfile);
              }
              if (session.personaBreakdowns) {
                setPersonaBreakdowns(session.personaBreakdowns);
              }
              if (session.qcStatus) {
                setQcStatus(session.qcStatus);
              }
              if (session.competitorAnalysis) {
                setCompetitorAnalysis(session.competitorAnalysis);
              }
              setAppState(session.appState || AppState.WELCOME);
              
              if (import.meta.env.DEV) {
                console.log('✅ Draft session recovered:', session.id);
              }
            }
            setShowDraftRecoveryModal(false);
            setDraftSessionToRecover(null);
          }}
          onDismiss={() => {
            setShowDraftRecoveryModal(false);
            setDraftSessionToRecover(null);
          }}
          onDelete={async () => {
            const session = draftSessionToRecover;
            if (session?.id) {
              // Delete the draft session
              await deleteDraftSession(session.id);
              
              // If we have user input, restore it and start fresh
              if (session.input) {
                setUserInput(session.input as UserInput);
                // Reset other state to start fresh
                setMembers([]);
                setReport('');
                setIcpProfile(undefined);
                setPersonaBreakdowns(undefined);
                setQcStatus(null);
                setCompetitorAnalysis(null);
                setCurrentSessionId(null);
                setAppState(AppState.ICP_SETUP);
              }
              
              setShowDraftRecoveryModal(false);
              setDraftSessionToRecover(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;