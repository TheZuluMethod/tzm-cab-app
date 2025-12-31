/**
 * Perplexity AI Service
 * 
 * Provides deep research capabilities using Perplexity AI API.
 * Gracefully falls back to Gemini-only research if Perplexity is unavailable.
 * 
 * Setup:
 * 1. Install package: npm install @perplexity-ai/perplexity_ai
 * 2. Set PERPLEXITY_API_KEY in your .env file
 * 3. Get API key from: https://www.perplexity.ai/settings/api
 */

/**
 * Perplexity API Client Interface
 * Based on @perplexity-ai/perplexity_ai package structure
 */
interface PerplexityClient {
  search: {
    create: (params: {
      query: string | string[];
      max_results?: number;
      max_tokens?: number;
      search_mode?: 'web' | 'academic' | 'sec' | null;
      search_recency_filter?: 'hour' | 'day' | 'week' | 'month' | 'year' | null;
    }) => Promise<{
      id: string;
      results: Array<{
        title: string;
        url: string;
        snippet: string;
        date?: string | null;
        last_updated?: string | null;
      }>;
      server_time?: string | null;
    }>;
  };
}

/**
 * Get Perplexity API client instance
 * @returns Perplexity client or null if unavailable
 */
/**
 * Get Perplexity API client instance
 * 
 * Dynamically imports and initializes the Perplexity client.
 * Gracefully handles missing package or API key.
 * 
 * @returns Perplexity client instance or null if unavailable
 */
const getPerplexityClient = async (): Promise<PerplexityClient | null> => {
  // Check for API key first
  const apiKey = process.env['PERPLEXITY_API_KEY'];
  if (!apiKey || apiKey.trim() === '') {
    console.warn('⚠️ Perplexity API key not found. Falling back to Gemini-only research.');
    return null;
  }
  
  // Try to dynamically import Perplexity - this will fail gracefully if package isn't installed
  try {
    // Use dynamic import with a variable to prevent static analysis
    const moduleName = '@perplexity-ai/perplexity_ai';
    const perplexityModule = await import(/* @vite-ignore */ moduleName);
    
    // The package exports Perplexity as default
    const Perplexity = perplexityModule.default;
    
    if (!Perplexity || typeof Perplexity !== 'function') {
      console.warn('⚠️ Perplexity module not found in expected format. Falling back to Gemini-only research.');
      return null;
    }
    
    // Initialize client with API key
    // The constructor expects { apiKey: string }
    const client = new Perplexity({ apiKey }) as PerplexityClient;
    
    // Verify client has the required search method
    if (!client?.search?.create) {
      console.warn('⚠️ Perplexity client missing search.create method. Falling back to Gemini-only research.');
      return null;
    }
    
    console.log('✅ Perplexity AI client initialized successfully');
    return client;
  } catch (error) {
    // Package not installed or other error - return null to use Gemini-only
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('⚠️ Perplexity package not available:', errorMessage);
    console.warn('💡 Falling back to Gemini-only research. To enable Perplexity: npm install @perplexity-ai/perplexity_ai');
    return null;
  }
};

/**
 * Perform deep research using Perplexity AI
 * 
 * @param queries - Array of research queries to execute
 * @returns Research summary string, or empty string if Perplexity unavailable
 */
export const performDeepResearch = async (queries: string[]): Promise<string> => {
  // Early return if no queries provided
  if (!queries || queries.length === 0) {
    return '';
  }
  
  try {
    const client = await getPerplexityClient();
    if (!client) {
      return ''; // Fallback to Gemini-only if Perplexity not available
    }
    
    // Optimize query processing for maximum research depth
    // Perplexity API supports arrays of queries in a single request for better efficiency
    const MAX_QUERIES_PER_REQUEST = 10; // Perplexity can handle multiple queries efficiently
    const MAX_RESULTS_PER_QUERY = 10; // Get more results per query for comprehensive research
    const timeoutMs = 60000; // 60 second timeout for comprehensive research
    
    // Split queries into optimized batches
    const batches: string[][] = [];
    for (let i = 0; i < queries.length; i += MAX_QUERIES_PER_REQUEST) {
      batches.push(queries.slice(i, i + MAX_QUERIES_PER_REQUEST));
    }
    
    // Process all batches in parallel for faster research
    const batchPromises = batches.map(async (batch) => {
      try {
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Perplexity research timeout')), timeoutMs);
        });
        
        // Execute search with optimized parameters for deep research
        const queryParam: string | string[] = batch.length === 1 ? (batch[0] ?? '') : batch;
        const searchPromise = client.search.create({
          query: queryParam, // Single query as string, multiple as array
          max_results: MAX_RESULTS_PER_QUERY, // Get maximum results for comprehensive research
          search_mode: 'web', // Use web search mode for current, real-time information
          search_recency_filter: 'month' // Focus on recent information (last month)
        }).then((search) => {
          // Combine all research results into a comprehensive research summary
          if (!search.results || search.results.length === 0) {
            return '';
          }
          
          // Format results with rich metadata for better context
          const batchResults = search.results
            .map((result) => {
              const title = result.title || 'Untitled';
              const url = result.url || '';
              const snippet = result.snippet || '';
              const date = result.date ? ` (${result.date})` : '';
              const lastUpdated = result.last_updated ? ` [Updated: ${result.last_updated}]` : '';
              
              return `[${title}]${url ? ` ${url}` : ''}${date}${lastUpdated}\n${snippet}`;
            })
            .filter(result => result.trim().length > 0);
          
          return batchResults.join('\n\n');
        });
        
        // Race between search and timeout
        const batchResult = await Promise.race([searchPromise, timeoutPromise]);
        return batchResult as string;
      } catch (error) {
        // Log batch error but continue with other batches
        console.warn(`Perplexity batch error:`, error instanceof Error ? error.message : 'Unknown error');
        return '';
      }
    });
    
    // Wait for all batches to complete
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Combine all successful batch results with clear section separators
    const comprehensiveResearch = batchResults
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && result.value.trim().length > 0
      )
      .map(result => result.value)
      .join('\n\n---\n\n');
    
    return comprehensiveResearch;
  } catch (error) {
    // Log error but don't break the flow
    console.error('Perplexity research error:', error instanceof Error ? error.message : 'Unknown error');
    // Return empty string if Perplexity fails - don't break the flow
    return '';
  }
};

/**
 * Research query input parameters
 */
interface ResearchQueryInput {
  companyWebsite?: string;
  industry?: string;
  icpTitles?: string;
  solutions?: string;
  coreProblems?: string;
  competitors?: string;
  seoKeywords?: string;
  companySize?: string[];
  companyRevenue?: string[];
  feedbackType?: string;
  feedbackItem?: string;
}

/**
 * Generate research queries based on user input for ICP and industry research
 * 
 * @param input - User input parameters for generating research queries
 * @returns Array of research query strings
 */
/**
 * Generate comprehensive research queries for deep market analysis
 * 
 * Creates optimized queries that maximize research depth and relevance.
 * Queries are designed to extract:
 * - Industry trends and market dynamics
 * - Role-specific challenges and priorities
 * - Competitive landscape insights
 * - Market language and search intent
 * - Company size/revenue-specific behaviors
 * 
 * @param input - User input parameters for generating research queries
 * @returns Array of research query strings (typically 15-30+ queries)
 */
export const generateResearchQueries = (input: ResearchQueryInput): string[] => {
  const queries: string[] = [];
  const industry = input.industry?.trim() || 'B2B';
  
  // ===== COMPANY WEBSITE RESEARCH (Deep Analysis - 8 queries) =====
  if (input.companyWebsite && input.companyWebsite.trim()) {
    const website = input.companyWebsite.trim();
    queries.push(`${website} company overview, products, services, and value propositions - search website content, about page, product pages`);
    queries.push(`${website} target market, customer base, and ICP alignment - search case studies, testimonials, and customer stories`);
    queries.push(`${website} competitive positioning, market differentiation, and unique selling points - search marketing materials and positioning statements`);
    queries.push(`${website} industry presence, market share, and brand recognition - search industry reports, news articles, and market analysis`);
    queries.push(`${website} technology stack, platform capabilities, and technical offerings - search product documentation and technical resources`);
    queries.push(`${website} pricing strategy, business model, and revenue streams - search pricing pages, plans, and business model information`);
    queries.push(`${website} marketing messaging, content strategy, and SEO approach - search blog, content library, and marketing materials`);
    queries.push(`${website} customer reviews, feedback, and market sentiment - search review sites, social media, and customer communities`);
  }

  // ===== INDUSTRY RESEARCH (Foundation - 6 queries with deep sources) =====
  if (input.industry && input.industry.trim()) {
    queries.push(`Latest trends, market analysis, and growth drivers in ${input.industry} industry 2024-2025 - search LinkedIn, industry reports, and market research sites`);
    queries.push(`${input.industry} market size, growth rate, TAM (Total Addressable Market), and key market players - search Gartner, Forrester, industry publications`);
    queries.push(`Emerging technologies and innovations in ${input.industry} sector - search tech blogs, research papers, and industry news`);
    queries.push(`${input.industry} industry challenges, pain points, and opportunities - search LinkedIn discussions, forums, and industry analysis`);
    queries.push(`${input.industry} buyer behavior, decision-making processes, and purchasing patterns - search research studies and market intelligence`);
    queries.push(`${input.industry} competitive landscape, market positioning, and differentiation strategies - search company websites, case studies, and industry reports`);
  }

  // ===== ICP TITLE RESEARCH (Role-Specific - 5 queries per title with LinkedIn and deep sources) =====
  if (input.icpTitles && input.icpTitles.trim()) {
    const titles = input.icpTitles
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    titles.forEach(title => {
      // Multiple angles for each title to get comprehensive insights from diverse sources
      queries.push(`${title} role responsibilities, daily challenges, and key priorities in ${industry} - search LinkedIn profiles, job descriptions, and role-specific forums`);
      queries.push(`${title} decision-making process, budget authority, and vendor evaluation criteria in ${industry} - search research papers, case studies, and industry reports`);
      queries.push(`${title} common pain points, goals, and success metrics in ${industry} companies - search LinkedIn discussions, Reddit, and professional communities`);
      queries.push(`${title} communication preferences, information sources, and trusted resources in ${industry} - search professional networks and industry publications`);
      queries.push(`${title} career paths, skill requirements, and industry trends in ${industry} - search LinkedIn, industry blogs, and professional development sites`);
    });
  }

  // ===== COMPETITOR RESEARCH (Competitive Intelligence - 5 queries per competitor with deep sources) =====
  if (input.competitors && input.competitors.trim()) {
    const competitors = input.competitors
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    competitors.forEach(competitor => {
      queries.push(`${competitor} company overview, products, services, and market position - search company website, LinkedIn, and industry databases`);
      queries.push(`${competitor} strengths, weaknesses, pricing strategy, and customer reviews - search G2, Capterra, Trustpilot, and review sites`);
      queries.push(`${competitor} market share, growth trajectory, and competitive advantages - search market research reports, financial filings, and industry analysis`);
      queries.push(`${competitor} marketing messaging, positioning, and brand strategy - search their website, blog, social media, and marketing materials`);
      queries.push(`${competitor} customer base, target market, and ICP alignment - search case studies, customer testimonials, and industry publications`);
    });
  }

  // ===== SEO KEYWORD RESEARCH (Market Language & Intent - 4 queries with deep sources) =====
  if (input.seoKeywords && input.seoKeywords.trim()) {
    const keywords = input.seoKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    queries.push(`Market trends, search volume, and buyer intent for keywords: ${keywords.join(', ')} - search Google Trends, SEMrush, Ahrefs, and keyword research tools`);
    queries.push(`Content marketing strategies and messaging that resonates for: ${keywords.join(', ')} - search top-ranking content, industry blogs, and content marketing sites`);
    queries.push(`Competitor content and SEO strategies for: ${keywords.join(', ')} - search competitor websites, content libraries, and SEO analysis tools`);
    queries.push(`User questions, pain points, and search intent behind keywords: ${keywords.join(', ')} - search Reddit, Quora, forums, and Q&A sites`);
  }

  // ===== COMPANY SIZE RESEARCH (Organizational Context - 4 queries with deep sources) =====
  if (input.companySize && input.companySize.length > 0) {
    const sizeRanges = input.companySize.join(' or ');
    queries.push(`Business challenges, priorities, and operational needs for companies with ${sizeRanges} employees - search industry reports, case studies, and business research`);
    queries.push(`Technology adoption patterns and budget allocation for ${sizeRanges} employee companies - search IT research, Gartner, Forrester, and tech industry reports`);
    queries.push(`Decision-making structure and buying process for ${sizeRanges} employee organizations - search organizational behavior research and B2B buying studies`);
    queries.push(`Growth patterns, scaling challenges, and organizational maturity for ${sizeRanges} employee companies - search business growth research and company case studies`);
  }

  // ===== COMPANY REVENUE RESEARCH (Budget & Investment Context - 4 queries with deep sources) =====
  if (input.companyRevenue && input.companyRevenue.length > 0) {
    const revenueRanges = input.companyRevenue.join(' or ');
    queries.push(`Budget considerations, investment priorities, and ROI expectations for companies with ${revenueRanges} annual revenue - search financial research and industry benchmarks`);
    queries.push(`Vendor evaluation criteria and procurement processes for ${revenueRanges} revenue companies - search procurement research, RFP databases, and vendor selection studies`);
    queries.push(`Technology spending patterns and strategic initiatives for ${revenueRanges} revenue organizations - search IT spending reports, Gartner, and technology investment research`);
    queries.push(`Financial decision-making, budget authority, and investment approval processes for ${revenueRanges} revenue companies - search financial management research and CFO insights`);
  }

  // ===== FEEDBACK-TYPE SPECIFIC RESEARCH =====
  const feedbackType = input.feedbackType?.toLowerCase() || '';
  
  // Pricing & Packaging Research
  if (feedbackType.includes('pricing') || feedbackType.includes('packaging')) {
    // Pricing expert research
    queries.push(`Marcos Rivera pricing strategies, frameworks, and insights for B2B SaaS companies - search LinkedIn profile https://www.linkedin.com/in/marcoslrivera/ and publications`);
    queries.push(`Ulrik Lehrskov-Schmidt pricing models, value-based pricing, and SaaS monetization strategies - search LinkedIn profile and expert content`);
    queries.push(`Utpal Dholakia pricing psychology, consumer behavior, and pricing research - search academic publications and research papers`);
    queries.push(`Street Pricing book by Marcos Rivera - pricing frameworks for B2B SaaS leaders and monetization strategies`);
    
    // Industry-specific pricing research
    if (input.industry) {
      queries.push(`${input.industry} industry standard pricing models: seat-based, usage-based, hybrid, and value-based pricing strategies`);
      queries.push(`${input.industry} pricing benchmarks, average deal sizes, and pricing tiers for similar offerings`);
      queries.push(`${input.industry} competitor pricing analysis: pricing structures, tiers, and packaging strategies`);
      queries.push(`${input.industry} pricing trends 2024-2025: how companies are pricing similar products and services`);
      queries.push(`${input.industry} pricing psychology and buyer expectations: what pricing models resonate with target customers`);
      queries.push(`${input.industry} pricing fencing strategies: feature gating, usage limits, and tier differentiation`);
    }
    
    // Competitor pricing deep dive
    if (input.competitors) {
      const competitors = input.competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);
      competitors.forEach(competitor => {
        queries.push(`${competitor} pricing strategy, pricing tiers, and packaging structure - search pricing pages and pricing analysis`);
        queries.push(`${competitor} pricing model comparison: seat-based vs usage-based vs hybrid pricing approach`);
      });
    }
    
    // General pricing research
    queries.push(`B2B SaaS pricing best practices: seat-based pricing, usage-based pricing, hybrid models, and value-based pricing frameworks`);
    queries.push(`Pricing psychology and buyer behavior: how decision-makers evaluate pricing in B2B software purchases`);
    queries.push(`Pricing optimization strategies: A/B testing pricing, pricing experiments, and conversion optimization`);
  }
  
  // Branding, Positioning & Messaging Research
  if (feedbackType.includes('branding') || feedbackType.includes('positioning') || feedbackType.includes('messaging')) {
    if (input.industry) {
      queries.push(`${input.industry} messaging best practices: how to communicate value propositions clearly and drive conversions`);
      queries.push(`${input.industry} brand positioning strategies: how successful companies differentiate their messaging`);
      queries.push(`${input.industry} conversion-optimized messaging: examples of high-converting copy and messaging frameworks`);
      queries.push(`${input.industry} buyer language and terminology: how target customers describe their problems and needs`);
    }
    
    if (input.competitors) {
      const competitors = input.competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);
      competitors.forEach(competitor => {
        queries.push(`${competitor} messaging strategy, brand positioning, and value proposition communication`);
        queries.push(`${competitor} marketing copy analysis: how they communicate benefits and drive conversions`);
      });
    }
    
    queries.push(`B2B messaging frameworks: how to create clear, understandable, and conversion-focused messaging`);
    queries.push(`Brand positioning examples: successful B2B companies with clear, differentiated messaging`);
    queries.push(`Conversion copywriting best practices: messaging that drives action and improves conversion rates`);
  }
  
  // Product & Feature Research
  if (feedbackType.includes('product') || feedbackType.includes('feature')) {
    if (input.industry) {
      queries.push(`${input.industry} product development trends: what features and capabilities customers expect`);
      queries.push(`${input.industry} feature prioritization: how to determine which features drive the most value`);
    }
    
    if (input.competitors) {
      const competitors = input.competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);
      competitors.forEach(competitor => {
        queries.push(`${competitor} product features, roadmap, and feature differentiation strategies`);
      });
    }
  }
  
  // Brainstorming Research
  if (feedbackType.includes('brainstorming')) {
    if (input.industry) {
      queries.push(`${input.industry} innovation trends, emerging opportunities, and market gaps`);
      queries.push(`${input.industry} customer pain points and unmet needs: opportunities for new solutions`);
    }
  }

  // Website CRO & Funnel Analysis Research
  if (feedbackType.includes('website') && (feedbackType.includes('cro') || feedbackType.includes('funnel'))) {
    if (input.companyWebsite) {
      queries.push(`${input.companyWebsite} SEO analysis: page titles, meta descriptions, keyword optimization, and search engine rankings`);
      queries.push(`${input.companyWebsite} technical SEO audit: page load speed, mobile responsiveness, site structure, and Core Web Vitals`);
      queries.push(`${input.companyWebsite} conversion rate optimization: CRO best practices, user experience, and funnel optimization`);
      queries.push(`${input.companyWebsite} Google search rankings and LLM/AEO visibility: current keyword rankings and AI search performance`);
    }
    
    if (input.industry) {
      queries.push(`${input.industry} SEO best practices: keyword research, on-page optimization, and technical SEO requirements`);
      queries.push(`${input.industry} website conversion optimization: CRO strategies, user experience best practices, and funnel optimization`);
      queries.push(`${input.industry} LLM and AI search optimization: strategies for ranking in Google's Generative Experience and AI Overviews`);
    }
    
    if (input.competitors) {
      const competitors = input.competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);
      competitors.forEach(competitor => {
        queries.push(`${competitor} website SEO analysis: keyword rankings, technical SEO, and search visibility`);
        queries.push(`${competitor} website conversion optimization: CRO strategies, user experience, and conversion funnel`);
      });
    }
    
    queries.push(`Website SEO audit best practices: comprehensive checklist for page titles, meta descriptions, images, keywords, and technical SEO`);
    queries.push(`Website CRO optimization: best practices for improving conversion rates, user experience, and funnel performance`);
    queries.push(`LLM and AI search optimization: strategies for improving visibility in Google's Generative Experience, AI Overviews, and AI-powered search`);
  }

  // ===== CROSS-CONTEXTUAL RESEARCH (Advanced Insights - 2 queries) =====
  // Combine multiple inputs for deeper insights
  if (input.industry && input.icpTitles && input.companySize && input.companySize.length > 0) {
    queries.push(
      `${input.industry} industry: ${input.icpTitles} priorities and challenges at companies with ${input.companySize.join(' or ')} employees`
    );
  }

  if (input.industry && input.competitors) {
    queries.push(
      `Competitive landscape analysis: ${input.competitors} vs other players in ${input.industry} market`
    );
  }

  return queries;
};
