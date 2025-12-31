import React, { useState, useRef, useEffect } from 'react';
import { UserInput, FileData } from '../types';
import { Search, AlertCircle, Paperclip, X, FileText, MessageSquare } from 'lucide-react';
import { useSpellCheck } from '../hooks/useSpellCheck';

interface SetupFormProps {
  onSubmit: (data: UserInput) => void;
  isSubmitting: boolean;
  initialData?: Partial<UserInput>;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSubmit, isSubmitting, initialData }) => {
  const [formData, setFormData] = useState<UserInput>({
    icpTitles: '',
    industry: '',
    competitors: '',
    seoKeywords: '',
    companyWebsite: undefined,
    solutions: undefined,
    coreProblems: undefined,
    companySize: undefined,
    companyRevenue: undefined,
    feedbackType: '',
    feedbackItem: '',
    circumstances: '',
    files: []
  });

  const firstInputRef = useRef<HTMLSelectElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Spell check hooks for text inputs
  const feedbackItemSpellCheck = useSpellCheck(formData['feedbackItem']);
  const circumstancesSpellCheck = useSpellCheck(formData['circumstances']);
  
  // Error state management
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Populate form with initial data from ICP setup
  useEffect(() => {
    if (initialData) {
      try {
        // Safely merge initial data, ensuring all required fields exist
        setFormData(prev => {
          const merged = {
            ...prev,
            ...initialData,
            // Ensure required fields have defaults
            feedbackType: initialData.feedbackType || prev.feedbackType || '',
            feedbackItem: initialData.feedbackItem || prev.feedbackItem || '',
            circumstances: initialData.circumstances || prev.circumstances || '',
            files: Array.isArray(initialData.files) ? initialData.files : prev.files || []
          };
          return merged;
        });
      } catch (error) {
        console.error('Error merging initial data:', error);
        // Don't crash, just log the error
      }
    }
  }, [initialData]);
  
  // Scroll to top and focus first field on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  }, []);

  // Validation functions
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'feedbackType':
        if (!value || value.trim() === '') {
          return 'Please select a feedback type';
        }
        break;
      case 'feedbackItem':
        if (!value || value.trim() === '') {
          return 'Please provide the item you want feedback on';
        }
        if (value.trim().length < 10) {
          return 'Please provide more details (at least 10 characters)';
        }
        break;
      case 'circumstances':
        // Optional field, but if provided, should be meaningful
        if (value && value.trim().length > 0 && value.trim().length < 5) {
          return 'Please provide more details about the circumstances';
        }
        break;
    }
    return '';
  };

  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    
    const feedbackTypeError = validateField('feedbackType', formData['feedbackType']);
    if (feedbackTypeError) newErrors['feedbackType'] = feedbackTypeError;
    
    const feedbackItemError = validateField('feedbackItem', formData['feedbackItem']);
    if (feedbackItemError) newErrors['feedbackItem'] = feedbackItemError;
    
    const circumstancesError = validateField('circumstances', formData['circumstances']);
    if (circumstancesError) newErrors['circumstances'] = circumstancesError;
    
    // CRITICAL: Competitors are REQUIRED for these report types
    const feedbackType = (formData['feedbackType'] || '').toLowerCase();
    const requiresCompetitors = 
      feedbackType.includes('competitor') && feedbackType.includes('breakdown') ||
      (feedbackType.includes('branding') || feedbackType.includes('positioning') || feedbackType.includes('messaging')) ||
      (feedbackType.includes('website') && (feedbackType.includes('cro') || feedbackType.includes('funnel')));
    
    if (requiresCompetitors) {
      const competitors = formData['competitors']?.trim() || '';
      if (!competitors || competitors.length === 0) {
        newErrors['competitors'] = 'Competitors are required for this report type. Please list your top competitors.';
      } else {
        const competitorList = competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);
        if (competitorList.length === 0) {
          newErrors['competitors'] = 'Please enter at least one competitor name';
        } else if (competitorList.length > 5) {
          newErrors['competitors'] = 'Please limit to 5 competitors maximum';
        }
      }
    }
    
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate field on blur
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileData[] = [];
      const unsupportedFiles: string[] = [];
      const MAX_FILE_SIZE = 10 * 1024 * 1024;

      const supportedTypes = [
        'application/pdf',
        'text/plain',
        'text/csv',
        'text/markdown',
        'text/x-markdown',
        'text/html',
        'image/'
      ];

      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (!file) continue; // Skip if file is undefined (shouldn't happen, but TypeScript requires this check)
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();

        if (file.size > MAX_FILE_SIZE) {
            unsupportedFiles.push(`${file.name} (file too large - max 10MB)`);
            continue;
        }

        const isSupported = supportedTypes.some(type => fileType.startsWith(type)) ||
                            fileName.endsWith('.md') ||
                            fileName.endsWith('.txt') ||
                            fileName.endsWith('.csv') ||
                            fileName.endsWith('.html') ||
                            fileName.endsWith('.pdf');

        if (!isSupported) {
            unsupportedFiles.push(file.name);
            continue;
        }

        // Normalize MIME type for ambiguous files
        let mimeType = file.type;
        if (!mimeType || mimeType === '') {
             if (fileName.endsWith('.md')) mimeType = 'text/plain';
             if (fileName.endsWith('.csv')) mimeType = 'text/csv';
             if (fileName.endsWith('.txt')) mimeType = 'text/plain';
        }
        // Force markdown to text/plain or supported type if needed, 
        // though Gemini supports text/md, browser often sees it as empty or text/markdown
        if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') {
            mimeType = 'text/plain'; // Safer for API if specific md type fails
        }

        try {
          const base64 = await fileToBase64(file);
          newFiles.push({
            name: file.name,
            mimeType: mimeType || 'text/plain',
            data: base64
          });
        } catch (error) {
          console.error("Error reading file:", file.name, error);
        }
      }

      if (unsupportedFiles.length > 0) {
        // Show user-friendly error notification
        const errorMessage = `The following files could not be uploaded:\n${unsupportedFiles.join('\n')}\n\nSupported formats: PDF, CSV, Text, Markdown, HTML, or Image files (max 10MB each).`;
        alert(errorMessage);
        // Also log for debugging
        console.error('File upload errors:', unsupportedFiles);
      }

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to extract base64 data from file'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['feedbackType', 'feedbackItem', 'circumstances'];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    // Validate form
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationResult.errors)[0];
      if (firstErrorField) {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (errorElement as HTMLElement).focus();
        }
      }
      return;
    }
    
    // Ensure all required fields are present before submission
    if (!formData['feedbackType'] || !formData['feedbackItem']) {
      return;
    }
    
    // Form is valid, submit
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-3 tracking-tight leading-tight">
          What do you want to test?
        </h1>
        <p className="text-[#595657] dark:text-[#9ca3af] text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          Now let's define what you'd like to test with your advisory board.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111827] rounded-2xl p-4 md:p-8 shadow-xl shadow-[#383535]/10 dark:shadow-[0_0_30px_rgba(87,122,255,0.2)] border border-[#F9FAFD] dark:border-[#374151]">
        <div className="grid gap-8 md:gap-8">
          
          {/* Feedback Type Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <MessageSquare className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Feedback Type
            </label>
            <select
              ref={firstInputRef}
              name="feedbackType"
              value={formData['feedbackType']}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all ${
                errors['feedbackType'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              required
              disabled={isSubmitting}
            >
              <option value="">Select a topic...</option>
              <option value="Branding, Positioning, & Messaging">Branding, Positioning, & Messaging</option>
              <option value="Competitor Breakdown">Competitor Breakdown</option>
              <option value="Pricing & Packaging">Pricing & Packaging</option>
              <option value="Product Feature or Idea">Product Feature or Idea</option>
              <option value="Brainstorming Session">Brainstorming Session</option>
              <option value="Website CRO & Funnel Analysis">Website CRO & Funnel Analysis</option>
              <option value="Other">Other</option>
            </select>
            {errors['feedbackType'] && touched['feedbackType'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['feedbackType']}
              </p>
            )}
          </div>

              {/* Feedback Item */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#D5DDFF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#A1B4FF] dark:border-[#577AFF]">
                  <Search className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
                  What do you want your board to review?
                </label>
            <textarea
              ref={feedbackItemSpellCheck.inputRef as React.RefObject<HTMLTextAreaElement>}
              name="feedbackItem"
              placeholder="Think of this as your prompt. The more detail the better: Paste a website URL, give a product description for full review & feedback, test marketing messaging or even an email or ad, or ask a specific question here..."
              value={formData['feedbackItem']}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={feedbackItemSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full h-32 bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all resize-none placeholder:text-xs placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['feedbackItem'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              required
              disabled={isSubmitting}
            />
            {errors['feedbackItem'] && touched['feedbackItem'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['feedbackItem']}
              </p>
            )}
            {!errors['feedbackItem'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Provide as much detail as possible. Think of this as your LLM prompt</p>
            )}
          </div>

          {/* Competitors Validation Warning */}
          {(() => {
            const feedbackType = (formData['feedbackType'] || '').toLowerCase();
            const requiresCompetitors = 
              feedbackType.includes('competitor') && feedbackType.includes('breakdown') ||
              (feedbackType.includes('branding') || feedbackType.includes('positioning') || feedbackType.includes('messaging')) ||
              (feedbackType.includes('website') && (feedbackType.includes('cro') || feedbackType.includes('funnel')));
            
            if (requiresCompetitors && (!formData['competitors'] || formData['competitors'].trim().length === 0)) {
              return (
                <div className="space-y-2">
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">Competitors Required</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                          This report type requires competitor information. Please go back to the previous step and add your top competitors.
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          If you don't know your competitors, we can research them from your website. Please add your website URL in the previous step.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

           {/* File Upload */}
           <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <Paperclip className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Attach Supporting Materials <span className="text-[#595657] dark:text-[#9ca3af] font-normal">(Optional)</span>
            </label>
            <div className="flex flex-col gap-3">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                multiple 
                accept=".pdf,.txt,.csv,.md,.html,image/*"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-[#D5DDFF] dark:border-[#374151] rounded-lg text-[#595657] dark:text-[#9ca3af] hover:border-[#577AFF] dark:hover:border-[#577AFF] hover:text-[#577AFF] dark:hover:text-[#577AFF] hover:bg-[#EEF2FF] dark:hover:bg-[#1a1f2e] transition-all font-medium text-sm md:text-base"
              >
                <Paperclip className="w-5 h-5" />
                <span className="text-center">Click to upload PDF, CSV, Text, or Image files</span>
              </button>
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Add things like pricing studies, sales brochures, and new feature guides or screenshots.</p>

              {formData.files.length > 0 && (
                <div className="grid gap-2 mt-1">
                  {formData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#F9FAFD] dark:bg-[#1a1f2e] p-3 rounded-md border border-[#EEF2FF] dark:border-[#374151]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white dark:bg-[#111827] rounded shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)]">
                           <FileText className="w-5 h-5 text-[#577AFF] dark:text-[#577AFF] flex-shrink-0" />
                        </div>
                        <span className="text-sm font-medium text-[#383535] dark:text-[#d1d5db] truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile(idx)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-[#595657] dark:text-[#9ca3af] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Circumstances */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
              <AlertCircle className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
              Special or Extenuating Circumstances <span className="text-[#595657] dark:text-[#9ca3af] font-normal">(Optional)</span>
            </label>
            <textarea
              ref={circumstancesSpellCheck.inputRef as React.RefObject<HTMLTextAreaElement>}
              name="circumstances"
              placeholder="e.g. Entering a saturated market, tight budget, rebranding phase..."
              value={formData['circumstances']}
              onChange={handleChange}
              onBlur={handleBlur}
              onContextMenu={circumstancesSpellCheck.handleContextMenu}
              spellCheck={false}
              className={`w-full h-24 bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all resize-none placeholder-[#595657] dark:placeholder-[#9ca3af] ${
                errors['circumstances'] 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                  : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
              }`}
              disabled={isSubmitting}
            />
            {errors['circumstances'] && touched['circumstances'] && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {errors['circumstances']}
              </p>
            )}
            {!errors['circumstances'] && (
              <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">Help the board understand your context</p>
            )}
          </div>

          {/* Competitors Field - Show when required */}
          {(() => {
            const feedbackType = (formData['feedbackType'] || '').toLowerCase();
            const requiresCompetitors = 
              feedbackType.includes('competitor') && feedbackType.includes('breakdown') ||
              (feedbackType.includes('branding') || feedbackType.includes('positioning') || feedbackType.includes('messaging')) ||
              (feedbackType.includes('website') && (feedbackType.includes('cro') || feedbackType.includes('funnel')));
            
            if (requiresCompetitors) {
              return (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#051A53] dark:text-[#A1B4FF] bg-[#EEF2FF] dark:bg-[#1a1f2e] px-3 py-2 rounded-lg flex items-center gap-2 uppercase tracking-wide border border-[#D5DDFF] dark:border-[#374151]">
                    <Search className="w-4 h-4 text-[#577AFF] dark:text-[#577AFF]" />
                    Top Competitors <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="competitors"
                    value={formData['competitors']}
                    placeholder="Enter competitor names separated by commas (e.g., Competitor A, Competitor B, Competitor C)"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-[#F9FAFD] dark:bg-[#0a0e1a] border rounded-lg px-4 py-3 text-[#221E1F] dark:text-[#f3f4f6] focus:outline-none focus:ring-2 transition-all ${
                      errors['competitors'] 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                        : 'border-[#EEF2FF] dark:border-[#374151] focus:ring-[#577AFF] focus:border-transparent'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  {errors['competitors'] && touched['competitors'] && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <span>⚠</span> {errors['competitors']}
                    </p>
                  )}
                  {!errors['competitors'] && (
                    <p className="text-xs text-[#595657] dark:text-[#9ca3af] mt-1">List up to 5 competitors for comparison analysis</p>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div className="pt-4">
            <button
                type="submit"
                disabled={isSubmitting}
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
                    <span className="text-[#595657] dark:text-[#9ca3af] text-sm md:text-base">Recruiting Board Members...</span>
                </span>
                ) : (
                'Recruit my board!'
                )}
            </button>
          </div>
        </div>
      </form>
      
      {/* Spell Check Context Menus */}
      {feedbackItemSpellCheck.SpellCheckMenu}
      {circumstancesSpellCheck.SpellCheckMenu}
    </div>
  );
};

export default SetupForm;