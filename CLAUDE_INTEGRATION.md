# Claude AI Integration

## Overview

Anthropic Claude has been integrated into the research and verification flow as a third LLM verification layer alongside Perplexity AI and Google Gemini.

## Architecture

The multi-LLM verification system works as follows:

1. **Perplexity AI** - Performs initial deep research (web search, current data)
2. **Gemini AI** - Verifies research, checks veracity, adds depth/breadth (parallel)
3. **Claude AI** - Verifies research, checks logical consistency, identifies biases (parallel)

Both Gemini and Claude verifications run in **parallel** for optimal performance - no sequential waiting.

## Setup

### 1. Install Package

```bash
npm install @anthropic-ai/sdk@^0.71.2
```

### 2. Set API Key

Add the Anthropic API key to your `.env` file:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

Or as a fallback:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Get API Key

1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy and add to your `.env` file

## How It Works

### Verification Flow

```typescript
// 1. Perplexity performs initial research
const perplexityResearch = await performDeepResearch(researchQueries);

// 2. Gemini and Claude verify in parallel
const [geminiVerification, claudeVerification] = await Promise.allSettled([
  verifyWithGemini(perplexityResearch),
  verifyResearchWithClaude(perplexityResearch, context)
]);

// 3. Combine results intelligently
const verifiedResearch = combineVerificationResults(
  perplexityResearch,
  geminiResult,
  claudeResult
);
```

### Claude's Role

Claude provides:
- **Factual accuracy verification** - Checks claims against known facts
- **Logical consistency** - Identifies contradictions or inconsistencies
- **Bias detection** - Identifies potential biases or gaps in research
- **Depth enhancement** - Adds context and analysis
- **Breadth enhancement** - Identifies related insights and perspectives

### Performance Optimization

- **Parallel execution** - Gemini and Claude run simultaneously (no sequential waiting)
- **Graceful fallback** - If Claude is unavailable, system continues with Gemini verification
- **Timeout protection** - 30-second timeout prevents hanging
- **Error handling** - Failures don't break the flow, fallback to original research

## Files Modified

- `services/claudeService.ts` - New Claude service implementation
- `services/geminiService.ts` - Updated to use parallel verification
- `services/dashboardDataService.ts` - Updated to use parallel verification
- `package.json` - Added @anthropic-ai/sdk dependency

## Benefits

1. **Higher Accuracy** - Triple verification (Perplexity + Gemini + Claude) ensures maximum veracity
2. **Better Quality** - Multiple perspectives enhance depth and breadth of research
3. **No Performance Hit** - Parallel execution means no additional wait time
4. **Resilient** - System works even if one verification fails
5. **Comprehensive** - Claude adds logical consistency and bias detection that complements Gemini's fact-checking

## Model Used

- **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) - Latest Sonnet model for best quality
- **Temperature**: 0.3 - Lower temperature for more factual, consistent verification
- **Max Tokens**: 8000 - Allows for comprehensive verification and enhancement

## Environment Variables

The system checks for the API key in this order:
1. `VITE_ANTHROPIC_API_KEY` (for Vite environment variables)
2. `ANTHROPIC_API_KEY` (fallback)

## Error Handling

- If Claude API key is missing → System continues with Gemini-only verification
- If Claude API call fails → System falls back to Gemini verification
- If both fail → System uses original Perplexity research
- All failures are logged but don't break the application flow

## Testing

To test the integration:

1. Ensure API key is set in `.env`
2. Run a report generation
3. Check console logs for verification messages:
   - `🔍 Verifying Perplexity research with Gemini and Claude (parallel multi-LLM verification)...`
   - `✅ Research verified and enhanced by Gemini and Claude`

## Notes

- Claude verification adds approximately 0-2 seconds to report generation (runs in parallel with Gemini)
- The system gracefully degrades if Claude is unavailable
- All verification results are cached to prevent duplicate API calls

