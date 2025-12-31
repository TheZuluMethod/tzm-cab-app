import React from 'react';
import { RotateCcw, X, ArrowRight, FileText, Trash2 } from 'lucide-react';

interface DraftRecoveryModalProps {
  onContinue: () => void;
  onDismiss: () => void;
  onDelete?: () => void;
  sessionTitle?: string;
}

const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
  onContinue,
  onDismiss,
  onDelete,
  sessionTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_40px_rgba(87,122,255,0.4)] max-w-md w-full mx-auto border border-[#EEF2FF] dark:border-[#374151] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#1a1f2e] dark:to-[#111827] px-6 py-5 border-b border-[#EEF2FF] dark:border-[#374151]">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-[#374151] transition-colors text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#051A53] dark:text-[#f3f4f6]">
                Incomplete Session Found
              </h2>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-0.5">
                We found work in progress
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#051A53] dark:text-[#f3f4f6] mb-1">
                {sessionTitle || 'Untitled Session'}
              </p>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">
                You have an incomplete session. Would you like to continue where you left off?
              </p>
            </div>
          </div>

          <div className="bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg p-4 border border-[#EEF2FF] dark:border-[#374151]">
            <p className="text-xs text-[#595657] dark:text-[#9ca3af] leading-relaxed">
              <strong className="text-[#051A53] dark:text-[#f3f4f6]">Continue:</strong> Restore your previous work and pick up where you left off.
            </p>
            <p className="text-xs text-[#595657] dark:text-[#9ca3af] leading-relaxed mt-2">
              <strong className="text-[#051A53] dark:text-[#f3f4f6]">Start Fresh:</strong> Begin a new session (your draft will remain saved).
            </p>
            {onDelete && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] leading-relaxed mt-2">
                <strong className="text-[#051A53] dark:text-[#f3f4f6]">Delete & Restart:</strong> Delete this draft and start over with the same user input.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] border-t border-[#EEF2FF] dark:border-[#374151] flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-[#111827] border border-[#D5DDFF] dark:border-[#374151] text-[#595657] dark:text-[#9ca3af] hover:bg-[#EEF2FF] dark:hover:bg-[#374151] transition-colors font-medium text-sm"
            >
              Start Fresh
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 transition-all font-semibold text-sm shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.4)] flex items-center justify-center gap-2"
            >
              Continue Session
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete & Restart with Same Input
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftRecoveryModal;

