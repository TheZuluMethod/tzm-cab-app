/**
 * Analytics Service
 * 
 * Fetches aggregate, anonymous analytics data across all users for the app owner.
 * All data is anonymized and aggregated - no individual user data is exposed.
 */

import { supabase } from './supabaseClient';

export interface AnalyticsData {
  // Usage metrics
  totalSessions: number;
  totalUsers: number;
  sessionsThisMonth: number;
  sessionsLastMonth: number;
  averageSessionsPerUser: number;
  
  // Feedback type breakdown
  feedbackTypeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
  
  // Monthly usage trend
  monthlyUsage: {
    month: string;
    sessions: number;
    users: number;
  }[];
  
  // ICP profile breakdown
  icpIndustryBreakdown: {
    industry: string;
    count: number;
    percentage: number;
  }[];
  
  icpTitleBreakdown: {
    title: string;
    count: number;
    percentage: number;
  }[];
  
  // Board member analysis
  mostCommonBoardRoles: {
    role: string;
    count: number;
    percentage: number;
  }[];
  
  averageBoardSize: number;
  
  // Session completion rates
  completionRate: number;
  averageReportLength: number;
  
  // Competitor analysis usage
  competitorAnalysisUsage: {
    used: number;
    notUsed: number;
    percentage: number;
  };
  
  // Top feedback items (anonymized)
  topFeedbackItems: {
    item: string;
    count: number;
    type: string;
  }[];
  
  // Report Quality Metrics
  reportQualityMetrics: {
    averageAccuracyScore: number;
    averageVerifiedClaimsPercentage: number;
    totalVerifiedClaims: number;
    totalClaims: number;
    sessionsWithQC: number;
  };
  
  // Report Length Distribution
  reportLengthDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  
  // User Engagement Distribution
  userEngagementDistribution: {
    sessionsCount: string;
    userCount: number;
    percentage: number;
  }[];
  
  // Peak Usage Times
  peakUsageTimes: {
    hourOfDay: number;
    sessionCount: number;
  }[];
  
  // Day of Week Usage
  dayOfWeekUsage: {
    day: string;
    sessionCount: number;
  }[];
  
  // ICP Profile Completeness
  icpProfileCompleteness: {
    hasIndustry: number;
    hasTitles: number;
    hasBoth: number;
    totalWithICP: number;
    completenessPercentage: number;
  };
  
  // Session Duration (time from creation to completion)
  averageSessionDuration: number; // in minutes

  // Referral Program Metrics
  referralMetrics: {
    totalReferrals: number;
    totalReferrers: number;
    pendingReferrals: number;
    signedUpReferrals: number;
    convertedReferrals: number;
    creditsApplied: number;
    conversionRate: number; // percentage of referrals that converted
    signUpRate: number; // percentage of referrals that signed up
    averageReferralsPerUser: number;
    referralStatusBreakdown: {
      status: string;
      count: number;
      percentage: number;
    }[];
    monthlyReferralTrend: {
      month: string;
      referrals: number;
      conversions: number;
    }[];
  };
}

/**
 * Check if current user is the app maker/admin
 * 
 * Option 2 (Current): Email-based admin list - fast, synchronous
 * Option 1 (Enhanced): Also checks is_super_admin database flag - use isAppMakerAsync() for full check
 * 
 * To add backup admin emails (Option 2):
 * - Uncomment and add emails to adminEmails array below
 * 
 * To use database flag (Option 1):
 * - Run migration: supabase/migrations/add_super_admin_column.sql
 * - Use isAppMakerAsync() where userId is available
 * - Set is_super_admin via recovery Edge Function
 */
export const isAppMaker = (userEmail: string | null | undefined): boolean => {
  if (!userEmail) return false;
  
  // Option 2: Primary and backup admin emails
  // Add backup emails here for account recovery
  const adminEmails = [
    'hbrett@thezulumethod.com', // Primary admin email
    // Add backup admin emails below for account recovery:
    // 'backup-admin@thezulumethod.com', // Uncomment and add backup email
    // 'emergency-admin@thezulumethod.com', // Uncomment and add emergency email
  ];
  
  return adminEmails.some(email => userEmail.toLowerCase() === email.toLowerCase());
};

/**
 * Enhanced admin check (Option 1) - includes database is_super_admin flag
 * 
 * Checks both:
 * 1. Email-based admin list (Option 2)
 * 2. Database is_super_admin flag (Option 1)
 * 
 * Use this where userId is available for full security check
 */
export const isAppMakerAsync = async (
  userEmail: string | null | undefined, 
  userId?: string
): Promise<boolean> => {
  if (!userEmail) return false;
  
  // First check email-based admin list (fast, no DB call)
  if (isAppMaker(userEmail)) {
    return true;
  }
  
  // Option 1: Check is_super_admin flag from database (if userId provided)
  if (userId && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', userId)
        .eq('email', userEmail.toLowerCase())
        .single();
      
      if (!error && data?.is_super_admin === true) {
        return true;
      }
    } catch (error) {
      // If database check fails, fall back to email-only check
      console.warn('Failed to check is_super_admin flag:', error);
    }
  }
  
  return false;
};

/**
 * Fetch aggregate analytics data across all users
 * Only accessible by app maker
 * 
 * Note: This requires RLS policies to allow admin access, or use of a database function.
 * See supabase/migrations/add_analytics_function.sql for setup instructions.
 */
export const fetchAnalyticsData = async (): Promise<{ data: AnalyticsData | null; error?: string }> => {
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    // Get current user to verify admin status
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !isAppMaker(authUser.email)) {
      return { data: null, error: 'Access denied: Admin privileges required' };
    }

    // Get all completed sessions (exclude drafts)
    // Note: This may fail if RLS policies don't allow admin access.
    // If you get permission errors, run the migration in supabase/migrations/add_analytics_function.sql
    // and uncomment the RLS policy section, or update this to use the database function instead.
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'complete')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return { data: null, error: sessionsError.message };
    }

    if (!sessions || sessions.length === 0) {
      // Return empty analytics structure
      return {
        data: {
          totalSessions: 0,
          totalUsers: 0,
          sessionsThisMonth: 0,
          sessionsLastMonth: 0,
          averageSessionsPerUser: 0,
          feedbackTypeBreakdown: [],
          monthlyUsage: [],
          icpIndustryBreakdown: [],
          icpTitleBreakdown: [],
          mostCommonBoardRoles: [],
          averageBoardSize: 0,
          completionRate: 0,
          averageReportLength: 0,
          competitorAnalysisUsage: { used: 0, notUsed: 0, percentage: 0 },
          topFeedbackItems: [],
          reportQualityMetrics: {
            averageAccuracyScore: 0,
            averageVerifiedClaimsPercentage: 0,
            totalVerifiedClaims: 0,
            totalClaims: 0,
            sessionsWithQC: 0,
          },
          reportLengthDistribution: [],
          userEngagementDistribution: [],
          peakUsageTimes: [],
          dayOfWeekUsage: [],
          icpProfileCompleteness: {
            hasIndustry: 0,
            hasTitles: 0,
            hasBoth: 0,
            totalWithICP: 0,
            completenessPercentage: 0,
          },
          averageSessionDuration: 0,
          referralMetrics: {
            totalReferrals: 0,
            totalReferrers: 0,
            pendingReferrals: 0,
            signedUpReferrals: 0,
            convertedReferrals: 0,
            creditsApplied: 0,
            conversionRate: 0,
            signUpRate: 0,
            averageReferralsPerUser: 0,
            referralStatusBreakdown: [],
            monthlyReferralTrend: [],
          },
        },
      };
    }

    // Get unique user count
    const uniqueUserIds = new Set(sessions.map((s: any) => s.user_id));
    const totalUsers = uniqueUserIds.size;

    // Calculate monthly usage
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const sessionsThisMonth = sessions.filter((s: any) => new Date((s as any).created_at) >= thisMonth).length;
    const sessionsLastMonth = sessions.filter(
      (s: any) => new Date(s.created_at) >= lastMonth && new Date(s.created_at) < thisMonth
    ).length;

    // Monthly usage trend (last 6 months)
    const monthlyUsageMap = new Map<string, { sessions: number; users: Set<string> }>();
    sessions.forEach((session: any) => {
      const date = new Date(session.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyUsageMap.has(monthKey)) {
        monthlyUsageMap.set(monthKey, { sessions: 0, users: new Set() });
      }
      const monthData = monthlyUsageMap.get(monthKey)!;
      monthData.sessions++;
      monthData.users.add(session.user_id);
    });

    const monthlyUsage = Array.from(monthlyUsageMap.entries())
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sessions: data.sessions,
        users: data.users.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Feedback type breakdown
    const feedbackTypeMap = new Map<string, number>();
    sessions.forEach((session: any) => {
      const input = session.input as any;
      if (input?.feedbackType) {
        feedbackTypeMap.set(input.feedbackType, (feedbackTypeMap.get(input.feedbackType) || 0) + 1);
      }
    });

    const totalFeedbackTypes = Array.from(feedbackTypeMap.values()).reduce((a, b) => a + b, 0);
    const feedbackTypeBreakdown = Array.from(feedbackTypeMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalFeedbackTypes > 0 ? Math.round((count / totalFeedbackTypes) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ICP Industry breakdown
    const industryMap = new Map<string, number>();
    sessions.forEach((session: any) => {
      const input = session.input as any;
      if (input?.industry) {
        industryMap.set(input.industry, (industryMap.get(input.industry) || 0) + 1);
      }
    });

    const totalIndustries = Array.from(industryMap.values()).reduce((a, b) => a + b, 0);
    const icpIndustryBreakdown = Array.from(industryMap.entries())
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: totalIndustries > 0 ? Math.round((count / totalIndustries) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 industries

    // ICP Title breakdown
    const titleMap = new Map<string, number>();
    sessions.forEach((session: any) => {
      const input = session.input as any;
      if (input?.icpTitles && Array.isArray(input.icpTitles)) {
        input.icpTitles.forEach((title: string) => {
          titleMap.set(title, (titleMap.get(title) || 0) + 1);
        });
      }
    });

    const totalTitles = Array.from(titleMap.values()).reduce((a, b) => a + b, 0);
    const icpTitleBreakdown = Array.from(titleMap.entries())
      .map(([title, count]) => ({
        title,
        count,
        percentage: totalTitles > 0 ? Math.round((count / totalTitles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 titles

    // Board member roles analysis
    const roleMap = new Map<string, number>();
    let totalBoardMembers = 0;
    sessions.forEach((session: any) => {
      const members = session.members as any[];
      if (Array.isArray(members)) {
        totalBoardMembers += members.length;
        members.forEach((member: any) => {
          if (member?.role) {
            roleMap.set(member.role, (roleMap.get(member.role) || 0) + 1);
          }
        });
      }
    });

    const totalRoles = Array.from(roleMap.values()).reduce((a, b) => a + b, 0);
    const mostCommonBoardRoles = Array.from(roleMap.entries())
      .map(([role, count]) => ({
        role,
        count,
        percentage: totalRoles > 0 ? Math.round((count / totalRoles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 roles

    const averageBoardSize = sessions.length > 0 ? Math.round((totalBoardMembers / sessions.length) * 10) / 10 : 0;

    // Completion rate (sessions with reports)
    const completedSessions = sessions.filter((s: any) => s.report && s.report.trim().length > 0).length;
    const completionRate = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

    // Average report length
    const reportLengths = sessions
      .map((s: any) => s.report?.length || 0)
      .filter((len: number) => len > 0);
    const averageReportLength = reportLengths.length > 0
      ? Math.round(reportLengths.reduce((a: number, b: number) => a + b, 0) / reportLengths.length)
      : 0;

    // Competitor analysis usage
    const competitorAnalysisUsed = sessions.filter((s: any) => s.competitor_analysis && s.competitor_analysis !== null).length;
    const competitorAnalysisUsage = {
      used: competitorAnalysisUsed,
      notUsed: sessions.length - competitorAnalysisUsed,
      percentage: sessions.length > 0 ? Math.round((competitorAnalysisUsed / sessions.length) * 100) : 0,
    };

    // Top feedback items (anonymized - only show first 50 chars)
    const feedbackItemMap = new Map<string, { count: number; type: string }>();
    sessions.forEach((session: any) => {
      const input = session.input as any;
      if (input?.feedbackItem) {
        const item = input.feedbackItem.substring(0, 50) + (input.feedbackItem.length > 50 ? '...' : '');
        const existing = feedbackItemMap.get(item);
        if (existing) {
          existing.count++;
        } else {
          feedbackItemMap.set(item, { count: 1, type: input.feedbackType || 'Unknown' });
        }
      }
    });

    const topFeedbackItems = Array.from(feedbackItemMap.entries())
      .map(([item, data]) => ({
        item,
        count: data.count,
        type: data.type,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 feedback items

    // Calculate average sessions per user
    const userSessionCounts = new Map<string, number>();
    sessions.forEach((session: any) => {
      userSessionCounts.set(session.user_id, (userSessionCounts.get(session.user_id) || 0) + 1);
    });
    const averageSessionsPerUser = totalUsers > 0
      ? Math.round((Array.from(userSessionCounts.values()).reduce((a, b) => a + b, 0) / totalUsers) * 10) / 10
      : 0;

    // Report Quality Metrics (from qc_status)
    const qcSessions = sessions.filter((s: any) => s.qc_status && typeof s.qc_status === 'object');
    let totalAccuracy = 0;
    let totalVerifiedClaims = 0;
    let totalClaims = 0;
    qcSessions.forEach((session: any) => {
      const qc = session.qc_status as any;
      if (qc?.accuracyScore !== undefined) {
        totalAccuracy += qc.accuracyScore;
      }
      if (qc?.verifiedClaims !== undefined) {
        totalVerifiedClaims += qc.verifiedClaims;
      }
      if (qc?.totalClaims !== undefined) {
        totalClaims += qc.totalClaims;
      }
    });
    const reportQualityMetrics = {
      averageAccuracyScore: qcSessions.length > 0 && totalAccuracy > 0
        ? Math.round((totalAccuracy / qcSessions.length) * 10) / 10
        : 0,
      averageVerifiedClaimsPercentage: totalClaims > 0
        ? Math.round((totalVerifiedClaims / totalClaims) * 100)
        : 0,
      totalVerifiedClaims,
      totalClaims,
      sessionsWithQC: qcSessions.length,
    };

    // Report Length Distribution
    const lengthRanges = [
      { min: 0, max: 5000, label: '0-5k' },
      { min: 5000, max: 10000, label: '5k-10k' },
      { min: 10000, max: 20000, label: '10k-20k' },
      { min: 20000, max: 50000, label: '20k-50k' },
      { min: 50000, max: Infinity, label: '50k+' },
    ];
    const reportLengthDistribution = lengthRanges.map(range => {
      const count = reportLengths.filter((len: number) => len >= range.min && len < range.max).length;
      return {
        range: range.label,
        count,
        percentage: reportLengths.length > 0 ? Math.round((count / reportLengths.length) * 100) : 0,
      };
    });

    // User Engagement Distribution
    const engagementRanges = [
      { min: 1, max: 2, label: '1-2 sessions' },
      { min: 3, max: 5, label: '3-5 sessions' },
      { min: 6, max: 10, label: '6-10 sessions' },
      { min: 11, max: 20, label: '11-20 sessions' },
      { min: 21, max: Infinity, label: '21+ sessions' },
    ];
    const sessionCountsArray = Array.from(userSessionCounts.values());
    const userEngagementDistribution = engagementRanges.map(range => {
      const userCount = sessionCountsArray.filter((count: number) => count >= range.min && count < range.max).length;
      return {
        sessionsCount: range.label,
        userCount,
        percentage: totalUsers > 0 ? Math.round((userCount / totalUsers) * 100) : 0,
      };
    });

    // Peak Usage Times - Hour of Day
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<string, number>();
    sessions.forEach((session: any) => {
      const date = new Date(session.created_at);
      const hour = date.getHours();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + 1);
    });
    const peakUsageTimes = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({
        hourOfDay: hour,
        sessionCount: count,
      }))
      .sort((a, b) => a.hourOfDay - b.hourOfDay); // Sort by hour
    
    // Day of Week Usage
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayOfWeekUsage = Array.from(dayCounts.entries())
      .map(([day, count]) => ({
        day,
        sessionCount: count,
      }))
      .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    // ICP Profile Completeness
    let hasIndustry = 0;
    let hasTitles = 0;
    let hasBoth = 0;
    let totalWithICP = 0;
    sessions.forEach((session: any) => {
      const input = session.input as any;
      if (input?.industry || (input?.icpTitles && Array.isArray(input.icpTitles) && input.icpTitles.length > 0)) {
        totalWithICP++;
        const hasInd = !!input?.industry;
        const hasTit = !!(input?.icpTitles && Array.isArray(input.icpTitles) && input.icpTitles.length > 0);
        if (hasInd) hasIndustry++;
        if (hasTit) hasTitles++;
        if (hasInd && hasTit) hasBoth++;
      }
    });
    const icpProfileCompleteness = {
      hasIndustry,
      hasTitles,
      hasBoth,
      totalWithICP,
      completenessPercentage: totalWithICP > 0 ? Math.round((hasBoth / totalWithICP) * 100) : 0,
    };

    // Average Session Duration (time from "Start Board Session" click to report fully loaded)
    // Use session_start_time and session_end_time if available, otherwise fallback to created_at/updated_at
    const sessionDurations: number[] = [];
    sessions.forEach((session: any) => {
      let startTime: Date;
      let endTime: Date;
      
      // Prefer session_start_time and session_end_time if available
      if (session.session_start_time && session.session_end_time) {
        startTime = new Date(session.session_start_time);
        endTime = new Date(session.session_end_time);
      } else {
        // Fallback to created_at and updated_at
        startTime = new Date(session.created_at);
        endTime = new Date(session.updated_at);
      }
      
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      // Only include reasonable durations (between 1 minute and 2 hours)
      if (durationMinutes >= 1 && durationMinutes <= 120) {
        sessionDurations.push(durationMinutes);
      }
    });
    const averageSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
      : 0;

    // Referral Program Metrics
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    let referralMetrics = {
      totalReferrals: 0,
      totalReferrers: 0,
      pendingReferrals: 0,
      signedUpReferrals: 0,
      convertedReferrals: 0,
      creditsApplied: 0,
      conversionRate: 0,
      signUpRate: 0,
      averageReferralsPerUser: 0,
      referralStatusBreakdown: [] as Array<{ status: string; count: number; percentage: number }>,
      monthlyReferralTrend: [] as Array<{ month: string; referrals: number; conversions: number }>,
    };

    if (!referralsError && referrals && referrals.length > 0) {
      const uniqueReferrers = new Set(referrals.map((r: any) => r.referrer_id));
      const totalReferrers = uniqueReferrers.size;

      const pendingReferrals = referrals.filter((r: any) => r.status === 'pending').length;
      const signedUpReferrals = referrals.filter((r: any) => r.status === 'signed_up' || r.status === 'converted' || r.status === 'credit_applied').length;
      const convertedReferrals = referrals.filter((r: any) => r.status === 'converted' || r.status === 'credit_applied').length;
      const creditsApplied = referrals.filter((r: any) => r.status === 'credit_applied').length;

      const conversionRate = referrals.length > 0 ? Math.round((convertedReferrals / referrals.length) * 100) : 0;
      const signUpRate = referrals.length > 0 ? Math.round((signedUpReferrals / referrals.length) * 100) : 0;
      const averageReferralsPerUser = totalReferrers > 0 ? Math.round((referrals.length / totalReferrers) * 10) / 10 : 0;

      // Status breakdown
      const statusMap = new Map<string, number>();
      referrals.forEach((r: any) => {
        statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1);
      });
      const referralStatusBreakdown = Array.from(statusMap.entries())
        .map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          count,
          percentage: referrals.length > 0 ? Math.round((count / referrals.length) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Monthly referral trend
      const monthlyReferralMap = new Map<string, { referrals: number; conversions: number }>();
      referrals.forEach((r: any) => {
        const date = new Date(r.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyReferralMap.has(monthKey)) {
          monthlyReferralMap.set(monthKey, { referrals: 0, conversions: 0 });
        }
        const monthData = monthlyReferralMap.get(monthKey)!;
        monthData.referrals++;
        if (r.status === 'converted' || r.status === 'credit_applied') {
          monthData.conversions++;
        }
      });

      const monthlyReferralTrend = Array.from(monthlyReferralMap.entries())
        .map(([key, data]) => ({
          month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          referrals: data.referrals,
          conversions: data.conversions,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      referralMetrics = {
        totalReferrals: referrals.length,
        totalReferrers,
        pendingReferrals,
        signedUpReferrals,
        convertedReferrals,
        creditsApplied,
        conversionRate,
        signUpRate,
        averageReferralsPerUser,
        referralStatusBreakdown,
        monthlyReferralTrend,
      };
    }

    return {
      data: {
        totalSessions: sessions.length,
        totalUsers,
        sessionsThisMonth,
        sessionsLastMonth,
        averageSessionsPerUser,
        feedbackTypeBreakdown,
        monthlyUsage,
        icpIndustryBreakdown,
        icpTitleBreakdown,
        mostCommonBoardRoles,
        averageBoardSize,
        completionRate,
        averageReportLength,
        competitorAnalysisUsage,
        topFeedbackItems,
        reportQualityMetrics,
        reportLengthDistribution,
        userEngagementDistribution,
        peakUsageTimes,
        dayOfWeekUsage,
        icpProfileCompleteness,
        averageSessionDuration,
        referralMetrics,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching analytics:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

/**
 * Save a snapshot of current analytics data
 * This should be called periodically (e.g., daily) to track progression over time
 */
export const saveAnalyticsSnapshot = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify admin status first
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !isAppMaker(authUser.email)) {
      console.warn('⚠️ Cannot save snapshot: Admin privileges required');
      return { success: false, error: 'Access denied: Admin privileges required' };
    }
    
    // First, fetch current analytics data
    const { data: analyticsData, error: fetchError } = await fetchAnalyticsData();
    
    if (fetchError || !analyticsData) {
      console.warn('⚠️ Cannot save snapshot: Failed to fetch analytics data:', fetchError);
      return { success: false, error: fetchError || 'Failed to fetch analytics data' };
    }

    // Check if snapshot already exists for today
    const today = new Date().toISOString().split('T')[0];
    
    // Try to find existing snapshot - handle errors gracefully
    let existingSnapshot = null;
    try {
      const { data, error: checkError } = await supabase
        .from('analytics_snapshots')
        .select('id')
        .eq('snapshot_date', today)
        .maybeSingle();
      
      if (checkError) {
        // PGRST116 means "no rows returned" which is fine - no snapshot exists yet
        if (checkError.code === 'PGRST116' || checkError.message?.includes('No rows')) {
          existingSnapshot = null; // No snapshot exists, which is fine
        } else {
          // Other errors (like 406) might be RLS or permission issues
          console.warn('Error checking for existing snapshot (will try to insert anyway):', checkError);
          existingSnapshot = null; // Assume no snapshot exists and try to insert
        }
      } else {
        existingSnapshot = data;
      }
    } catch (err) {
      console.warn('Exception checking for existing snapshot (will try to insert anyway):', err);
      existingSnapshot = null; // Assume no snapshot exists and try to insert
    }

    // Prepare snapshot data
    const snapshotData = {
      snapshot_date: today,
      snapshot_timestamp: new Date().toISOString(),
      total_sessions: analyticsData.totalSessions,
      total_users: analyticsData.totalUsers,
      sessions_this_month: analyticsData.sessionsThisMonth,
      sessions_last_month: analyticsData.sessionsLastMonth,
      average_sessions_per_user: analyticsData.averageSessionsPerUser,
      feedback_type_breakdown: analyticsData.feedbackTypeBreakdown,
      monthly_usage: analyticsData.monthlyUsage,
      icp_industry_breakdown: analyticsData.icpIndustryBreakdown,
      icp_title_breakdown: analyticsData.icpTitleBreakdown,
      most_common_board_roles: analyticsData.mostCommonBoardRoles,
      completion_rate: analyticsData.completionRate,
      average_report_length: analyticsData.averageReportLength,
      average_board_size: analyticsData.averageBoardSize,
      competitor_analysis_count: analyticsData.competitorAnalysisUsage.used,
      competitor_analysis_percentage: analyticsData.competitorAnalysisUsage.percentage,
      top_feedback_items: analyticsData.topFeedbackItems,
      report_quality_metrics: analyticsData.reportQualityMetrics,
      report_length_distribution: analyticsData.reportLengthDistribution,
      user_engagement_distribution: analyticsData.userEngagementDistribution,
      average_session_duration: analyticsData.averageSessionDuration,
      peak_usage_times: analyticsData.peakUsageTimes,
      day_of_week_usage: analyticsData.dayOfWeekUsage,
      icp_profile_completeness: analyticsData.icpProfileCompleteness,
      full_snapshot: analyticsData, // Store complete snapshot for reference
    };

    if (existingSnapshot && existingSnapshot.id) {
      // Update existing snapshot
      const { error } = await supabase
        .from('analytics_snapshots')
        .update(snapshotData)
        .eq('id', existingSnapshot.id);

      if (error) {
        console.error('❌ Error updating analytics snapshot:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details });
        return { success: false, error: error.message };
      }
      
      console.log('✅ Analytics snapshot updated for', today);
      return { success: true };
    } else {
      // Insert new snapshot
      const { error } = await supabase
        .from('analytics_snapshots')
        .insert(snapshotData);

      if (error) {
        console.error('❌ Error saving analytics snapshot:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details });
        console.error('Snapshot data keys:', Object.keys(snapshotData));
        return { success: false, error: error.message };
      }
      
      console.log('✅ Analytics snapshot saved for', today);
      return { success: true };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving analytics snapshot:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get historical analytics snapshots
 * @param daysBack Number of days to look back (default: 30)
 */
export const getHistoricalAnalytics = async (daysBack: number = 30): Promise<{
  data: Array<{
    date: string;
    timestamp: string;
    analytics: AnalyticsData;
  }> | null;
  error?: string;
}> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .gte('snapshot_date', cutoffDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false });

    if (error) {
      console.error('Error fetching historical analytics:', error);
      return { data: null, error: error.message };
    }

    const historicalData = (data || []).map((snapshot: any) => ({
      date: snapshot.snapshot_date,
      timestamp: snapshot.snapshot_timestamp,
      analytics: snapshot.full_snapshot || {
        totalSessions: snapshot.total_sessions,
        totalUsers: snapshot.total_users,
        sessionsThisMonth: snapshot.sessions_this_month,
        sessionsLastMonth: snapshot.sessions_last_month,
        averageSessionsPerUser: snapshot.average_sessions_per_user,
        feedbackTypeBreakdown: snapshot.feedback_type_breakdown,
        monthlyUsage: snapshot.monthly_usage,
        icpIndustryBreakdown: snapshot.icp_industry_breakdown,
        icpTitleBreakdown: snapshot.icp_title_breakdown,
        mostCommonBoardRoles: snapshot.most_common_board_roles,
        averageBoardSize: snapshot.average_board_size,
        completionRate: snapshot.completion_rate,
        averageReportLength: snapshot.average_report_length,
        competitorAnalysisUsage: {
          used: snapshot.competitor_analysis_count,
          notUsed: 0,
          percentage: snapshot.competitor_analysis_percentage,
        },
        topFeedbackItems: snapshot.top_feedback_items,
        reportQualityMetrics: snapshot.report_quality_metrics,
        reportLengthDistribution: snapshot.report_length_distribution,
        userEngagementDistribution: snapshot.user_engagement_distribution,
        averageSessionDuration: snapshot.average_session_duration,
        peakUsageTimes: snapshot.peak_usage_times,
        dayOfWeekUsage: snapshot.day_of_week_usage,
        icpProfileCompleteness: snapshot.icp_profile_completeness,
      },
    }));

    return { data: historicalData };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching historical analytics:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

