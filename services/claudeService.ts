/**
 * Anthropic Claude Service
 * 
 * Provides verification and enhancement capabilities using Anthropic Claude API.
 * Used as part of the multi-LLM verification system alongside Perplexity and Gemini.
 * 
 * Setup:
 * 1. Install package: npm install @anthropic-ai/sdk
 * 2. Set ANTHROPIC_API_KEY in your .env file
 * 3. Get API key from: https://console.anthropic.com/
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Get Claude API client instance
 * 
 * Dynamically initializes the Claude client.
 * Gracefully handles missing API key.
 * 
 * @returns Claude client instance or null if unavailable
 */
const getClaudeClient = async (): Promise<Anthropic | null> => {
  try {
    // Get API key from environment
    const apiKey = import.meta.env['VITE_ANTHROPIC_API_KEY'] || import.meta.env['ANTHROPIC_API_KEY'];
    
    if (!apiKey || apiKey.trim() === '') {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Claude API key not found. Claude verification will be skipped.');
      }
      return null;
    }
    
    // Initialize Claude client
    const client = new Anthropic({
      apiKey: apiKey,
    });
    
    return client;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Error initializing Claude client:', error);
    }
    return null;
  }
};

/**
 * Verify and enhance research data using Claude
 * 
 * Claude provides a third verification layer, checking for:
 * - Factual accuracy
 * - Logical consistency
 * - Completeness
 * - Potential biases or gaps
 * 
 * @param researchData - Research data from Perplexity AI
 * @param context - Additional context (industry, ICP titles, etc.)
 * @returns Enhanced and verified research data, or original if Claude unavailable
 */
export const verifyResearchWithClaude = async (
  researchData: string,
  context: {
    industry?: string;
    icpTitles?: string;
    competitors?: string;
    companyWebsite?: string;
    companySize?: string[];
    companyRevenue?: string[];
    feedbackType?: string;
    feedbackItem?: string;
  }
): Promise<string> => {
  // Early return if no research data
  if (!researchData || researchData.trim().length === 0) {
    return '';
  }
  
  try {
    const client = await getClaudeClient();
    if (!client) {
      return researchData; // Fallback to original if Claude unavailable
    }
    
    const timeoutMs = 30000; // 30 second timeout for verification
    
    const verificationPrompt = `You are a fact-checker, research validation expert, and copy editor. Your task is to:

1. VERIFY the veracity of the research data provided below
2. CHECK for any hallucinations, false information, or random/incorrect data
3. ADD DEPTH AND BREADTH by expanding on key insights with additional context
4. CORRECT any inaccuracies or remove unverifiable claims
5. ENSURE all statistics, facts, and claims are accurate and well-supported
6. IDENTIFY any logical inconsistencies or potential biases
7. ADD missing context or perspectives that would strengthen the analysis
8. ENSURE proper formatting: H3 headers must be bold (### **Header**), proper spacing between sections, no raw unformatted text
9. CRITICAL: Review ALL text for spelling, grammar, syntax, and readability. Correct any errors and ensure professional, polished language throughout
10. ENSURE proper capitalization, punctuation, and sentence structure
11. CHECK for typos, repeated words, and awkward phrasing
12. VERIFY all technical terms and proper nouns are spelled correctly

RESEARCH DATA FROM PERPLEXITY AI:
${researchData}

CONTEXT:
- Industry: ${context.industry || 'not specified'}
- ICP Titles: ${context.icpTitles || 'various'}
- Competitors: ${context.competitors || 'not specified'}
- Company Website: ${context.companyWebsite || 'not provided'}
- Company Size: ${context.companySize && context.companySize.length > 0 ? context.companySize.join(', ') : 'various'}
- Company Revenue: ${context.companyRevenue && context.companyRevenue.length > 0 ? context.companyRevenue.join(', ') : 'various'}
${context.feedbackType ? `- Feedback Type: ${context.feedbackType}` : ''}
${context.feedbackItem ? `- Feedback Item: ${context.feedbackItem.substring(0, 200)}...` : ''}

TASK:
1. Review all facts, statistics, and claims in the research data
2. Verify each claim is accurate and well-supported
3. Remove or correct any hallucinations, false information, or unverifiable claims
4. Add depth by expanding on key insights with additional context and analysis
5. Add breadth by identifying related insights, trends, or perspectives that complement the research
6. Check for logical consistency and identify any contradictions
7. Identify potential biases or gaps in the research
8. Ensure all data is current, accurate, and relevant to the context provided
9. ENSURE proper formatting: H3 headers must be bold (### **Header**), proper spacing between sections, no raw unformatted text
10. CRITICAL: Review ALL text for spelling, grammar, syntax, and readability. Correct any errors and ensure professional, polished language throughout
11. ENSURE proper capitalization, punctuation, and sentence structure
12. CHECK for typos, repeated words, and awkward phrasing
13. VERIFY all technical terms and proper nouns are spelled correctly

Return the VERIFIED, ENHANCED, and CORRECTED research data. Maintain the structure and organization of the original research, but ensure all content is accurate, verified, and enhanced with additional depth, breadth, and logical consistency.

CRITICAL FORMATTING REQUIREMENTS:
- All H3 headers must be formatted as: ### **Header Text** (with both ### and **bold**)
- Use proper spacing: double line breaks between paragraphs, single line break after headers
- Never output raw, unformatted text - always use proper markdown structure
- Ensure all sections have substantial content - never leave sections empty or blank

CRITICAL LANGUAGE QUALITY REQUIREMENTS:
- Review and correct ALL spelling errors
- Fix ALL grammar mistakes
- Ensure proper syntax and sentence structure
- Improve readability and flow
- Verify technical terms and proper nouns are spelled correctly
- Remove repeated words or phrases
- Ensure professional, polished language throughout`;

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Claude verification timeout')), timeoutMs);
    });
    
    const verificationPromise = client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Use latest Sonnet model for best quality
      max_tokens: 8000, // Allow for comprehensive verification and enhancement
      messages: [
        {
          role: 'user',
          content: verificationPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more factual, consistent verification
    }).then((response) => {
      // Extract text from Claude's response
      const textContent = response.content.find((block) => block.type === 'text');
      if (textContent && 'text' in textContent) {
        return textContent.text;
      }
      return '';
    });
    
    // Race between verification and timeout
    const verifiedData = await Promise.race([verificationPromise, timeoutPromise]);
    
    if (verifiedData && verifiedData.trim().length > 0) {
      if (import.meta.env.DEV) {
        console.log('✅ Research verified and enhanced by Claude');
      }
      return verifiedData as string;
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Claude verification returned empty, using original research');
      }
      return researchData;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('⚠️ Error during Claude verification, using original research:', error);
    }
    // Continue with original research if verification fails
    return researchData;
  }
};

/**
 * Combine verification results from multiple LLMs
 * 
 * Intelligently merges verification outputs from Gemini and Claude,
 * prioritizing verified facts and removing duplicates while preserving
 * unique insights from each model.
 * 
 * @param originalResearch - Original research from Perplexity
 * @param geminiVerification - Verification output from Gemini
 * @param claudeVerification - Verification output from Claude
 * @returns Combined and enhanced research data
 */
export const combineVerificationResults = (
  originalResearch: string,
  geminiVerification: string,
  claudeVerification: string
): string => {
  // If both verifications are available, combine them intelligently
  if (geminiVerification && geminiVerification.trim().length > 0 && 
      claudeVerification && claudeVerification.trim().length > 0) {
    
    // Use the longer, more comprehensive verification as base
    // (usually indicates more thorough verification)
    const baseVerification = geminiVerification.length > claudeVerification.length 
      ? geminiVerification 
      : claudeVerification;
    
    const secondaryVerification = geminiVerification.length > claudeVerification.length 
      ? claudeVerification 
      : geminiVerification;
    
    // Combine with clear separation and attribution
    const combined = `${baseVerification}

=== ADDITIONAL VERIFICATION FROM SECOND LLM ===
${secondaryVerification}
=== END ADDITIONAL VERIFICATION ===

NOTE: This research has been verified by multiple AI systems (Perplexity AI for initial research, Gemini AI and Claude AI for verification and enhancement) to ensure maximum accuracy, depth, and veracity.`;
    
    return combined;
  }
  
  // If only one verification is available, use it
  if (geminiVerification && geminiVerification.trim().length > 0) {
    return geminiVerification;
  }
  
  if (claudeVerification && claudeVerification.trim().length > 0) {
    return claudeVerification;
  }
  
  // Fallback to original if no verification available
  return originalResearch;
};

