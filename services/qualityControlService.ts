/**
 * Quality Control Service
 * 
 * Validates generated reports to ensure 100% accuracy, prevent hallucinations,
 * and verify all data, statistics, and claims are accurate and real.
 * 
 * This service performs:
 * - Fact-checking of claims and statistics
 * - Source verification
 * - Hallucination detection
 * - Data accuracy validation
 * - Cross-referencing with original research data
 */

import { GoogleGenAI, Type } from "@google/genai";
import { reportError } from "./errorReportingService";

/**
 * List of Gemini models to try in order (fallback chain)
 * Only includes models that are available in the current API version
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp'
  // Note: gemini-1.5-flash and gemini-1.5-pro are not available in v1beta API, removed from chain
];

/**
 * Check if an error is a token/quota/rate limit error that should trigger model fallback
 * 
 * IMPORTANT: Must be very specific to avoid false positives.
 * Only actual quota/rate limit errors should trigger fallback, not authentication or other errors.
 */
const isModelLimitError = (error: any): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = JSON.stringify(error);
  
  // Extract error details from the error object
  let errorStatus: number | undefined;
  let errorCode: string | undefined;
  
  try {
    const errorObj = error as any;
    errorStatus = errorObj?.status || errorObj?.statusCode || errorObj?.response?.status || errorObj?.response?.statusCode;
    errorCode = errorObj?.code || errorObj?.response?.data?.error?.code || errorObj?.response?.data?.code;
  } catch (e) {
    // Ignore parsing errors
  }
  
  // Check for model not found (404) - should try next model
  const isModelNotFound = 
    errorStatus === 404 ||
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
    // HTTP 429 status code (most reliable indicator)
    errorStatus === 429 ||
    errorMessage.includes('429') ||
    errorString.includes('429') ||
    errorString.includes('"status":429') ||
    errorString.includes('"code":429') ||
    // RESOURCE_EXHAUSTED error code (most specific)
    errorCode === 'RESOURCE_EXHAUSTED' ||
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorString.includes('RESOURCE_EXHAUSTED') ||
    // QuotaFailure error code
    errorCode === 'QuotaFailure' ||
    errorString.includes('QuotaFailure') ||
    errorMessage.includes('QuotaFailure') ||
    // Specific quota exceeded messages (must include both "quota" AND "exceeded"/"limit"/"reached")
    (errorMessage.includes('quota') && (errorMessage.includes('exceeded') || errorMessage.includes('limit') || errorMessage.includes('reached'))) ||
    (errorString.includes('quota') && (errorString.includes('exceeded') || errorString.includes('limit') || errorString.includes('reached'))) ||
    // Rate limit exceeded (must include both "rate limit" AND "exceeded")
    (errorMessage.includes('rate limit') && errorMessage.includes('exceeded')) ||
    (errorString.includes('rate limit') && errorString.includes('exceeded')) ||
    // Token limit errors (but NOT authentication token errors - must be specific)
    (errorMessage.includes('token limit') && (errorMessage.includes('exceeded') || errorMessage.includes('too many'))) ||
    (errorString.includes('token limit') && (errorString.includes('exceeded') || errorString.includes('too many'))) ||
    errorMessage.includes('TokenLimitExceeded') ||
    errorString.includes('TokenLimitExceeded');
  
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
      console.warn('Failed to report model fallback via email');
    });
  } catch (e) {
    console.warn('Error reporting model fallback:', e);
  }
};

/**
 * Generic wrapper for model calls with automatic fallback
 */
const callWithModelFallback = async <T>(
  _ai: GoogleGenAI,
  callFn: (model: string) => Promise<T>,
  context: string
): Promise<T> => {
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
        console.log(`✅ Fallback successful: ${firstModel} → ${model} for ${context}`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a model limit error and not the last model, try next
      if (isModelLimitError(error) && model !== MODEL_FALLBACK_CHAIN[MODEL_FALLBACK_CHAIN.length - 1]) {
        console.warn(`⚠️ Model ${model} hit limit in ${context}, trying fallback...`);
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
 * Get Gemini AI client instance for QC validation
 * Uses the same API key resolution as geminiService
 */
const getClient = (): GoogleGenAI => {
  // Check both API_KEY and GEMINI_API_KEY for compatibility
  // Handle both string values and potential 'undefined' strings from Vite
  const apiKey1 = process.env['API_KEY'];
  const apiKey2 = process.env['GEMINI_API_KEY'];
  
  // Check if either key exists and is not empty/undefined/placeholder
  const apiKey = (apiKey1 && apiKey1 !== 'undefined' && apiKey1 !== '' && apiKey1 !== 'your_gemini_api_key_here')
    ? apiKey1 
    : (apiKey2 && apiKey2 !== 'undefined' && apiKey2 !== '' && apiKey2 !== 'your_gemini_api_key_here')
    ? apiKey2
    : null;
    
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file and restart the dev server.');
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Quality control issues found during validation
 */
export interface QCIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'hallucination' | 'unverified_claim' | 'statistic_mismatch' | 'source_missing' | 'data_inconsistency';
  location: string; // Section or context where issue was found
  originalText: string; // The problematic text
  issue: string; // Description of the issue
  suggestedCorrection?: string; // Suggested fix if available
}

/**
 * Quality control validation result
 */
export interface QCResult {
  isValid: boolean;
  issues: QCIssue[];
  verifiedClaims: number;
  totalClaims: number;
  accuracyScore: number; // 0-100
  corrections?: string; // Corrected version of the content
}

/**
 * Validate multiple claims in a single batch to reduce API calls
 * This significantly reduces API usage (e.g., 10 claims = 1 API call instead of 10)
 */
const validateClaimsBatch = async (
  claims: string[],
  researchData: string,
  context: string
): Promise<Array<{ isValid: boolean; issue?: QCIssue; claim: string }>> => {
  if (claims.length === 0) {
    return [];
  }

  const ai = getClient();
  
  const prompt = `
You are a fact-checker and data validation expert. Your job is to verify if multiple claims are accurate and supported by evidence.

CLAIMS TO VERIFY:
${claims.map((claim, idx) => `${idx + 1}. "${claim}"`).join('\n')}

RESEARCH DATA AVAILABLE:
${researchData || 'No research data provided'}

CONTEXT:
${context}

TASK:
For EACH claim above, check:
1. If the claim contains specific numbers, statistics, percentages, or factual statements
2. If the claim is supported by the research data provided
3. Identify if the claim appears to be:
   - A hallucination (completely made up)
   - An unverified claim (not supported by research)
   - A statistic mismatch (numbers don't match research)
   - Potentially accurate (supported by research)

Return a JSON response with this structure:
{
  "validations": [
    {
      "claimIndex": 0,
      "isValid": true/false,
      "hasSpecificData": true/false,
      "isSupportedByResearch": true/false,
      "issueType": "none" | "hallucination" | "unverified_claim" | "statistic_mismatch",
      "confidence": "high" | "medium" | "low",
      "explanation": "Brief explanation"
    },
    ... (one for each claim)
  ]
}

Be strict: If a claim contains specific numbers or statistics that aren't in the research data, mark it as potentially problematic.
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      validations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            claimIndex: { type: Type.NUMBER },
            isValid: { type: Type.BOOLEAN },
            hasSpecificData: { type: Type.BOOLEAN },
            isSupportedByResearch: { type: Type.BOOLEAN },
            issueType: {
              type: Type.STRING,
              enum: ['none', 'hallucination', 'unverified_claim', 'statistic_mismatch']
            },
            confidence: {
              type: Type.STRING,
              enum: ['high', 'medium', 'low']
            },
            explanation: { type: Type.STRING }
          },
          required: ['claimIndex', 'isValid', 'hasSpecificData', 'isSupportedByResearch', 'issueType', 'confidence', 'explanation']
        }
      }
    },
    required: ['validations']
  };

  try {
    const response = await callWithModelFallback(
      ai,
      async (model) => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1, // Low temperature for factual accuracy
          }
        });

        if (response.text) {
          return JSON.parse(response.text);
        }
        throw new Error("No text returned from API");
      },
      'validateClaimsBatch'
    );

    if (response && response.validations && Array.isArray(response.validations)) {
      return response.validations.map((validation: any) => {
        const claim = claims[validation.claimIndex] || '';
        
        if (!validation.isValid || validation.issueType !== 'none') {
          const issue: QCIssue = {
            severity: validation.issueType === 'hallucination' ? 'error' : 'warning',
            type: validation.issueType === 'hallucination'
              ? 'hallucination'
              : validation.issueType === 'statistic_mismatch'
              ? 'statistic_mismatch'
              : 'unverified_claim',
            location: context,
            originalText: claim,
            issue: validation.explanation,
            suggestedCorrection: validation.isSupportedByResearch
              ? 'Verify against research data'
              : 'Remove or replace with verified information'
          };
          return { isValid: false, issue, claim };
        }
        
        return { isValid: true, claim };
      });
    }
  } catch (error) {
    console.error('Error validating claims batch:', error);
    // Fallback: mark all as unverified
    return claims.map(claim => ({
      isValid: false,
      issue: {
        severity: 'warning' as const,
        type: 'unverified_claim' as const,
        location: context,
        originalText: claim,
        issue: 'Could not validate claim - API error'
      },
      claim
    }));
  }

  // Fallback: mark all as unverified
  return claims.map(claim => ({
    isValid: false,
    issue: {
      severity: 'warning' as const,
      type: 'unverified_claim' as const,
      location: context,
      originalText: claim,
      issue: 'Could not validate claim - no response from validation API'
    },
    claim
  }));
};


/**
 * Extract claims and statistics from report content
 */
const extractClaims = (content: string): string[] => {
  const claims: string[] = [];
  
  // Extract sentences with numbers, percentages, statistics
  const statisticPattern = /\d+[%x]?|\d+\.\d+[%]?/g;
  const sentences = content.split(/[.!?]\s+/);
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length < 10) return; // Skip very short sentences
    
    // Skip markdown table separator rows (lines with only dashes and pipes)
    if (/^\|[\s\-:]+\|[\s\-:]+\|/.test(trimmed)) {
      return; // Skip table separator rows
    }
    
    // Check for statistics, percentages, or specific numbers
    if (statisticPattern.test(trimmed)) {
      claims.push(trimmed);
    }
    
    // Check for strong factual claims (contains "is", "are", "has", "have" with specific data)
    if (/\b(is|are|has|have|was|were)\b/i.test(trimmed) && trimmed.length > 20) {
      // Check if it contains specific data points
      if (/\d+/.test(trimmed) || /\b(million|billion|thousand|percent|%)\b/i.test(trimmed)) {
        claims.push(trimmed);
      }
    }
    
    // Also extract table cell content that might contain claims
    if (trimmed.includes('|') && trimmed.length > 20) {
      // Extract content from table cells (between pipes)
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
      cells.forEach(cell => {
        // Skip if it's just emojis or separators
        if (/^[\u{1F300}-\u{1F9FF}]+$/u.test(cell)) return;
        if (/^[\-:]+$/.test(cell)) return;
        
        // Check if cell contains factual claims
        if (statisticPattern.test(cell) || /\b(is|are|has|have|was|were)\b/i.test(cell)) {
          if (cell.length > 15) {
            claims.push(cell);
          }
        }
      });
    }
  });
  
  // Remove duplicates
  return [...new Set(claims)];
};

/**
 * Retry a function with exponential backoff
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`⚠️ QC attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('QC retry failed');
};

/**
 * Fallback validation when API calls fail - basic pattern matching
 */
const fallbackValidation = (
  reportContent: string,
  researchData: string
): QCResult => {
  console.warn('⚠️ Using fallback QC validation (API unavailable)');
  
  const claims = extractClaims(reportContent);
  const totalClaims = claims.length;
  
  if (totalClaims === 0) {
    return {
      isValid: true,
      issues: [],
      verifiedClaims: 0,
      totalClaims: 0,
      accuracyScore: 100
    };
  }
  
  // Basic pattern matching: check if claim keywords appear in research data
  let verifiedClaims = 0;
  const issues: QCIssue[] = [];
  
  claims.forEach((claim, index) => {
    const claimLower = claim.toLowerCase();
    const researchLower = researchData.toLowerCase();
    
    // Extract key terms from claim (numbers, percentages, key nouns)
    const keyTerms = claimLower.match(/\d+[%]?|\b\w{4,}\b/g) || [];
    
    // If we have research data, check if key terms appear
    if (researchData.trim().length > 0) {
      const matchingTerms = keyTerms.filter(term => researchLower.includes(term));
      // If at least 30% of key terms match, consider it potentially verified
      if (matchingTerms.length / Math.max(keyTerms.length, 1) >= 0.3) {
        verifiedClaims++;
      } else {
        issues.push({
          severity: 'warning',
          type: 'unverified_claim',
          location: `Report section ${index + 1}`,
          originalText: claim,
          issue: 'Claim could not be verified against research data (fallback validation)'
        });
      }
    } else {
      // No research data - flag as unverified
      issues.push({
        severity: 'warning',
        type: 'unverified_claim',
        location: `Report section ${index + 1}`,
        originalText: claim,
        issue: 'No research data available for verification (fallback validation)'
      });
    }
  });
  
  const accuracyScore = totalClaims > 0 
    ? Math.round((verifiedClaims / totalClaims) * 100)
    : 100;
  
  return {
    isValid: accuracyScore >= 50, // Lower threshold for fallback
    issues,
    verifiedClaims,
    totalClaims,
    accuracyScore
  };
};

/**
 * Perform comprehensive quality control on generated report content
 * 
 * CRITICAL: This function MUST always complete successfully. It uses retries,
 * fallbacks, and error recovery to ensure QC always runs, even if API calls fail.
 * 
 * @param reportContent - The generated report markdown content
 * @param researchData - The original Perplexity research data used
 * @param userInput - User input context for validation
 * @returns QCResult with validation findings (always succeeds)
 */
export const performQualityControl = async (
  reportContent: string,
  researchData: string,
  _userInput: {
    industry?: string;
    icpTitles?: string;
    competitors?: string;
    feedbackItem?: string;
  }
): Promise<QCResult> => {
    // Extract all claims and statistics from the report
    const claims = extractClaims(reportContent);
  const totalClaims = claims.length;
    
    if (totalClaims === 0) {
      // No specific claims to validate - this is actually good (no made-up stats)
      return {
        isValid: true,
        issues: [],
        verifiedClaims: 0,
        totalClaims: 0,
        accuracyScore: 100 // Perfect score since no unverified claims exist
      };
    }
  
  // Try full QC validation with retries
  try {
    return await retryWithBackoff(async () => {
      const issues: QCIssue[] = [];
      let verifiedClaims = 0;
    
    // Validate claims in batches to reduce API calls significantly
    // Instead of 1 call per claim, we batch multiple claims per call
    // This reduces API usage from 10-20+ calls to 1-2 calls per session
    const BATCH_SIZE = 20; // Increased batch size - validate 20 claims per API call (reduces API calls by 50%)
    const batches: string[][] = [];
    
    for (let i = 0; i < claims.length; i += BATCH_SIZE) {
      batches.push(claims.slice(i, i + BATCH_SIZE));
    }
    
    // Process batches sequentially to avoid rate limits
    for (const batch of batches) {
      try {
        const context = `Report section containing ${batch.length} claims`;
        
        // Validate entire batch in single API call (much more efficient!)
        const batchResults = await retryWithBackoff(
          () => validateClaimsBatch(batch, researchData, context),
          1, // 1 retry per batch (reduced to save API calls)
          1000 // 1s base delay
        );
        
        // Process batch results
        batchResults.forEach((result) => {
          if (result.isValid) {
            verifiedClaims++;
          } else if (result.issue) {
            issues.push(result.issue);
          }
        });
      } catch (batchError) {
        console.error('Error validating batch:', batchError);
        // Mark all claims in batch as unverified on error
        batch.forEach(claim => {
          issues.push({
            severity: 'warning',
            type: 'unverified_claim',
            location: 'QC Process',
            originalText: claim,
            issue: 'Could not validate claim - batch validation failed'
          });
        });
      }
    }
    
    // Calculate accuracy score
    const accuracyScore = totalClaims > 0 
      ? Math.round((verifiedClaims / totalClaims) * 100)
      : 100;
    
    // Determine if report is valid (no critical errors)
    const hasErrors = issues.some(issue => issue.severity === 'error');
    const isValid = !hasErrors && accuracyScore >= 90; // At least 90% accuracy required
    
    // Generate corrections ONLY if score is significantly below threshold (< 85%)
    // This prevents unnecessary API calls when score is close to acceptable
    let corrections: string | undefined;
    if (accuracyScore < 85 && issues.length > 0 && issues.some(i => i.severity === 'error')) {
      try {
          corrections = await retryWithBackoff(
            () => generateCorrections(reportContent, issues, researchData),
            1, // 1 retry for corrections (reduced to save API calls)
            1000 // 1s base delay
          );
      } catch (correctionError) {
          console.error('⚠️ Correction generation failed after retries, continuing without corrections:', correctionError);
        // Continue without corrections - report is still valid
      }
    }
    
    return {
      isValid,
      issues,
      verifiedClaims,
      totalClaims,
      accuracyScore,
      corrections
    };
    }, 3, 2000); // 3 retries with 2s base delay
  } catch (error) {
    console.error('❌ QC failed after all retries, using fallback validation:', error);
    
    // CRITICAL: Always return a result, even if API calls fail
    // Use fallback validation to ensure QC completes
    const fallbackResult = fallbackValidation(reportContent, researchData);
    
    // Add a warning issue about fallback usage
    fallbackResult.issues.unshift({
        severity: 'warning',
        type: 'data_inconsistency',
        location: 'QC Process',
        originalText: '',
      issue: `QC API calls failed, used fallback validation. Full validation unavailable: ${error instanceof Error ? error.message : String(error)}`
    });
    
    return fallbackResult;
  }
};

/**
 * Generate corrected version of content based on QC issues
 */
const generateCorrections = async (
  content: string,
  issues: QCIssue[],
  researchData: string
): Promise<string> => {
  try {
    const ai = getClient();
    
    const criticalIssues = issues.filter(i => i.severity === 'error');
    if (criticalIssues.length === 0) {
      return content; // No critical issues, return original
    }
    
    const prompt = `
You are a fact-checker correcting a report to remove hallucinations and unverified claims.

ORIGINAL REPORT:
${content}

QUALITY CONTROL ISSUES FOUND:
${criticalIssues.map((issue, idx) => `
${idx + 1}. [${issue.type.toUpperCase()}] ${issue.location}
   Original: "${issue.originalText}"
   Issue: ${issue.issue}
   ${issue.suggestedCorrection ? `Suggestion: ${issue.suggestedCorrection}` : ''}
`).join('\n')}

RESEARCH DATA (Verified Sources):
${researchData || 'No research data available'}

TASK:
1. Remove or correct all flagged hallucinations and unverified claims
2. Replace with verified information from research data when possible
3. If no verified data exists, remove the claim entirely or mark it as "requires verification"
4. Preserve the report structure and formatting
5. Maintain the same tone and style
6. Do NOT add new unverified claims

Return the corrected report content. Only include verified, fact-checked information.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1, // Low temperature for accuracy
      }
    });

    if (response.text) {
      return response.text;
    }
    
    return content; // Return original if correction fails
  } catch (error) {
    console.error('Error generating corrections:', error);
    return content; // Return original on error
  }
};

/**
 * Quick validation check for specific sections
 * Used for real-time validation during streaming
 */
export const quickValidateSection = async (
  sectionContent: string,
  researchData: string
): Promise<{ hasIssues: boolean; warnings: string[] }> => {
  const warnings: string[] = [];
  
  // Quick checks for common hallucination patterns
  const suspiciousPatterns = [
    /\d+% (increase|decrease|growth|reduction)/i, // Specific percentages
    /\$\d+[KMB]?/i, // Specific dollar amounts
    /\d+ (million|billion|thousand)/i, // Large numbers
  ];
  
  const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => pattern.test(sectionContent));
  
  if (hasSuspiciousPatterns && !researchData) {
    warnings.push('Section contains specific statistics but no research data available for verification');
  }
  
  return {
    hasIssues: warnings.length > 0,
    warnings
  };
};

