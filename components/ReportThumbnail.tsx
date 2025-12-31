import React from 'react';
import { FileText, Calendar, Lightbulb, Target, TrendingUp, Zap } from 'lucide-react';
import { SavedSession } from '../types';

interface ReportThumbnailProps {
  session: SavedSession;
  onClick: () => void;
  onDelete?: () => void;
}

const ReportThumbnail: React.FC<ReportThumbnailProps> = ({ session, onClick, onDelete }) => {
  // Extract key metrics from report
  const extractMetrics = (report: string) => {
    if (!report || report.trim() === '') {
      return {
        actionableSuggestions: 0,
        keyFindings: 0,
        strategicInsights: 0,
        hasRoast: false,
        hasGold: false,
      };
    }

    // Count actionable suggestions - look for patterns like "Recommended Action", "Action:", "Suggestion:", etc.
    const actionablePatterns = [
      /Recommended Action/gi,
      /Action:/gi,
      /Suggestion:/gi,
      /Recommendation:/gi,
      /Next Steps/gi,
      /Actionable/gi,
    ];
    const actionableCount = actionablePatterns.reduce((count, pattern) => {
      const matches = report.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    // Count key findings - look for "Key Finding", "Finding:", "Insight:", etc.
    const findingsPatterns = [
      /Key Finding/gi,
      /Finding:/gi,
      /Insight:/gi,
      /Key Insight/gi,
    ];
    const findingsCount = findingsPatterns.reduce((count, pattern) => {
      const matches = report.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    // Count strategic insights - look for strategic recommendations, competitive insights, etc.
    const strategicPatterns = [
      /Strategic/gi,
      /Competitive Insight/gi,
      /Market Insight/gi,
      /Strategic Recommendation/gi,
    ];
    const strategicCount = strategicPatterns.reduce((count, pattern) => {
      const matches = report.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    // Extract a key takeaway or summary - look for common summary patterns
    let keyTakeaway: string | null = null;
    
    // Try to find "Key Takeaways", "Summary", "Executive Summary", "The Gold", etc.
    const summaryPatterns = [
      /(?:Key Takeaways?|Executive Summary|Summary|Main Findings?)[:\s]+(.{50,200})/i,
      /(?:The Gold|Gold)[:\s]+(.{50,200})/i,
      /(?:Key Insight|Main Insight)[:\s]+(.{50,200})/i,
    ];
    
    for (const pattern of summaryPatterns) {
      const match = report.match(pattern);
      if (match && match[1]) {
        keyTakeaway = match[1]
          .replace(/#{1,6}\s/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .substring(0, 150);
        if (keyTakeaway.length > 30) break; // Found a good one
      }
    }
    
    // If no summary found, try to extract first meaningful paragraph after removing headers and Executive Dashboard
    if (!keyTakeaway) {
      const cleanedReport = report
        .replace(/#{1,6}\s/g, '')
        .replace(/Executive Dashboard.*?\n/gi, '')
        .replace(/\|.*?\|/g, '') // Remove table markdown
        .replace(/\*\*/g, '')
        .replace(/\*/g, '');
      
      const paragraphs = cleanedReport.split(/\n+/).filter(p => {
        const trimmed = p.trim();
        return trimmed.length > 50 && 
               !trimmed.match(/^(Category|Status|Observation|Recommended Action|Executive Dashboard)/i) &&
               !trimmed.match(/^[-|]+$/); // Not just dashes or pipes
      });
      
      if (paragraphs.length > 0) {
        keyTakeaway = paragraphs[0].trim().substring(0, 150);
      }
    }

    return {
      actionableSuggestions: Math.max(actionableCount, 0),
      keyFindings: Math.max(findingsCount, 0),
      strategicInsights: Math.max(strategicCount, 0),
      hasRoast: report.includes('The Roast') || report.includes('Roast'),
      hasGold: report.includes('The Gold') || report.includes('Gold'),
      keyTakeaway,
    };
  };

  const metrics = extractMetrics(session.report || '');
  const displayTitle = session.title || session.input.feedbackItem?.substring(0, 50) || 'Board Report';
  
  // Use key takeaway as preview if available, otherwise clean the first part of report
  const preview = metrics.keyTakeaway || (session.report
    ? session.report
        .replace(/#{1,6}\s/g, '')
        .replace(/Executive Dashboard.*?\n/gi, '')
        .replace(/\|.*?\|/g, '') // Remove table markdown
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 150)
    : 'No preview available');

  return (
    <div 
      className="group relative bg-white dark:bg-[#111827] rounded-xl border border-[#EEF2FF] dark:border-[#374151] hover:border-[#577AFF] dark:hover:border-[#577AFF] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(87,122,255,0.3)] transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Header with gradient */}
      <div className="p-4 border-b border-[#EEF2FF] dark:border-[#374151] bg-gradient-to-r from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827]">
        <div className="flex items-start justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#577AFF] flex items-center justify-center flex-shrink-0 shadow-md dark:shadow-[0_0_15px_rgba(87,122,255,0.5)]">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-[#A1B4FF] dark:text-[#A1B4FF] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              title="Delete Report"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <h3 className="font-bold text-[#051A53] dark:text-[#f3f4f6] text-sm mb-1 line-clamp-2 leading-tight">
          {displayTitle}
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#595657] dark:text-[#9ca3af] mt-2">
          <Calendar className="w-3 h-3" />
          <span>{session.date}{session.timestamp ? ` • ${session.timestamp}` : ''}</span>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4">
        <p className="text-xs text-[#595657] dark:text-[#9ca3af] line-clamp-3 mb-4 leading-relaxed">
          {preview}{preview.length >= 150 ? '...' : ''}
        </p>

        {/* Tags/Badges - Only show industry, exclude feedbackType and Roast&Gold since they're in metrics strip */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {session.input.industry && (
            <span className="px-2 py-0.5 bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#577AFF] dark:text-[#93C5FD] rounded text-[10px] font-medium">
              {session.input.industry}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="px-4 py-3 bg-[#E5E9F0] dark:bg-[#0f1419] border-t border-[#EEF2FF] dark:border-[#374151]">
        <div className="flex flex-wrap gap-2">
          {/* Request Type */}
          {session.input.feedbackType && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Target className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                Request: {session.input.feedbackType}
              </span>
            </div>
          )}

          {/* Actionable Suggestions */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-full">
            <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
              {metrics.actionableSuggestions} Suggestions
            </span>
          </div>

          {/* Key Findings */}
          {metrics.keyFindings > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <Lightbulb className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                {metrics.keyFindings} Findings
              </span>
            </div>
          )}

          {/* Strategic Insights */}
          {metrics.strategicInsights > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                {metrics.strategicInsights} Insights
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#577AFF] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default ReportThumbnail;

