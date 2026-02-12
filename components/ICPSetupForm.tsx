import React, { useState, useEffect, useRef } from 'react';
import { UserInput } from '../types';
import { Users, Briefcase, Target, Search, Building2, DollarSign, Globe, Lightbulb, AlertCircle } from 'lucide-react';
import { useSpellCheck } from '../hooks/useSpellCheck';
import { getCurrentUser } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { isAppMaker } from '../services/analyticsService';

interface ICPSetupFormProps {
  onSubmit: (data: Partial<UserInput>) => void;
  isSubmitting: boolean;
}

const COMPANY_SIZE_OPTIONS = [
  '10 - 100 Employees',
  '100 - 500 Employees',
  '500 - 1,000 Employees',
  '1,000 - 5,000 Employees',
  '5,000+ Employees'
];

const COMPANY_REVENUE_OPTIONS = [
  'Below $5M annually',
  '$5M - $25M',
  '$25M - $100M',
  '$100M - $250M',
  '$250M - $500M',
  '$500M+'
];

const ICPSetupForm: React.FC<ICPSetupFormProps> = ({ onSubmit, isSubmitting }) => {
  // Validate props
  if (!onSubmit || typeof onSubmit !== 'function') {
    console.error('ICPSetupForm: Invalid onSubmit prop');
    return (
      <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Form initialization error. Please reload the page.</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    companyWebsite: '',
    industry: '',
    icpTitles: '',
    solutions: '',
    coreProblems: '',
    competitors: '',
    seoKeywords: '',
    companySize: [] as string[],
    companyRevenue: [] as string[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRegisteredWebsite, setUserRegisteredWebsite] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Spell check hooks for text inputs
  const industrySpellCheck = useSpellCheck(formData['industry']);
  const icpTitlesSpellCheck = useSpellCheck(formData['icpTitles']);
  const solutionsSpellCheck = useSpellCheck(formData['solutions']);
  const coreProblemsSpellCheck = useSpellCheck(formData['coreProblems']);
  const competitorsSpellCheck = useSpellCheck(formData.competitors);
  const seoKeywordsSpellCheck = useSpellCheck(formData.seoKeywords);
  
  // Load saved ICP data and pre-populate website
  useEffect(() => {
    const loadSavedData = async () => {
      // Load saved ICP fields from localStorage
      const savedIcpData = localStorage.getItem('saved_icp_data');
      if (savedIcpData) {
        try {
          const parsed = JSON.parse(savedIcpData);
          setFormData(prev => ({
            ...prev,
            icpTitles: parsed.icpTitles || prev.icpTitles,
            solutions: parsed.solutions || prev.solutions,
            coreProblems: parsed.coreProblems || prev.coreProblems,
            companySize: parsed.companySize || prev.companySize,
            companyRevenue: parsed.companyRevenue || prev.companyRevenue,
          }));
        } catch (e) {
          console.error('Error loading saved ICP data:', e);
        }
      }

      // Pre-populate website from user account or email domain
      try {
        const user = await getCurrentUser();
        if (user) {
          // Check if user is admin
          const admin = user.email ? isAppMaker(user.email) : false;
          setIsAdmin(admin);
          setUserEmail(user.email || null);

          // First try to get website from user profile
          if (supabase) {
            const { data: profileData } = await supabase
              .from('users')
              .select('website')
              .eq('id', user.id)
              .single();

            if (profileData?.website) {
              setUserRegisteredWebsite(profileData.website);
              // Only pre-populate if the field is empty - don't override user input
              setFormData(prev => ({
                ...prev,
                companyWebsite: prev.companyWebsite || profileData.website
              }));
              // Don't return here - allow user to override
            }
          }

          // If no website in profile, derive from email domain
          if (user.email) {
            const emailDomain = user.email.split('@')[1];
            if (emailDomain && emailDomain !== 'gmail.com' && emailDomain !== 'yahoo.com' && emailDomain !== 'hotmail.com' && emailDomain !== 'outlook.com') {
              // Use the domain as website (add https://)
              const websiteUrl = `https://${emailDomain}`;
              setUserRegisteredWebsite(websiteUrl);
              // Only pre-populate if the field is empty - don't override user input
              setFormData(prev => ({
                ...prev,
                companyWebsite: prev.companyWebsite || websiteUrl
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data for website pre-population:', error);
      }
    };

    loadSavedData();
  }, []);

  // Scroll to top and focus first field on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  }, []);

  const validateField = (name: string, value: string | string[]): string => {
    switch (name) {
      case 'industry':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Industry is required';
        }
        break;
      case 'icpTitles':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'ICP titles are required';
        }
        break;
      case 'companyWebsite':
        if (value && typeof value === 'string' && value.trim() !== '') {
          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlPattern.test(value.trim())) {
            return 'Please enter a valid website URL (e.g., https://www.example.com)';
          }
          
          // Domain restriction: Non-admin users can only use their own domain
          if (!isAdmin) {
            const extractDomain = (url: string | undefined): string => {
              if (!url || typeof url !== 'string') return '';
              try {
                const cleanUrl = url.trim();
                if (!cleanUrl) return '';
                const parts = cleanUrl
                  .replace(/^https?:\/\//i, '')
                  .replace(/^www\./i, '')
                  .split('/');
                const domainPart = parts[0] || '';
                const queryParts = domainPart.split('?');
                const domain = (queryParts[0] || '').trim().toLowerCase();
                return domain || '';
              } catch {
                return '';
              }
            };
            
            const enteredDomain = typeof value === 'string' ? extractDomain(value.trim()) : '';
            const allowedDomains: string[] = [];
            
            // Add registered website domain if available
            if (userRegisteredWebsite) {
              const registeredDomain = extractDomain(userRegisteredWebsite);
              if (registeredDomain) {
                allowedDomains.push(registeredDomain);
              }
            }
            
            // Add email domain if available (excluding common email providers)
            if (userEmail) {
              const emailDomain = userEmail.split('@')[1]?.toLowerCase();
              if (emailDomain && 
                  emailDomain !== 'gmail.com' && 
                  emailDomain !== 'yahoo.com' && 
                  emailDomain !== 'hotmail.com' && 
                  emailDomain !== 'outlook.com' &&
                  emailDomain !== 'icloud.com' &&
                  emailDomain !== 'protonmail.com') {
                allowedDomains.push(emailDomain);
              }
            }
            
            // Check if entered domain matches any allowed domain
            if (allowedDomains.length > 0 && !allowedDomains.includes(enteredDomain)) {
              const primaryDomain = allowedDomains[0] || 'your registered domain';
              return `You can only research your own company website. Please use your registered domain (${primaryDomain}) or contact support if you need to update your domain.`;
            }
          }
        }
        break;
      case 'competitors':
        // Field validation - format check (actual requirement checked in SetupForm based on feedbackType)
        if (value && typeof value === 'string' && value.trim() !== '') {
          const competitors = value.split(',').map(c => c.trim()).filter(c => c.length > 0);
          if (competitors.length === 0) {
            return 'Please enter at least one competitor name';
          }
          if (competitors.length > 5) {
            return 'Please limit to 5 competitors maximum';
          }
          // Check for reasonable competitor names (at least 2 characters each)
          const invalidCompetitors = competitors.filter(c => c.length < 2);
          if (invalidCompetitors.length > 0) {
            return 'Each competitor name should be at least 2 characters';
          }
        }
        break;
      case 'seoKeywords':
        // Optional field, but if provided, should have reasonable format
        if (value && typeof value === 'string' && value.trim() !== '') {
          const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
          if (keywords.length === 0) {
            return 'Please enter at least one keyword';
          }
          if (keywords.length > 10) {
            return 'Please limit to 10 keywords maximum';
          }
          // Check for reasonable keywords (at least 2 characters each)
          const invalidKeywords = keywords.filter(k => k.length < 2);
          if (invalidKeywords.length > 0) {
            return 'Each keyword should be at least 2 characters';
          }
        }
        break;
    }
    return '';
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate field on blur (including optional fields)
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleMultiSelect = (field: 'companySize' | 'companyRevenue', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const newValue = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: newValue };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submit triggered');
    console.log('Form data:', formData);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {
      industry: true,
      icpTitles: true,
      companyWebsite: true
    };
    setTouched(allTouched);
    
    // Validate synchronously - no async needed
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData['industry'] || formData['industry'].trim() === '') {
      newErrors['industry'] = 'Industry is required';
    }
    
    if (!formData['icpTitles'] || formData['icpTitles'].trim() === '') {
      newErrors['icpTitles'] = 'ICP titles are required';
    }
    
    // Validate optional website field if provided
    if (formData['companyWebsite'] && formData['companyWebsite'].trim() !== '') {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData['companyWebsite'].trim())) {
        newErrors['companyWebsite'] = 'Please enter a valid website URL';
      } else {
        // Domain restriction check (same as validateField)
        if (!isAdmin) {
          const extractDomain = (url: string | undefined): string => {
            if (!url || typeof url !== 'string') return '';
            try {
              const cleanUrl = url.trim();
              if (!cleanUrl) return '';
              const parts = cleanUrl
                .replace(/^https?:\/\//i, '')
                .replace(/^www\./i, '')
                .split('/');
              const domainPart = parts[0] || '';
              const queryParts = domainPart.split('?');
              const domain = (queryParts[0] || '').trim().toLowerCase();
              return domain || '';
            } catch {
              return '';
            }
          };
          
          const websiteValue = formData['companyWebsite'];
          const enteredDomain = websiteValue ? extractDomain(websiteValue.trim()) : '';
          const allowedDomains: string[] = [];
          
          if (userRegisteredWebsite) {
            const registeredDomain = extractDomain(userRegisteredWebsite);
            if (registeredDomain) {
              allowedDomains.push(registeredDomain);
            }
          }
          
          if (userEmail) {
            const emailDomain = userEmail.split('@')[1]?.toLowerCase();
            if (emailDomain && 
                emailDomain !== 'gmail.com' && 
                emailDomain !== 'yahoo.com' && 
                emailDomain !== 'hotmail.com' && 
                emailDomain !== 'outlook.com' &&
                emailDomain !== 'icloud.com' &&
                emailDomain !== 'protonmail.com') {
              allowedDomains.push(emailDomain);
            }
          }
          
          if (allowedDomains.length > 0 && !allowedDomains.includes(enteredDomain)) {
            const primaryDomain = allowedDomains[0] || 'your registered domain';
            newErrors['companyWebsite'] = `You can only research your own company website. Please use your registered domain (${primaryDomain}) or contact support if you need to update your domain.`;
          }
        }
      }
    }
    
    // Set errors if any
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation failed with errors:', newErrors);
      setErrors(newErrors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
          if (errorElement) {
            errorElement.focus();
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return;
    }
    
    // Clear any existing errors
    setErrors({});
    
    // Save ICP fields to localStorage for next time
    try {
      const icpDataToSave = {
        icpTitles: formData.icpTitles,
        solutions: formData.solutions,
        coreProblems: formData.coreProblems,
        companySize: formData.companySize,
        companyRevenue: formData.companyRevenue,
      };
      localStorage.setItem('saved_icp_data', JSON.stringify(icpDataToSave));
    } catch (e) {
      console.error('Error saving ICP data:', e);
    }
    
    // All validation passed - proceed to next step IMMEDIATELY
    // Clean up optional fields - convert empty strings to undefined
    const cleanedData: Partial<UserInput> = {
      industry: formData['industry'].trim(),
      icpTitles: formData['icpTitles'].trim(),
      companyWebsite: formData['companyWebsite']?.trim() || undefined,
      solutions: formData['solutions']?.trim() || undefined,
      coreProblems: formData['coreProblems']?.trim() || undefined,
      competitors: formData['competitors']?.trim() || undefined,
      seoKeywords: formData.seoKeywords?.trim() || undefined,
      companySize: formData.companySize.length > 0 ? formData.companySize : undefined,
      companyRevenue: formData.companyRevenue.length > 0 ? formData.companyRevenue : undefined
    };
    
    // Remove undefined values to keep data clean
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key as keyof typeof cleanedData] === undefined) {
        delete cleanedData[key as keyof typeof cleanedData];
      }
    });
    
    console.log('Form is valid, calling onSubmit with cleaned data:', cleanedData);
    
    try {
      onSubmit(cleanedData);
      console.log('onSubmit called successfully');
    } catch (error) {
      console.error('Error calling onSubmit:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Show error to user
      setErrors({ 
        submit: error instanceof Error ? error.message : 'An error occurred. Please try again.' 
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-3 tracking-tight leading-tight">
          Define Your ICP
        </h1>
        <p className="text-[#595657] dark:text-[#9ca3af] text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          Start by recording your company details and defining your Ideal Customer Profile. This helps us create the perfect advisory board for your needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111827] rounded-2xl p-4 md:p-8 shadow-xl shadow-[#383535]/10 dark:shadow-[0_0_30px_rgba(87,122,255,0.2)] border border-[#F9FAFD] dark:border-[#374151]">
        <div className="grid gap-8 md:gap-8">
          
          {/* Company Website */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Globe className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Your Website
            </label>
            <input
              ref={firstInputRef}
              type="url"
              name="companyWebsite"
              placeholder="https://www.yourcompany.com"
              value={formData['companyWebsite']}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['companyWebsite'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['companyWebsite'] && touched['companyWebsite'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['companyWebsite']}
              </p>
            )}
            {!errors['companyWebsite'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">We'll conduct deep research on your website to understand your offerings and market position</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Briefcase className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Your Industry
            </label>
            <textarea
              ref={industrySpellCheck.inputRef as React.RefObject<HTMLTextAreaElement>}
              name="industry"
              placeholder="E.g., B2B SaaS, MedTech, Cyber Security, etc... (you can also provide things like NAICS codes & TAM)"
              value={formData['industry']}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={industrySpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full h-24 bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all resize-none placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['industry'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['industry'] && touched['industry'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['industry']}
              </p>
            )}
            {!errors['industry'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">We'll conduct deep market research on your industry</p>
            )}
          </div>
          
          {/* ICP Titles */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Users className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              What are your ICP titles?
            </label>
            <input
              ref={icpTitlesSpellCheck.inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              name="icpTitles"
              placeholder="E.g., CEO, CRO, Director of Development, Product Manager, etc..."
              value={formData['icpTitles']}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={icpTitlesSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['icpTitles'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['icpTitles'] && touched['icpTitles'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['icpTitles']}
              </p>
            )}
            {!errors['icpTitles'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Separate multiple titles with commas</p>
            )}
          </div>

          {/* Solutions */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Lightbulb className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Your Solution(s) <span className="text-[#A1B4FF] dark:text-[#A1B4FF] font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              ref={solutionsSpellCheck.inputRef as React.RefObject<HTMLTextAreaElement>}
              name="solutions"
              placeholder="Describe your products, services, or solutions..."
              value={formData['solutions']}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={solutionsSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full h-24 bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all resize-none placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['solutions'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['solutions'] && touched['solutions'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['solutions']}
              </p>
            )}
            {!errors['solutions'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Describe what you offer to your customers</p>
            )}
          </div>

          {/* Core Problems */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <AlertCircle className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              The Core Problem(s) You Solve <span className="text-[#A1B4FF] dark:text-[#A1B4FF] font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              ref={coreProblemsSpellCheck.inputRef as React.RefObject<HTMLTextAreaElement>}
              name="coreProblems"
              placeholder="Describe the main problems or pain points your solution addresses..."
              value={formData.coreProblems}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={coreProblemsSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full h-24 bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all resize-none placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['coreProblems'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['coreProblems'] && touched['coreProblems'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['coreProblems']}
              </p>
            )}
            {!errors['coreProblems'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">What problems or pain points does your solution address?</p>
            )}
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Building2 className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Your Ideal ICP Company Size <span className="text-[#A1B4FF] dark:text-[#A1B4FF] font-normal normal-case">(Optional)</span>
            </label>
            <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Choose all that apply</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPANY_SIZE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelect('companySize', option)}
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-all text-sm font-medium
                    ${formData.companySize.includes(option)
                      ? 'bg-[#EEF2FF] dark:bg-[#1a1f2e] border-[#577AFF] dark:border-[#577AFF] text-[#577AFF] dark:text-[#A1B4FF]'
                      : 'bg-[#F9FAFD] dark:bg-[#0a0e1a] border-[#EEF2FF] dark:border-[#374151] text-[#383535] dark:text-[#d1d5db] hover:border-[#D5DDFF] dark:hover:border-[#577AFF]'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Company Revenue */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <DollarSign className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Your Ideal ICP Company Revenue <span className="text-[#A1B4FF] dark:text-[#A1B4FF] font-normal normal-case">(Optional)</span>
            </label>
            <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Choose all that apply</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPANY_REVENUE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelect('companyRevenue', option)}
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-all text-sm font-medium
                    ${formData.companyRevenue.includes(option)
                      ? 'bg-[#EEF2FF] dark:bg-[#1a1f2e] border-[#577AFF] dark:border-[#577AFF] text-[#577AFF] dark:text-[#A1B4FF]'
                      : 'bg-[#F9FAFD] dark:bg-[#0a0e1a] border-[#EEF2FF] dark:border-[#374151] text-[#383535] dark:text-[#d1d5db] hover:border-[#D5DDFF] dark:hover:border-[#577AFF]'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Target className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Please list your top competitors <span className="text-red-500 dark:text-red-400 font-normal normal-case">*</span>
              <span className="text-[#595657] dark:text-[#9ca3af] font-normal normal-case text-xs ml-auto">Required for Competitor, Branding, & Website reports</span>
            </label>
            <input
              ref={competitorsSpellCheck.inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              name="competitors"
              placeholder="E.g., Competitor 1, Competitor 2, Competitor 3, Competitor 4"
              value={formData.competitors}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={competitorsSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['competitors'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['competitors'] && touched['competitors'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['competitors']}
              </p>
            )}
            {!errors['competitors'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Separate multiple competitors with commas</p>
            )}
          </div>

          {/* SEO Keywords */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Search className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Please list your top 10 SEO keywords <span className="text-[#A1B4FF] dark:text-[#A1B4FF] font-normal normal-case">(Optional)</span>
            </label>
            <input
              ref={seoKeywordsSpellCheck.inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              name="seoKeywords"
              placeholder="E.g., keyword1, keyword2, keyword3, ..."
              value={formData.seoKeywords}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={seoKeywordsSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['seoKeywords'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['seoKeywords'] && touched['seoKeywords'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['seoKeywords']}
              </p>
            )}
            {!errors['seoKeywords'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Separate multiple keywords with commas</p>
            )}
          </div>

          <div className="pt-4">
            <button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => {
                  // Ensure form submission happens even if there's an issue with form onSubmit
                  if (!isSubmitting) {
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                      form.dispatchEvent(formEvent);
                    }
                  }
                }}
                className={`w-full py-4 md:py-5 rounded-xl text-lg md:text-xl font-bold tracking-wide shadow-lg dark:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center
                ${isSubmitting 
                    ? 'bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#595657] dark:text-[#9ca3af] cursor-not-allowed shadow-none border border-[#D5DDFF] dark:border-[#374151]' 
                    : 'bg-green-500 dark:bg-green-500 hover:bg-green-600 dark:hover:bg-green-600 text-white shadow-green-200 dark:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:-translate-y-1'
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-[#577AFF] dark:text-[#577AFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[#595657] dark:text-[#9ca3af] text-sm md:text-base">Processing...</span>
                </span>
              ) : (
                'Next: Tell us what you want to test...'
              )}
            </button>
          </div>
        </div>
      </form>
      
      {/* Spell Check Context Menus */}
      {industrySpellCheck.SpellCheckMenu}
      {icpTitlesSpellCheck.SpellCheckMenu}
      {solutionsSpellCheck.SpellCheckMenu}
      {coreProblemsSpellCheck.SpellCheckMenu}
      {competitorsSpellCheck.SpellCheckMenu}
      {seoKeywordsSpellCheck.SpellCheckMenu}
    </div>
  );
};

export default ICPSetupForm;

