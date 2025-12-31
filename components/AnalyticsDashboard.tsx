/**
 * Analytics Dashboard Component
 * 
 * Displays aggregate, anonymous analytics data across all users.
 * Only accessible by the app maker/admin.
 */

import React, { useState, useEffect } from 'react';
import { X, BarChart3, Users, FileText, TrendingUp, Target, PieChart, Activity, Calendar, Award, Zap, Clock, CheckCircle, Star, TrendingDown, Gift, UserPlus } from 'lucide-react';
import { fetchAnalyticsData, saveAnalyticsSnapshot, AnalyticsData } from '../services/analyticsService';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

const COLORS = {
  primary: '#577AFF',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const DARK_COLORS = {
  primary: '#577AFF',
  secondary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  const chartColors = [colors.primary, colors.secondary, colors.success, colors.warning, colors.info, colors.danger];

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      console.log('📊 Loading analytics dashboard...');
      const result = await fetchAnalyticsData();
      if (result.error) {
        console.error('❌ Error loading analytics:', result.error);
        setError(result.error);
      } else {
        console.log('✅ Analytics data loaded, saving snapshot...');
        setAnalytics(result.data);
        // Save a snapshot of current analytics data for historical tracking
        // This runs in the background and won't block the UI
        saveAnalyticsSnapshot().then(result => {
          if (result.success) {
            console.log('✅ Analytics snapshot saved successfully');
          } else {
            console.warn('⚠️ Failed to save analytics snapshot:', result.error);
            // Log more details in dev mode
            if (import.meta.env.DEV) {
              console.warn('Snapshot save failure details:', result);
            }
          }
        }).catch(err => {
          console.error('❌ Exception saving analytics snapshot:', err);
          // Don't show error to user - snapshot saving is non-critical
        });
      }
      setIsLoading(false);
    };
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_30px_rgba(87,122,255,0.3)] max-w-7xl w-full max-h-[90vh] overflow-hidden border-2 border-[#EEF2FF] dark:border-[#577AFF]">
          <div className="p-6 border-b border-[#EEF2FF] dark:border-[#374151] flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
            </button>
          </div>
          <div className="p-12 flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-12 h-12 text-[#577AFF] dark:text-[#577AFF] animate-pulse mx-auto mb-4" />
              <p className="text-[#595657] dark:text-[#9ca3af]">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_30px_rgba(87,122,255,0.3)] max-w-7xl w-full max-h-[90vh] overflow-hidden border-2 border-[#EEF2FF] dark:border-[#577AFF]">
          <div className="p-6 border-b border-[#EEF2FF] dark:border-[#374151] flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
            </button>
          </div>
          <div className="p-12 text-center">
            <p className="text-red-600 dark:text-red-400">Error loading analytics: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 overflow-hidden">
      <div className="h-full flex flex-col bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_30px_rgba(87,122,255,0.3)] max-w-7xl w-full m-4 border-2 border-[#EEF2FF] dark:border-[#577AFF]">
        {/* Header - Sticky */}
        <div className="p-6 border-b border-[#EEF2FF] dark:border-[#374151] flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#111827]">
          <div>
            <h2 className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">Analytics Dashboard</h2>
            <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-1">Aggregate, anonymous data across all users</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Cards - Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Users className="w-6 h-6" />}
              title="Total Users"
              value={analytics.totalUsers}
              subtitle="Registered users"
              color={colors.primary}
            />
            <MetricCard
              icon={<FileText className="w-6 h-6" />}
              title="Total Sessions"
              value={analytics.totalSessions}
              subtitle={`${analytics.sessionsThisMonth} this month`}
              color={colors.secondary}
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Avg Sessions/User"
              value={analytics.averageSessionsPerUser}
              subtitle="Per user average"
              color={colors.success}
            />
            <MetricCard
              icon={<Target className="w-6 h-6" />}
              title="Completion Rate"
              value={`${analytics.completionRate}%`}
              subtitle="Sessions with reports"
              color={colors.info}
            />
          </div>

          {/* Additional Metrics - Moved to Top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={<FileText className="w-5 h-5" />}
              title="Avg Report Length"
              value={`${Math.round(analytics.averageReportLength / 1000)}k chars`}
              subtitle="Average characters"
              color={colors.warning}
            />
            <MetricCard
              icon={<Users className="w-5 h-5" />}
              title="Avg Board Size"
              value={analytics.averageBoardSize}
              subtitle="Members per board"
              color={colors.info}
            />
            <MetricCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Competitor Analysis"
              value={`${analytics.competitorAnalysisUsage.percentage}%`}
              subtitle={`${analytics.competitorAnalysisUsage.used} sessions used it`}
              color={colors.danger}
            />
          </div>

          {/* Referral Program Metrics */}
          {analytics.referralMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Gift className="w-5 h-5" />}
                  title="Total Referrals"
                  value={analytics.referralMetrics.totalReferrals}
                  subtitle={`${analytics.referralMetrics.totalReferrers} referrers`}
                  color={colors.primary}
                />
                <MetricCard
                  icon={<UserPlus className="w-5 h-5" />}
                  title="Conversions"
                  value={analytics.referralMetrics.convertedReferrals}
                  subtitle={`${analytics.referralMetrics.conversionRate}% conversion rate`}
                  color={colors.success}
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Sign Ups"
                  value={analytics.referralMetrics.signedUpReferrals}
                  subtitle={`${analytics.referralMetrics.signUpRate}% sign up rate`}
                  color={colors.info}
                />
                <MetricCard
                  icon={<Award className="w-5 h-5" />}
                  title="Credits Applied"
                  value={analytics.referralMetrics.creditsApplied}
                  subtitle="Free months awarded"
                  color={colors.warning}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Referral Status Breakdown */}
                {analytics.referralMetrics.referralStatusBreakdown.length > 0 && (
                  <ChartCard title="Referral Status Breakdown" icon={<PieChart className="w-5 h-5" />}>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analytics.referralMetrics.referralStatusBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.referralMetrics.referralStatusBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                            borderRadius: '8px',
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Monthly Referral Trend */}
                {analytics.referralMetrics.monthlyReferralTrend.length > 0 && (
                  <ChartCard title="Monthly Referral Trend" icon={<TrendingUp className="w-5 h-5" />}>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.referralMetrics.monthlyReferralTrend}>
                        <defs>
                          <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.success} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={colors.success} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                        <XAxis
                          dataKey="month"
                          stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#221E1F' }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="referrals"
                          stroke={colors.primary}
                          fillOpacity={1}
                          fill="url(#colorReferrals)"
                          name="Referrals"
                        />
                        <Area
                          type="monotone"
                          dataKey="conversions"
                          stroke={colors.success}
                          fillOpacity={0.6}
                          fill="url(#colorConversions)"
                          name="Conversions"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </div>
            </>
          )}

          {/* Monthly Usage Trend */}
          {analytics.monthlyUsage.length > 0 && (
            <ChartCard title="Monthly Usage Trend" icon={<Calendar className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.monthlyUsage}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    dataKey="month"
                    stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#221E1F' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke={colors.primary}
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                    name="Sessions"
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke={colors.secondary}
                    fillOpacity={0.6}
                    fill={colors.secondary}
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Type Breakdown */}
            {analytics.feedbackTypeBreakdown.length > 0 && (
              <ChartCard title="Feedback Type Breakdown" icon={<PieChart className="w-5 h-5" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.feedbackTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.feedbackTypeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ICP Industry Breakdown */}
            {analytics.icpIndustryBreakdown.length > 0 && (
              <ChartCard title="Top Industries" icon={<BarChart3 className="w-5 h-5" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.icpIndustryBreakdown.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <YAxis
                      dataKey="industry"
                      type="category"
                      stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                      style={{ fontSize: '12px' }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={colors.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ICP Title Breakdown */}
            {analytics.icpTitleBreakdown.length > 0 && (
              <ChartCard title="Top ICP Titles" icon={<Award className="w-5 h-5" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.icpTitleBreakdown.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="title"
                      stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Board Roles Breakdown */}
            {analytics.mostCommonBoardRoles.length > 0 && (
              <ChartCard title="Most Common Board Roles" icon={<Zap className="w-5 h-5" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.mostCommonBoardRoles.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <YAxis
                      dataKey="role"
                      type="category"
                      stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                      style={{ fontSize: '12px' }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={colors.success} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* Report Quality Metrics */}
          {analytics.reportQualityMetrics.sessionsWithQC > 0 && (
            <ChartCard title="Report Quality Scores" icon={<Star className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <p className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">
                    {analytics.reportQualityMetrics.averageAccuracyScore}%
                  </p>
                  <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-1">Avg Accuracy Score</p>
                </div>
                <div className="text-center p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <p className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">
                    {analytics.reportQualityMetrics.averageVerifiedClaimsPercentage}%
                  </p>
                  <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-1">Verified Claims</p>
                </div>
                <div className="text-center p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <p className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">
                    {analytics.reportQualityMetrics.sessionsWithQC}
                  </p>
                  <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-1">Sessions with QC</p>
                </div>
              </div>
            </ChartCard>
          )}

          {/* Report Length Distribution */}
          {analytics.reportLengthDistribution.length > 0 && (
            <ChartCard title="Report Length Distribution" icon={<FileText className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.reportLengthDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    dataKey="range"
                    stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* User Engagement Distribution */}
          {analytics.userEngagementDistribution.length > 0 && (
            <ChartCard title="User Engagement Distribution" icon={<Activity className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.userEngagementDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                  <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                  <YAxis
                    dataKey="sessionsCount"
                    type="category"
                    stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                    style={{ fontSize: '12px' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="userCount" fill={colors.success} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Usage Times - Hour of Day */}
            {analytics.peakUsageTimes.length > 0 && (
              <ChartCard title="Peak Usage Times (Hour of Day)" icon={<Clock className="w-5 h-5" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.peakUsageTimes}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.info} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={colors.info} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="hourOfDay"
                      stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Hour (24h)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => `${value}:00`}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessionCount"
                      stroke={colors.info}
                      fillOpacity={1}
                      fill="url(#colorHours)"
                      name="Sessions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Day of Week Usage */}
            {analytics.dayOfWeekUsage.length > 0 && (
              <ChartCard title="Usage by Day of Week" icon={<Calendar className="w-5 h-5" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.dayOfWeekUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="day"
                      stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="sessionCount" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* ICP Profile Completeness */}
          {analytics.icpProfileCompleteness.totalWithICP > 0 && (
            <ChartCard title="ICP Profile Completeness" icon={<CheckCircle className="w-5 h-5" />}>
              <div className="space-y-4">
                <div className="text-center p-6 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <p className="text-4xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">
                    {analytics.icpProfileCompleteness.completenessPercentage}%
                  </p>
                  <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-2">Complete Profiles</p>
                  <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                    {analytics.icpProfileCompleteness.hasBoth} of {analytics.icpProfileCompleteness.totalWithICP} sessions
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                    <p className="text-lg font-semibold text-[#221E1F] dark:text-[#f3f4f6]">
                      {analytics.icpProfileCompleteness.hasIndustry}
                    </p>
                    <p className="text-xs text-[#595657] dark:text-[#9ca3af]">With Industry</p>
                  </div>
                  <div className="p-3 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                    <p className="text-lg font-semibold text-[#221E1F] dark:text-[#f3f4f6]">
                      {analytics.icpProfileCompleteness.hasTitles}
                    </p>
                    <p className="text-xs text-[#595657] dark:text-[#9ca3af]">With Titles</p>
                  </div>
                </div>
              </div>
            </ChartCard>
          )}

          {/* Average Session Duration */}
          {analytics.averageSessionDuration > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                icon={<Clock className="w-5 h-5" />}
                title="Avg Session Duration"
                value={`${analytics.averageSessionDuration} min`}
                subtitle="Time to complete report"
                color={colors.secondary}
              />
            </div>
          )}

          {/* Top Feedback Items */}
          {analytics.topFeedbackItems.length > 0 && (
            <ChartCard title="Top Feedback Items" icon={<FileText className="w-5 h-5" />}>
              <div className="space-y-2">
                {analytics.topFeedbackItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6]">{item.item}</p>
                      <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Type: {item.type}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-[#577AFF] dark:text-[#577AFF]">{item.count}</p>
                      <p className="text-xs text-[#595657] dark:text-[#9ca3af]">times</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, subtitle, color }) => {
  return (
    <div className="bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-xl p-4 border border-[#EEF2FF] dark:border-[#374151]">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#595657] dark:text-[#9ca3af] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">{value}</p>
          <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon, children }) => {
  const { theme } = useTheme();
  return (
    <div className="bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-xl p-6 border border-[#EEF2FF] dark:border-[#374151]">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-[#577AFF] dark:text-[#577AFF]">{icon}</div>
        <h3 className="text-lg font-semibold text-[#221E1F] dark:text-[#f3f4f6]">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default AnalyticsDashboard;

