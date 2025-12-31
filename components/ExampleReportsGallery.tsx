import React from 'react';
import { FileText, ArrowRight, Sparkles } from 'lucide-react';
import { SavedSession } from '../types';
import { getAllExampleReports } from '../data/exampleReports';

interface ExampleReportsGalleryProps {
  onUseTemplate: (report: SavedSession) => void;
}

const ExampleReportsGallery: React.FC<ExampleReportsGalleryProps> = ({
  onUseTemplate,
}) => {
  const examples = getAllExampleReports();

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#EEF2FF] to-[#D5DDFF] dark:from-[#1a1f2e] dark:to-[#111827] border border-[#A1B4FF] dark:border-[#577AFF]/50 mb-4 shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.3)]">
          <Sparkles className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
          <span className="text-sm font-semibold text-[#577AFF] dark:text-[#A1B4FF]">See It In Action</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#051A53] dark:text-[#f3f4f6] mb-3">
          Example Reports
        </h2>
        <p className="text-lg text-[#595657] dark:text-[#9ca3af] max-w-2xl mx-auto">
          Here's what your AI Advisory Board can deliver! Click any example to use it as a template to start your own board review instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {examples.map((report, index) => {
          // Different color gradients for each icon
          const iconGradients = [
            'bg-gradient-to-br from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#A1B4FF]', // Blue
            'bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-500 dark:to-pink-500', // Purple to Pink
            'bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-500 dark:to-emerald-500', // Green
            'bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-500 dark:to-amber-500', // Orange
            'bg-gradient-to-br from-red-500 to-rose-500 dark:from-red-500 dark:to-rose-500', // Red
            'bg-gradient-to-br from-cyan-500 to-blue-500 dark:from-cyan-500 dark:to-blue-500', // Cyan
          ];
          
          const iconGradient = iconGradients[index % iconGradients.length];
          const shadowColors = [
            'rgba(87,122,255,0.5)', // Blue shadow
            'rgba(168,85,247,0.5)', // Purple shadow
            'rgba(34,197,94,0.5)', // Green shadow
            'rgba(249,115,22,0.5)', // Orange shadow
            'rgba(239,68,68,0.5)', // Red shadow
            'rgba(6,182,212,0.5)', // Cyan shadow
          ];
          const shadowColor = shadowColors[index % shadowColors.length];

          return (
            <div
              key={report.id}
              className="bg-white dark:bg-[#111827] rounded-xl border border-[#EEF2FF] dark:border-[#374151] shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.2)] overflow-hidden hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(87,122,255,0.3)] transition-all group flex flex-col h-full"
            >
              {/* Header - Fixed height to accommodate two-line titles */}
              <div className="p-6 border-b border-[#EEF2FF] dark:border-[#374151] bg-gradient-to-r from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] min-h-[160px] flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg ${iconGradient} flex items-center justify-center shadow-lg`} style={{ boxShadow: `0 0 15px ${shadowColor}` }}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-[#577AFF] dark:text-[#93C5FD] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-2 py-1 rounded-full">
                    Board Template
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#051A53] dark:text-[#f3f4f6] mb-2 line-clamp-2 min-h-[3.5rem] flex items-start">
                  {report.title}
                </h3>
                <p className="text-sm text-[#595657] dark:text-[#9ca3af] line-clamp-2 flex-grow">
                  {report.input.feedbackItem}
                </p>
              </div>

            {/* Content Preview */}
            <div className="p-6 flex-grow">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#595657] dark:text-[#9ca3af]">
                  <span className="font-semibold text-[#221E1F] dark:text-[#f3f4f6]">Industry:</span>
                  <span>{report.input.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#595657] dark:text-[#9ca3af]">
                  <span className="font-semibold text-[#221E1F] dark:text-[#f3f4f6]">Focus:</span>
                  <span>{report.input.feedbackType}</span>
                </div>
              </div>
            </div>

              {/* Actions */}
              <div className="p-6 pt-0 mt-auto">
                <button
                  onClick={() => onUseTemplate(report)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#577AFF] dark:bg-[#577AFF] text-white hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors font-semibold text-sm shadow-lg dark:shadow-[0_0_15px_rgba(87,122,255,0.5)] group-hover:shadow-xl dark:group-hover:shadow-[0_0_25px_rgba(87,122,255,0.6)]"
                >
                  Use Template
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
          💡 <strong>Tip:</strong> These examples show real board insights. Use a template to get started in seconds!
        </p>
      </div>
    </div>
  );
};

export default ExampleReportsGallery;

