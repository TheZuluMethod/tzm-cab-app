/**
 * User Dropdown Menu Component
 * 
 * Displays a dropdown menu with Admin, Saved Reports, and Sign Out options.
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, History, LogOut, Settings, BarChart3, PlusCircle } from 'lucide-react';
import { isAppMaker } from '../services/analyticsService';

interface UserDropdownProps {
  userEmail: string;
  userAvatarUrl?: string | null;
  savedReportsCount: number;
  onSavedReportsClick: () => void;
  onSignOut: () => void;
  onAdminClick: () => void;
  onAnalyticsClick?: () => void;
  onStartNewBoard?: () => void;
  showStartNewBoard?: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = React.memo(({
  userEmail,
  userAvatarUrl,
  savedReportsCount,
  onSavedReportsClick,
  onSignOut,
  onAdminClick,
  onAnalyticsClick,
  onStartNewBoard,
  showStartNewBoard = false,
}) => {
  const isAdmin = isAppMaker(userEmail);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#EEF2FF] dark:border-[#374151] bg-white dark:bg-[#111827] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)]"
      >
        {userAvatarUrl ? (
          <img 
            key={userAvatarUrl}
            src={userAvatarUrl} 
            alt="User avatar" 
            className="w-6 h-6 rounded-full object-cover border border-[#EEF2FF] dark:border-[#374151] flex-shrink-0"
            onError={(e) => {
              // Hide image and show icon instead
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
            style={{ display: 'block' }}
          />
        ) : null}
        {!userAvatarUrl && <User className="w-4 h-4 text-[#595657] dark:text-[#9ca3af] flex-shrink-0" />}
        <span className="text-sm text-[#595657] dark:text-[#d1d5db] hidden sm:inline max-w-[200px] truncate">{userEmail}</span>
        <ChevronDown className={`w-4 h-4 text-[#595657] dark:text-[#9ca3af] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111827] rounded-lg shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.3)] border border-[#EEF2FF] dark:border-[#374151] py-2 z-50">
          {/* Start New Board Menu Item - First item in dropdown */}
          {showStartNewBoard && onStartNewBoard && (
            <>
              <button
                onClick={() => {
                  onStartNewBoard();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#221E1F] dark:text-[#f3f4f6] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors flex items-center gap-3"
              >
                <PlusCircle className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
                <span>Start A New Board</span>
              </button>
              <div className="border-t border-[#EEF2FF] dark:border-[#374151] my-1"></div>
            </>
          )}

          {/* Saved Reports Menu Item */}
          <button
            onClick={() => {
              onSavedReportsClick();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-[#221E1F] dark:text-[#f3f4f6] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors flex items-center gap-3 justify-between"
          >
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              <span>Saved Reports</span>
            </div>
            {savedReportsCount > 0 && (
              <span className="bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#577AFF] dark:text-[#A1B4FF] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D5DDFF] dark:border-[#374151]">
                {savedReportsCount}
              </span>
            )}
          </button>

          <div className="border-t border-[#EEF2FF] dark:border-[#374151] my-1"></div>

          {/* Account Menu Item */}
          <button
            onClick={() => {
              onAdminClick();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-[#221E1F] dark:text-[#f3f4f6] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors flex items-center gap-3"
          >
            <Settings className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
            <span>Account</span>
          </button>

          {/* Analytics Menu Item - Only visible to app maker */}
          {isAdmin && onAnalyticsClick && (
            <>
              <button
                onClick={() => {
                  onAnalyticsClick();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#221E1F] dark:text-[#f3f4f6] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors flex items-center gap-3"
              >
                <BarChart3 className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
                <span>Analytics</span>
              </button>
            </>
          )}

          <div className="border-t border-[#EEF2FF] dark:border-[#374151] my-1"></div>

          {/* Sign Out Menu Item */}
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
});

UserDropdown.displayName = 'UserDropdown';

export default UserDropdown;

