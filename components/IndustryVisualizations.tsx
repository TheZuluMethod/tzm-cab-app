import React, { memo } from 'react';
import { Building2, Activity, Globe, DollarSign, TrendingDown, TrendingUp as TrendUp, Minus, Loader2 } from 'lucide-react';
import { DashboardData } from '../services/dashboardDataService';

interface IndustryVisualizationsProps {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  loadingSections?: Set<string>;
  loadedSections?: Set<string>;
  fallbackData: DashboardData;
}

const IndustryVisualizations: React.FC<IndustryVisualizationsProps> = memo(({ 
  dashboardData, 
  isLoading, 
  loadingSections = new Set(),
  loadedSections = new Set(),
  fallbackData 
}) => {
  // Check which sections have data (for display) - Only 4 sections now
  const hasKeyPlayers = dashboardData?.keyPlayers && dashboardData.keyPlayers.length > 0;
  const hasTechnologyAdoption = dashboardData?.technologyAdoption && dashboardData.technologyAdoption.length > 0;
  const hasGeographicDistribution = dashboardData?.geographicDistribution && dashboardData.geographicDistribution.length > 0;
  const hasInvestmentTrends = dashboardData?.investmentTrends && dashboardData.investmentTrends.length > 0;

  // Check loading state per section
  const isKeyPlayersLoading = loadingSections.has('keyPlayers') && !hasKeyPlayers;
  const isTechnologyLoading = loadingSections.has('technologyAdoption') && !hasTechnologyAdoption;
  const isGeographicLoading = loadingSections.has('geographicDistribution') && !hasGeographicDistribution;
  const isInvestmentLoading = loadingSections.has('investmentTrends') && !hasInvestmentTrends;

  // Show sections that are loading OR have data
  // This ensures smooth progressive loading
  const shouldShowKeyPlayers = hasKeyPlayers || isKeyPlayersLoading;
  const shouldShowTechnology = hasTechnologyAdoption || isTechnologyLoading;
  const shouldShowGeographic = hasGeographicDistribution || isGeographicLoading;
  const shouldShowInvestment = hasInvestmentTrends || isInvestmentLoading;

  // If no sections to show at all, show a message
  if (!shouldShowKeyPlayers && !shouldShowTechnology && !shouldShowGeographic && !shouldShowInvestment) {
    return (
      <div className="text-center py-12">
        <p className="text-[#595657] dark:text-[#9ca3af]">Industry research information will appear here as found...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 SECTIONS - Progressive Loading: Show sections as they become available */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Key Players / Market Leaders */}
        {shouldShowKeyPlayers && (
        <div className={`bg-white dark:bg-[#111827] rounded-xl p-6 border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] transition-all duration-300 ${
          isKeyPlayersLoading ? 'opacity-75' : 'opacity-100'
        }`}>
          <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
            Key Market Players
            {isKeyPlayersLoading && (
              <Loader2 className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF] animate-spin ml-auto" />
            )}
          </h3>
          {isKeyPlayersLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#577AFF] dark:border-[#577AFF]"></div>
                <span className="ml-3 text-sm text-[#595657] dark:text-[#9ca3af]">Loading market players data...</span>
              </div>
              <p className="text-xs text-center text-[#595657] dark:text-[#9ca3af] italic">
                This section will update automatically when data is ready
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(dashboardData?.keyPlayers || []).slice(0, 5).map((player, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#221E1F] dark:text-[#f3f4f6]">{player.name}</span>
                    <span className="text-sm font-bold text-[#577AFF] dark:text-[#A1B4FF]">{player.marketShare}%</span>
                  </div>
                  <div className="w-full bg-[#EEF2FF] dark:bg-[#374151] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out bg-[#577AFF] dark:bg-[#577AFF]"
                      style={{ width: `${Math.min(player.marketShare, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#595657] dark:text-[#9ca3af]">{player.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Section 2: Technology Adoption */}
        {shouldShowTechnology && (
        <div className={`bg-white dark:bg-[#111827] rounded-xl p-6 border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] transition-all duration-300 ${
          isTechnologyLoading ? 'opacity-75' : 'opacity-100'
        }`}>
          <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
            Tech Adoption
            {isTechnologyLoading && (
              <Loader2 className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF] animate-spin ml-auto" />
            )}
          </h3>
          {isTechnologyLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] dark:border-[#4CAF50]"></div>
                <span className="ml-3 text-sm text-[#595657] dark:text-[#9ca3af]">Loading technology adoption data...</span>
              </div>
              <p className="text-xs text-center text-[#595657] dark:text-[#9ca3af] italic">
                This section will update automatically when data is ready
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(dashboardData?.technologyAdoption || []).slice(0, 5).map((tech, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#221E1F] dark:text-[#f3f4f6]">{tech.technology}</span>
                    <span className="text-sm font-bold text-[#4CAF50] dark:text-[#4CAF50]">{tech.adoptionRate}%</span>
                  </div>
                  <div className="w-full bg-[#EEF2FF] dark:bg-[#374151] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out bg-[#4CAF50] dark:bg-[#4CAF50]"
                      style={{ width: `${Math.min(tech.adoptionRate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#595657] dark:text-[#9ca3af]">{tech.impact}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Section 3: Geographic Distribution */}
      {shouldShowGeographic && (
      <div className={`bg-white dark:bg-[#111827] rounded-xl p-6 border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] transition-all duration-300 ${
        isGeographicLoading ? 'opacity-75' : 'opacity-100'
      }`}>
        <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
          Market Distribution
          {isGeographicLoading && (
            <Loader2 className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF] animate-spin ml-auto" />
          )}
        </h3>
        {isGeographicLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#577AFF] dark:border-[#577AFF]"></div>
              <span className="ml-3 text-sm text-[#595657] dark:text-[#9ca3af]">Loading geographic data...</span>
            </div>
            <p className="col-span-full text-xs text-center text-[#595657] dark:text-[#9ca3af] italic">
              This section will update automatically when data is ready
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dashboardData?.geographicDistribution || []).slice(0, 6).map((region, idx) => (
              <div key={idx} className="bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg p-4 border border-[#EEF2FF] dark:border-[#374151]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#221E1F] dark:text-[#f3f4f6]">{region.region}</span>
                  <span className="text-sm font-bold text-[#577AFF] dark:text-[#A1B4FF]">{region.percentage}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#595657] dark:text-[#9ca3af]">
                  <TrendUp className="w-3 h-3 text-[#4CAF50] dark:text-[#4CAF50]" />
                  <span>{region.growth > 0 ? '+' : ''}{region.growth}% growth</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Section 4: Investment Trends */}
      {shouldShowInvestment && (
      <div className={`bg-white dark:bg-[#111827] rounded-xl p-6 border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] transition-all duration-300 ${
        isInvestmentLoading ? 'opacity-75' : 'opacity-100'
      }`}>
        <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
          Investment & Funding Trends
          {isInvestmentLoading && (
            <Loader2 className="w-4 h-4 text-[#4CAF50] dark:text-[#4CAF50] animate-spin ml-auto" />
          )}
        </h3>
        {isInvestmentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] dark:border-[#4CAF50]"></div>
              <span className="ml-3 text-sm text-[#595657] dark:text-[#9ca3af]">Loading investment trends data...</span>
            </div>
            <p className="col-span-full text-xs text-center text-[#595657] dark:text-[#9ca3af] italic">
              This section will update automatically when data is ready
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dashboardData?.investmentTrends || []).slice(0, 6).map((investment, idx) => {
              const trendIcon = investment.trend === 'up' ? TrendUp : investment.trend === 'down' ? TrendingDown : Minus;
              const trendColor = investment.trend === 'up' ? '#4CAF50' : investment.trend === 'down' ? '#F44336' : '#595657';
              return (
                <div key={idx} className="p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#221E1F] dark:text-[#f3f4f6]">{investment.category}</span>
                    {React.createElement(trendIcon, { className: `w-4 h-4`, style: { color: trendColor } })}
                  </div>
                  <div className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-1">{investment.amount}</div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded`} style={{ backgroundColor: `${trendColor}20`, color: trendColor }}>
                    {investment.trend.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
});

IndustryVisualizations.displayName = 'IndustryVisualizations';

export default IndustryVisualizations;
