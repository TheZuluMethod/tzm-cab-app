import React, { useState, useMemo } from 'react';
import { History, X, Search, Filter, Calendar, TrendingUp, FileText, Users } from 'lucide-react';
import { SavedSession } from '../types';
import ReportThumbnail from './ReportThumbnail';

interface SavedReportsListProps {
  sessions: SavedSession[];
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClose: () => void;
}

type SortOption = 'newest' | 'oldest' | 'title' | 'industry';
type FilterOption = 'all' | string; // 'all' or industry name

const SavedReportsList: React.FC<SavedReportsListProps> = ({
  sessions,
  onLoadSession,
  onDeleteSession,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique industries for filter dropdown
  const industries = useMemo(() => {
    const uniqueIndustries = new Set<string>();
    sessions.forEach(session => {
      if (session.input.industry) {
        uniqueIndustries.add(session.input.industry);
      }
    });
    return Array.from(uniqueIndustries).sort();
  }, [sessions]);

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => {
        const title = (session.title || session.input.feedbackItem || '').toLowerCase();
        const industry = (session.input.industry || '').toLowerCase();
        const feedbackType = (session.input.feedbackType || '').toLowerCase();
        const reportPreview = (session.report || '').toLowerCase().substring(0, 500);
        
        return title.includes(query) || 
               industry.includes(query) || 
               feedbackType.includes(query) ||
               reportPreview.includes(query);
      });
    }

    // Apply industry filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(session => session.input.industry === filterBy);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        case 'oldest':
          return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
        case 'title':
          const titleA = (a.title || a.input.feedbackItem || '').toLowerCase();
          const titleB = (b.title || b.input.feedbackItem || '').toLowerCase();
          return titleA.localeCompare(titleB);
        case 'industry':
          const industryA = (a.input.industry || '').toLowerCase();
          const industryB = (b.input.industry || '').toLowerCase();
          return industryA.localeCompare(industryB);
        default:
          return 0;
      }
    });

    return sorted;
  }, [sessions, searchQuery, sortBy, filterBy]);

  return (
    <div className="fixed inset-y-0 left-0 w-full md:w-96 lg:w-[420px] bg-white dark:bg-[#111827] shadow-2xl dark:shadow-[0_0_30px_rgba(87,122,255,0.2)] transform transition-transform duration-300 z-50 border-r border-[#EEF2FF] dark:border-[#374151] flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[#EEF2FF] dark:border-[#374151] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] flex items-center gap-2">
            <History className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
            Saved Reports
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6] rounded-lg hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#595657] dark:text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent text-sm"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2">
          {/* Industry Filter */}
          <div className="relative flex-1">
            <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#595657] dark:text-[#9ca3af] pointer-events-none" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="w-full pl-9 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent text-xs appearance-none bg-white dark:bg-[#0a0e1a]"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-8 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent text-xs appearance-none bg-white dark:bg-[#0a0e1a]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
              <option value="industry">Industry</option>
            </select>
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#595657] dark:text-[#9ca3af] pointer-events-none" />
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-xs text-[#595657] dark:text-[#9ca3af]">
          {filteredAndSortedSessions.length === sessions.length ? (
            <span>{sessions.length} {sessions.length === 1 ? 'report' : 'reports'}</span>
          ) : (
            <span>
              Showing {filteredAndSortedSessions.length} of {sessions.length} {sessions.length === 1 ? 'report' : 'reports'}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-full flex items-center justify-center mx-auto mb-4 text-[#D5DDFF] dark:text-[#577AFF]">
              {searchQuery || filterBy !== 'all' ? (
                <Search className="w-8 h-8" />
              ) : (
                <FileText className="w-8 h-8" />
              )}
            </div>
            <p className="text-sm font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-2">
              {searchQuery || filterBy !== 'all' ? 'No reports found' : 'No saved reports yet'}
            </p>
            <p className="text-xs text-[#595657] dark:text-[#9ca3af]">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Complete a board session to see your reports here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedSessions.map(session => (
              <ReportThumbnail
                key={session.id}
                session={session}
                onClick={() => onLoadSession(session)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedReportsList;

