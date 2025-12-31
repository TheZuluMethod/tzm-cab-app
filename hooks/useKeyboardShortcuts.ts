/**
 * Keyboard Shortcuts Hook
 * 
 * Provides keyboard shortcuts for power users:
 * - Cmd/Ctrl + K: Quick search (opens search in saved reports)
 * - Cmd/Ctrl + N: New report (starts new session)
 * - Cmd/Ctrl + S: Save (if applicable)
 * - Esc: Close modals/sidebars
 * - ?: Show shortcuts help
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  onQuickSearch?: () => void;
  onNewReport?: () => void;
  onClose?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const {
    onQuickSearch,
    onNewReport,
    onClose,
    onShowHelp,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    // Cmd/Ctrl + K: Quick search
    if (ctrlOrCmd && event.key === 'k' && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onQuickSearch?.();
      return;
    }

    // Cmd/Ctrl + N: New report
    if (ctrlOrCmd && event.key === 'n' && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onNewReport?.();
      return;
    }

    // Cmd/Ctrl + S: Save (prevent browser save dialog)
    if (ctrlOrCmd && event.key === 's' && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      // Could trigger save action if needed
      return;
    }

    // Esc: Close modals/sidebars
    if (event.key === 'Escape' && !ctrlOrCmd && !event.shiftKey && !event.altKey) {
      onClose?.();
      return;
    }

    // ?: Show shortcuts help
    if (event.key === '?' && !ctrlOrCmd && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onShowHelp?.();
      return;
    }
  }, [enabled, onQuickSearch, onNewReport, onClose, onShowHelp]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Get list of available shortcuts for display
 */
export const getShortcutsList = (): KeyboardShortcut[] => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? '⌘' : 'Ctrl';

  return [
    {
      key: `${modifier} + K`,
      action: () => {},
      description: 'Quick search',
    },
    {
      key: `${modifier} + N`,
      action: () => {},
      description: 'New report',
    },
    {
      key: 'Esc',
      action: () => {},
      description: 'Close modals/sidebars',
    },
    {
      key: '?',
      action: () => {},
      description: 'Show shortcuts',
    },
  ];
};

