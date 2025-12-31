import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';
import { UserInput } from '../types';
import { fetchDashboardData, DashboardData } from '../services/dashboardDataService';
import IndustryVisualizations from './IndustryVisualizations';

interface IndustryDataVisualizationProps {
  userInput: UserInput | null;
  onDataLoaded?: (data: DashboardData) => void; // Callback to store data for report
  autoFetch?: boolean; // Whether to automatically fetch data on mount (default: false to prevent quota issues)
}

const IndustryDataVisualization: React.FC<IndustryDataVisualizationProps> = ({ userInput, onDataLoaded, autoFetch = false }) => {
  if (!userInput) return null;

  const industry = userInput.industry || 'Industry';

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Start as false, only set to true when explicitly fetching
  const [hasQuotaError, setHasQuotaError] = useState<boolean>(false);

  // Animation states - one box at a time, left to right
  const [animatedBox, setAnimatedBox] = useState<number>(0); // 0-3 for the 4 boxes
  const [marketSizeValue, setMarketSizeValue] = useState(0);
  const [growthRateValue, setGrowthRateValue] = useState('0.0');
  const [dealSizeValue, setDealSizeValue] = useState(0);
  const [maturityText, setMaturityText] = useState('');

  // Only fetch data if autoFetch is true
  // This prevents automatic API calls that consume quota unnecessarily
  useEffect(() => {
    // Only auto-fetch if explicitly enabled
    if (!autoFetch) {
      setIsLoading(false);
      return;
    }

    // Reset state to force fresh data fetch
    setIsLoading(true);
    setDashboardData(null);
    setHasQuotaError(false);
    setAnimatedBox(0);
    setMarketSizeValue(0);
    setGrowthRateValue('0.0');
    setDealSizeValue(0);
    setMaturityText('');
    
    let isMounted = true;
    
    const loadData = async () => {
      try {
        if (import.meta.env.DEV) {
          console.log('🔄 Fetching FRESH dashboard data for:', {
            industry: userInput.industry,
            icpTitles: userInput.icpTitles,
            companyWebsite: userInput.companyWebsite,
            competitors: userInput.competitors,
            timestamp: Date.now()
          });
        }
        
        // Fetch fresh data
        const data = await fetchDashboardData(userInput);
        
        if (isMounted) {
          if (import.meta.env.DEV) {
            console.log('✅ Fresh dashboard data loaded:', data);
          }
          setDashboardData(data);
          setIsLoading(false);
          setHasQuotaError(false);
          // Store data for report to use (same data, no re-fetch)
          if (onDataLoaded) {
            onDataLoaded(data);
          }
          // Reset animation to start fresh with new data
          setAnimatedBox(0);
          setMarketSizeValue(0);
          setGrowthRateValue('0.0');
          setDealSizeValue(0);
          setMaturityText('');
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
        
        // Check if this is a quota error
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('API Quota Exceeded') || errorMessage.includes('quota') || errorMessage.includes('429')) {
          setHasQuotaError(true);
          if (import.meta.env.DEV) {
            console.warn('⚠️ Quota error detected - stopping automatic retries');
          }
        }
        // Fallback data will be used
      }
    };
    
    // Start fetching only if autoFetch is enabled
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [
    autoFetch, // Only re-fetch if autoFetch changes
    // Only include userInput dependencies if autoFetch is true
    ...(autoFetch ? [
      userInput?.industry, 
      userInput?.icpTitles, 
      userInput?.companyWebsite,
      userInput?.competitors,
      userInput?.companySize?.join(','),
      userInput?.companyRevenue?.join(',')
    ] : [])
  ]); // Re-fetch when ANY of these change AND autoFetch is true

  // Only use real dashboard data - never use fallback/placeholder data
  // If no data yet, use empty structure for top 4 boxes (they'll show loading state)
  const data: DashboardData = dashboardData || {
    marketSize: 0,
    growthRate: 0,
    avgDealSize: 0,
    marketMaturity: 'Growing' as const,
    revenueDistribution: [],
    companySizeDistribution: [],
    industryInsights: { trends: [], dynamics: [], quotes: [] },
    keyPlayers: [],
    technologyAdoption: [],
    geographicDistribution: [],
    buyingCycleStages: [],
    painPoints: [],
    investmentTrends: []
  };

  // Ensure animation starts only when real data is available
  useEffect(() => {
    // Only start animation if we have real dashboard data
    if (dashboardData && !isLoading) {
      // Reset and start animation with real data
      if (animatedBox === 0 && marketSizeValue === 0) {
        const timer = setTimeout(() => {
          setAnimatedBox(0); // This will trigger the animation
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, []); // Run once on mount

  const maturityOptions: Array<'Emerging' | 'Growing' | 'Mature' | 'Declining'> = ['Emerging', 'Growing', 'Mature', 'Declining'];

  // Animate boxes one at a time, left to right - ALWAYS use fresh dashboardData when available
  // Restart animation when fresh data loads
  useEffect(() => {
    // ALWAYS prioritize dashboardData (fresh data) over fallback data
    const targetMarketSize = dashboardData?.marketSize ?? data.marketSize;
    const targetGrowthRate = dashboardData?.growthRate ?? data.growthRate;
    const targetDealSize = dashboardData?.avgDealSize ?? data.avgDealSize;
    const targetMaturity = dashboardData?.marketMaturity ?? data.marketMaturity;
    
    // If we have fresh data, use it immediately; otherwise use fallback after short delay
    const startDelay = dashboardData ? 50 : 300;
    
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (animatedBox === 0) {
      timeoutId = setTimeout(() => {
        const duration = 1200;
        const steps = 60;
      let step = 0;
      
        intervalId = setInterval(() => {
        step++;
          const current = Math.min((step / steps) * targetMarketSize, targetMarketSize);
        setMarketSizeValue(Math.floor(current));
        
        if (step >= steps) {
            setMarketSizeValue(targetMarketSize);
            if (intervalId) clearInterval(intervalId);
            setTimeout(() => setAnimatedBox(1), 150);
        }
      }, duration / steps);
      }, startDelay);
    } else if (animatedBox === 1) {
      timeoutId = setTimeout(() => {
        const duration = 1200;
        const steps = 60;
      let step = 0;
      
        intervalId = setInterval(() => {
        step++;
          const current = Math.min((step / steps) * targetGrowthRate, targetGrowthRate);
        setGrowthRateValue(current.toFixed(1));
        
        if (step >= steps) {
            setGrowthRateValue(targetGrowthRate.toFixed(1));
            if (intervalId) clearInterval(intervalId);
            setTimeout(() => setAnimatedBox(2), 150);
        }
      }, duration / steps);
      }, startDelay);
    } else if (animatedBox === 2) {
      timeoutId = setTimeout(() => {
        const duration = 1200;
        const steps = 60;
      let step = 0;
      
        intervalId = setInterval(() => {
        step++;
          const current = Math.min((step / steps) * targetDealSize, targetDealSize);
        setDealSizeValue(Math.floor(current));
        
        if (step >= steps) {
            setDealSizeValue(targetDealSize);
            if (intervalId) clearInterval(intervalId);
            setTimeout(() => setAnimatedBox(3), 150);
        }
      }, duration / steps);
      }, startDelay);
    } else if (animatedBox === 3) {
      timeoutId = setTimeout(() => {
      let currentIndex = 0;
        const cycleDuration = 150;
        const finalMaturity = targetMaturity;
      
        intervalId = setInterval(() => {
        const option = maturityOptions[currentIndex];
        if (option !== undefined) {
          setMaturityText(option);
        }
        currentIndex++;
        
        if (currentIndex >= maturityOptions.length) {
            setMaturityText(finalMaturity);
            if (intervalId) clearInterval(intervalId);
        }
      }, cycleDuration);
      }, startDelay);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
    
    return undefined;
  }, [animatedBox, dashboardData, data.marketSize, data.growthRate, data.avgDealSize, data.marketMaturity]);

  // Get the actual values to display - ONLY use real dashboardData, never fallback
  // Use animated values if they're set, otherwise use dashboardData directly
  const displayMarketSize = marketSizeValue > 0 ? marketSizeValue : (dashboardData?.marketSize || 0);
  const displayGrowthRate = growthRateValue !== '0.0' ? parseFloat(growthRateValue) : (dashboardData?.growthRate || 0);
  const displayDealSize = dealSizeValue > 0 ? dealSizeValue : (dashboardData?.avgDealSize || 0);
  const displayMaturity = maturityText || (dashboardData?.marketMaturity || 'Loading...');

  // Show quota error message if detected
  if (hasQuotaError) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-6 mb-4">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">API Quota Exceeded</h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            You've reached the free tier limit of 250 requests per day for Gemini API. 
            The quota resets on a rolling 24-hour window (not at midnight). 
            Please wait a few minutes before trying again, or upgrade to a paid plan for higher limits.
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Dashboard data will use fallback values until the quota resets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Market Size Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
            <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Market Size</h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 transition-all duration-500">
            {isLoading && !dashboardData ? (
              <span className="inline-block w-16 h-8 bg-blue-200 dark:bg-blue-800/50 rounded animate-pulse" />
            ) : dashboardData && displayMarketSize > 0 ? (
              `$${displayMarketSize}B`
            ) : (
              <span className="text-sm text-blue-600 dark:text-blue-400">Loading...</span>
            )}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total Addressable Market</p>
        </div>

        {/* Growth Rate Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800/50 shadow-sm dark:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-green-500 dark:border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
            <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">Growth Rate</h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 transition-all duration-500">
            {isLoading && !dashboardData ? (
              <span className="inline-block w-16 h-8 bg-green-200 dark:bg-green-800/50 rounded animate-pulse" />
            ) : dashboardData && displayGrowthRate > 0 ? (
              `${displayGrowthRate.toFixed(1)}%`
            ) : (
              <span className="text-sm text-green-600 dark:text-green-400">Loading...</span>
            )}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Annual Growth (CAGR)</p>
        </div>

        {/* Avg Deal Size Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800/50 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-purple-500 dark:border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
            <TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">Avg Deal Size</h3>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 transition-all duration-500">
            {isLoading && !dashboardData ? (
              <span className="inline-block w-16 h-8 bg-purple-200 dark:bg-purple-800/50 rounded animate-pulse" />
            ) : dashboardData && displayDealSize > 0 ? (
              `$${displayDealSize}K`
            ) : (
              <span className="text-sm text-purple-600 dark:text-purple-400">Loading...</span>
            )}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Average Contract Value</p>
        </div>

        {/* Market Maturity Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-xl p-6 border border-orange-200 dark:border-orange-800/50 shadow-sm dark:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <PieChart className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : (
            <Users className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-1">Market Stage</h3>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 min-h-[2rem] flex items-center transition-all duration-500">
            {isLoading && !dashboardData && !maturityText ? (
              <span className="inline-block w-20 h-8 bg-orange-200 dark:bg-orange-800/50 rounded animate-pulse" />
            ) : (
              displayMaturity
            )}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Industry Lifecycle</p>
        </div>
      </div>

      <IndustryVisualizations 
        dashboardData={dashboardData}
        isLoading={isLoading}
        fallbackData={{
          marketSize: 0,
          growthRate: 0,
          avgDealSize: 0,
          marketMaturity: 'Growing' as const,
          revenueDistribution: [],
          companySizeDistribution: [],
          industryInsights: { trends: [], dynamics: [], quotes: [] },
          keyPlayers: [],
          technologyAdoption: [],
          geographicDistribution: [],
          buyingCycleStages: [],
          painPoints: [],
          investmentTrends: []
        }}
      />

    </div>
  );
};

export default IndustryDataVisualization;
