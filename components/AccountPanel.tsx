/**
 * Account Panel Component
 * 
 * Allows users to manage their own account details: avatar, name, email, and other profile information.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, User as UserIcon, Mail, UserCircle, AlertCircle, CheckCircle, Loader2, Phone, Building2, FileText, Globe, Moon, Sun, Lock, Eye, EyeOff, Users, Copy, Gift, Settings } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { getCurrentUser, changePassword } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import { createReferral, getReferralStats, getUserReferrals, getReferralLink, generateReferralCode, Referral, ReferralStats } from '../services/referralService';
import { isAppMaker } from '../services/analyticsService';

interface AccountPanelProps {
  onClose: () => void;
}

interface UserFormData {
  email: string;
  fullName: string;
  phone: string;
  company: string;
  bio: string;
  website: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  currentAvatarUrl: string | null;
}

const AccountPanel: React.FC<AccountPanelProps> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    fullName: '',
    phone: '',
    company: '',
    bio: '',
    website: '',
    avatarFile: null,
    avatarPreview: null,
    currentAvatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Referral state
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralEmails, setReferralEmails] = useState<string[]>(['', '', '', '', '']);
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminNagEnabled, setAdminNagEnabled] = useState(false);

  // Load current user data
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setError('User not found. Please sign in again.');
          setIsLoading(false);
          return;
        }

        // Check if user is admin
        if (user.email) {
          const admin = isAppMaker(user.email);
          setIsAdmin(admin);
          if (admin) {
            // Load admin nag toggle preference
            const nagEnabled = localStorage.getItem('admin_nag_enabled') === 'true';
            setAdminNagEnabled(nagEnabled);
          }
        }

        // Load user profile from public.users table
        if (supabase) {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading profile:', profileError);
          }

          // Get avatar from user metadata or profile
          const avatarUrl = user.user_metadata?.avatar_url || profileData?.avatar_url || null;

          setFormData({
            email: user.email || '',
            fullName: profileData?.full_name || user.user_metadata?.full_name || '',
            phone: profileData?.phone || '',
            company: profileData?.company || '',
            bio: profileData?.bio || '',
            website: profileData?.website || '',
            avatarFile: null,
            avatarPreview: null,
            currentAvatarUrl: avatarUrl,
          });
        } else {
          // Fallback if Supabase not configured
          setFormData({
            email: user.email || '',
            fullName: user.user_metadata?.full_name || '',
            phone: '',
            company: '',
            bio: '',
            website: '',
            avatarFile: null,
            avatarPreview: null,
            currentAvatarUrl: user.user_metadata?.avatar_url || null,
          });
        }
      } catch (err: any) {
        console.error('Error loading user data:', err);
        setError('Failed to load account information.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
    loadReferralData();
  }, []);

  // Load referral data
  const loadReferralData = async () => {
    try {
      const { stats, error: statsError } = await getReferralStats();
      if (!statsError && stats) {
        setReferralStats(stats);
      }

      const { referrals: userReferrals, error: referralsError } = await getUserReferrals();
      if (!referralsError && userReferrals) {
        setReferrals(userReferrals);
        // Get referral code from first referral or generate one
        if (userReferrals.length > 0) {
          setReferralCode(userReferrals[0].referral_code);
        } else {
          const { code } = await generateReferralCode();
          if (code) setReferralCode(code);
        }
      }
    } catch (err) {
      console.error('Error loading referral data:', err);
    }
  };

  // Handle creating referrals for multiple emails
  const handleCreateReferrals = async () => {
    // Filter out empty emails
    const validEmails = referralEmails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0) {
      setReferralError('Please enter at least one email address');
      return;
    }

    setIsCreatingReferral(true);
    setReferralError(null);
    setReferralSuccess(null);

    const results: string[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    // Create referrals for each email
    for (const email of validEmails) {
      const { success, error, referralCode: newCode } = await createReferral(email.trim());
      if (success) {
        results.push(email.trim());
        if (newCode && !referralCode) setReferralCode(newCode);
      } else {
        errors.push({ email, error: error?.message || 'Failed to create referral' });
      }
    }

    if (results.length > 0) {
      const successMessage = errors.length > 0
        ? `Referrals sent to ${results.length} colleague(s). ${errors.length} failed.`
        : `Referrals sent to ${results.length} colleague(s)! They'll receive an email with your referral link.`;
      setReferralSuccess(successMessage);
      // Clear successful emails
      setReferralEmails(referralEmails.map(email => 
        results.includes(email.trim()) ? '' : email
      ));
      await loadReferralData(); // Refresh stats
      setTimeout(() => setReferralSuccess(null), 5000);
    }

    if (errors.length > 0 && results.length === 0) {
      setReferralError(errors.map(e => `${e.email}: ${e.error}`).join('; '));
    } else if (errors.length > 0) {
      setReferralError(`Some referrals failed: ${errors.map(e => e.email).join(', ')}`);
    }

    setIsCreatingReferral(false);
  };

  // Handle individual email input change
  const handleReferralEmailChange = (index: number, value: string) => {
    const newEmails = [...referralEmails];
    newEmails[index] = value;
    setReferralEmails(newEmails);
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    if (!referralCode) return;
    
    const link = getReferralLink(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      setReferralSuccess('Referral link copied to clipboard!');
      setTimeout(() => setReferralSuccess(null), 3000);
    } catch (err) {
      setReferralError('Failed to copy link');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setFormData({
        ...formData,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      });
      setError(null);
    }
  };

  // Normalize website URL - add https:// if missing
  const normalizeWebsite = (website: string): string | null => {
    if (!website || !website.trim()) {
      return null;
    }

    const trimmed = website.trim();
    
    // If it already starts with http:// or https://, return as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // If it starts with www., add https://
    if (trimmed.startsWith('www.')) {
      return `https://${trimmed}`;
    }

    // Otherwise, assume it's a domain and add https://
    // Basic validation: should contain at least one dot (for domain extension)
    if (trimmed.includes('.')) {
      return `https://${trimmed}`;
    }

    // If it doesn't look like a valid domain, return as-is (let user decide)
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('User not found. Please sign in again.');
        setIsSubmitting(false);
        return;
      }

      // Check if Supabase is configured
      if (!supabase) {
        setError('Supabase is not configured. Profile updates require Supabase.');
        setIsSubmitting(false);
        return;
      }

      // Normalize website URL
      const normalizedWebsite = normalizeWebsite(formData.website);

      // Upload avatar if provided
      let avatarUrl: string | null = formData.currentAvatarUrl;
      if (formData.avatarFile) {
        try {
          const fileExt = formData.avatarFile.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          // Store in user-specific folder: {user_id}/{filename}
          // The bucket is 'avatars', so the full path will be: avatars/{user_id}/{filename}
          const filePath = `${user.id}/${fileName}`;

          // Try to find the bucket - first try listing, then fallback to direct access
          let bucketId: string | null = null;
          
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
          
          if (!bucketError && buckets && buckets.length > 0) {
            // Look for avatar bucket - check both id and name fields
            const avatarsBucket = buckets.find(b => {
              const idLower = (b.id || '').toLowerCase().trim();
              const nameLower = (b.name || '').toLowerCase().trim();
              return (
                idLower === 'avatars' || 
                idLower === 'cab avatars' ||
                idLower === 'cabavatars' ||
                idLower.includes('avatar') ||
                nameLower === 'avatars' ||
                nameLower === 'cab avatars' ||
                nameLower === 'cabavatars' ||
                nameLower.includes('avatar')
              );
            });
            
            if (avatarsBucket) {
              // Use the bucket id (not name) as that's what Supabase expects
              bucketId = avatarsBucket.id;
            }
          }
          
          // Fallback: Try direct access to known bucket names/IDs
          if (!bucketId) {
            const possibleBucketNames = ['CAB Avatars', 'cab avatars', 'CABAvatars', 'avatars', 'cab-avatars'];
            
            for (const bucketName of possibleBucketNames) {
              try {
                // Try to list files in the bucket (this will fail if bucket doesn't exist)
                const { error: testError } = await supabase.storage.from(bucketName).list('', { limit: 1 });
                
                // If no error, bucket exists and we can access it
                if (!testError) {
                  bucketId = bucketName;
                  break;
                }
                
                // If error says "not found", bucket doesn't exist - continue to next
                if (testError.message?.toLowerCase().includes('not found')) {
                  continue;
                }
              } catch {
                // Continue to next bucket name
              }
            }
          }
          
          // If we still haven't found the bucket, try "CAB Avatars" directly
          // (the bucket exists, so this might be a permissions issue with listing)
          if (!bucketId) {
            // Try "CAB Avatars" directly since we know it exists
            bucketId = 'CAB Avatars';
          }

          // Delete old avatar if exists (optional - don't fail if this fails)
          if (formData.currentAvatarUrl) {
            try {
              // Extract path from URL (works for both 'avatars' and 'CAB Avatars')
              const urlParts = formData.currentAvatarUrl.split('/storage/v1/object/public/');
              if (urlParts.length > 1) {
                const pathAfterBucket = urlParts[1].split('/').slice(1).join('/');
                if (pathAfterBucket) {
                  await supabase.storage.from(bucketId).remove([pathAfterBucket]);
                }
              }
            } catch (deleteError) {
              console.warn('Could not delete old avatar:', deleteError);
              // Continue anyway
            }
          }

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketId)
            .upload(filePath, formData.avatarFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Avatar upload error details:', uploadError);
            
            // Provide more specific error messages
            if (uploadError.message?.includes('new row violates row-level security')) {
              throw new Error('Storage permissions error. Please ensure storage policies are set up correctly (run supabase/storage-setup.sql)');
            } else if (uploadError.message?.includes('Bucket not found')) {
              throw new Error('Avatars bucket not found. Please create it in Supabase Dashboard → Storage.');
            } else {
              throw new Error(`Avatar upload failed: ${uploadError.message || 'Unknown error'}`);
            }
          }

          if (uploadData) {
            const { data: urlData } = supabase.storage.from(bucketId).getPublicUrl(filePath);
            avatarUrl = urlData.publicUrl;
            
            // Verify the URL is accessible (test if it's a valid URL)
            if (!avatarUrl || !avatarUrl.startsWith('http')) {
              throw new Error('Failed to generate valid public URL for avatar');
            }
          }
        } catch (avatarError: any) {
          console.error('Avatar upload error:', avatarError);
          // Don't fail the entire profile update if avatar fails
          // Just show a warning but continue with other updates
          setError(`Warning: ${avatarError.message}. Profile will be updated without avatar change.`);
          // Continue with profile update using existing avatar
          avatarUrl = formData.currentAvatarUrl;
        }
      }

      // Update user metadata in auth.users (only if avatar changed or name changed)
      if (avatarUrl !== formData.currentAvatarUrl || formData.fullName) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: formData.fullName,
            avatar_url: avatarUrl,
          },
        });

        if (authError) {
          console.error('Auth update error:', authError);
          // Continue with profile update even if auth metadata update fails
        }
      }

      // Update user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: formData.email,
          full_name: formData.fullName || null,
          phone: formData.phone || null,
          company: formData.company || null,
          bio: formData.bio || null,
          website: normalizedWebsite,
          avatar_url: avatarUrl,
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message || 'Unknown error'}`);
      }

      // Show success message
      if (error && error.includes('Warning:')) {
        // If there was an avatar warning, show it as success with warning
        setSuccess('Profile updated successfully!');
        setError(null); // Clear the warning error
      } else {
        setSuccess('Profile updated successfully!');
      }

      // Reload user data to get the latest avatar URL from database
      // This ensures we have the correct URL even if there were any sync issues
      try {
        const updatedUser = await getCurrentUser();
        if (updatedUser && supabase) {
          const { data: updatedProfile } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', updatedUser.id)
            .single();
          
          const finalAvatarUrl = updatedProfile?.avatar_url || updatedUser.user_metadata?.avatar_url || avatarUrl || formData.currentAvatarUrl;
          
          setFormData({
            ...formData,
            currentAvatarUrl: finalAvatarUrl,
            avatarFile: null,
            avatarPreview: null,
          });
        } else if (avatarUrl) {
          // Fallback: use the URL we just saved
          setFormData({
            ...formData,
            currentAvatarUrl: avatarUrl,
            avatarFile: null,
            avatarPreview: null,
          });
        }
      } catch {
        // Fallback: use the URL we just saved
        if (avatarUrl) {
          setFormData({
            ...formData,
            currentAvatarUrl: avatarUrl,
            avatarFile: null,
            avatarPreview: null,
          });
        }
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#577AFF] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-[0_0_30px_rgba(87,122,255,0.3)] border-2 border-[#EEF2FF] dark:border-[#577AFF] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white dark:bg-[#111827] border-b border-[#EEF2FF] dark:border-[#374151] px-6 py-4 flex items-center justify-between z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#577AFF] dark:bg-[#577AFF] rounded-lg flex items-center justify-center shadow-lg dark:shadow-[0_0_15px_rgba(87,122,255,0.5)]">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6]">Account Details</h2>
              <p className="text-sm text-[#595657] dark:text-[#9ca3af]">Manage your account information and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Avatar Upload Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
              <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">Avatar / Profile Picture</h3>
              <div className="flex items-center gap-4">
                {/* Avatar Preview */}
                <div className="w-24 h-24 rounded-full bg-[#EEF2FF] dark:bg-[#1a1f2e] flex items-center justify-center overflow-hidden border-2 border-[#D5DDFF] dark:border-[#374151] shadow-lg dark:shadow-[0_0_15px_rgba(87,122,255,0.3)]">
                  {formData.avatarPreview ? (
                    <img
                      src={formData.avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : formData.currentAvatarUrl ? (
                    <img
                      src={formData.currentAvatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Failed to load avatar image:', formData.currentAvatarUrl);
                        console.error('Image error event:', e);
                        // Fallback to placeholder on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ Avatar image loaded successfully:', formData.currentAvatarUrl);
                      }}
                    />
                  ) : (
                    <UserCircle className="w-12 h-12 text-[#A1B4FF] dark:text-[#577AFF]" />
                  )}
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-[#EEF2FF] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors cursor-pointer text-sm text-[#595657] dark:text-[#d1d5db]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{formData.avatarFile || formData.currentAvatarUrl ? 'Change Image' : 'Upload Image'}</span>
                  </label>
                  {(formData.avatarFile || formData.currentAvatarUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          avatarFile: null, 
                          avatarPreview: null,
                          currentAvatarUrl: null,
                        });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                Recommended: Square image, max 5MB. JPG, PNG, or GIF.
              </p>
            </div>

            {/* 2. Personal Information Section - Full Name, Email, Phone, Bio */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
              <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">Personal Information</h3>
              <div className="space-y-4">
                {/* Full Name Field */}
            <div>
              <label htmlFor="account-name" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                <input
                  id="account-name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#1a1f2e] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="account-email" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                Email <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                <input
                  id="account-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#9ca3af] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent bg-gray-50"
                  placeholder="user@example.com"
                  disabled
                />
              </div>
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="account-phone" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                    Phone Number <span className="text-xs text-[#595657] dark:text-[#9ca3af]">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                <input
                  id="account-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#1a1f2e] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

                {/* Bio Field */}
                <div>
                  <label htmlFor="account-bio" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                    Bio / About Me
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                    <textarea
                      id="account-bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#1a1f2e] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                    Brief description about yourself or your role.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Company Information Section - Company, Website */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
              <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">Company Information</h3>
              <div className="space-y-4">
            {/* Company Field */}
            <div>
              <label htmlFor="account-company" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                Company / Organization
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                <input
                  id="account-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#1a1f2e] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                  placeholder="Company Name"
                />
              </div>
            </div>

            {/* Website Field */}
            <div>
              <label htmlFor="account-website" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                <input
                  id="account-website"
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#1a1f2e] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                  placeholder="example.com or www.example.com"
                />
              </div>
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                Enter your website (e.g., example.com, www.example.com, or https://example.com)
              </p>
                </div>
              </div>
            </div>

            {/* 4. Appearance Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
              <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">App Appearance</h3>
              <div className="flex items-center justify-between p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151] shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)]">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
                  ) : (
                    <Sun className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-[#221E1F] dark:text-[#f3f4f6]">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </div>
                    <div className="text-xs text-[#595657] dark:text-[#9ca3af]">
                      {theme === 'dark' ? 'Modern dark theme with glowing accents' : 'Clean light theme'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-[#577AFF]' : 'bg-[#cbd5e1]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 5. Password Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
              <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-4">My Account Details</h3>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(!showPasswordSection);
                    if (showPasswordSection) {
                      // Reset password fields when closing
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError(null);
                    }
                  }}
                  className="text-sm text-[#577AFF] dark:text-[#93C5FD] hover:text-[#4A6CF7] dark:hover:text-[#60A5FA] font-medium"
                >
                  {showPasswordSection ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordSection && (
                <div className="space-y-4 p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  {/* Current Password */}
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                      Current Password
              </label>
              <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                      <input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#111827] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6]"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#111827] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6]"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
              </div>
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#595657] dark:text-[#9ca3af]" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#111827] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Change Password Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setSuccess(null);

                      // Validate passwords match
                      if (newPassword !== confirmPassword) {
                        setError('New passwords do not match');
                        return;
                      }

                      // Validate password strength
                      if (newPassword.length < 8) {
                        setError('Password must be at least 8 characters long');
                        return;
                      }
                      if (!/(?=.*[a-z])/.test(newPassword)) {
                        setError('Password must contain at least one lowercase letter');
                        return;
                      }
                      if (!/(?=.*[A-Z])/.test(newPassword)) {
                        setError('Password must contain at least one uppercase letter');
                        return;
                      }
                      if (!/(?=.*[0-9])/.test(newPassword)) {
                        setError('Password must contain at least one number');
                        return;
                      }

                      if (!currentPassword) {
                        setError('Please enter your current password');
                        return;
                      }

                      setIsChangingPassword(true);
                      try {
                        const { error: changeError } = await changePassword(currentPassword, newPassword);
                        if (changeError) {
                          setError(changeError.message || 'Failed to change password. Please try again.');
                          setIsChangingPassword(false);
                          return;
                        }

                        // Log password change and send confirmation email
                        if (supabase) {
                          try {
                            const user = await getCurrentUser();
                            if (user) {
                              // Get IP and user agent for audit
                              const ipAddress = null; // Could be obtained from headers if available
                              const userAgent = navigator.userAgent;
                              
                              // Call database function to log password change
                              const { error: logError } = await supabase.rpc('log_password_change', {
                                p_user_id: user.id,
                                p_ip_address: ipAddress,
                                p_user_agent: userAgent,
                              });
                              
                              if (logError) {
                                console.warn('Failed to log password change:', logError);
                                // Don't fail the password change if logging fails
                              }

                              // Send confirmation email via Edge Function (if configured)
                              try {
                                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                                if (supabaseUrl) {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (session) {
                                    await fetch(`${supabaseUrl}/functions/v1/send-password-change-email`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`,
                                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                                      },
                                      body: JSON.stringify({
                                        userId: user.id,
                                        userEmail: user.email,
                                      }),
                                    }).catch(err => {
                                      console.warn('Failed to send password change email:', err);
                                      // Don't fail the password change if email fails
                                    });
                                  }
                                }
                              } catch (emailErr) {
                                console.warn('Error sending password change email:', emailErr);
                                // Don't fail the password change if email fails
                              }
                            }
                          } catch (logErr) {
                            console.warn('Error logging password change:', logErr);
                            // Don't fail the password change if logging fails
                          }
                        }

                        setSuccess('Password changed successfully! A confirmation email has been sent to your email address.');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowPasswordSection(false);
                        
                        setTimeout(() => {
                          setSuccess(null);
                        }, 5000);
                      } catch (err: any) {
                        setError(err.message || 'An unexpected error occurred');
                      } finally {
                        setIsChangingPassword(false);
                      }
                    }}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full bg-[#577AFF] dark:bg-[#577AFF] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg dark:shadow-[0_0_15px_rgba(87,122,255,0.5)]"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 6. Admin Settings Section - Only visible to admin */}
            {isAdmin && (
              <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
                  <h3 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6]">Admin Settings</h3>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-[#F9FAFD] dark:bg-[#1a1f2e] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <input
                    type="checkbox"
                    id="admin-nag-toggle"
                    checked={adminNagEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAdminNagEnabled(enabled);
                      localStorage.setItem('admin_nag_enabled', enabled.toString());
                    }}
                    className="w-5 h-5 rounded border-[#EEF2FF] dark:border-[#374151] text-[#577AFF] focus:ring-2 focus:ring-[#577AFF] cursor-pointer"
                  />
                  <label htmlFor="admin-nag-toggle" className="flex-1 text-sm text-[#221E1F] dark:text-[#f3f4f6] cursor-pointer">
                    Show Upgrade Nag Screen
                    <span className="block text-xs text-[#595657] dark:text-[#9ca3af] mt-1">
                      When enabled, you'll see upgrade prompts and trial nag screens like regular users
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* 7. Refer Colleagues Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F9FAFD] to-[#EEF2FF] dark:from-[#1a1f2e] dark:to-[#111827] rounded-xl border-2 border-[#D5DDFF] dark:border-[#374151] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF]" />
                <h1 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6]">Refer Colleagues & Friends For Free Months</h1>
              </div>
              
              <h2 className="text-sm text-[#595657] dark:text-[#9ca3af] mb-4">
                When they sign up and become paying customers, <strong>you'll get 1 free month</strong> for each successful referral.
              </h2>

              {referralStats && (
                <div className="mb-4 p-3 bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#577AFF] dark:text-[#577AFF]">{referralStats.totalReferrals}</div>
                      <div className="text-xs text-[#595657] dark:text-[#9ca3af]">Total Referrals</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{referralStats.convertedReferrals}</div>
                      <div className="text-xs text-[#595657] dark:text-[#9ca3af]">Converted</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{referralStats.creditsApplied}</div>
                      <div className="text-xs text-[#595657] dark:text-[#9ca3af]">Free Months</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#577AFF] dark:text-[#577AFF]">{5 - referralStats.totalReferrals}</div>
                      <div className="text-xs text-[#595657] dark:text-[#9ca3af]">Remaining</div>
                    </div>
                  </div>
                </div>
              )}

              {referralError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{referralError}</p>
                </div>
              )}

              {referralSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">{referralSuccess}</p>
                </div>
              )}

              {referralStats?.canReferMore && (
                <div className="mt-6 mb-4">
                  <label className="block text-sm font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-3">
                    Colleague's Email Addresses
                  </label>
                  <div className="space-y-2 mb-4">
                    {referralEmails.map((email, index) => (
                      <input
                        key={index}
                        type="email"
                        value={email}
                        onChange={(e) => handleReferralEmailChange(index, e.target.value)}
                        className="w-full px-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#1a1f2e] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
                        placeholder={`Colleague ${index + 1} email`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateReferrals}
                    disabled={isCreatingReferral || referralEmails.every(email => !email.trim())}
                    className="w-full px-6 py-2 bg-[#577AFF] dark:bg-[#577AFF] text-white rounded-lg font-semibold hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingReferral ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Referrals...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Send Referrals
                      </>
                    )}
                  </button>
                </div>
              )}

              {referralCode && (
                <div className="mt-8 mb-4">
                  <label className="block text-sm font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-2">
                    Your Referral Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getReferralLink(referralCode)}
                      readOnly
                      className="flex-1 px-4 py-2 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#9ca3af] rounded-lg bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="px-4 py-2 border border-[#EEF2FF] dark:border-[#374151] rounded-lg text-[#595657] dark:text-[#d1d5db] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {referrals.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-[#221E1F] dark:text-[#f3f4f6] mb-2">Your Referrals</h4>
                  <div className="space-y-2">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="p-3 bg-white dark:bg-[#111827] rounded-lg border border-[#EEF2FF] dark:border-[#374151] flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6]">{referral.referred_email}</div>
                          <div className="text-xs text-[#595657] dark:text-[#9ca3af]">
                            {referral.status === 'pending' && 'Pending'}
                            {referral.status === 'signed_up' && 'Signed Up'}
                            {referral.status === 'converted' && 'Converted'}
                            {referral.status === 'credit_applied' && '✓ Credit Applied'}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          referral.status === 'credit_applied' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          referral.status === 'converted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          referral.status === 'signed_up' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                        }`}>
                          {referral.status === 'credit_applied' ? 'Free Month ✓' :
                           referral.status === 'converted' ? 'Paying Customer' :
                           referral.status === 'signed_up' ? 'Signed Up' :
                           'Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!referralStats?.canReferMore && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    You've reached the maximum of 5 referrals. Thank you for spreading the word!
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#577AFF] dark:bg-[#577AFF] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#4A6CF7] dark:hover:bg-[#4A6CF7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.5)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update My Profile
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#EEF2FF] dark:border-[#374151] rounded-lg text-[#595657] dark:text-[#d1d5db] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPanel;

