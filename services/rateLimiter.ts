/**
 * Rate Limiter for Gemini API
 * 
 * Ensures we don't exceed the free tier rate limit of 5 requests per minute
 * by adding delays between API calls.
 */

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  windowMs: number; // Time window in milliseconds (default: 60 seconds)
}

class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequestsPerMinute: 5, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * Wait if necessary to stay under the rate limit
   */
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove requests outside the current window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    // If we're at the limit, wait until the oldest request expires
    if (this.requests.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = this.requests[0];
      const waitTime = (oldestRequest + this.config.windowMs) - now + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        if (import.meta.env.DEV) {
          console.log(`⏳ Rate limiter: Waiting ${Math.ceil(waitTime / 1000)}s to stay under ${this.config.maxRequestsPerMinute} req/min limit`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Clean up again after waiting
        const newNow = Date.now();
        this.requests = this.requests.filter(timestamp => timestamp > (newNow - this.config.windowMs));
      }
    }

    // Record this request
    this.requests.push(Date.now());
  }

  /**
   * Get current request count in the window
   */
  getCurrentCount(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    return this.requests.length;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

// Create a singleton instance for the app
// Free tier: 5 requests per minute
// Paid tier: Much higher (1500+), but we'll use 5 as safe default for free tier
// In production with paid plan, this can be increased or disabled
const getRateLimitConfig = (): RateLimitConfig => {
  // Check if we're in production and have a paid plan indicator
  // For now, use free tier limits (5 req/min)
  // TODO: When ready for production, increase this or make it configurable via env var
  const isProduction = import.meta.env.PROD;
  const maxRequests = isProduction ? 1500 : 5; // Higher limit in production (assumes paid plan)
  
  return {
    maxRequestsPerMinute: maxRequests,
    windowMs: 60000 // 60 seconds
  };
};

const defaultRateLimiter = new RateLimiter(getRateLimitConfig());

export default defaultRateLimiter;
export { RateLimiter };

