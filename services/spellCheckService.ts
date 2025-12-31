/**
 * Spell Check and Grammar Service
 * 
 * Uses Gemini AI to check spelling and grammar in text input fields.
 * Provides suggestions for corrections via right-click context menu.
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Get Gemini AI client instance
 */
const getClient = (): GoogleGenAI => {
  const apiKey1 = process.env['API_KEY'];
  const apiKey2 = process.env['GEMINI_API_KEY'];
  
  const apiKey = (apiKey1 && apiKey1 !== 'undefined' && apiKey1 !== '' && apiKey1 !== 'your_gemini_api_key_here')
    ? apiKey1 
    : (apiKey2 && apiKey2 !== 'undefined' && apiKey2 !== '' && apiKey2 !== 'your_gemini_api_key_here')
    ? apiKey2
    : null;
    
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  
  return new GoogleGenAI({ apiKey });
};

export interface SpellCheckIssue {
  word: string;
  startIndex: number;
  endIndex: number;
  suggestions: string[];
  type: 'spelling' | 'grammar';
  message: string;
}

export interface SpellCheckResult {
  issues: SpellCheckIssue[];
  correctedText?: string;
}

/**
 * Check spelling and grammar for a given text
 */
export const checkSpellingAndGrammar = async (
  text: string,
  selectedWord?: string,
  selectedWordIndex?: number
): Promise<SpellCheckResult> => {
  if (!text || text.trim().length === 0) {
    return { issues: [] };
  }

  try {
    const ai = getClient();
    
    // If a specific word is selected, focus on that word
    const prompt = selectedWord && selectedWordIndex !== undefined
      ? `Check the spelling and grammar of the following text. Pay special attention to the word "${selectedWord}" at position ${selectedWordIndex}. 

Text: "${text}"

Return a JSON object with this structure:
{
  "issues": [
    {
      "word": "the misspelled or grammatically incorrect word",
      "startIndex": 0,
      "endIndex": 3,
      "suggestions": ["corrected word 1", "corrected word 2"],
      "type": "spelling" or "grammar",
      "message": "Brief explanation of the issue"
    }
  ],
  "correctedText": "The full text with all corrections applied"
}

Focus on the word "${selectedWord}" and provide 3-5 spelling/grammar suggestions for it.`
      : `Check the spelling and grammar of the following text:

Text: "${text}"

Return a JSON object with this structure:
{
  "issues": [
    {
      "word": "the misspelled or grammatically incorrect word",
      "startIndex": 0,
      "endIndex": 3,
      "suggestions": ["corrected word 1", "corrected word 2"],
      "type": "spelling" or "grammar",
      "message": "Brief explanation of the issue"
    }
  ],
  "correctedText": "The full text with all corrections applied"
}

Identify all spelling and grammar issues. For each issue, provide 3-5 correction suggestions.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more consistent results
      }
    });

    if (response.text) {
      try {
        const result = JSON.parse(response.text) as SpellCheckResult;
        
        // Validate and fix indices if needed
        result.issues = result.issues.map(issue => {
          // Ensure indices are within bounds
          if (issue.startIndex < 0) issue.startIndex = 0;
          if (issue.endIndex > text.length) issue.endIndex = text.length;
          if (issue.endIndex <= issue.startIndex) {
            // Try to find the word in the text
            const wordIndex = text.indexOf(issue.word, issue.startIndex);
            if (wordIndex !== -1) {
              issue.startIndex = wordIndex;
              issue.endIndex = wordIndex + issue.word.length;
            }
          }
          return issue;
        });
        
        return result;
      } catch (parseError) {
        console.error('Error parsing spell check response:', parseError);
        // Fallback: try to extract suggestions from text response
        return { issues: [] };
      }
    }
    
    return { issues: [] };
  } catch (error) {
    console.error('Error checking spelling and grammar:', error);
    return { issues: [] };
  }
};

/**
 * Get suggestions for a specific word
 */
export const getWordSuggestions = async (
  word: string,
  context: string
): Promise<string[]> => {
  if (!word || word.trim().length === 0) {
    return [];
  }

  try {
    const ai = getClient();
    
    const prompt = `Provide 5 spelling and grammar correction suggestions for the word "${word}" in this context: "${context}"

Return a JSON array of strings:
["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    if (response.text) {
      try {
        const suggestions = JSON.parse(response.text) as string[];
        return Array.isArray(suggestions) ? suggestions : [];
      } catch {
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting word suggestions:', error);
    return [];
  }
};

