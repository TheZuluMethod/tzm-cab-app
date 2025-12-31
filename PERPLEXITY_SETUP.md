# Perplexity API Setup Guide

## ✅ Package Installed
The `@perplexity-ai/perplexity_ai` package (v0.16.0) has been successfully installed.

## 🔑 API Key Configuration

### Step 1: Create .env file
Create a `.env` file in the project root with the following content:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Perplexity AI API Key
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### Step 2: Restart Dev Server
After creating the `.env` file, restart your development server:
```bash
npm run dev
```

## 🚀 What's Been Optimized

### 1. **Enhanced Research Queries**
- **Industry Research**: 4 comprehensive queries covering trends, market size, innovations, and challenges
- **ICP Title Research**: 3 queries per title covering responsibilities, decision-making, and pain points
- **Competitor Research**: 3 queries per competitor covering overview, strengths/weaknesses, and market position
- **SEO Keyword Research**: 3 queries covering trends, content strategies, and competitor SEO
- **Company Size/Revenue Research**: Detailed queries about challenges, priorities, and decision-making
- **Cross-Contextual Research**: Combined queries for deeper insights

### 2. **Optimized API Usage**
- **Batch Processing**: Processes up to 10 queries per request (increased from 5)
- **Maximum Results**: Retrieves 10 results per query for comprehensive research
- **Parallel Processing**: All batches run in parallel for faster research
- **Timeout**: Increased to 60 seconds for comprehensive research
- **Search Mode**: Uses 'web' mode for real-time, current information
- **Recency Filter**: Focuses on information from the past month

### 3. **Enhanced Research Output**
- **Rich Metadata**: Includes dates and last updated timestamps
- **Better Formatting**: Clear section separators and structured output
- **Error Resilience**: Continues processing even if some batches fail

### 4. **Improved Integration**
- **Better Prompts**: Enhanced instructions to Gemini to heavily leverage Perplexity research
- **Research Context**: Clear markers in prompts showing where research data is included
- **Fact-Checking**: Explicit instructions to cross-reference findings with research data

## 📊 Research Coverage

The system now generates **15-30+ research queries** per session, covering:
- Industry trends and market dynamics
- Role-specific challenges and priorities  
- Competitive landscape intelligence
- Market language and search intent
- Company size/revenue-specific behaviors
- Cross-contextual insights

## 🔍 Verification

To verify Perplexity is working:
1. Check browser console for any Perplexity-related warnings
2. Look for "Perplexity research" in the generated reports
3. Reports should include more specific, current market data when Perplexity is active

## ⚠️ Troubleshooting

If Perplexity isn't working:
1. Verify `.env` file exists and contains `PERPLEXITY_API_KEY`
2. Check that the API key starts with `pplx-`
3. Restart the dev server after creating/updating `.env`
4. Check browser console for error messages
5. The app will gracefully fall back to Gemini-only if Perplexity fails

## 📝 Notes

- Perplexity research runs in parallel with Gemini analysis for optimal performance
- Research is cached per session to avoid redundant API calls
- The app works perfectly fine without Perplexity, but with enhanced research when configured

