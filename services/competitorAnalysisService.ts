/**
 * Competitor Analysis Service
 * 
 * Handles competitor identification and data collection for competitor breakdown analysis.
 * Uses Perplexity AI and Gemini AI to gather comprehensive competitor information.
 */

import { UserInput } from '../types';
import { performDeepResearch } from './perplexityService';
import { GoogleGenAI } from "@google/genai";
import rateLimiter from './rateLimiter';

/**
 * Get Gemini client instance
 */
const getClient = (): GoogleGenAI => {
  const apiKey1 = process.env['API_KEY'] || import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
  const apiKey2 = process.env['GEMINI_API_KEY'] || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const apiKey = (apiKey1 && apiKey1 !== 'undefined' && apiKey1 !== '' && apiKey1 !== 'your_gemini_api_key_here')
    ? apiKey1
    : (apiKey2 && apiKey2 !== 'undefined' && apiKey2 !== '' && apiKey2 !== 'your_gemini_api_key_here')
    ? apiKey2
    : null;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set VITE_GEMINI_API_KEY in your .env file and restart the dev server.');
  }
  return new GoogleGenAI({ apiKey });
};

export interface CompetitorData {
  name: string;
  domain: string;
  topKeywords: string[];
  h1: string;
  h2s: string[];
  description: string;
  hooks: string[];
  uniqueSellingPoints: string[];
  valuePropositions: string[];
  pricingOverview: string;
  winsAgainstUser: string[];
  lossesAgainstUser: string[];
  actionableSuggestions: string[];
}

export interface CompetitorAnalysisResult {
  userDomain: string;
  competitors: CompetitorData[];
}

/**
 * Extract domain from website URL
 */
const extractDomain = (website: string | undefined): string | null => {
  if (!website) return null;
  
  try {
    // Remove protocol and www
    let domain = website
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
    
    return domain || null;
  } catch {
    return null;
  }
};

/**
 * Identify top 5 competitors based on user's domain and industry
 */
const identifyCompetitors = async (
  userDomain: string | null,
  industry: string,
  existingCompetitors?: string
): Promise<string[]> => {
  const ai = getClient();
  
  // Use existing competitors if provided, otherwise identify them
  if (existingCompetitors && existingCompetitors.trim()) {
    const competitors = existingCompetitors
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .slice(0, 5);
    
    if (competitors.length > 0) {
      return competitors;
    }
  }
  
  // If no domain, use industry-based search
  if (!userDomain) {
    const researchQuery = `Top 5 competitors in ${industry} industry. List company names and their domains.`;
    const research = await performDeepResearch([researchQuery]);
    
    const prompt = `
Extract exactly 5 competitor company names from this research data. Return only company names, one per line, no additional text.

Research data:
${research}
`;
    
    await rateLimiter.waitIfNeeded();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3 }
    });
    
    const competitors = response.text
      ?.split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0 && !c.match(/^\d+\./))
      .slice(0, 5) || [];
    
    return competitors.length > 0 ? competitors : [];
  }
  
  // Use Perplexity to find competitors based on domain
  const researchQueries = [
    `Who are the top 5 direct competitors of ${userDomain} in the ${industry} industry? List company names and websites.`,
    `${userDomain} competitors analysis: main competitors, market share, and competitive landscape`,
    `Competitive analysis for ${userDomain}: who are their primary competitors in ${industry}?`
  ];
  
  const research = await performDeepResearch(researchQueries);
  
  const prompt = `
Extract exactly 5 competitor company names from this research data. These should be direct competitors of ${userDomain} in the ${industry} industry.

Return only company names, one per line, no additional text or numbering.

Research data:
${research}
`;
  
  await rateLimiter.waitIfNeeded();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.3 }
  });
  
  const competitors = response.text
    ?.split('\n')
    .map(c => c.trim().replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''))
    .filter(c => c.length > 0 && c.toLowerCase() !== userDomain.toLowerCase())
    .slice(0, 5) || [];
  
  return competitors.length > 0 ? competitors : [];
};

/**
 * Fetch comprehensive data for a single competitor
 */
const fetchCompetitorData = async (
  competitorName: string,
  industry: string,
  userDomain: string | null,
  userSolutions?: string
): Promise<CompetitorData> => {
  const ai = getClient();
  
  // Research queries for competitor data
  const researchQueries = [
    `${competitorName} website: H1, H2 headings, meta description, and key messaging`,
    `${competitorName} top performing keywords on Google and search engine optimization strategy`,
    `${competitorName} pricing and packaging: pricing tiers, plans, and pricing model`,
    `${competitorName} unique selling points and value propositions: what makes them different`,
    `${competitorName} brand messaging: hooks, taglines, and marketing copy`,
    `${competitorName} competitive advantages and weaknesses in ${industry}`
  ];
  
  const research = await performDeepResearch(researchQueries);
  
  const prompt = `
You are analyzing ${competitorName} as a competitor in the ${industry} industry.

${userDomain ? `The user's company domain is: ${userDomain}` : ''}
${userSolutions ? `The user's solutions: ${userSolutions}` : ''}

Research data:
${research}

Extract and structure the following information about ${competitorName}:

1. **Top Keywords**: List their top 5-7 performing keywords on Google and main LLMs (search terms they rank for)
2. **H1**: Their main H1 heading from their homepage
3. **H2s**: List 3-5 main H2 headings from their homepage
4. **Description**: Their meta description or main value proposition description
5. **Hooks**: 3-5 compelling hooks, taglines, or attention-grabbing statements they use
6. **Unique Selling Points**: Their 3 unique selling points (what makes them different)
7. **Value Propositions**: Their top 5 core value propositions/benefits they communicate
8. **Pricing Overview**: Summary of their pricing & packaging model (tiers, pricing structure, etc.)
9. **Wins Against User**: Where ${competitorName} wins/beats the user's company (3-5 points)
10. **Losses Against User**: Where ${competitorName} loses/falls short compared to the user's company (3-5 points)
11. **Actionable Suggestions**: 3-5 actionable suggestions for how the user can beat ${competitorName} in the market

Return the data in this exact JSON format:
{
  "name": "${competitorName}",
  "domain": "competitor-domain.com",
  "topKeywords": ["keyword1", "keyword2", ...],
  "h1": "Main H1 heading",
  "h2s": ["H2 1", "H2 2", ...],
  "description": "Meta description",
  "hooks": ["hook1", "hook2", ...],
  "uniqueSellingPoints": ["USP1", "USP2", "USP3"],
  "valuePropositions": ["VP1", "VP2", "VP3", "VP4", "VP5"],
  "pricingOverview": "Pricing summary",
  "winsAgainstUser": ["win1", "win2", ...],
  "lossesAgainstUser": ["loss1", "loss2", ...],
  "actionableSuggestions": ["suggestion1", "suggestion2", ...]
}

Be specific and data-driven. Use the research data provided.
`;
  
  await rateLimiter.waitIfNeeded();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.4 }
  });
  
  try {
    // Try to extract JSON from response
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    
    const data = JSON.parse(jsonText) as CompetitorData;
    
    // Validate and ensure all fields exist
    return {
      name: data.name || competitorName,
      domain: data.domain || '',
      topKeywords: Array.isArray(data.topKeywords) ? data.topKeywords : [],
      h1: data.h1 || '',
      h2s: Array.isArray(data.h2s) ? data.h2s : [],
      description: data.description || '',
      hooks: Array.isArray(data.hooks) ? data.hooks : [],
      uniqueSellingPoints: Array.isArray(data.uniqueSellingPoints) ? data.uniqueSellingPoints : [],
      valuePropositions: Array.isArray(data.valuePropositions) ? data.valuePropositions : [],
      pricingOverview: data.pricingOverview || '',
      winsAgainstUser: Array.isArray(data.winsAgainstUser) ? data.winsAgainstUser : [],
      lossesAgainstUser: Array.isArray(data.lossesAgainstUser) ? data.lossesAgainstUser : [],
      actionableSuggestions: Array.isArray(data.actionableSuggestions) ? data.actionableSuggestions : []
    };
  } catch (error) {
    console.error(`Error parsing competitor data for ${competitorName}:`, error);
    
    // Return fallback structure
    return {
      name: competitorName,
      domain: '',
      topKeywords: [],
      h1: '',
      h2s: [],
      description: '',
      hooks: [],
      uniqueSellingPoints: [],
      valuePropositions: [],
      pricingOverview: '',
      winsAgainstUser: [],
      lossesAgainstUser: [],
      actionableSuggestions: []
    };
  }
};

/**
 * Perform comprehensive competitor analysis
 */
export const analyzeCompetitors = async (input: UserInput): Promise<CompetitorAnalysisResult> => {
  const userDomain = extractDomain(input.companyWebsite);
  
  // Identify competitors
  const competitorNames = await identifyCompetitors(
    userDomain,
    input.industry || 'B2B SaaS',
    input.competitors
  );
  
  if (competitorNames.length === 0) {
    throw new Error('Could not identify competitors. Please provide competitor names in the ICP setup form.');
  }
  
  // Fetch data for each competitor (limit to 5)
  const competitorsData: CompetitorData[] = [];
  
  for (const competitorName of competitorNames.slice(0, 5)) {
    try {
      const data = await fetchCompetitorData(
        competitorName,
        input.industry || 'B2B SaaS',
        userDomain,
        input.solutions
      );
      competitorsData.push(data);
      
      // Add small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching data for ${competitorName}:`, error);
      // Continue with other competitors even if one fails
    }
  }
  
  return {
    userDomain: userDomain || '',
    competitors: competitorsData
  };
};

