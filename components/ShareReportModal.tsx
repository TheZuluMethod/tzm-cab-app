import React, { useState } from 'react';
import { X, Copy, Check, Lock, Calendar, Link2, Eye, EyeOff } from 'lucide-react';
import { createShareableLink, revokeShareableLink } from '../services/sharingService';
import { getCurrentUser } from '../services/authService';

interface ShareReportModalProps {
  sessionId: string;
  reportTitle: string;
  onClose: () => void;
  onShareCreated?: (shareUrl: string) => void;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({
  sessionId,
  reportTitle,
  onClose,
  onShareCreated,
}) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [requirePassword, setRequirePassword] = useState(false);

  const handleCreateLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('You must be logged in to share reports');
        setIsLoading(false);
        return;
      }

      if (requirePassword && !password.trim()) {
        setError('Please enter a password');
        setIsLoading(false);
        return;
      }

      const { shareToken, shareUrl: url, error: shareError } = await createShareableLink(
        sessionId,
        user.id,
        {
          password: requirePassword ? password.trim() : undefined,
          expiresInDays: expiresInDays || undefined,
        }
      );

      if (shareError) {
        setError(shareError);
        setIsLoading(false);
        return;
      }

      if (!url) {
        setError('Failed to create shareable link. Please try again.');
        setIsLoading(false);
        return;
      }

      setShareUrl(url);
      onShareCreated?.(url);
    } catch (err: any) {
      console.error('Error creating shareable link:', err);
      setError(err?.message || 'Failed to create shareable link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-xl sm:rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(87,122,255,0.3)] overflow-y-auto max-h-[95vh] my-auto animate-in slide-in-from-bottom-4 duration-500">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1f2e] transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
        </button>

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#EEF2FF] dark:border-[#374151]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[#577AFF] to-[#A1B4FF] dark:from-[#577AFF] dark:to-[#577AFF] flex items-center justify-center shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)] flex-shrink-0">
              <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#051A53] dark:text-[#f3f4f6]">
                Share Report
              </h2>
              <p className="text-xs sm:text-sm text-[#595657] dark:text-[#9ca3af] mt-1 truncate">
                {reportTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {!shareUrl ? (
            <div className="space-y-6">
              {/* Password Protection */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePassword}
                    onChange={(e) => setRequirePassword(e.target.checked)}
                    className="w-5 h-5 rounded border-[#EEF2FF] dark:border-[#374151] text-[#577AFF] dark:text-[#577AFF] focus:ring-2 focus:ring-[#577AFF] dark:focus:ring-[#577AFF]"
                  />
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#577AFF] dark:text-[#93C5FD]" />
                    <span className="text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6]">
                      Require password
                    </span>
                  </div>
                </label>
                {requirePassword && (
                  <div className="mt-3 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-4 pr-10 py-2.5 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expiration */}
              <div>
                <label className="flex items-center gap-3 mb-3">
                  <Calendar className="w-4 h-4 text-[#577AFF] dark:text-[#93C5FD]" />
                  <span className="text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6]">
                    Link expires in
                  </span>
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateLink}
                disabled={isLoading || (requirePassword && !password)}
                className="w-full bg-[#577AFF] dark:bg-[#577AFF] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating link...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Create Shareable Link
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✅ Shareable link created successfully!
                </p>
              </div>

              {/* Share URL */}
              <div>
                <label className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-2">
                  Shareable Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2.5 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 bg-[#577AFF] dark:bg-[#577AFF] text-white rounded-lg hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                <p className="text-xs text-[#595657] dark:text-[#9ca3af]">
                  💡 Anyone with this link can view your report{requirePassword ? ' (password required)' : ''}.
                  {expiresInDays > 0 && ` Link expires in ${expiresInDays} days.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#EEF2FF] dark:border-[#374151] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#577AFF] dark:text-[#93C5FD] rounded-lg hover:bg-[#D5DDFF] dark:hover:bg-[#111827] transition-colors font-semibold"
          >
            {shareUrl ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;

