import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { getShortcutsList } from '../hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = getShortcutsList();
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(87,122,255,0.3)] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1f2e] transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-[#EEF2FF] dark:border-[#374151]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#577AFF] flex items-center justify-center shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)]">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#051A53] dark:text-[#f3f4f6]">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af] mt-1">
                Power user shortcuts to navigate faster
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-[#EEF2FF] dark:border-[#374151] bg-[#F9FAFD] dark:bg-[#1a1f2e] hover:bg-[#EEF2FF] dark:hover:bg-[#111827] transition-colors"
              >
                <span className="text-sm text-[#595657] dark:text-[#9ca3af]">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-[#EEF2FF] dark:border-[#374151] rounded-lg text-xs font-semibold text-[#577AFF] dark:text-[#93C5FD] shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[#EEF2FF] dark:bg-[#1a1f2e] rounded-lg border border-[#D5DDFF] dark:border-[#374151]">
            <p className="text-xs text-[#595657] dark:text-[#9ca3af] text-center">
              💡 <strong>Tip:</strong> Press <kbd className="px-2 py-0.5 bg-white dark:bg-[#111827] border border-[#EEF2FF] dark:border-[#374151] rounded text-[#577AFF] dark:text-[#93C5FD] text-xs font-semibold">?</kbd> anytime to show this help
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#EEF2FF] dark:border-[#374151] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#577AFF] dark:bg-[#577AFF] text-white rounded-lg hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors font-semibold shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;

