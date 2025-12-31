/**
 * Gemini AI Service
 * 
 * Handles all interactions with Google Gemini AI API for:
 * - Board member generation
 * - Analysis report streaming
 * - ICP profile generation
 * - Persona breakdown generation
 * 
 * All functions integrate with Perplexity AI for enhanced research when available.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, BoardMember, ICPProfile, PersonaBreakdown } from "../types";
import { performDeepResearch, generateResearchQueries } from "./perplexityService";
import { verifyResearchWithClaude, combineVerificationResults } from "./claudeService";
import { reportError } from "./errorReportingService";
import rateLimiter from "./rateLimiter";
import { CompetitorAnalysisResult } from "./competitorAnalysisService";
import { generateCacheKey, getCached, setCached } from "./cacheService";

/**
 * List of Gemini models to try in order (fallback chain)
 * Start with fastest/cheapest, fallback to more capable models
 * Only includes models that are available in the current API version
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp'
  // Note: gemini-1.5-flash and gemini-1.5-pro are not available in v1beta API, removed from chain
];

/**
 * Check if an error is a token/quota/rate limit error OR model not found error that should trigger model fallback
 * 
 * IMPORTANT: This function must be very specific to avoid false positives.
 * Only actual quota/rate limit errors should trigger fallback, not authentication or other errors.
 */
const isModelLimitError = (error: any): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = JSON.stringify(error);
  
  // Check for model not found (404) - should try next model
  const isModelNotFound = 
    errorMessage.includes('404') ||
    errorMessage.includes('NOT_FOUND') ||
    errorMessage.includes('is not found') ||
    errorMessage.includes('not supported') ||
    errorString.includes('"code":404') ||
    errorString.includes('NOT_FOUND') ||
    errorString.includes('is not found');
  
  // Check for ACTUAL quota/rate limit errors ONLY (not authentication token errors)
  // Must be very specific to avoid false positives
  const isLimitError = 
    // HTTP 429 status code (rate limit)
    errorMessage.includes('429') ||
    errorString.includes('429') ||
    errorString.includes('"status":429') ||
    errorString.includes('"code":429') ||
    // Specific quota error messages
    (errorMessage.includes('quota') && (errorMessage.includes('exceeded') || errorMessage.includes('limit') || errorMessage.includes('reached'))) ||
    (errorString.includes('quota') && (errorString.includes('exceeded') || errorString.includes('limit') || errorString.includes('reached'))) ||
    // RESOURCE_EXHAUSTED error code
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorString.includes('RESOURCE_EXHAUSTED') ||
    // Rate limit specific messages
    (errorMessage.includes('rate limit') && errorMessage.includes('exceeded')) ||
    (errorString.includes('rate limit') && errorString.includes('exceeded')) ||
    // Token limit errors (but NOT authentication token errors)
    (errorMessage.includes('token limit') && (errorMessage.includes('exceeded') || errorMessage.includes('too many'))) ||
    (errorString.includes('token limit') && (errorString.includes('exceeded') || errorString.includes('too many'))) ||
    errorMessage.includes('TokenLimitExceeded') ||
    errorString.includes('TokenLimitExceeded') ||
    // QuotaFailure error code
    errorString.includes('QuotaFailure') ||
    errorMessage.includes('QuotaFailure');
  
  return isModelNotFound || isLimitError;
};

/**
 * Report model fallback error via email (non-blocking)
 */
const reportModelFallback = async (originalModel: string, fallbackModel: string, error: Error, context: string): Promise<void> => {
  try {
    const fallbackError = new Error(
      `Model fallback triggered: ${originalModel} → ${fallbackModel}. Original error: ${error.message}. Context: ${context}`
    );
    fallbackError.name = 'ModelFallbackError';
    
    await reportError(fallbackError, {
      appState: 'ModelFallback',
      timestamp: new Date().toISOString(),
      sessionId: 'model-fallback'
    }).catch(() => {
      // Don't let email failures break the app
      console.warn('Failed to report model fallback via email');
    });
  } catch (e) {
    // Silently fail - don't break the app
    console.warn('Error reporting model fallback:', e);
  }
};

/**
 * Generic wrapper for model calls with automatic fallback
 * Tries models in order until one succeeds or all fail
 */
const callWithModelFallback = async <T>(
  _ai: GoogleGenAI,
  callFn: (model: string) => Promise<T>,
  context: string
): Promise<T> => {
  // Wait if necessary to stay under rate limit (5 req/min for free tier)
  await rateLimiter.waitIfNeeded();
  
  let lastError: Error | null = null;
  const firstModel = MODEL_FALLBACK_CHAIN[0];
  if (!firstModel) {
    throw new Error('No models available in fallback chain');
  }
  
  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const result = await callFn(model);
      
      // Success! If we used a fallback model, report it
      if (model !== firstModel && lastError) {
        await reportModelFallback(
          firstModel,
          model,
          lastError,
          context
        );
        if (import.meta.env.DEV) {
          console.log(`✅ Fallback successful: ${firstModel} → ${model} for ${context}`);
        }
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log detailed error information for debugging
      if (import.meta.env.DEV) {
        const errorObj = error as any;
        const errorStatus = errorObj?.status || errorObj?.statusCode || errorObj?.response?.status || errorObj?.response?.statusCode;
        const errorCode = errorObj?.code || errorObj?.response?.data?.error?.code || errorObj?.response?.data?.code;
        console.error(`❌ API Error for model ${model} in ${context}:`, {
          message: lastError.message,
          name: lastError.name,
          status: errorStatus,
          code: errorCode,
          fullError: JSON.stringify(error).substring(0, 1000)
        });
      }
      
      // If it's a model limit error and not the last model, try next
      if (isModelLimitError(error) && model !== MODEL_FALLBACK_CHAIN[MODEL_FALLBACK_CHAIN.length - 1]) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Model ${model} hit limit in ${context}, trying fallback...`);
        }
        continue; // Try next model
      }
      
      // If it's the last model or not a limit error, we'll throw it
      if (model === MODEL_FALLBACK_CHAIN[MODEL_FALLBACK_CHAIN.length - 1]) {
        // All models failed - report the error
        const finalError = new Error(
          `All models failed for ${context}. Last error: ${lastError.message}`
        );
        finalError.name = 'AllModelsFailedError';
        
        // Report via email (non-blocking)
        reportError(finalError, {
          appState: 'ModelFallback',
          timestamp: new Date().toISOString(),
          sessionId: 'model-fallback'
        }).catch(() => {
          console.warn('Failed to report all models failure via email');
        });
        
        throw lastError;
      }
    }
  }
  
  // Should never reach here, but just in case
  throw lastError || new Error(`All models failed for ${context}`);
};

/**
 * Get Gemini AI client instance
 * @returns Configured GoogleGenAI client
 */
const getClient = (): GoogleGenAI => {
  // Check both API_KEY and GEMINI_API_KEY for compatibility
  // vite.config.ts injects process.env.API_KEY and process.env.GEMINI_API_KEY from .env file
  // Check process.env first (injected by Vite), then import.meta.env as fallback
  const apiKey1 = process.env['API_KEY'] || import.meta.env['VITE_API_KEY'] || import.meta.env['API_KEY'];
  const apiKey2 = process.env['GEMINI_API_KEY'] || import.meta.env['VITE_GEMINI_API_KEY'] || import.meta.env['GEMINI_API_KEY'];
  
  // Check if either key exists and is not empty/undefined/placeholder
  const apiKey = (apiKey1 && apiKey1 !== 'undefined' && apiKey1 !== '' && apiKey1 !== 'your_gemini_api_key_here')
    ? apiKey1 
    : (apiKey2 && apiKey2 !== 'undefined' && apiKey2 !== '' && apiKey2 !== 'your_gemini_api_key_here')
    ? apiKey2
    : null;
    
  if (!apiKey) {
    // Provide helpful debugging info
    const hasApiKey1 = !!apiKey1 && apiKey1 !== 'undefined' && apiKey1 !== '';
    const hasApiKey2 = !!apiKey2 && apiKey2 !== 'undefined' && apiKey2 !== '';
    const isPlaceholder = apiKey1 === 'your_gemini_api_key_here' || apiKey2 === 'your_gemini_api_key_here';
    
    console.error('❌ GEMINI_API_KEY Error:', {
      'process.env.API_KEY exists': !!process.env['API_KEY'],
      'process.env.GEMINI_API_KEY exists': !!process.env['GEMINI_API_KEY'],
      'VITE_API_KEY exists': !!import.meta.env['VITE_API_KEY'],
      'VITE_GEMINI_API_KEY exists': !!import.meta.env['VITE_GEMINI_API_KEY'],
      'API_KEY exists': hasApiKey1,
      'GEMINI_API_KEY exists': hasApiKey2,
      'Is placeholder': isPlaceholder,
      'API_KEY value': apiKey1 ? `${String(apiKey1).substring(0, 10)}...` : 'not set',
      'GEMINI_API_KEY value': apiKey2 ? `${String(apiKey2).substring(0, 10)}...` : 'not set'
    });
    
    if (isPlaceholder) {
      throw new Error('GEMINI_API_KEY is set to placeholder value. Please replace "your_gemini_api_key_here" with your actual Gemini API key in the .env file and restart the dev server.');
    } else {
      throw new Error('GEMINI_API_KEY is not configured. Please set VITE_GEMINI_API_KEY in your .env file and restart the dev server.');
    }
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Generate 20 diverse board members based on user's ICP and industry context
 * 
 * Creates a Customer Advisory Board of 20 distinct, fictional professionals
 * that match the user's Ideal Customer Profile (ICP) criteria.
 * 
 * @param input - User input containing ICP definition, industry, company size/revenue, competitors, etc.
 * @returns Promise resolving to array of 20 BoardMember objects
 * @throws Error if API call fails or response is invalid
 */
export const generateBoardMembers = async (input: UserInput): Promise<BoardMember[]> => {
  // Check cache first
  const cacheKey = generateCacheKey(
    'boardMembers',
    input.industry,
    input.icpTitles || input.icpDefinition,
    input.companySize?.join(','),
    input.companyRevenue?.join(','),
    input.competitors,
    input.seoKeywords
  );

  const cached = await getCached<BoardMember[]>(cacheKey, 'boardMembers');
  if (cached) {
    if (import.meta.env.DEV) {
      console.log('✅ Using cached board members');
    }
    return cached;
  }

  let ai: GoogleGenAI;
  try {
    ai = getClient();
    if (import.meta.env.DEV) {
      console.log('✅ Gemini client initialized successfully');
    }
  } catch (error) {
    // Re-throw with more context
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to get Gemini client:', errorMessage);
    console.error('Environment check:', {
      'process.env.API_KEY': process.env['API_KEY'] ? 'exists' : 'missing',
      'process.env.GEMINI_API_KEY': process.env['GEMINI_API_KEY'] ? 'exists' : 'missing',
      'API_KEY type': typeof process.env['API_KEY'],
      'GEMINI_API_KEY type': typeof process.env['GEMINI_API_KEY']
    });
    throw new Error(`API Configuration Error: ${errorMessage}`);
  }
  
  // Build comprehensive ICP context
  const icpContext = input.icpTitles 
    ? `ICP Titles: ${input.icpTitles}`
    : input.icpDefinition 
    ? `ICP Definition: ${input.icpDefinition}`
    : '';

  const prompt = `
    You are an expert UX Researcher and Organizational Psychologist.
    Your task is to assemble a "Customer Advisory Board" (CAB) of 20 distinct, fictional professionals.
    
    Context provided by user:
    - Target Industry: ${input.industry}
    ${icpContext ? `- ${icpContext}` : ''}
    ${input.companySize && input.companySize.length > 0 ? `- Ideal Company Size: ${input.companySize.join(', ')}` : ''}
    ${input.companyRevenue && input.companyRevenue.length > 0 ? `- Ideal Company Revenue: ${input.companyRevenue.join(', ')}` : ''}
    ${input.competitors ? `- Top Competitors: ${input.competitors}` : ''}
    ${input.seoKeywords ? `- SEO Keywords: ${input.seoKeywords}` : ''}
    ${input.circumstances ? `- Special Circumstances: ${input.circumstances}` : ''}

    Create 20 highly realistic, varied, and experienced profiles that perfectly match this ICP or influence it.
    
    CRITICAL: Use the provided ICP titles, industry context, company size/revenue ranges, competitor landscape, and SEO keywords to inform the diversity and expertise of board members.
    - Job Titles should align with the provided ICP titles: ${input.icpTitles || 'various roles'}
    - Industry expertise should reflect: ${input.industry}
    ${input.companySize && input.companySize.length > 0 ? `- Company sizes should primarily fall within these ranges: ${input.companySize.join(', ')}` : ''}
    ${input.companyRevenue && input.companyRevenue.length > 0 ? `- Company revenues should primarily fall within these ranges: ${input.companyRevenue.join(', ')}` : ''}
    ${input.competitors ? `- Some members should have experience with or knowledge of competitors: ${input.competitors}` : ''}
    ${input.seoKeywords ? `- Consider expertise areas related to these keywords: ${input.seoKeywords}` : ''}
    
    Ensure diversity in:
    - Job Titles (distributed across the provided ICP titles)
    - Company Sizes (should align with provided ranges: ${input.companySize && input.companySize.length > 0 ? input.companySize.join(', ') : 'various sizes'})
    - Company Revenues (should align with provided ranges: ${input.companyRevenue && input.companyRevenue.length > 0 ? input.companyRevenue.join(', ') : 'various revenues'})
    - Technical vs Operational backgrounds
    - "Guru" status traits (e.g., The Skeptic, The Visionary, The Data-Purist, The Budget-Hawk)
    - Gender and demographics (represented by name and archetype)

    Return a JSON array of 20 objects.
  `;

  // We use an inferred schema type here to avoid build issues with strict Type imports in some environments
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        role: { type: Type.STRING },
        companyType: { type: Type.STRING },
        expertise: { type: Type.STRING },
        personalityArchetype: { type: Type.STRING, description: "e.g. The Skeptic, The Early Adopter" },
        avatarStyle: { type: Type.STRING, description: "One of: 'male', 'female', 'abstract'" }
      },
      required: ["id", "name", "role", "companyType", "expertise", "personalityArchetype"],
    },
  };

  try {
    return await callWithModelFallback(
      ai,
      async (model) => {
        if (import.meta.env.DEV) {
          console.log(`🔍 Attempting API call with model: ${model}`);
        }
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7,
          }
        });

        if (response.text) {
          return JSON.parse(response.text) as BoardMember[];
        }
        throw new Error("No text returned from API");
      },
      'generateBoardMembers'
    );
  } catch (error) {
    console.error("Error generating board:", error);
    
    // Log full error details for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = JSON.stringify(error);
    
    // Extract error details from the error object
    let errorStatus: number | undefined;
    let errorCode: string | undefined;
    let errorDetails: any = undefined;
    
    try {
      // Try to extract structured error information
      const errorObj = error as any;
      errorStatus = errorObj?.status || errorObj?.statusCode || errorObj?.response?.status || errorObj?.response?.statusCode;
      errorCode = errorObj?.code || errorObj?.response?.data?.error?.code || errorObj?.response?.data?.code;
      errorDetails = errorObj?.response?.data || errorObj?.details || errorObj?.error;
    } catch (e) {
      // Ignore parsing errors
    }
    
    if (import.meta.env.DEV) {
      console.error("🔍 Full error details:", {
        name: error instanceof Error ? error.name : 'unknown',
        message: errorMessage,
        status: errorStatus,
        code: errorCode,
        details: errorDetails,
        stringified: errorString.substring(0, 2000) // First 2000 chars for better debugging
      });
    }
    
    // Check for quota/rate limit errors ONLY (must be very specific to avoid false positives)
    // Only trigger on actual quota/rate limit errors, not authentication or other errors
    
    // First, check if this is an authentication/configuration error (NOT a quota error)
    const isAuthError = 
      errorMessage.includes('API_KEY') ||
      errorMessage.includes('API Configuration Error') ||
      errorMessage.includes('not configured') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized') ||
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorCode === 'UNAUTHENTICATED' ||
      errorCode === 'PERMISSION_DENIED';
    
    if (isAuthError) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Authentication/configuration error detected, NOT treating as quota error');
      }
      // Re-throw as-is - don't treat as quota error
      throw error;
    }
    
    // Check status code first (most reliable indicator of quota errors)
    // ONLY treat as quota error if we have EXACT status code or error code matches
    // Do NOT check generic strings to avoid false positives
    const has429Status = errorStatus === 429;
    
    // Check for RESOURCE_EXHAUSTED error code (most specific)
    const hasResourceExhausted = errorCode === 'RESOURCE_EXHAUSTED';
    
    // Check for QuotaFailure error code
    const hasQuotaFailure = errorCode === 'QuotaFailure';
    
    // Check for 429 in structured error response (JSON format only, not generic string)
    // IMPORTANT: Exclude our own error messages to prevent circular detection
    const has429InStructuredResponse = 
      (!errorString.includes('API Quota Exceeded: You\'ve reached')) && (
        errorString.includes('"status":429') || 
        errorString.includes('"code":429') ||
        (errorDetails && (errorDetails.status === 429 || errorDetails.code === 429))
      );
    
    // ONLY treat as quota error if we have definitive proof (status code or error code)
    // Do NOT check generic "quota" strings - they cause false positives
    // NEVER treat as quota error if error message contains our own error text (prevents circular detection)
    const isOurOwnError = errorMessage.includes('API Quota Exceeded: You\'ve reached the free tier limit');
    const isQuotaError = !isOurOwnError && (has429Status || has429InStructuredResponse || hasResourceExhausted || hasQuotaFailure);
    
    if (import.meta.env.DEV) {
      console.log('🔍 Quota error detection result:', {
        has429Status,
        has429InStructuredResponse,
        hasResourceExhausted,
        hasQuotaFailure,
        isQuotaError,
        isOurOwnError,
        errorStatus,
        errorCode,
        errorMessage: errorMessage.substring(0, 200)
      });
    }
    
    if (isQuotaError) {
      if (import.meta.env.DEV) {
        console.log('✅ Confirmed quota/rate limit error - showing message', {
          has429Status,
          has429InStructuredResponse,
          hasResourceExhausted,
          hasQuotaFailure,
          errorStatus,
          errorCode,
          fullError: errorString.substring(0, 500)
        });
      }
      
      // Extract retry delay if available
      let retryDelay = 'a few minutes';
      let isRateLimit = false; // Distinguish rate limit (temporary) from quota (daily limit)
      
      try {
        const errorObj = typeof error === 'object' ? error : JSON.parse(errorString);
        
        // Check for retry-after header or retryDelay (indicates rate limit, not quota)
        if (errorObj?.retryDelay || errorObj?.details?.[0]?.retryDelay) {
          const delay = errorObj.retryDelay || errorObj.details[0].retryDelay;
          retryDelay = `${Math.ceil(parseInt(String(delay)) / 1000)} seconds`;
          isRateLimit = true; // Has retry delay = rate limit, not quota
        }
        
        // Check for retry-after in response headers
        if (errorObj?.response?.headers?.['retry-after'] || errorObj?.headers?.['retry-after']) {
          const retryAfter = errorObj.response?.headers?.['retry-after'] || errorObj.headers?.['retry-after'];
          retryDelay = `${retryAfter} seconds`;
          isRateLimit = true;
        }
        
        // Check error message for rate limit vs quota indicators
        if (errorMessage.toLowerCase().includes('rate limit') || 
            errorMessage.toLowerCase().includes('too many requests') ||
            errorCode === 'RATE_LIMIT_EXCEEDED') {
          isRateLimit = true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Create appropriate error message based on whether it's a rate limit or quota
      let errorMessageText: string;
      if (isRateLimit) {
        // Rate limit - temporary, should retry soon
        errorMessageText = `Rate Limit Exceeded: Too many requests to Gemini API. ` +
          `Please wait ${retryDelay} before trying again. ` +
          `This is a temporary limit (requests per minute/second), not your daily quota. ` +
          `Visit https://ai.google.dev/gemini-api/docs/rate-limits for more information.`;
      } else {
        // Quota limit - daily limit reached
        errorMessageText = `API Quota Exceeded: You've reached your daily request limit for Gemini API. ` +
          `The quota resets on a rolling 24-hour window (not at midnight). ` +
          `Please wait ${retryDelay} before trying again. ` +
          `If you're on a paid plan and seeing this error, check your API usage dashboard. ` +
          `Visit https://ai.google.dev/gemini-api/docs/rate-limits for more information.`;
      }
      
      const quotaError = new Error(
        errorMessageText +
        (import.meta.env.DEV ? ` Check the browser console for detailed error information.` : '')
      );
      quotaError.name = 'QuotaExceededError';
      throw quotaError;
    }
    
    // Log non-quota errors for debugging
    if (import.meta.env.DEV) {
      console.log('⚠️ Non-quota error detected, re-throwing original error', {
        errorStatus,
        errorCode,
        errorMessage: errorMessage.substring(0, 200)
      });
    }
    
    // Re-throw original error if not a quota error
    throw error;
  }
};

/**
 * Regenerate a single board member to replace an existing one
 * 
 * Creates a new unique board member that brings a different perspective
 * than the existing members, while still matching the ICP criteria.
 * 
 * @param input - User input containing ICP definition and context
 * @param existingMembers - Current board members (excluding the one being replaced)
 * @param memberToRemoveId - ID of the member to replace
 * @returns Promise resolving to a new BoardMember object
 * @throws Error if API call fails or response is invalid
 */
export const regenerateBoardMember = async (
  input: UserInput, 
  existingMembers: BoardMember[], 
  memberToRemoveId: string
): Promise<BoardMember> => {
  const ai = getClient();
  
  const existingNames = existingMembers.filter(m => m.id !== memberToRemoveId).map(m => m.name).join(", ");

  const icpContext = input.icpTitles 
    ? `ICP Titles: ${input.icpTitles}`
    : input.icpDefinition 
    ? `ICP Definition: ${input.icpDefinition}`
    : '';

  const prompt = `
    You are refining a Customer Advisory Board.
    Context:
    - Industry: ${input.industry}
    ${icpContext ? `- ${icpContext}` : ''}
    ${input.companySize && input.companySize.length > 0 ? `- Ideal Company Size: ${input.companySize.join(', ')}` : ''}
    ${input.companyRevenue && input.companyRevenue.length > 0 ? `- Ideal Company Revenue: ${input.companyRevenue.join(', ')}` : ''}
    ${input.competitors ? `- Top Competitors: ${input.competitors}` : ''}
    ${input.seoKeywords ? `- SEO Keywords: ${input.seoKeywords}` : ''}

    We are removing a member. Create a NEW, unique replacement member who brings a DIFFERENT perspective than the current group.
    Existing members (do not copy): ${existingNames}.
    
    The new member should align with the ICP titles, industry context, and company size/revenue ranges provided.
    
    Return a single JSON object for the new member.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      name: { type: Type.STRING },
      role: { type: Type.STRING },
      companyType: { type: Type.STRING },
      expertise: { type: Type.STRING },
      personalityArchetype: { type: Type.STRING },
      avatarStyle: { type: Type.STRING }
    },
    required: ["id", "name", "role", "companyType", "expertise", "personalityArchetype"],
  };

  try {
    return await callWithModelFallback(
      ai,
      async (model) => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          }
        });

        if (response.text) {
          return JSON.parse(response.text) as BoardMember;
        }
        throw new Error("No text returned from API");
      },
      'regenerateBoardMember'
    );
  } catch (error) {
    throw new Error(`Failed to regenerate member: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate comprehensive ICP Profile Report using deep research
 * 
 * Creates a detailed Ideal Customer Profile (ICP) analysis including:
 * - Use case fit scenarios
 * - Signals and attributes that indicate potential customers
 * - Title groupings by department
 * 
 * Integrates Perplexity AI research for enhanced market insights when available.
 * 
 * @param input - User input containing industry, ICP titles, company size/revenue, competitors, etc.
 * @returns Promise resolving to ICPProfile object
 * @throws Error if API call fails or response is invalid
 */
export const generateICPProfile = async (input: UserInput): Promise<ICPProfile> => {
  // Check cache first
  const cacheKey = generateCacheKey(
    'icpProfile',
    input.industry,
    input.icpTitles || input.icpDefinition,
    input.companyWebsite,
    input.solutions,
    input.coreProblems,
    input.competitors,
    input.seoKeywords,
    input.companySize?.join(','),
    input.companyRevenue?.join(',')
  );

  const cached = await getCached<ICPProfile>(cacheKey, 'icpProfile');
  if (cached) {
    if (import.meta.env.DEV) {
      console.log('✅ Using cached ICP profile');
    }
    return cached;
  }

  const ai = getClient();
  
  // Perform Perplexity research (with feedback type for specialized research)
  const researchQueries = generateResearchQueries({
    companyWebsite: input.companyWebsite,
    industry: input.industry,
    icpTitles: input.icpTitles,
    solutions: input.solutions,
    coreProblems: input.coreProblems,
    competitors: input.competitors,
    seoKeywords: input.seoKeywords,
    companySize: input.companySize,
    companyRevenue: input.companyRevenue,
    feedbackType: input.feedbackType,
    feedbackItem: input.feedbackItem
  });
  
  const perplexityResearch = await performDeepResearch(researchQueries);
  
  const prompt = `
    You are an expert market researcher and ICP analyst.
    
    Create a comprehensive ICP Profile based on:
    ${input.companyWebsite ? `- Company Website: ${input.companyWebsite} (Deep research conducted on offerings and market position)` : ''}
    - Industry: ${input.industry}
    - ICP Titles: ${input.icpTitles || 'Various'}
    ${input.solutions ? `- Solutions: ${input.solutions}` : ''}
    ${input.coreProblems ? `- Core Problems Solved: ${input.coreProblems}` : ''}
    - Company Size: ${input.companySize?.join(', ') || 'Various'}
    - Company Revenue: ${input.companyRevenue?.join(', ') || 'Various'}
    - Competitors: ${input.competitors || 'Not specified'}
    - SEO Keywords: ${input.seoKeywords || 'Not specified'}
    
    ${perplexityResearch ? `\n=== DEEP RESEARCH DATA FROM PERPLEXITY AI ===\n${perplexityResearch}\n=== END PERPLEXITY RESEARCH ===\n\nCRITICAL: Heavily leverage this Perplexity research throughout your ICP profile. This research contains current market trends, verified industry data, competitive intelligence, and role-specific insights. Integrate specific facts and statistics from this research.\n` : ''}
    
    Generate a comprehensive ICP Profile matching this EXACT structure (return as JSON):
    {
      "useCaseFit": [
        "Specific type of company/use case 1",
        "Specific type of company/use case 2",
        "etc."
      ],
      "signalsAndAttributes": [
        {
          "category": "Signal/Attribute Category Name",
          "description": "Detailed description of the signal or attribute",
          "triggerQuestion": "Optional trigger question in quotes if applicable"
        }
      ],
      "titles": [
        {
          "department": "Department Name (e.g., Human Resources, Procurement, Compliance, Security)",
          "roles": ["Title 1", "Title 2", "Title 3"]
        }
      ],
      "psychographics": [
        "Psychological characteristic 1",
        "Psychological characteristic 2",
        "etc."
      ],
      "buyingTriggers": [
        "What motivates them to buy 1",
        "What motivates them to buy 2",
        "etc."
      ],
      "languagePatterns": [
        "How they communicate 1",
        "Terminology they use 1",
        "etc."
      ],
      "narrativeFrames": [
        "Story/framework they use 1",
        "Story/framework they use 2",
        "etc."
      ],
      "objections": [
        "Common concern/pushback 1",
        "Common concern/pushback 2",
        "etc."
      ],
      "copyAngles": [
        "Messaging approach that resonates 1",
        "Messaging approach that resonates 2",
        "etc."
      ],
      "leadBehavioralPatterns": [
        "How they behave as leads 1",
        "How they behave as leads 2",
        "etc."
      ]
    }
    
    CRITICAL REQUIREMENTS - ALL SECTIONS MUST BE INCLUDED:
    - useCaseFit: REQUIRED - List 5-8 specific types of companies/organizations that would be a good fit (e.g., "Global financial institutions with fingerprinting options", "National banks with local branches")
    - signalsAndAttributes: REQUIRED - Create 6-10 signals/attributes that indicate potential interest or need. Each should have a category name, description, and optionally a trigger question in quotes
    - titles: REQUIRED - Group titles by department. Use the ICP titles provided (${input.icpTitles || 'various roles'}) and organize them into logical departments
    - psychographics: REQUIRED - List 5-8 psychological characteristics, values, attitudes, and interests of your ICP (e.g., "Values data-driven decision making", "Risk-averse when it comes to new technology")
    - buyingTriggers: REQUIRED - List 5-8 specific triggers that motivate your ICP to make a purchase (e.g., "Regulatory compliance deadlines", "Scaling challenges")
    - languagePatterns: REQUIRED - List 5-8 language patterns, terminology, and communication styles your ICP uses (e.g., "Uses technical jargon", "Prefers ROI-focused language")
    - narrativeFrames: REQUIRED - List 5-8 stories, frameworks, or mental models your ICP uses to understand the world (e.g., "Views technology as competitive advantage", "Sees security as foundational")
    - objections: REQUIRED - List 5-8 common concerns, hesitations, or pushbacks your ICP typically has (e.g., "Budget constraints", "Integration complexity")
    - copyAngles: REQUIRED - List 5-8 messaging approaches or angles that resonate with your ICP (e.g., "Focus on efficiency gains", "Emphasize risk reduction")
    - leadBehavioralPatterns: REQUIRED - List 5-8 specific behavioral patterns your ICP exhibits as leads (e.g., "Researches extensively before engaging", "Prefers demos over sales calls")
    
    IMPORTANT: You MUST include ALL of these sections in your response. Do not omit any section. Each section should have 5-8 items (or 6-10 for signalsAndAttributes). Use the Perplexity research data to inform all sections with verified, current market insights.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      useCaseFit: { type: Type.ARRAY, items: { type: Type.STRING } },
      signalsAndAttributes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            triggerQuestion: { type: Type.STRING }
          },
          required: ["category", "description"]
        }
      },
      titles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            department: { type: Type.STRING },
            roles: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["department", "roles"]
        }
      },
      psychographics: { type: Type.ARRAY, items: { type: Type.STRING } },
      buyingTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
      languagePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
      narrativeFrames: { type: Type.ARRAY, items: { type: Type.STRING } },
      objections: { type: Type.ARRAY, items: { type: Type.STRING } },
      copyAngles: { type: Type.ARRAY, items: { type: Type.STRING } },
      leadBehavioralPatterns: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["useCaseFit", "signalsAndAttributes", "titles"],
    // Ensure all optional fields are always generated
    // The model should always include these fields even if marked optional
    additionalProperties: false
  };

  try {
    return await callWithModelFallback(
      ai,
      async (model) => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7,
          }
        });

        if (response.text) {
          const profile = JSON.parse(response.text) as ICPProfile;
          // Cache the result
          await setCached(cacheKey, profile, 'icpProfile').catch(() => {
            // Fail silently - caching is not critical
          });
          return profile;
        }
        throw new Error("No text returned from API");
      },
      'generateICPProfile'
    );
  } catch (error) {
    console.error("Error generating ICP profile:", error);
    throw error;
  }
};

/**
 * Generate detailed Persona Breakdown Reports for each board member
 * 
 * Creates comprehensive persona profiles for each board member including:
 * - Demographics (age, titles, communication preferences)
 * - Attributes and characteristics
 * - Jobs to be done
 * - Decision-making process (research, evaluation, purchase)
 * - Challenges and pain points
 * 
 * Processes members in batches of 5 for optimal performance.
 * Performs Perplexity research once and reuses for all personas.
 * 
 * @param input - User input containing industry and ICP context
 * @param members - Array of board members to generate personas for
 * @returns Promise resolving to array of PersonaBreakdown objects
 */
export const generatePersonaBreakdowns = async (
  input: UserInput,
  members: BoardMember[]
): Promise<PersonaBreakdown[]> => {
  // Check cache first - use first member's role as part of cache key
  const cacheKey = generateCacheKey(
    'personaBreakdowns',
    input.industry,
    input.icpTitles || input.icpDefinition,
    members.length.toString(),
    members[0]?.role || '',
    input.companySize?.join(','),
    input.companyRevenue?.join(',')
  );

  const cached = await getCached<PersonaBreakdown[]>(cacheKey, 'personaBreakdowns');
  if (cached && cached.length > 0) {
    if (import.meta.env.DEV) {
      console.log('✅ Using cached persona breakdowns');
    }
    return cached;
  }

  const ai = getClient();
  
  // Perform Perplexity research once (not for each persona to avoid excessive API calls)
  const researchQueries = generateResearchQueries({
    companyWebsite: input.companyWebsite,
    industry: input.industry,
    icpTitles: input.icpTitles,
    competitors: input.competitors,
    seoKeywords: input.seoKeywords,
    companySize: input.companySize,
    companyRevenue: input.companyRevenue
  });
  
  const perplexityResearch = await performDeepResearch(researchQueries);
  
  const personaBreakdowns: PersonaBreakdown[] = [];
  
  // Process members in parallel batches for optimal performance
  const BATCH_SIZE = 5; // Process 5 personas at a time to balance speed and API limits
  
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);
    
    // Generate personas for this batch in parallel
    const batchPromises = batch.map(async (member) => {
    const prompt = `
      Create a detailed persona breakdown for:
      - Name: ${member.name}
      - Role: ${member.role}
      - Company Type: ${member.companyType}
      - Expertise: ${member.expertise}
      - Personality: ${member.personalityArchetype}
      
      Industry Context: ${input.industry}
      ${perplexityResearch ? `\n=== DEEP RESEARCH DATA FROM PERPLEXITY AI ===\n${perplexityResearch}\n=== END PERPLEXITY RESEARCH ===\n\nCRITICAL: Use this Perplexity research to create highly accurate, current persona profiles. The research contains verified data about role responsibilities, industry challenges, decision-making processes, and market trends. Integrate specific insights from this research into the persona breakdown.\n` : ''}
      
      Generate a comprehensive persona breakdown matching this EXACT structure (return as JSON):
      {
        "personaName": "Creative nickname based on personality (e.g., 'Price-Conscious Paula', 'Data-Driven David')",
        "personaTitle": "PROFESSIONAL TITLE IN ALL CAPS (e.g., 'PROCUREMENT PROFESSIONAL', 'HR DIRECTOR')",
        "buyerType": "Buyer type (e.g., 'Influencer Buyer', 'Decision Maker', 'End User', 'Champion')",
        "ageRange": "Age range (e.g., '25 - 55', '30 - 60')",
        "preferredCommunicationChannels": ["Email", "Phone", "RFP Portal", etc.],
        "titles": ["Exact title 1", "Exact title 2", "Variations of the role"],
        "otherRelevantInfo": [
          "Key contextual information about their role",
          "How they interact with vendors",
          "Their position in the buying process"
        ],
        "attributes": [
          "Reduced time to fill",
          "Tech Focused",
          "SLA Sensitivity",
          "Budget-Minded",
          "Billing Accuracy",
          "Other relevant attributes"
        ],
        "jobsToBeDone": [
          "When [situation], I want [action] so I can [outcome]",
          "When [situation], I want [action] so I can [outcome]"
        ],
        "decisionMakingProcess": {
          "research": {
            "description": "Who or what informs me? Where do I get my information? Where do I have community?",
            "sources": ["Source 1", "Source 2", "Source 3"]
          },
          "evaluation": {
            "description": "What is important to me? What specific features or factors are most important?",
            "factors": ["Factor 1", "Factor 2", "Factor 3"]
          },
          "purchase": {
            "description": "What convinces me? What makes me hesitate? Where do I buy?",
            "hesitations": ["Hesitation 1", "Hesitation 2"],
            "purchaseFactors": ["Factor that convinces 1", "Factor that convinces 2"]
          }
        },
        "challenges": [
          "Challenge 1",
          "Challenge 2",
          "Challenge 3"
        ]
      }
      
      IMPORTANT:
      - personaName: Create a memorable nickname that reflects their personality archetype
      - personaTitle: Use the role in ALL CAPS
      - buyerType: Identify their role in the buying process
      - jobsToBeDone: Use the format "When X, I want Y so I can Z"
      - decisionMakingProcess: Structure exactly as shown with research, evaluation, and purchase sections
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        personaName: { type: Type.STRING },
        personaTitle: { type: Type.STRING },
        buyerType: { type: Type.STRING },
        ageRange: { type: Type.STRING },
        preferredCommunicationChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
        titles: { type: Type.ARRAY, items: { type: Type.STRING } },
        otherRelevantInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
        attributes: { type: Type.ARRAY, items: { type: Type.STRING } },
        jobsToBeDone: { type: Type.ARRAY, items: { type: Type.STRING } },
        decisionMakingProcess: {
          type: Type.OBJECT,
          properties: {
            research: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                sources: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["description", "sources"]
            },
            evaluation: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                factors: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["description", "factors"]
            },
            purchase: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                hesitations: { type: Type.ARRAY, items: { type: Type.STRING } },
                purchaseFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["description", "hesitations", "purchaseFactors"]
            }
          },
          required: ["research", "evaluation", "purchase"]
        },
        challenges: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["personaName", "personaTitle", "buyerType", "ageRange", "preferredCommunicationChannels", "titles", "otherRelevantInfo", "attributes", "jobsToBeDone", "decisionMakingProcess", "challenges"]
    };

      try {
        return await callWithModelFallback(
          ai,
          async (model) => {
            const response = await ai.models.generateContent({
              model: model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
              }
            });

            if (response.text) {
              return JSON.parse(response.text) as PersonaBreakdown;
            }
            throw new Error("No text returned from API");
          },
          `generatePersonaBreakdown-${member.name}`
        );
      } catch (error) {
        console.error(`Error generating persona breakdown for ${member.name}:`, error);
        // Return null if generation fails (after all models tried)
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    // Filter out null results and add to personaBreakdowns
    batchResults.forEach(result => {
      if (result) {
        personaBreakdowns.push(result);
      }
    });
  }
  
  // Cache the results
  if (personaBreakdowns.length > 0) {
    await setCached(cacheKey, personaBreakdowns, 'personaBreakdowns').catch(() => {
      // Fail silently - caching is not critical
    });
  }
  
  return personaBreakdowns;
};

/**
 * Stream the comprehensive analysis report with Perplexity research integration
 * 
 * Generates a detailed "Zulu Method" analysis report by simulating a Customer
 * Advisory Board session. The report includes:
 * - Executive Dashboard (summary table)
 * - Key Research Findings & Facts
 * - Deep Dive Analysis (Messaging, Positioning, Branding)
 * - The Roast & The Gold (critical feedback)
 * - Raw Board Transcript (simulated dialogue)
 * 
 * Streams the response in real-time for better UX.
 * Integrates Perplexity AI research for enhanced market insights when available.
 * 
 * @param input - User input containing feedback item, industry, ICP context, etc.
 * @param members - Array of 20 board members participating in the analysis
 * @param onChunk - Callback function called for each text chunk as it streams
 * @throws Error if streaming fails
 */
export const streamAnalysis = async (
  input: UserInput,
  members: BoardMember[],
  onChunk: (text: string) => void,
  competitorAnalysis?: CompetitorAnalysisResult
): Promise<{ report: string; researchData: string }> => {
  const ai = getClient();
  
  // Perform Perplexity research first (with feedback type for specialized research)
  const researchQueries = generateResearchQueries({
    companyWebsite: input.companyWebsite,
    industry: input.industry,
    icpTitles: input.icpTitles,
    competitors: input.competitors,
    seoKeywords: input.seoKeywords,
    companySize: input.companySize,
    companyRevenue: input.companyRevenue,
    feedbackType: input.feedbackType,
    feedbackItem: input.feedbackItem
  });
  
  const perplexityResearch = await performDeepResearch(researchQueries);
  
  // Step 2: Use Gemini AND Claude in parallel to verify Perplexity research, check veracity, add depth/breadth, and ensure no hallucinations
  // Running verifications in parallel optimizes performance - no sequential waiting
  let verifiedResearchData = perplexityResearch;
  if (perplexityResearch && perplexityResearch.trim().length > 0) {
    try {
      if (import.meta.env.DEV) {
        console.log('🔍 Verifying Perplexity research with Gemini and Claude (parallel multi-LLM verification)...');
      }
      
      const verificationPrompt = `
You are a fact-checker and research validation expert. Your task is to:

1. VERIFY the veracity of the research data provided below
2. CHECK for any hallucinations, false information, or random/incorrect data
3. ADD DEPTH AND BREADTH by expanding on key insights with additional context
4. CORRECT any inaccuracies or remove unverifiable claims
5. ENSURE all statistics, facts, and claims are accurate and well-supported

RESEARCH DATA FROM PERPLEXITY AI:
${perplexityResearch}

CONTEXT:
- Industry: ${input.industry}
- ICP Titles: ${input.icpTitles || 'various'}
- Competitors: ${input.competitors || 'not specified'}
- Feedback Type: ${input.feedbackType || 'general'}
- Company Size: ${input.companySize && input.companySize.length > 0 ? input.companySize.join(', ') : 'various'}
- Company Revenue: ${input.companyRevenue && input.companyRevenue.length > 0 ? input.companyRevenue.join(', ') : 'various'}

TASK:
1. Review all facts, statistics, and claims in the research data
2. Verify each claim is accurate and well-supported
3. Remove or correct any hallucinations, false information, or unverifiable claims
4. Add depth by expanding on key insights with additional context and analysis
5. Add breadth by identifying related insights, trends, or perspectives that complement the research
6. Ensure all data is current, accurate, and relevant to the context provided

Return the VERIFIED, ENHANCED, and CORRECTED research data. Maintain the structure and organization of the original research, but ensure all content is accurate, verified, and enhanced with additional depth and breadth.
`;

      // Run Gemini and Claude verifications in parallel for optimal performance
      const [geminiVerification, claudeVerification] = await Promise.allSettled([
        // Gemini verification
        callWithModelFallback(
          ai,
          async (model) => {
            // Use faster model for verification (flash models are faster)
            const fastModel = model.includes('flash') ? model : 'gemini-2.0-flash-exp';
            const response = await ai.models.generateContent({
              model: fastModel,
              contents: verificationPrompt,
              config: {
                temperature: 0.1, // Low temperature for factual accuracy
                maxOutputTokens: 4000, // Limit output for speed
              }
            });
            
            if (response.text) {
              return response.text;
            }
            throw new Error("No text returned from verification API");
          },
          'verifyPerplexityResearch'
        ),
        // Claude verification
        verifyResearchWithClaude(perplexityResearch, {
          industry: input.industry,
          icpTitles: input.icpTitles,
          competitors: input.competitors,
          companyWebsite: input.companyWebsite,
          companySize: input.companySize,
          companyRevenue: input.companyRevenue,
          feedbackType: input.feedbackType,
          feedbackItem: input.feedbackItem
        })
      ]);
      
      // Extract results from settled promises
      const geminiResult = geminiVerification.status === 'fulfilled' ? geminiVerification.value : null;
      const claudeResult = claudeVerification.status === 'fulfilled' ? claudeVerification.value : null;
      
      // Combine verification results intelligently
      if (geminiResult || claudeResult) {
        verifiedResearchData = combineVerificationResults(
          perplexityResearch,
          geminiResult || '',
          claudeResult || ''
        );
        
        if (import.meta.env.DEV) {
          const verifiedBy = [];
          if (geminiResult) verifiedBy.push('Gemini');
          if (claudeResult) verifiedBy.push('Claude');
          console.log(`✅ Research verified and enhanced by ${verifiedBy.join(' and ')}`);
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Both verifications failed, using original Perplexity research');
        }
        verifiedResearchData = perplexityResearch;
      }
    } catch (verificationError) {
      console.error('⚠️ Error during multi-LLM verification, using original Perplexity research:', verificationError);
      // Continue with original research if verification fails
      verifiedResearchData = perplexityResearch;
    }
  }
  
  const boardContext = members.map(m => 
    `- ${m.name} (${m.role} at ${m.companyType}): ${m.personalityArchetype}. Expertise: ${m.expertise}`
  ).join('\n');

  const fileContext = input.files.map(f => `File: ${f.name} (${f.mimeType})\nData: ${f.data}`).join('\n\n');

  // Build comprehensive context
  const icpContext = input.icpTitles 
    ? `ICP Titles: ${input.icpTitles}`
    : input.icpDefinition 
    ? `ICP Definition: ${input.icpDefinition}`
    : '';

  // Build specialized prompt based on feedback type
  const feedbackType = (input.feedbackType || '').toLowerCase();
  const isPricing = feedbackType.includes('pricing') || feedbackType.includes('packaging');
  const isBranding = feedbackType.includes('branding') || feedbackType.includes('positioning') || feedbackType.includes('messaging');
  const isProduct = feedbackType.includes('product') && (feedbackType.includes('feature') || feedbackType.includes('idea'));
  const isBrainstorming = feedbackType.includes('brainstorming') && feedbackType.includes('session');
  const isCompetitorBreakdown = feedbackType.includes('competitor') && feedbackType.includes('breakdown');
  const isWebsiteCrawl = feedbackType.includes('website') && (feedbackType.includes('cro') || feedbackType.includes('funnel'));
  // Note: isNewIdea variable removed as it's not currently used in specialized requirements
  
  // Build specialized analysis requirements
  let specializedRequirements = '';
  let specializedSections = '';
  let executiveDashboardRows = '';
  
  if (isPricing) {
    specializedRequirements = `
    PRICING-SPECIFIC ANALYSIS REQUIREMENTS:
    - Provide CRITICAL, DEEP, and USEFUL critiques about pricing models, fencing strategies, pricing tiers, and all elements impacting pricing
    - Base analysis on industry standards, competitor pricing, company context, and ICP expectations
    - Leverage pricing expert insights from Marcos Rivera (Street Pricing), Ulrik Lehrskov-Schmidt, and Utpal Dholakia research included in Perplexity data
    - Include standard pricing metrics for ${input.industry || 'the industry'} showing how competitors and contemporaries are pricing similar offerings
    - Cover ALL important pricing models: seat-based, usage-based, hybrid, value-based, and other relevant models
    - Analyze pricing psychology and buyer behavior specific to ${input.icpTitles || 'target customers'}
    - Provide actionable recommendations for pricing optimization, tier structure, and fencing strategies
    - Compare against competitor pricing strategies (${input.competitors || 'industry standards'})
    - Consider company size (${input.companySize && input.companySize.length > 0 ? input.companySize.join(', ') : 'various'}) and revenue context (${input.companyRevenue && input.companyRevenue.length > 0 ? input.companyRevenue.join(', ') : 'various'}) when evaluating pricing appropriateness
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR PRICING ANALYSIS:
    - Pricing Model
    - Pricing Tiers  
    - Competitive Positioning
    - ICP Alignment
    - Value Communication
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Deep Dive Analysis
    ### Pricing Model Analysis
    (Critical evaluation of current pricing model: seat-based, usage-based, hybrid, or other. Compare against industry standards and best practices from pricing experts.)
    
    ### Pricing Tier Structure & Fencing
    (Deep analysis of pricing tiers, feature gating, usage limits, and differentiation strategies. What works? What doesn't? How can it be improved?)
    
    ### Industry Pricing Benchmarks
    (Standard pricing metrics for ${input.industry || 'the industry'}: average deal sizes, pricing ranges, common models used by competitors and contemporaries. Include specific data from research. Use tables or structured data to present pricing comparisons clearly.)
    
    ### Competitive Pricing Analysis
    (How does this pricing compare to ${input.competitors || 'competitors'}? What pricing strategies are competitors using? Where are the opportunities? Include comparison tables showing competitor pricing structures.)
    
    ### Pricing Psychology & Buyer Behavior
    (How will ${input.icpTitles || 'target customers'} perceive and evaluate this pricing? What influences their decision-making? What pricing signals resonate?)
    
    ### Actionable Pricing Recommendations
    (Specific, actionable recommendations for improving pricing models, tiers, fencing, and overall pricing strategy to drive conversions and revenue.)
    `;
  } else if (isBranding) {
    specializedRequirements = `
    BRANDING/MESSAGING-SPECIFIC ANALYSIS REQUIREMENTS:
    - CENTER all output on actionable input that makes messaging clearer, more understandable, and better
    - Focus on formats and examples that enable the user to use the output to drive MANY MORE CONVERSIONS
    - Provide SPECIFIC EXAMPLES of what would make their messaging/branding/positioning much better
    - Always focus on actionable input with concrete examples
    - Analyze clarity, understandability, and conversion potential of current messaging
    - CRITICAL: NEVER use assumptions about competitors - if competitors are provided, research ACTUAL competitor websites and analyze ACTUAL messaging strategies
    - CRITICAL: If competitors are NOT provided but ${input.companyWebsite || 'website'} is available, research the website to identify top competitors and analyze their ACTUAL messaging
    - CRITICAL: Find ACTUAL keywords and phrases used by competitors through real research - never assume or use generic keywords
    - Leverage SEO keyword insights (${input.seoKeywords || 'market language'}) to understand how target audience thinks and communicates
    - Provide before/after examples or specific rewrites that would improve conversion rates
    - Focus on messaging that resonates with ${input.icpTitles || 'target customers'} in ${input.industry || 'the industry'}
    - CRITICAL: Extract and list the top 10 main ICP and customer pain points through ACTUAL research, then draft the most advantageous angles and positioning against each
    - CRITICAL: List top 3 unique selling points and optimizations that will help beat the competition based on ACTUAL competitive analysis
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR BRANDING/MESSAGING ANALYSIS:
    - Messaging Clarity
    - Conversion Potential
    - Positioning
    - Brand Alignment
    - ICP Resonance
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Deep Dive Analysis
    ### Messaging Clarity & Conversion Analysis
    (Deep feedback on copy, tone, clarity. What's confusing? What's unclear? Provide SPECIFIC EXAMPLES of clearer, more conversion-focused alternatives. Show before/after examples.)
    
    ### Top 10 ICP & Customer Pain Points Analysis
    
    Extract and list the top 10 main ICP and customer pain points based on:
    - ${input.icpTitles || 'Target customer'} roles and responsibilities
    - ${input.industry || 'Industry'} challenges and pain points
    - Research data on customer needs and frustrations
    - Competitive analysis of what competitors are addressing
    
    For each of the top 10 pain points, provide:
    - **Pain Point**: Clear description of the customer problem
    - **Current Messaging Gap**: How current messaging fails to address this pain point
    - **Most Advantageous Positioning Angle**: The best way to position messaging to address this pain point
    - **Recommended Messaging**: Specific copy/positioning that would resonate with this pain point
    - **Competitive Advantage**: How this positioning beats ${input.competitors || 'competitors'} on this pain point
    
    ### Top 3 Unique Selling Points & Competitive Optimizations
    
    Identify and detail the top 3 unique selling points (USPs) that will help beat the competition:
    
    For each USP:
    - **USP Title**: Short, clear, pithy title
    - **USP Description**: Brief but clear description of what makes this unique
    - **Market Value**: What in the market or with competitors makes this valuable
    - **Competitive Differentiation**: How this beats ${input.competitors || 'competitors'} specifically
    - **Optimization Strategy**: Specific optimizations to maximize this USP's impact
    - **Prioritized To-Do List**: Step-by-step actions to achieve getting this USP to market
    
    ### Positioning & Differentiation
    (Where this fits in the market vs ${input.competitors || 'competitors'}. How can positioning be clearer and more compelling? Provide specific positioning statements that would work better.)
    
    ### Brand Voice & Values Alignment
    (Visuals, vibes, values alignment. Does the messaging align with brand values? How can it be more authentic and compelling? Provide examples.)
    
    ### Conversion-Optimized Messaging Examples
    (SPECIFIC EXAMPLES of improved messaging that would drive more conversions. Show concrete rewrites, headlines, value propositions, and calls-to-action that would perform better.)
    
    ### Market Language & Buyer Communication
    (How does the messaging align with how ${input.icpTitles || 'target customers'} actually think and communicate? Use SEO keyword insights (${input.seoKeywords || 'market language'}) to inform recommendations. Provide examples of messaging that uses buyer language.)
    `;
  } else if (isProduct) {
    specializedRequirements = `
    PRODUCT/FEATURE-SPECIFIC ANALYSIS REQUIREMENTS:
    - Provide deep, actionable feedback on product features, functionality, and user experience
    - Focus on how features address ${input.icpTitles || 'target customer'} pain points and jobs-to-be-done
    - Compare against competitor features and industry standards
    - Provide specific recommendations for feature improvements, prioritization, and differentiation
    - Include feature comparison tables and prioritization matrices where relevant
    - CRITICAL: Create a feature/capability gap and opportunity matrix in table format showing gaps (risks) and opportunities
    - CRITICAL: For each gap/opportunity, provide: short clear title, brief description, market value, prioritized to-do list, and scoring based on effort, investment/cost, difficulty, value to company/users/market
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR PRODUCT/FEATURE ANALYSIS:
    - Feature Value Proposition
    - User Experience Quality
    - Competitive Differentiation
    - ICP Alignment
    - Implementation Feasibility
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Deep Dive Analysis
    ### Feature Analysis & User Experience
    (Deep feedback on features, functionality, and user experience. What works? What doesn't? How can it be improved? Include specific examples and use cases.)
    
    ### Competitive Feature Comparison
    (How do features compare to ${input.competitors || 'competitors'}? What features are missing? What features differentiate? Use comparison tables to show feature parity and gaps.)
    
    ### Feature & Capability Gap & Opportunity Matrix
    
    Create a comprehensive table showing feature/capability gaps (risks) and opportunities:
    
    **Table Columns:**
    - **Title**: Short, clear, pithy title for the gap/opportunity
    - **Type**: Gap (Risk) or Opportunity
    - **Description**: Brief but clear description
    - **Market Value**: What in the market or with competitors makes this valuable/risky
    - **Priority**: High/Medium/Low
    - **Score**: Overall score (see scoring system below)
    
    **For each gap/opportunity, provide:**
    - **Title**: Short, clear, pithy title
    - **Description**: Brief but clear description of the gap or opportunity
    - **Market Value**: What in the market or with competitors makes this valuable (for opportunities) or risky (for gaps)
    - **Prioritized To-Do List**: Step-by-step actions to achieve getting this feature/capability to market (for opportunities) or mitigate the risk (for gaps)
    
    **Scoring System:**
    For each gap/opportunity, calculate a score based on:
    - **Effort** (1-10): How much effort is required? (1 = minimal, 10 = massive)
    - **Investment/Cost** (1-10): Financial investment required (1 = low cost, 10 = very expensive)
    - **Difficulty to Build & Launch** (1-10): Technical/complexity difficulty (1 = easy, 10 = extremely difficult)
    - **Value to Company** (1-10): Business value/ROI (1 = low value, 10 = extremely high value)
    - **Value to Users** (1-10): User benefit/value (1 = low value, 10 = extremely high value)
    - **Value to Market** (1-10): Market differentiation/competitive advantage (1 = low, 10 = extremely high)
    
    **Score Calculation Formula:**
    Overall Score = (Value to Company × 0.3) + (Value to Users × 0.25) + (Value to Market × 0.25) - (Effort × 0.1) - (Investment/Cost × 0.05) - (Difficulty × 0.05)
    
    Higher scores indicate better opportunities (higher value, lower cost/effort). Lower scores indicate higher-risk gaps or low-value opportunities.
    
    **Scoring Key:**
    - Scores above 7.0: High-priority opportunities (pursue immediately)
    - Scores 5.0-7.0: Medium-priority opportunities (plan for near-term)
    - Scores 3.0-5.0: Low-priority opportunities (consider for future)
    - Scores below 3.0: Low-value or high-risk items (deprioritize or mitigate)
    
    Include this scoring breakdown and key in the report so users understand how scores were calculated.
    
    ### ICP Alignment & Pain Point Resolution
    (How well do features address ${input.icpTitles || 'target customer'} pain points and jobs-to-be-done? What's missing? What additional features would be valuable?)
    
    ### Feature Prioritization & Roadmap Recommendations
    (Actionable recommendations for feature improvements, prioritization, and roadmap planning. Include prioritization matrices showing impact vs effort, incorporating scores from the gap/opportunity matrix.)
    
    ### Technical Feasibility & Implementation Considerations
    (Assessment of technical complexity, resource requirements, and implementation timeline. What are the risks and dependencies?)
    `;
  } else if (isBrainstorming) {
    specializedRequirements = `
    BRAINSTORMING-SPECIFIC ANALYSIS REQUIREMENTS:
    - CRITICAL: Base your entire analysis on the user's specific ask: "${input.feedbackItem}"
    - CRITICAL: If supporting documentation/files are provided, analyze them thoroughly and reference specific details from the documents
    - CRITICAL: If circumstances are provided ("${input.circumstances || 'none'}"), use them to understand context and constraints
    - Facilitate creative exploration and idea generation around the EXACT brainstorming topic provided by the user
    - Evaluate ideas from multiple perspectives: feasibility, market potential, ICP alignment, competitive positioning
    - Provide structured analysis of brainstormed concepts with pros/cons, risks/opportunities based on the user's specific input
    - Focus on actionable next steps and validation strategies tailored to the user's ask
    - Compare brainstormed ideas against market trends and competitor approaches, but always anchor back to the user's specific question or topic
    - NEVER use generic brainstorming frameworks - always respond directly to what the user asked
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR BRAINSTORMING ANALYSIS:
    - Idea Viability
    - Market Potential
    - ICP Resonance
    - Competitive Advantage
    - Implementation Complexity
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Deep Dive Analysis
    
    CRITICAL: All analysis must be based on the user's specific ask: "${input.feedbackItem}"
    ${input.circumstances ? `CRITICAL: Consider these circumstances: "${input.circumstances}"` : ''}
    ${input.files && input.files.length > 0 ? `CRITICAL: Reference specific details from the ${input.files.length} attached file(s) throughout your analysis` : ''}
    
    ### Idea Exploration & Concept Development
    (Deep exploration of the brainstormed ideas SPECIFICALLY related to: "${input.feedbackItem}". What are the core concepts from the user's ask? How do they address ${input.icpTitles || 'target customer'} needs? What variations or extensions are possible based on the user's input?)
    
    ### Market Potential & Opportunity Assessment
    (Evaluation of market opportunity, size, and timing SPECIFICALLY for the user's ask: "${input.feedbackItem}". How does this align with ${input.industry || 'industry'} trends? What's the competitive landscape for this specific topic?)
    
    ### ICP Alignment & Customer Validation
    (How well do the brainstormed ideas from "${input.feedbackItem}" resonate with ${input.icpTitles || 'target customers'}? What validation would be needed for this specific ask? What are the key assumptions to test based on the user's question?)
    
    ### Competitive Positioning & Differentiation
    (How do the brainstormed ideas from "${input.feedbackItem}" compare to ${input.competitors || 'competitor'} approaches? What makes these ideas unique? Where are the differentiation opportunities for this specific topic?)
    
    ### Risk Assessment & Feasibility Analysis
    (What are the risks, challenges, and barriers SPECIFICALLY related to "${input.feedbackItem}"? What resources would be needed? What are the key dependencies and assumptions for this ask?)
    
    ### Actionable Next Steps & Validation Plan
    (Specific, actionable recommendations for validating the ideas from "${input.feedbackItem}", testing assumptions, and moving forward. Include a structured validation plan tailored to the user's specific ask.)
    `;
  } else if (isCompetitorBreakdown) {
    specializedRequirements = `
    COMPETITOR BREAKDOWN ANALYSIS REQUIREMENTS:
    - CRITICAL: NEVER use assumptions or generic competitor data - ALWAYS perform ACTUAL research on each competitor
    - CRITICAL: If competitors are NOT provided, research ${input.companyWebsite || 'the user\'s website'} to identify top 5 competitors through actual market research
    - CRITICAL: For each competitor, conduct ACTUAL website analysis: crawl their site, analyze ACTUAL keywords they rank for, review ACTUAL H1/H2 headings, descriptions, hooks, unique selling points, value propositions, pricing
    - CRITICAL: Find ACTUAL keywords and phrases used by competitors through real research - never assume or use generic keywords
    - CRITICAL: Review and analyze ACTUAL competitor websites to provide truly customized and actual feedback
    - Compare each competitor against the user's company/products based on ACTUAL analysis
    - Identify where each competitor wins and loses against the user based on REAL data
    - Provide actionable suggestions for how to beat each competitor in the market
    - Use structured tables and matrices to present competitor data clearly
    - Focus on competitive intelligence that enables strategic decision-making
    - CRITICAL: Analyze ACTUAL competitor pricing through real research and create a detailed pricing comparison table showing the client's pricing vs top 5 competitors
    - CRITICAL: Research ACTUAL SEO and LLM (GEO/AEO) keyword rankings - find REAL keywords the client and each top 5 competitor rank highest for, with strategies to win those positions based on actual data
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR COMPETITOR BREAKDOWN ANALYSIS:
    - Competitive Positioning
    - Keyword Strategy
    - Messaging Differentiation
    - Pricing Advantage
    - Market Share Position
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Competitor Breakdown
    
    ## Top 5 Competitors Analysis
    
    For each competitor, provide a comprehensive analysis including:
    
    ### Competitor 1: [Competitor Name]
    - **Top Performing Keywords**: Research and list ACTUAL top 5-7 keywords they rank for on Google and main LLMs - never use assumptions
    - **Brand Messaging**: Research ACTUAL H1, H2 headings, description, hooks, and messaging strategy from their website - provide specific examples
    - **Unique Selling Points**: Identify their ACTUAL 3 unique selling points through real analysis of their website and marketing materials
    - **Value Propositions**: Extract their ACTUAL top 5 core value propositions/benefits from real website review
    - **Pricing & Packaging**: Research ACTUAL pricing model and packaging strategy - provide real pricing information, not assumptions
    - **Where They Win**: Where this competitor ACTUALLY beats the user's company based on real comparison (3-5 specific points)
    - **Where They Lose**: Where this competitor ACTUALLY falls short vs the user's company based on real analysis (3-5 specific points)
    - **Actionable Suggestions**: How to beat this competitor (3-5 specific recommendations based on actual competitive gaps)
    
    (Repeat for Competitors 2-5)
    
    ## Competitive Pricing Analysis
    
    ### Pricing Comparison Table
    Create a comprehensive pricing comparison table showing:
    - Company/Competitor name
    - Pricing model (seat-based, usage-based, hybrid, value-based, etc.)
    - Entry tier pricing
    - Mid-tier pricing
    - Premium tier pricing
    - Key features included at each tier
    - Pricing positioning (premium, mid-market, budget)
    - Value proposition per tier
    
    Include the client's current pricing and all top 5 competitors in this table. Use clear formatting to make comparisons easy.
    
    ### Pricing Strategy Recommendations
    Based on the pricing comparison, provide:
    - Where the client is competitively positioned
    - Pricing gaps and opportunities
    - Recommendations for pricing adjustments or tier restructuring
    - Value-based pricing opportunities
    
    ## SEO & LLM Keyword Ranking Analysis
    
    ### Top 10 Keywords Ranking Table
    Create a detailed table showing:
    - Keyword
    - Client's current ranking (if ranking)
    - Top 5 Competitors and their rankings for each keyword
    - Search volume/importance
    - Keyword intent (informational, navigational, transactional)
    - Current winner (who ranks #1)
    
    List the top 10 keywords that are most valuable for the client's market, showing where the client and each competitor rank.
    
    ### Keyword Strategy & Win Plan
    CRITICAL: Research ACTUAL keyword rankings - never use assumptions. For each of the top 10 keywords, provide:
    - **Current State**: Who ACTUALLY ranks highest (with real ranking positions) and why based on actual analysis
    - **Win Strategy**: Specific, actionable steps to win this keyword position from competitors based on actual competitive analysis
    - **Content Strategy**: What content or optimization is needed based on what competitors are ACTUALLY doing
    - **Technical SEO**: Any technical improvements required based on actual site analysis
    - **Link Building**: Opportunities for backlinks or authority building based on actual competitor backlink profiles
    - **Priority Level**: High/Medium/Low based on actual value and difficulty assessment
    
    Focus on keywords where competitors are ACTUALLY winning (verified through research) but the client could realistically compete.
    
    ## Competitive Matrix Summary
    
    Create a comparison table showing:
    - Competitor names
    - Key strengths
    - Key weaknesses
    - Pricing comparison
    - Market positioning
    - Recommended competitive strategies
    
    ## Strategic Recommendations
    
    ### Overall Competitive Strategy
    (Synthesize insights from all competitors to provide overarching competitive strategy recommendations)
    
    ### Priority Actions to Beat Competitors
    (Ranked list of highest-impact actions to gain competitive advantage, incorporating pricing and keyword strategies)
    
    ### Market Positioning Opportunities
    (Where are the gaps in the competitive landscape? How can the user position themselves uniquely?)
    `;
  } else if (isWebsiteCrawl) {
    specializedRequirements = `
    WEBSITE CRO & FUNNEL ANALYSIS REQUIREMENTS:
    - CRITICAL: Perform ACTUAL deep research and analysis of ${input.companyWebsite || 'the website'} - NEVER use assumptions or generic statements
    - CRITICAL: Conduct REAL website crawl, analyze ACTUAL page titles, meta descriptions, img tags, keyword saturation, Google search rankings, LLM (GEO/AEO) rankings
    - CRITICAL: Run ACTUAL page load speed tests and provide REAL numbers, not assumptions or generic ranges
    - CRITICAL: Review the ACTUAL website structure, content, and functionality - provide SPECIFIC findings about what exists, where it's located, and how it works
    - CRITICAL: If competitors are provided, research ACTUAL competitor websites and provide REAL comparisons based on actual analysis
    - CRITICAL: If competitors are NOT provided but ${input.companyWebsite || 'website'} is available, research the website to identify top 5 competitors through actual market research
    - Score website CRO (Conversion Rate Optimization) & Funnel analysis across multiple dimensions based on ACTUAL site review
    - Provide SPECIFIC, PERSONALIZED recommendations based on ACTUAL findings - never use vague language like "often", "usually", "typically"
    - Focus on actionable insights that will improve search visibility, user experience, and conversion rates
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR WEBSITE CRAWL ANALYSIS:
    - SEO/GEO Health Score
    - CRO & Communication Score
    - Page Load Performance
    - Keyword Ranking Position
    - User Experience Quality
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Website CRO & Funnel Analysis
    
    ## Executive Summary
    (High-level overview of website health, key findings, and priority recommendations)
    
    ## SEO & GEO Health Analysis
    
    ### Page Title Analysis
    - Score each page's title tag (1-10 scale)
    - Identify issues: missing titles, duplicate titles, titles too long/short, poor keyword usage
    - Provide specific recommendations for improving each page's title
    - Compare against ${input.competitors || 'competitor'} best practices
    
    ### Meta Description Analysis
    - Score each page's meta description (1-10 scale)
    - Identify issues: missing descriptions, duplicate descriptions, descriptions too long/short, poor call-to-action
    - Provide specific recommendations for improving each page's meta description
    - Include examples of optimized meta descriptions
    
    ### Image Tag Analysis
    - Score image alt tags and optimization (1-10 scale)
    - Identify issues: missing alt tags, poor alt text, unoptimized images, missing image titles
    - Provide recommendations for image SEO optimization
    - Include examples of properly optimized images
    
    ### Keyword Saturation Analysis
    - Analyze keyword saturation for ${input.industry || 'the market'} and against ${input.competitors || 'competitors'}
    - Identify keyword gaps and opportunities
    - Provide keyword targeting recommendations for each major page
    - Create a keyword opportunity matrix showing:
      - Target keywords
      - Current ranking (if any)
      - Competitor rankings
      - Search volume/importance
      - Recommended optimization strategy
    
    ### Google Search Ranking Analysis
    - Current rankings for key terms in ${input.industry || 'the market'}
    - Ranking positions vs ${input.competitors || 'competitors'}
    - Identify ranking opportunities and quick wins
    - Provide specific strategies to improve rankings
    
    ### LLM (GEO/AEO) Ranking Analysis
    - How the website performs in LLM search results (Google's Generative Experience, AI Overviews, etc.)
    - Current visibility in AI-powered search
    - Strategies to improve LLM/AEO rankings
    - Content optimization for AI search engines
    
    ### Page Load Speed Analysis
    - CRITICAL: Run ACTUAL page load speed tests using tools like Google PageSpeed Insights, GTmetrix, or WebPageTest
    - Report ACTUAL page load times (e.g., "3.2 seconds", "4.7 seconds") - NEVER use generic ranges or assumptions
    - Report ACTUAL performance scores from real tests (e.g., "Lighthouse Performance: 72/100", "GTmetrix Grade: B")
    - Identify SPECIFIC bottlenecks found in actual tests: large images (with actual file sizes), unoptimized code (with specific files), slow hosting (with actual response times), etc.
    - Provide SPECIFIC recommendations for improving page speed based on actual test results
    - Impact on SEO and user experience with actual data
    
    ### LLM.txt File Analysis
    
    **What is llm.txt?**
    llm.txt is a standardized file (similar to robots.txt) that helps AI systems and LLMs understand your website's content structure, key information, and how to properly cite and reference your site. It's becoming increasingly important for visibility in AI-powered search (GEO/AEO).
    
    **Analysis:**
    - Check if ${input.companyWebsite || 'the website'} has an llm.txt file at ${input.companyWebsite ? `${input.companyWebsite}/llm.txt` : 'the root domain/llm.txt'}
    - If it exists: Analyze its content, structure, and completeness
    - If it doesn't exist: Create a comprehensive llm.txt file recommendation below
    
    **Recommended llm.txt Content** (if missing):
    [Provide a complete, ready-to-use llm.txt file content that includes:
    - Site overview and purpose
    - Key pages and their purposes
    - Important content sections
    - Contact information
    - How to cite the site
    - Any other relevant information for AI systems]
    
    **Why You Need This:**
    - Improves visibility in Google's Generative Experience and AI Overviews
    - Helps AI systems understand and properly reference your content
    - Ensures accurate representation of your brand in AI-powered search
    - Future-proofs your SEO strategy for the AI era
    
    ### Additional SEO/GEO Critical Factors
    - Mobile responsiveness and mobile-first indexing (based on actual testing)
    - Site structure and internal linking (actual analysis of site architecture)
    - Schema markup and structured data (actual review of implemented schemas)
    - SSL/HTTPS status (actual verification)
    - XML sitemap and robots.txt (actual review of files)
    - Core Web Vitals scores (actual test results with specific numbers)
    - Any other critical SEO/GEO factors found in actual analysis
    
    ### SEO/GEO Gap Analysis & Opportunities
    - Comprehensive list of SEO/GEO gaps, issues, and opportunities
    - Prioritized action plan to address each gap
    - Quick wins vs long-term optimizations
    
    ## Website CRO & Funnel Analysis
    
    ### Home Page Hero Clarity Score
    Score (1-10) and analyze:
    - How quickly and clearly visitors understand what the company does
    - How clearly visitors understand what they offer
    - Clarity of value proposition
    - Visual hierarchy and messaging clarity
    - Comparison against ${input.competitors || 'competitor'} home pages
    - Specific recommendations for improvement
    
    ### Contact & Communication Accessibility Score
    Score (1-10) and analyze:
    - **800# Visibility**: Is there a visible toll-free number? Is it on every page or only certain pages?
    - **Chatbot Availability**: Is there a chatbot? How visible and accessible is it?
    - **Contact Form**: Is there a contact form? Where is it located? How easy is it to find?
    - **Free Trial/Demo CTAs**: Are free trial or demo CTAs visible and accessible?
    - **Sales/Support/Contact Emails**: Are email addresses listed? Where? How easy to find?
    - **Page-by-Page Analysis**: Which pages have contact options? Which are missing them?
    - **Recommendations**: Specific improvements for contact accessibility
    
    ### Content & Resource Accessibility Score
    Score (1-10) and analyze:
    - **Blog/Resources**: Does the site have a blog or resource center? How easy is it to find?
    - **Social Links**: Are social media links visible? Where are they located?
    - **Additional Information Access**: How easy is it for visitors to find deeper information?
    - **Content Organization**: Is content well-organized and easy to navigate?
    - **Recommendations**: Specific improvements for content accessibility
    
    ### Newsletter & Lead Generation Score
    Score (1-10) and analyze based on ACTUAL website review:
    - **Newsletter Signup**: Is there a newsletter signup? WHERE EXACTLY is it located? (e.g., "Footer on all pages", "Homepage hero section", "Blog sidebar") How visible and compelling is it? Provide SPECIFIC details about placement, design, and copy.
    - **Lead Generation Forms**: Are there lead gen forms? WHERE EXACTLY are they located? (e.g., "Contact page", "Pricing page bottom", "Blog post end") How optimized are they? Provide SPECIFIC analysis of form fields, CTAs, and conversion optimization.
    - **Value Exchange**: What SPECIFIC value is offered in exchange for contact information? (e.g., "Free whitepaper download", "14-day trial", "Demo request") Provide ACTUAL details, not assumptions.
    - **Recommendations**: SPECIFIC improvements for lead generation based on actual findings
    
    ### Website & Funnel Physiology Analysis
    Score (1-10) and analyze additional critical factors:
    - **Navigation Clarity**: Is site navigation intuitive and clear?
    - **Call-to-Action Optimization**: Are CTAs clear, compelling, and well-placed?
    - **Trust Signals**: Are there trust badges, testimonials, case studies, certifications?
    - **Social Proof**: Customer logos, reviews, testimonials visibility
    - **Funnel Flow**: How well does the site guide visitors through the conversion funnel?
    - **Mobile Experience**: How well does the site work on mobile devices?
    - **Page-to-Page Flow**: Does the site guide visitors logically through the journey?
    - **Exit Intent Optimization**: Are there exit-intent popups or offers?
    - **A/B Testing Opportunities**: What elements could benefit from testing?
    
    ### CRO Gap Analysis & Optimization Opportunities
    - Comprehensive list of CRO gaps and opportunities
    - Prioritized action plan with quick wins and long-term optimizations
    - Specific recommendations for each identified gap
    
    ## Competitive Website Comparison
    CRITICAL: If competitors are provided, conduct ACTUAL analysis of competitor websites and compare against the user's site for SEO/GEO and CRO metrics. If competitors are NOT provided but ${input.companyWebsite || 'website'} is available, research the website to identify top 5 competitors and perform actual competitive analysis. NEVER use assumptions or generic comparisons - always base analysis on actual website reviews.
    
    ## Prioritized Action Plan
    - **Quick Wins**: High-impact, low-effort improvements (implement immediately)
    - **Medium-Term**: Important optimizations requiring more effort (plan for next quarter)
    - **Long-Term**: Strategic improvements requiring significant resources (roadmap items)
    
    ## Board-Level Strategic Recommendations
    (High-level strategic recommendations for website optimization, SEO/GEO strategy, and CRO improvements based on all findings)
    `;
  } else {
    // Default/Other topic - adapt based on the actual ask
    specializedRequirements = `
    GENERAL ANALYSIS REQUIREMENTS:
    - CRITICAL: Base your entire analysis on the user's specific ask: "${input.feedbackItem}"
    - CRITICAL: If supporting documentation/files are provided, analyze them thoroughly and reference specific details from the documents
    - CRITICAL: If circumstances are provided ("${input.circumstances || 'none'}"), use them to understand context and constraints
    - CRITICAL: The user selected "Other" which means this doesn't fit standard categories - focus EXCLUSIVELY on what they asked, not generic frameworks
    - Provide comprehensive, multi-perspective analysis of the user's EXACT ask - respond directly to their question or topic
    - Focus on actionable insights that address ${input.icpTitles || 'target customer'} needs, but always in the context of the user's specific question
    - Compare against ${input.competitors || 'competitor'} approaches and industry standards, but anchor all comparisons to the user's ask
    - Consider market trends, competitive positioning, and ICP alignment, but always relate back to the user's specific input
    - Provide specific, actionable recommendations that directly address what the user asked
    - NEVER use generic analysis templates - tailor everything to the user's specific question or topic
    `;
    
    executiveDashboardRows = `
    REQUIRED ROWS FOR GENERAL ANALYSIS:
    - Core Value Proposition
    - Market Fit
    - Competitive Positioning
    - ICP Alignment
    - Implementation Feasibility
    - Board-Level Concerns
    `;
    
    specializedSections = `
    # Deep Dive Analysis
    
    CRITICAL: All analysis must be based on the user's specific ask: "${input.feedbackItem}"
    ${input.circumstances ? `CRITICAL: Consider these circumstances: "${input.circumstances}"` : ''}
    ${input.files && input.files.length > 0 ? `CRITICAL: Reference specific details from the ${input.files.length} attached file(s) throughout your analysis` : ''}
    
    ### Core Concept Analysis
    (Deep analysis of the core concept or idea SPECIFICALLY from the user's ask: "${input.feedbackItem}". What are the key elements of what they're asking about? How does it address ${input.icpTitles || 'target customer'} needs? Analyze the user's specific question or topic, not generic concepts.)
    
    ### Market Positioning & Competitive Analysis
    (Where does "${input.feedbackItem}" fit in the market vs ${input.competitors || 'competitors'}? What's the competitive landscape for this specific ask? How can positioning be strengthened for this particular question or topic?)
    
    ### ICP Alignment & Customer Resonance
    (How well does "${input.feedbackItem}" resonate with ${input.icpTitles || 'target customers'}? What are the key value propositions related to the user's specific ask? What validation is needed for this particular question or topic?)
    
    ### Implementation Considerations
    (What are the practical considerations for implementation SPECIFICALLY related to "${input.feedbackItem}"? What resources, risks, and dependencies exist for addressing the user's ask?)
    
    ### Actionable Recommendations
    (Specific, actionable recommendations for moving forward with "${input.feedbackItem}". What are the next steps? What should be prioritized? All recommendations must directly address the user's specific question or topic.)
    `;
  }

  const prompt = `
    You are the world's best UX Researcher & Organizational Psychologist leading a Customer Advisory Board (CAB) as the Facilitator.
    
    ROLE: As the Facilitator, you guide the board discussion, synthesize insights from the 20 personas, and ensure all perspectives are heard and integrated into the final analysis.
    
    TASK:
    Conduct a deep "Zulu Method" analysis of the user's ask using the 20 assembled personas. As the Facilitator, synthesize their diverse perspectives into a comprehensive, actionable report.
    
    INPUTS:
    ${input.companyWebsite ? `- Company Website: ${input.companyWebsite} (Deep research conducted on offerings, products, market position)` : ''}
    - Industry: ${input.industry}
    ${icpContext ? `- ${icpContext}` : ''}
    ${input.companySize && input.companySize.length > 0 ? `- Ideal Company Size: ${input.companySize.join(', ')}` : ''}
    ${input.companyRevenue && input.companyRevenue.length > 0 ? `- Ideal Company Revenue: ${input.companyRevenue.join(', ')}` : ''}
    ${input.competitors ? `- Top Competitors: ${input.competitors}` : ''}
    ${input.seoKeywords ? `- SEO Keywords: ${input.seoKeywords}` : ''}
    - Feedback Type: ${input.feedbackType || 'General feedback'}
    - THE ASK: ${input.feedbackItem}
    ${input.circumstances ? `- Circumstances: ${input.circumstances}` : ''}
    ${fileContext ? `- Attached Files:\n${fileContext}` : ''}
    ${competitorAnalysis ? `\n=== COMPETITOR ANALYSIS DATA ===\nUser Domain: ${competitorAnalysis.userDomain}\n\nCompetitors Analyzed:\n${competitorAnalysis.competitors.map((comp, idx) => `
Competitor ${idx + 1}: ${comp.name} (${comp.domain})
- Top Keywords: ${comp.topKeywords.join(', ')}
- H1: ${comp.h1}
- H2s: ${comp.h2s.join('; ')}
- Description: ${comp.description}
- Hooks: ${comp.hooks.join('; ')}
- Unique Selling Points: ${comp.uniqueSellingPoints.join('; ')}
- Value Propositions: ${comp.valuePropositions.join('; ')}
- Pricing Overview: ${comp.pricingOverview}
- Wins Against User: ${comp.winsAgainstUser.join('; ')}
- Losses Against User: ${comp.lossesAgainstUser.join('; ')}
- Actionable Suggestions: ${comp.actionableSuggestions.join('; ')}
`).join('\n')}\n=== END COMPETITOR ANALYSIS ===\n` : ''}
    
    ${verifiedResearchData ? `\n=== VERIFIED RESEARCH DATA (Perplexity AI + Multi-LLM Verification) ===\n${verifiedResearchData}\n=== END VERIFIED RESEARCH ===\n\nCRITICAL: This research data has been verified by Perplexity AI (initial deep research) and multiple AI verification systems (Gemini AI and Claude AI for veracity checking, depth/breadth enhancement, logical consistency, and hallucination detection). Heavily leverage this verified research data throughout your analysis. This research contains:\n${input.companyWebsite ? `- Deep analysis of ${input.companyWebsite} including products, offerings, market position, and competitive positioning\n` : ''}- Current market trends and verified industry data (verified for accuracy)\n- Competitive intelligence and market positioning insights (fact-checked)\n- Role-specific challenges and priorities (validated)\n- Market language and buyer intent from SEO keyword analysis (verified)\n- Company size/revenue-specific behaviors and decision-making patterns (fact-checked)${isPricing ? '\n- Pricing expert insights from Marcos Rivera, Ulrik Lehrskov-Schmidt, and Utpal Dholakia (verified)\n- Industry pricing benchmarks, competitor pricing strategies, and pricing model best practices (fact-checked)' : ''}${isBranding ? '\n- Messaging best practices, conversion-optimized copy examples, and brand positioning strategies (verified)' : ''}${isCompetitorBreakdown ? '\n- Comprehensive competitor data including keywords, messaging, pricing, and competitive positioning (verified)' : ''}\n${input.companyWebsite ? `- Website-specific insights including messaging, content strategy, and customer base (verified)\n` : ''}\nIntegrate specific facts, statistics, and insights from this VERIFIED research into your analysis. All data has been checked for veracity, enhanced with additional depth and breadth, and verified to contain zero hallucinations. Cross-reference findings with the research data to provide fact-checked, current market insights. ${input.companyWebsite ? `Pay special attention to how the company website research informs your understanding of their market position and offerings.` : ''}\n` : ''}
    
    THE BOARD:
    ${boardContext}

    CRITICAL ANALYSIS REQUIREMENTS:
    1. CRITICAL: NEVER use assumptions, generic data, or market averages - ALWAYS perform ACTUAL research and analysis
    2. CRITICAL: If competitors are provided, research ACTUAL competitor websites - crawl their sites, analyze ACTUAL keywords, messaging, pricing, and features. NEVER use generic competitor assumptions.
    3. CRITICAL: If competitors are NOT provided but ${input.companyWebsite || 'website'} is available, research the website to identify top 5 competitors through actual market research
    4. CRITICAL: Find ACTUAL keywords and phrases used by competitors through real research - never assume or use generic keywords
    5. CRITICAL: Review and analyze ACTUAL websites to provide truly customized and actual feedback - never use vague language like "often", "usually", "typically"
    6. Use the SEO keywords (${input.seoKeywords || 'not provided'}) to understand market language, search intent, and how the target audience thinks about related topics
    7. Consider the industry context (${input.industry}) and ICP titles (${input.icpTitles || 'various'}) when evaluating messaging, positioning, and product fit
    8. Consider company size ranges (${input.companySize && input.companySize.length > 0 ? input.companySize.join(', ') : 'various'}) and revenue ranges (${input.companyRevenue && input.companyRevenue.length > 0 ? input.companyRevenue.join(', ') : 'various'}) when assessing budget constraints, decision-making processes, and organizational maturity
    9. ${verifiedResearchData ? 'CRITICAL: Integrate the VERIFIED research data above (verified by both Perplexity AI and Gemini AI) to provide fact-checked, current market insights. All research data has been verified for veracity, enhanced with depth/breadth, and checked for hallucinations. Cross-reference findings with the verified research data.' : 'Perform deep research and fact-checking against the provided context, competitor landscape, SEO keyword insights, company size/revenue context, and general knowledge.'}
    ${specializedRequirements}

    CRITICAL FORMATTING RULES:
    1.  DO NOT include any preamble or intro text. Start directly with the first Header.
    2.  Use exactly the Section Headers provided below (H1 #). H1 headers must be bold and use # at the start of the line.
    3.  Never duplicate Section Headers in the body content below the header.
    4.  Use exactly the Sub-Headers provided below (H3 ###) for specific sections. H3 headers must use ### at the start and be bold.
    5.  Use double line breaks (two newlines) between ALL paragraphs, list items, and below H3s for readability.
    6.  Keep paragraphs short (max 3 sentences). Each paragraph should be on its own line(s).
    7.  All paragraphs should use normal text formatting (not bold unless emphasizing specific words with **bold**).
    8.  For the Executive Dashboard Table, you MUST use standard Markdown syntax (using pipes |). DO NOT use HTML tags like <table>.
    9.  H2 headers (##) should be used sparingly and only when needed for major subsections. They should be bold.
    10. Ensure all text flows naturally and is properly formatted with correct spacing.

    REQUIRED OUTPUT STRUCTURE (Markdown):

    # Executive Dashboard
    
    Create a Standard Markdown Table summarizing the findings. Use EXACT markdown table syntax.
    
    CRITICAL TABLE FORMATTING REQUIREMENTS:
    1. Header row: | Category | Status | Observation | Recommended Action |
    2. Separator row: |----------|----------|----------|----------|
    3. Data rows: One row per category with actual content
    
    EXAMPLE FORMAT (copy this exact structure and fill in real content):
    | Category | Status | Observation | Recommended Action |
    |----------|----------|----------|----------|
    | Messaging | 🟢 | Clear value proposition resonates with target audience | Continue emphasizing ROI-focused messaging |
    | Positioning | 🟡 | Competitive differentiation needs strengthening | Highlight unique features vs ${input.competitors || 'competitors'} |
    | Branding | 🟢 | Visual identity aligns with ${input.icpTitles || 'target'} expectations | Maintain current brand consistency |
    
    ${executiveDashboardRows}
    
    Each row must have:
    - Category: The row name from the list above
    - Status: ONE emoji only (🔴 for critical issues, 🟡 for concerns, 🟢 for good)
    - Observation: 1-2 sentences describing the finding
    - Recommended Action: 1-2 sentences with specific, actionable steps
    
    CRITICAL: 
    - DO NOT include multiple separator rows
    - DO NOT include dashes in data cells
    - DO NOT leave cells empty
    - DO NOT use placeholder text
    - Each data row must have all 4 columns filled with real content
    - Status column must contain ONLY an emoji (🔴, 🟡, or 🟢)

    # Key Research Findings & Facts
    List bullet points of objective facts, data, or verified assumptions that the board agrees on regarding the industry/ask.
    ${isPricing ? 'Include pricing benchmarks, industry standards, and competitor pricing data from research. Use tables to present pricing comparisons clearly.' : isBranding ? 'Include messaging best practices, conversion data, and market language insights from research.' : isProduct ? 'Include feature comparisons, industry standards, and competitive intelligence from research. Use tables to show feature parity.' : isBrainstorming ? 'Include market trends, competitive landscape, and validation data from research.' : isCompetitorBreakdown ? 'Include competitor intelligence, market positioning data, and competitive landscape insights from research. Use the competitor analysis data provided above to inform findings.' : isWebsiteCrawl ? 'Include SEO/GEO benchmarks, technical SEO standards, CRO best practices, and competitive website analysis from research. Use tables to show comparisons and scores.' : 'Include relevant industry data, competitive intelligence, and market insights from research.'}
    
    ${specializedSections}

    # The Roast & The Gold
    
    Format this section with clear attribution to board members. Use markdown blockquotes (>) for quoted text with member names and roles.
    
    ### 🔥 The Roast
    (Brutal, unfiltered criticism from the Skeptics and Budget-Hawks. What sucks? What is vague? ${isPricing ? 'What pricing elements are problematic?' : isBranding ? 'What messaging is confusing or ineffective?' : isProduct ? 'What features are missing or poorly designed?' : isBrainstorming ? 'What ideas are unrealistic or poorly thought out?' : isWebsiteCrawl ? 'What SEO/GEO issues are critical? What CRO problems are hurting conversions?' : 'What are the critical flaws?'})
    
    Format as markdown blockquotes with attribution:
    > "Critical feedback text here"  
    > – **Member Name** (Role, Company Type)
    
    Include 3-5 critical quotes from different Skeptics and Budget-Hawks board members.
    
    ### 🏆 The Gold
    (What is brilliant? What resonates deeply with the Visionaries and Champions? ${isPricing ? 'What pricing elements work well?' : isBranding ? 'What messaging elements are strong and conversion-focused?' : isProduct ? 'What features are innovative and valuable?' : isBrainstorming ? 'What ideas have the most potential?' : isWebsiteCrawl ? 'What SEO/GEO strengths exist? What CRO elements are working well?' : 'What are the strongest elements?'})
    
    Format as markdown blockquotes with attribution:
    > "Positive feedback text here"  
    > – **Member Name** (Role, Company Type)
    
    Include 3-5 positive quotes from different Visionaries and Champions board members.

    # Raw Board Transcript
    
    Format this section as a dialogue between board members. Use clear attribution with member names and roles in bold.
    
    Format example:
    **Facilitator:** "Opening question or prompt"
    
    **Member Name (Role, Company Type):** "Their response or comment"
    
    **Another Member Name (Role, Company Type):** "Their counterpoint or agreement"
    
    **Member Name (Role, Company Type):** "Further discussion or agreement"
    
    (A summarized dialogue or 'raw notes' from the session where specific members debate key points. Use their actual names from the board roster. Show the back-and-forth discussion, disagreements, agreements, and key insights. Make it feel like a real board meeting transcript. Include 8-12 exchanges between different board members showing diverse perspectives.)
  `;

  let fullReport = '';
  
  try {
    if (import.meta.env.DEV) {
      console.log('🚀 Starting report generation with Perplexity research...');
      console.log(`📊 Perplexity research length: ${perplexityResearch?.length || 0} characters`);
    }
    
    // Try streaming with model fallback
    let stream: any = null;
    const firstModelForStream = MODEL_FALLBACK_CHAIN[0];
    if (!firstModelForStream) {
      throw new Error('No models available in fallback chain');
    }
    let usedModel = firstModelForStream;
    let streamError: Error | null = null;
    
    // Try each model for streaming
    for (const model of MODEL_FALLBACK_CHAIN) {
      try {
        // Try Format 1: Simple string
        try {
          stream = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
            config: {
              temperature: 0.7,
            }
          });
          usedModel = model;
          if (import.meta.env.DEV) {
            console.log(`✅ Streaming API initialized with ${model}`);
          }
          break; // Success, exit loop
        } catch (formatError1) {
          // Try Format 2: Array format
          try {
            stream = await ai.models.generateContentStream({
              model: model,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                temperature: 0.7,
              }
            });
            usedModel = model;
            if (import.meta.env.DEV) {
              console.log(`✅ Streaming API initialized with ${model} (format 2)`);
            }
            break; // Success, exit loop
          } catch (formatError2) {
            streamError = formatError2 instanceof Error ? formatError2 : new Error(String(formatError2));
            // If it's a limit error and not the last model, try next model
            if (isModelLimitError(streamError) && model !== MODEL_FALLBACK_CHAIN[MODEL_FALLBACK_CHAIN.length - 1]) {
              if (import.meta.env.DEV) {
                console.warn(`⚠️ Model ${model} hit limit for streaming, trying next model...`);
              }
              continue; // Try next model
            }
            // If not a limit error or last model, break and try non-streaming fallback
            break;
          }
        }
      } catch (error) {
        streamError = error instanceof Error ? error : new Error(String(error));
        if (isModelLimitError(streamError) && model !== MODEL_FALLBACK_CHAIN[MODEL_FALLBACK_CHAIN.length - 1]) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Model ${model} hit limit, trying next model...`);
          }
          continue;
        }
        break;
      }
    }
    
    // If streaming failed for all models, try non-streaming with fallback
    if (!stream) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Streaming failed, trying non-streaming with model fallback...');
      }
      try {
        return await callWithModelFallback(
          ai,
          async (model) => {
            const response = await ai.models.generateContent({
              model: model,
              contents: prompt,
              config: {
                temperature: 0.7,
              }
            });
            
            if (response.text) {
              // Simulate streaming by chunking the response
              const text = response.text;
              const chunkSize = 50;
              for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.substring(i, i + chunkSize);
                fullReport += chunk;
                onChunk(chunk);
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              
              if (import.meta.env.DEV) {
                console.log(`✅ Report generated via non-streaming fallback (${model}). Length: ${fullReport.length} characters`);
              }
              return {
                report: fullReport,
                researchData: verifiedResearchData || perplexityResearch || ''
              };
            }
            throw new Error("No text returned from API");
          },
          'streamAnalysis-nonStreaming'
        );
      } catch (error) {
        // Report fallback attempt
        if (streamError) {
          const firstModel = MODEL_FALLBACK_CHAIN[0];
          if (firstModel) {
            await reportModelFallback(
              firstModel,
              'non-streaming-fallback',
              streamError,
              'streamAnalysis'
            );
          }
        }
        throw error;
      }
    }
    
    // Report if we used a fallback model for streaming
    if (usedModel !== firstModelForStream && streamError) {
      await reportModelFallback(
        firstModelForStream,
        usedModel,
        streamError,
        'streamAnalysis-streaming'
      );
    }

    // Process stream chunks
    let chunkCount = 0;
    for await (const chunk of stream) {
      try {
        chunkCount++;
        let text = '';
        
        // Handle different chunk formats from the API
        if (chunk && typeof chunk === 'object') {
          // Check for response property
          if ('response' in chunk && chunk.response) {
            const response = chunk.response;
            if (response.candidates && Array.isArray(response.candidates)) {
              for (const candidate of response.candidates) {
                if (candidate.content && candidate.content.parts) {
                  for (const part of candidate.content.parts) {
                    if (part.text) {
                      text += String(part.text);
                    }
                  }
                }
              }
            }
          }
          // Try text property directly
          else if ('text' in chunk && chunk.text) {
            text = String(chunk.text);
          }
          // Try content property
          else if ('content' in chunk && chunk.content) {
            const content = chunk.content;
            if (typeof content === 'string') {
              text = content;
            } else if (content && typeof content === 'object') {
              if ('text' in content) {
                text = String(content.text);
              } else if ('parts' in content && Array.isArray(content.parts)) {
                for (const part of content.parts) {
                  if (part && typeof part === 'object' && 'text' in part) {
                    text += String(part.text || '');
                  }
                }
              }
            }
          }
          // Try delta property
          else if ('delta' in chunk && chunk.delta) {
            text = String(chunk.delta);
          }
          // Try parts array directly
          else if ('parts' in chunk && Array.isArray(chunk.parts)) {
            for (const part of chunk.parts) {
              if (part && typeof part === 'object' && 'text' in part) {
                text += String(part.text || '');
              }
            }
          }
        } else if (typeof chunk === 'string') {
          text = chunk;
        }
        
        if (text && text.trim().length > 0) {
          fullReport += text;
          onChunk(text);
        }
      } catch (chunkError) {
        if (import.meta.env.DEV) {
          console.warn(`Error processing chunk ${chunkCount}:`, chunkError);
        }
        // Continue processing other chunks
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`📦 Processed ${chunkCount} chunks`);
    }
    
    // Ensure we have content
    if (!fullReport || fullReport.trim().length === 0) {
      console.error('❌ No content received from streaming API');
      console.error('Chunk count:', chunkCount);
      
      // If we have no content but streaming worked, try fallback
      if (chunkCount > 0) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Stream processed but no text extracted. Trying fallback...');
        }
        // Fallback to non-streaming with model fallback
        try {
          const result = await callWithModelFallback(
            ai,
            async (model) => {
              const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                  temperature: 0.7,
                }
              });
              
              if (response.text) {
                return response.text;
              }
              throw new Error("No text returned from API");
            },
            'streamAnalysis-emptyStreamFallback'
          );
          fullReport = result;
          // Send all chunks at once
          onChunk(fullReport);
          if (import.meta.env.DEV) {
            console.log(`✅ Report generated via empty stream fallback. Length: ${fullReport.length} characters`);
          }
          return {
            report: fullReport,
            researchData: verifiedResearchData || perplexityResearch || ''
          };
        } catch (fallbackError) {
          console.error('❌ Empty stream fallback also failed:', fallbackError);
          throw new Error("No content received from streaming API. Please check API configuration.");
        }
      }
      
      throw new Error("No content received from streaming API. Please check API configuration.");
    }
    
    if (import.meta.env.DEV) {
      console.log(`✅ Report generation complete. Total length: ${fullReport.length} characters`);
      console.log(`📄 Report preview (first 200 chars): ${fullReport.substring(0, 200)}...`);
    }
    
    // Return the complete report and research data for QC
    return {
      report: fullReport,
      researchData: perplexityResearch || ''
    };
  } catch (error) {
    console.error("❌ Stream error:", error);
    
    // Check for quota/rate limit errors specifically
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = JSON.stringify(error);
    
    // Extract error details from the error object
    let errorStatus: number | undefined;
    let errorCode: string | undefined;
    let errorDetails: any = undefined;
    
    try {
      // Try to extract structured error information
      const errorObj = error as any;
      errorStatus = errorObj?.status || errorObj?.statusCode || errorObj?.response?.status || errorObj?.response?.statusCode;
      errorCode = errorObj?.code || errorObj?.response?.data?.error?.code || errorObj?.response?.data?.code;
      errorDetails = errorObj?.response?.data || errorObj?.details || errorObj?.error;
    } catch (e) {
      // Ignore parsing errors
    }
    
    // Log the actual error for debugging
    if (import.meta.env.DEV) {
      console.log('🔍 Stream error details:', {
        message: errorMessage,
        name: error instanceof Error ? error.name : 'unknown',
        status: errorStatus,
        code: errorCode,
        details: errorDetails,
        stringified: errorString.substring(0, 2000) // First 2000 chars for better debugging
      });
    }
    
    // Detect quota/rate limit errors ONLY (must be very specific to avoid false positives)
    
    // First, check if this is an authentication/configuration error (NOT a quota error)
    const isAuthError = 
      errorMessage.includes('API_KEY') ||
      errorMessage.includes('API Configuration Error') ||
      errorMessage.includes('not configured') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized') ||
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorCode === 'UNAUTHENTICATED' ||
      errorCode === 'PERMISSION_DENIED';
    
    if (isAuthError) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Authentication/configuration error detected in stream, NOT treating as quota error');
      }
      // Re-throw as-is - don't treat as quota error
      throw error;
    }
    
    // Check status code first (most reliable indicator of quota errors)
    // ONLY treat as quota error if we have EXACT status code or error code matches
    // Do NOT check generic strings to avoid false positives
    const has429Status = errorStatus === 429;
    
    // Check for RESOURCE_EXHAUSTED error code (most specific)
    const hasResourceExhausted = errorCode === 'RESOURCE_EXHAUSTED';
    
    // Check for QuotaFailure error code
    const hasQuotaFailure = errorCode === 'QuotaFailure';
    
    // Check for 429 in structured error response (JSON format only, not generic string)
    // IMPORTANT: Exclude our own error messages to prevent circular detection
    const has429InStructuredResponse = 
      (!errorString.includes('API Quota Exceeded: You\'ve reached')) && (
        errorString.includes('"status":429') || 
        errorString.includes('"code":429') ||
        (errorDetails && (errorDetails.status === 429 || errorDetails.code === 429))
      );
    
    // ONLY treat as quota error if we have definitive proof (status code or error code)
    // Do NOT check generic "quota" strings - they cause false positives
    // NEVER treat as quota error if error message contains our own error text (prevents circular detection)
    const isOurOwnError = errorMessage.includes('API Quota Exceeded') || errorMessage.includes('Rate Limit Exceeded');
    const isQuotaError = !isOurOwnError && (has429Status || has429InStructuredResponse || hasResourceExhausted || hasQuotaFailure);
    
    if (import.meta.env.DEV) {
      console.log('🔍 Stream quota error detection result:', {
        has429Status,
        has429InStructuredResponse,
        hasResourceExhausted,
        hasQuotaFailure,
        isQuotaError,
        errorStatus,
        errorCode,
        errorMessage: errorMessage.substring(0, 200)
      });
    }
    
    if (isQuotaError) {
      if (import.meta.env.DEV) {
        console.log('✅ Confirmed quota/rate limit error in stream - showing message', {
          has429Status,
          has429InStructuredResponse,
          hasResourceExhausted,
          hasQuotaFailure,
          errorStatus,
          errorCode,
          fullError: errorString.substring(0, 500)
        });
      }
      
      // Extract retry delay if available
      let retryDelay = 'a few minutes';
      let isRateLimit = false; // Distinguish rate limit (temporary) from quota (daily limit)
      
      try {
        const errorObj = typeof error === 'object' ? error : JSON.parse(errorString);
        
        // Check for retry-after header or retryDelay (indicates rate limit, not quota)
        if (errorObj?.retryDelay || errorObj?.details?.[0]?.retryDelay) {
          const delay = errorObj.retryDelay || errorObj.details[0].retryDelay;
          retryDelay = `${Math.ceil(parseInt(String(delay)) / 1000)} seconds`;
          isRateLimit = true; // Has retry delay = rate limit, not quota
        }
        
        // Check for retry-after in response headers
        if (errorObj?.response?.headers?.['retry-after'] || errorObj?.headers?.['retry-after']) {
          const retryAfter = errorObj.response?.headers?.['retry-after'] || errorObj.headers?.['retry-after'];
          retryDelay = `${retryAfter} seconds`;
          isRateLimit = true;
        }
        
        // Check error message for rate limit vs quota indicators
        if (errorMessage.toLowerCase().includes('rate limit') || 
            errorMessage.toLowerCase().includes('too many requests') ||
            errorCode === 'RATE_LIMIT_EXCEEDED') {
          isRateLimit = true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Create appropriate error message based on whether it's a rate limit or quota
      let errorMessageText: string;
      if (isRateLimit) {
        // Rate limit - temporary, should retry soon
        errorMessageText = `Rate Limit Exceeded: Too many requests to Gemini API. ` +
          `Please wait ${retryDelay} before trying again. ` +
          `This is a temporary limit (requests per minute/second), not your daily quota. ` +
          `Visit https://ai.google.dev/gemini-api/docs/rate-limits for more information.`;
      } else {
        // Quota limit - daily limit reached
        errorMessageText = `API Quota Exceeded: You've reached your daily request limit for Gemini API. ` +
          `The quota resets on a rolling 24-hour window (not at midnight). ` +
          `Please wait ${retryDelay} before trying again. ` +
          `If you're on a paid plan and seeing this error, check your API usage dashboard. ` +
          `Visit https://ai.google.dev/gemini-api/docs/rate-limits for more information.`;
      }
      
      const quotaError = new Error(
        errorMessageText +
        (import.meta.env.DEV ? ` Check the browser console for detailed error information.` : '')
      );
      quotaError.name = 'QuotaExceededError';
      throw quotaError;
    }
    
    // Log non-quota errors for debugging
    if (import.meta.env.DEV) {
      console.log('⚠️ Non-quota error in stream, showing original error', {
        errorStatus,
        errorCode,
        errorMessage: errorMessage.substring(0, 200)
      });
    }
    
    // Provide more detailed error information for other errors
    const errorStack = error instanceof Error ? error.stack : '';
    console.error("Error details:", errorStack);
    
    // If we have partial content, return it
    if (fullReport && fullReport.trim().length > 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Returning partial report due to error');
      }
      return {
        report: fullReport,
        researchData: perplexityResearch || ''
      };
    }
    
    // Last resort: try non-streaming generation (but not for quota errors)
    try {
      if (import.meta.env.DEV) {
        console.log('🔄 Attempting non-streaming generation as last resort...');
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      
      if (response.text) {
        fullReport = response.text;
        // Send all chunks at once
        onChunk(fullReport);
        if (import.meta.env.DEV) {
          console.log(`✅ Report generated via last resort fallback. Length: ${fullReport.length} characters`);
        }
        return {
          report: fullReport,
          researchData: perplexityResearch || ''
        };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback generation also failed:', fallbackError);
    }
    
    throw new Error(`Report generation failed: ${errorMessage}`);
  }
};
