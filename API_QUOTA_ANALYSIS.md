# API Quota Analysis & Solution

**Date:** December 8, 2025  
**Issue:** API Quota Exceeded (250 requests/day free tier limit)

## Problem Analysis

### The Discrepancy Explained

**Dashboard (Screenshot #1) shows:** Paid tier limits
- `gemini-2.5-flash`: 10,000 RPD (Requests Per Day)
- `gemini-2.5-flash-lite`: Unlimited RPD
- `gemini-3-pro`: 250 RPD

**Error (Screenshot #2) shows:** Free tier limit
- 250 requests per day (free tier limit)

**Root Cause:** You're on the **free tier** which has a **250 requests/day limit across ALL models**, but the dashboard is showing **paid tier limits** which are much higher.

---

## API Calls Per Board Session

A single board session makes **15-30+ API calls**:

### 1. Board Generation (1 call)
- `generateBoardMembers()`: 1 API call

### 2. Research Verification (1-2 calls)
- Perplexity research verification: 1 API call (if Perplexity data exists)
- Dashboard data verification: 1 API call

### 3. Main Analysis (1 call)
- `streamAnalysis()`: 1 API call (streaming)

### 4. ICP Profile (1 call)
- `generateICPProfile()`: 1 API call

### 5. Persona Breakdowns (4 calls)
- `generatePersonaBreakdowns()`: 20 members ÷ 5 per batch = **4 API calls**

### 6. Quality Control (5-20+ calls)
- Claim validation: Claims ÷ 5 per batch = **5-20+ API calls**
- Each claim validated individually
- With retries: Can be **10-40+ calls**

### 7. Dashboard Data (2-3 calls)
- Research verification: 1 API call
- Data extraction: 1 API call
- Retry if incomplete: +1 API call

**Total per session: 15-30+ API calls**

**With 10 sessions/day: 150-300+ API calls** → **Exceeds 250 RPD limit**

---

## Solutions

### Solution 1: Upgrade to Paid Tier (Immediate Fix)
- Upgrade your Gemini API to paid tier
- Gets you 10,000+ RPD limits
- No code changes needed

### Solution 2: Optimize API Calls (Code Changes)

#### A. Reduce Quality Control Calls
- **Current:** Validates each claim individually (5-20+ calls)
- **Optimize:** Batch multiple claims in single validation call
- **Savings:** 5-20 calls → 1-2 calls per session

#### B. Cache Dashboard Data
- **Current:** Fetches fresh data every time
- **Optimize:** Cache dashboard data for same industry/ICP for 24 hours
- **Savings:** 2-3 calls → 0 calls (if cached)

#### C. Combine Persona Generation
- **Current:** 4 batches of 5 personas
- **Optimize:** Generate all 20 personas in single call (if model supports)
- **Savings:** 4 calls → 1 call

#### D. Skip Optional Calls
- **Current:** Always runs QC validation
- **Optimize:** Make QC optional or run only on first session
- **Savings:** 5-20 calls → 0 calls (if skipped)

#### E. Reduce Retries
- **Current:** Multiple retries on failures
- **Optimize:** Single retry, then fail gracefully
- **Savings:** 2-5 calls per failure

**Potential savings: 10-25 calls per session → 5-10 calls per session**

---

## Recommended Implementation

### Priority 1: Batch Quality Control (Biggest Impact)
- Combine multiple claims into single validation call
- Reduces QC calls from 5-20+ → 1-2 per session

### Priority 2: Cache Dashboard Data
- Cache by industry + ICP titles
- 24-hour TTL
- Reduces dashboard calls from 2-3 → 0 (if cached)

### Priority 3: Make QC Optional
- Add toggle to skip QC for faster sessions
- Users can choose speed vs. accuracy

### Priority 4: Reduce Retries
- Single retry instead of multiple
- Better error messages instead of retries

---

## Quick Fix: Rate Limiting

Add client-side rate limiting to prevent hitting limits:

```typescript
// Track API calls per day
const API_CALL_TRACKER = {
  date: new Date().toDateString(),
  count: 0,
  limit: 200 // Stay under 250 to be safe
};

function checkRateLimit(): boolean {
  const today = new Date().toDateString();
  if (API_CALL_TRACKER.date !== today) {
    API_CALL_TRACKER.date = today;
    API_CALL_TRACKER.count = 0;
  }
  return API_CALL_TRACKER.count < API_CALL_TRACKER.limit;
}
```

---

## Next Steps

1. **Immediate:** Upgrade to paid tier (if budget allows)
2. **Short-term:** Implement QC batching (reduces calls by 80%)
3. **Medium-term:** Add dashboard data caching
4. **Long-term:** Make QC optional, optimize all batch sizes

---

**Status:** Analysis complete - Ready for implementation
