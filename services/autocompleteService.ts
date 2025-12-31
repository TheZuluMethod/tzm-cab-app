/**
 * Auto-complete Service
 * 
 * Provides smart defaults and suggestions for form fields
 */

import { supabase } from './supabaseClient';

export interface AutocompleteSuggestion {
  value: string;
  label: string;
  category?: string;
}

/**
 * Get industry suggestions based on user's previous inputs
 */
export const getIndustrySuggestions = async (userId: string | null, query: string = ''): Promise<AutocompleteSuggestion[]> => {
  const commonIndustries = [
    'SaaS / Technology',
    'E-commerce / Retail',
    'Healthcare / Medical',
    'Finance / Fintech',
    'Education / EdTech',
    'Marketing / Advertising',
    'Real Estate',
    'Manufacturing',
    'Consulting / Professional Services',
    'Media / Entertainment',
    'Food & Beverage',
    'Travel / Hospitality',
    'Non-profit',
    'Energy / Utilities',
    'Automotive',
    'Fashion / Apparel',
    'Sports / Fitness',
    'Legal Services',
    'Insurance',
    'Telecommunications',
  ];

  // If user is logged in, get their previous industries
  if (userId && supabase) {
    try {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('input')
        .eq('user_id', userId)
        .not('input', 'is', null)
        .limit(50);

      if (sessions && sessions.length > 0) {
        const userIndustries = new Set<string>();
        sessions.forEach(session => {
          const input = session.input as any;
          if (input?.industry && typeof input.industry === 'string') {
            userIndustries.add(input.industry);
          }
        });

        // Combine user industries with common industries
        const allIndustries = Array.from(userIndustries).concat(commonIndustries);
        const uniqueIndustries = Array.from(new Set(allIndustries));

        // Filter by query if provided
        const filtered = query
          ? uniqueIndustries.filter(industry =>
              industry.toLowerCase().includes(query.toLowerCase())
            )
          : uniqueIndustries;

        return filtered.slice(0, 10).map(industry => ({
          value: industry,
          label: industry,
          category: userIndustries.has(industry) ? 'Your Industries' : 'Common Industries',
        }));
      }
    } catch (error) {
      console.error('Error fetching user industries:', error);
    }
  }

  // Fallback to common industries
  const filtered = query
    ? commonIndustries.filter(industry =>
        industry.toLowerCase().includes(query.toLowerCase())
      )
    : commonIndustries;

  return filtered.slice(0, 10).map(industry => ({
    value: industry,
    label: industry,
    category: 'Common Industries',
  }));
};

/**
 * Get ICP title suggestions based on industry
 */
export const getICPTitleSuggestions = (industry: string): AutocompleteSuggestion[] => {
  const titleMap: Record<string, string[]> = {
    'SaaS / Technology': [
      'VP of Engineering',
      'CTO',
      'VP of Product',
      'Head of Product',
      'VP of Sales',
      'VP of Marketing',
      'Chief Revenue Officer',
      'VP of Customer Success',
      'VP of Operations',
      'VP of Finance',
    ],
    'E-commerce / Retail': [
      'VP of E-commerce',
      'VP of Merchandising',
      'VP of Marketing',
      'VP of Operations',
      'VP of Supply Chain',
      'VP of Customer Experience',
      'VP of Digital',
      'VP of Sales',
      'VP of Finance',
      'VP of Technology',
    ],
    'Healthcare / Medical': [
      'VP of Clinical Operations',
      'VP of Medical Affairs',
      'VP of Patient Care',
      'VP of Operations',
      'VP of Finance',
      'VP of Technology',
      'VP of Marketing',
      'VP of Business Development',
      'VP of Quality',
      'VP of Compliance',
    ],
    'Finance / Fintech': [
      'VP of Finance',
      'VP of Risk',
      'VP of Operations',
      'VP of Technology',
      'VP of Product',
      'VP of Compliance',
      'VP of Marketing',
      'VP of Sales',
      'VP of Customer Success',
      'Chief Risk Officer',
    ],
    'Marketing / Advertising': [
      'VP of Marketing',
      'VP of Brand',
      'VP of Digital',
      'VP of Creative',
      'VP of Media',
      'VP of Strategy',
      'VP of Client Services',
      'VP of Operations',
      'VP of Technology',
      'VP of Finance',
    ],
  };

  const suggestions = titleMap[industry] || [
    'VP of Operations',
    'VP of Marketing',
    'VP of Sales',
    'VP of Finance',
    'VP of Technology',
    'VP of Product',
    'VP of Customer Success',
    'VP of Business Development',
    'VP of Strategy',
    'VP of Human Resources',
  ];

  return suggestions.map(title => ({
    value: title,
    label: title,
    category: 'Common Titles',
  }));
};

/**
 * Get feedback type suggestions
 */
export const getFeedbackTypeSuggestions = (): AutocompleteSuggestion[] => {
  return [
    { value: 'Product Feedback', label: 'Product Feedback', category: 'Feedback Types' },
    { value: 'Marketing Strategy', label: 'Marketing Strategy', category: 'Feedback Types' },
    { value: 'Pricing Strategy', label: 'Pricing Strategy', category: 'Feedback Types' },
    { value: 'Go-to-Market', label: 'Go-to-Market', category: 'Feedback Types' },
    { value: 'Competitive Analysis', label: 'Competitive Analysis', category: 'Feedback Types' },
    { value: 'Brand Positioning', label: 'Brand Positioning', category: 'Feedback Types' },
    { value: 'Customer Experience', label: 'Customer Experience', category: 'Feedback Types' },
    { value: 'Feature Prioritization', label: 'Feature Prioritization', category: 'Feedback Types' },
    { value: 'Sales Strategy', label: 'Sales Strategy', category: 'Feedback Types' },
    { value: 'Product Roadmap', label: 'Product Roadmap', category: 'Feedback Types' },
  ];
};

/**
 * Get "I'm not sure" helper suggestions
 */
export const getHelperSuggestions = (field: 'industry' | 'icpTitles' | 'feedbackType'): AutocompleteSuggestion[] => {
  switch (field) {
    case 'industry':
      return [
        {
          value: '',
          label: "💡 Not sure? Start with 'SaaS / Technology' - it's the most common",
          category: 'Helper',
        },
        {
          value: '',
          label: "💡 You can always change this later - pick what feels closest",
          category: 'Helper',
        },
      ];
    case 'icpTitles':
      return [
        {
          value: '',
          label: "💡 Think about who makes buying decisions in your industry",
          category: 'Helper',
        },
        {
          value: '',
          label: "💡 Common titles: VP of Marketing, VP of Sales, CTO, etc.",
          category: 'Helper',
        },
      ];
    case 'feedbackType':
      return [
        {
          value: '',
          label: "💡 What do you need feedback on? Product, Marketing, Pricing, etc.",
          category: 'Helper',
        },
        {
          value: '',
          label: "💡 You can ask about anything - strategy, features, positioning",
          category: 'Helper',
        },
      ];
    default:
      return [];
  }
};

