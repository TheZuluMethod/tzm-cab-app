/**
 * Example Reports Data
 * 
 * Pre-built example reports to showcase value and provide templates
 */

import { SavedSession } from '../types';

export const exampleReports: SavedSession[] = [
  {
    id: 'example-1',
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'SaaS Pricing Strategy Review',
    input: {
      industry: 'SaaS',
      icpTitles: 'VP of Sales, CRO, Director of Revenue Operations',
      solutions: 'Customer success platform',
      coreProblems: 'Customer churn, low expansion revenue',
      feedbackType: 'Pricing & Packaging',
      feedbackItem: 'Should we move from per-seat pricing to usage-based pricing?',
      circumstances: 'We\'re seeing pushback on per-seat pricing from enterprise customers who have many inactive users.',
      files: [],
    },
    members: Array.from({ length: 20 }, (_, i) => ({
      id: `ex1-${i + 1}`,
      name: `Member ${i + 1}`,
      role: i % 3 === 0 ? 'VP of Sales' : i % 3 === 1 ? 'CRO' : 'Director of Revenue Operations',
      companyType: 'Enterprise SaaS',
      expertise: 'Revenue Operations',
      personalityArchetype: 'The Strategist',
    })),
    report: `# SaaS Pricing Strategy Review - Board Report

## Executive Dashboard

| Category | Status | Observation | Recommended Action |
|----------|--------|-------------|-------------------|
| Pricing Model | ⚠️ Needs Review | Current per-seat model creates friction for enterprise customers with many inactive users | Consider hybrid model: Base subscription + usage tiers |
| Market Position | ✅ Strong | Competitive pricing but missing enterprise flexibility | Add enterprise tier with usage-based components |
| Customer Feedback | ⚠️ Mixed | Enterprise customers want usage-based, SMB prefer simplicity | Segment pricing by customer size |

## Key Research Findings

### Market Trends
- **Industry Standard**: 68% of SaaS companies offer usage-based pricing options
- **Enterprise Preference**: 82% of enterprise buyers prefer hybrid pricing models
- **Competitive Analysis**: Top 3 competitors all offer usage-based tiers

### Customer Insights
- **Pain Point**: Per-seat pricing penalizes companies with large user bases
- **Opportunity**: Usage-based pricing aligns costs with value delivered
- **Risk**: SMB customers may find usage-based pricing confusing

## Deep Dive Analysis

### Current Pricing Model Assessment
Your per-seat pricing model works well for SMB customers but creates friction for enterprise accounts. The board identified three key issues:

1. **Inactive User Penalty**: Enterprise customers pay for users who rarely log in
2. **Value Misalignment**: Costs don't scale with actual usage/value received
3. **Competitive Disadvantage**: Competitors offer more flexible pricing

### Recommended Pricing Strategy

**Hybrid Model (Recommended)**
- **Base Subscription**: $X/month for core features (includes Y active users)
- **Usage Tiers**: Additional charges based on key value metrics
- **Enterprise Option**: Custom pricing with usage caps and volume discounts

**Benefits:**
- Aligns costs with value for enterprise customers
- Maintains simplicity for SMB customers
- Competitive with market leaders
- Increases expansion revenue potential

## The Roast & The Gold

### The Roast 🔥
"Your current pricing model is stuck in 2015. Enterprise customers are laughing at your per-seat model while your competitors eat your lunch with flexible pricing."

### The Gold ✨
"You have a golden opportunity to increase ARPU by 30-40% with a hybrid model. Enterprise customers are literally asking for this - it's free money if you execute well."

## Raw Board Transcript

**Sarah Chen (VP of Sales)**: "I've seen this exact scenario at three companies. The move to hybrid pricing increased our enterprise ARPU by 35% within 6 months."

**Michael Rodriguez (CRO)**: "The key is making it optional. Keep per-seat for SMB, add hybrid for enterprise. Best of both worlds."

---

*This is an example report. Click "Use This Template" to create your own board session.*`,
    icpProfile: {
      useCaseFit: ['Enterprise SaaS companies', 'B2B software providers'],
      signalsAndAttributes: [
        {
          category: 'Company Size',
          description: 'Companies with 100+ employees',
        },
      ],
      titles: [
        {
          department: 'Revenue',
          roles: ['VP of Sales', 'CRO', 'Director of Revenue Operations'],
        },
      ],
    },
  },
  {
    id: 'example-2',
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'Product Feature Launch Analysis',
    input: {
      industry: 'E-commerce',
      icpTitles: 'CMO, VP of Marketing, Director of Growth',
      solutions: 'E-commerce platform',
      coreProblems: 'Low conversion rates, cart abandonment',
      feedbackType: 'Product Feature or Idea',
      feedbackItem: 'Should we add a "Buy Now, Pay Later" feature to increase conversions?',
      circumstances: 'We\'re seeing 60% cart abandonment and competitors are adding BNPL options.',
      files: [],
    },
    members: Array.from({ length: 20 }, (_, i) => ({
      id: `ex2-${i + 1}`,
      name: `Member ${i + 1}`,
      role: i % 3 === 0 ? 'CMO' : i % 3 === 1 ? 'VP of Marketing' : 'Director of Growth',
      companyType: 'E-commerce',
      expertise: 'Digital Marketing',
      personalityArchetype: 'The Innovator',
    })),
    report: `# Product Feature Launch Analysis - Board Report

## Executive Dashboard

| Category | Status | Observation | Recommended Action |
|----------|--------|-------------|-------------------|
| Feature Priority | ✅ High | BNPL addresses core conversion problem | Launch in Q2 with phased rollout |
| Market Fit | ✅ Strong | 73% of competitors offer BNPL | Fast-track implementation |
| Risk Assessment | ⚠️ Medium | Payment processing complexity | Partner with established BNPL provider |

## Key Research Findings

### Market Analysis
- **Industry Adoption**: 73% of top e-commerce sites offer BNPL
- **Consumer Demand**: 68% of shoppers prefer BNPL for purchases over $100
- **Conversion Impact**: Average 15-25% increase in conversion rates

### Customer Insights
- **Pain Point**: High cart abandonment on high-ticket items
- **Opportunity**: BNPL removes price barrier for many customers
- **Risk**: Need to educate customers on BNPL benefits

## Deep Dive Analysis

### Feature Assessment
The board unanimously supports adding BNPL functionality. Key insights:

1. **High Impact**: Addresses your #1 conversion problem
2. **Market Standard**: Expected feature in modern e-commerce
3. **Low Risk**: Partner with established provider (Klarna, Afterpay, etc.)

### Implementation Recommendations

**Phase 1 (MVP)**
- Partner with Klarna or Afterpay
- Offer on purchases $100+
- Prominent placement at checkout

**Phase 2 (Optimization)**
- A/B test messaging
- Add to product pages
- Track conversion lift

**Phase 3 (Advanced)**
- Custom BNPL terms
- Loyalty program integration
- Analytics dashboard

## The Roast & The Gold

### The Roast 🔥
"You're losing customers to competitors who offer BNPL. This isn't rocket science - it's table stakes in 2025."

### The Gold ✨
"BNPL could increase your AOV by 30% and reduce cart abandonment by 20%. This is a no-brainer - implement it yesterday."

---

*This is an example report. Click "Use This Template" to create your own board session.*`,
  },
  {
    id: 'example-3',
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'Brand Messaging Review',
    input: {
      industry: 'B2B Services',
      icpTitles: 'CEO, Founder, Head of Marketing',
      solutions: 'Business consulting services',
      coreProblems: 'Unclear value proposition, low brand awareness',
      feedbackType: 'Branding, Positioning, & Messaging',
      feedbackItem: 'Is our messaging clear enough? We want to test our new tagline: "Transform Your Business, One Strategy at a Time"',
      circumstances: 'We\'re rebranding and need to validate our new messaging before launch.',
      files: [],
    },
    members: Array.from({ length: 20 }, (_, i) => ({
      id: `ex3-${i + 1}`,
      name: `Member ${i + 1}`,
      role: i % 3 === 0 ? 'CEO' : i % 3 === 1 ? 'Founder' : 'Head of Marketing',
      companyType: 'B2B Services',
      expertise: 'Strategic Planning',
      personalityArchetype: 'The Visionary',
    })),
    report: `# Brand Messaging Review - Board Report

## Executive Dashboard

| Category | Status | Observation | Recommended Action |
|----------|--------|-------------|-------------------|
| Message Clarity | ⚠️ Needs Work | Tagline is generic and doesn't differentiate | Focus on specific outcomes, not process |
| Value Proposition | ⚠️ Weak | Doesn't communicate unique value | Highlight ROI and transformation metrics |
| Brand Positioning | ⚠️ Unclear | Could apply to any consulting firm | Emphasize industry expertise and track record |

## Key Research Findings

### Message Analysis
- **Clarity Score**: 4/10 - Too generic
- **Memorability**: 3/10 - Forgettable
- **Differentiation**: 2/10 - Sounds like every other consultant

### Competitive Landscape
- **Market Leaders**: Use outcome-focused messaging
- **Trend**: Shift from process to results
- **Opportunity**: Lead with ROI and case studies

## Deep Dive Analysis

### Current Messaging Assessment
Your tagline "Transform Your Business, One Strategy at a Time" has several issues:

1. **Too Generic**: Could describe any consulting firm
2. **Process-Focused**: Talks about what you do, not what customers get
3. **No Differentiation**: Doesn't highlight unique value
4. **Weak Emotional Hook**: Doesn't resonate with pain points

### Recommended Messaging Alternatives

**Option 1 (ROI-Focused)**
"Double Your Revenue in 90 Days - Or We Work for Free"
- Strong outcome promise
- Risk reversal
- Memorable

**Option 2 (Problem-Focused)**
"Stop Losing Deals to Competitors - We Help You Win"
- Addresses specific pain
- Action-oriented
- Clear benefit

**Option 3 (Transformation-Focused)**
"From Struggling to Thriving - We Turn Around B2B Companies"
- Emotional journey
- Specific to B2B
- Transformation promise

## The Roast & The Gold

### The Roast 🔥
"Your tagline is so generic it could be a fortune cookie. You're competing with every consultant on LinkedIn with this messaging."

### The Gold ✨
"You have a real opportunity to stand out with outcome-focused messaging. Lead with results, not process. Your customers care about ROI, not your methodology."

---

*This is an example report. Click "Use This Template" to create your own board session.*`,
  },
  {
    id: 'example-4',
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'ICP Profile & Persona Analysis',
    input: {
      industry: 'Healthcare Technology',
      icpTitles: 'CMO, VP of Marketing, Director of Growth',
      solutions: 'Telemedicine platform',
      coreProblems: 'Patient engagement, remote care delivery',
      feedbackType: 'IPC Profile & Persona',
      feedbackItem: 'Who is our ideal customer? We need to understand our ICP better to improve targeting.',
      circumstances: 'We\'re struggling with customer acquisition and want to refine our target persona.',
      files: [],
    },
    members: Array.from({ length: 20 }, (_, i) => ({
      id: `ex4-${i + 1}`,
      name: `Member ${i + 1}`,
      role: i % 3 === 0 ? 'CMO' : i % 3 === 1 ? 'VP of Marketing' : 'Director of Growth',
      companyType: 'Healthcare Technology',
      expertise: 'Digital Health',
      personalityArchetype: 'The Analyst',
    })),
    report: `# ICP Profile & Persona Analysis - Board Report

## Executive Dashboard

| Category | Status | Observation | Recommended Action |
|----------|--------|-------------|-------------------|
| ICP Clarity | ⚠️ Needs Refinement | Current targeting too broad, missing key attributes | Narrow to mid-market health systems (100-500 beds) |
| Persona Definition | ⚠️ Incomplete | Missing decision-making process and pain points | Develop detailed buyer personas with job titles |
| Market Fit | ✅ Strong | Telemedicine market growing 25% YoY | Focus on post-pandemic care delivery models |

## Key Research Findings

### Market Analysis
- **Target Market**: Mid-market health systems (100-500 beds) represent $2.3B opportunity
- **Key Decision Makers**: CMO, VP of Clinical Operations, Director of Telehealth
- **Pain Points**: Staffing shortages, patient access, cost containment

### Customer Insights
- **Ideal Customer**: Health systems with existing telehealth programs seeking to scale
- **Buying Process**: 6-12 month evaluation, requires clinical champion and IT approval
- **Budget**: $50K-$200K annual contracts

## Deep Dive Analysis

### Current ICP Assessment
Your current targeting is too broad. The board identified these refinements:

1. **Company Size**: Focus on 100-500 bed health systems (sweet spot)
2. **Geographic**: Prioritize states with favorable telehealth reimbursement
3. **Technology Maturity**: Target systems with existing EHR integration needs

### Recommended ICP Profile

**Primary Persona: Clinical Operations Leader**
- Title: VP of Clinical Operations or Director of Telehealth
- Company: Mid-market health system (100-500 beds)
- Pain Points: Staffing shortages, patient access, care coordination
- Goals: Improve patient outcomes, reduce costs, increase provider satisfaction

**Secondary Persona: Marketing Leader**
- Title: CMO or VP of Marketing
- Company: Same health system profile
- Pain Points: Patient acquisition, brand differentiation
- Goals: Increase market share, improve patient experience

## The Roast & The Gold

### The Roast 🔥
"Your ICP is so broad you're targeting everyone and no one. You're wasting marketing dollars on hospitals that will never buy."

### The Gold ✨
"Focus on mid-market health systems with existing telehealth programs. They have budget, need, and urgency. This is your sweet spot - go deep, not wide."

---

*This is an example report. Click "Use This Template" to create your own board session.*`,
  },
  {
    id: 'example-5',
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'New Feature Validation',
    input: {
      industry: 'FinTech',
      icpTitles: 'CTO, VP of Product, Head of Engineering',
      solutions: 'Digital banking platform',
      coreProblems: 'Customer retention, feature adoption',
      feedbackType: 'Product Feature or Idea',
      feedbackItem: 'Should we build a "Round Up" savings feature? We see competitors adding it.',
      circumstances: 'We\'re evaluating whether to invest in building a round-up savings feature that rounds up purchases to the nearest dollar and saves the difference.',
      files: [],
    },
    members: Array.from({ length: 20 }, (_, i) => ({
      id: `ex5-${i + 1}`,
      name: `Member ${i + 1}`,
      role: i % 3 === 0 ? 'CTO' : i % 3 === 1 ? 'VP of Product' : 'Head of Engineering',
      companyType: 'FinTech',
      expertise: 'Product Development',
      personalityArchetype: 'The Builder',
    })),
    report: `# New Feature Validation - Board Report

## Executive Dashboard

| Category | Status | Observation | Recommended Action |
|----------|--------|-------------|-------------------|
| Feature Priority | ✅ High | Round-up features show 40% adoption rates | Build MVP in Q2, full feature in Q3 |
| Market Demand | ✅ Strong | 3 of 5 competitors offer round-up savings | Fast-track to match market standard |
| Development Risk | ✅ Low | Well-understood feature, existing patterns | Partner with established provider or build in-house |

## Key Research Findings

### Market Analysis
- **Adoption Rates**: Round-up features achieve 35-45% user adoption
- **Competitive Landscape**: 60% of top fintech apps offer round-up savings
- **User Behavior**: Millennials and Gen Z show highest engagement (58% adoption)

### Customer Insights
- **Pain Point**: Users struggle to save consistently
- **Opportunity**: Micro-savings remove friction from saving decisions
- **Risk**: Feature fatigue if not well-integrated into existing UX

## Deep Dive Analysis

### Feature Assessment
The board strongly recommends building the round-up feature. Key insights:

1. **High Value**: Addresses core user need (passive saving)
2. **Low Risk**: Proven feature with established UX patterns
3. **Competitive Necessity**: Expected feature in modern banking apps

### Implementation Recommendations

**Phase 1 (MVP)**
- Basic round-up to nearest dollar
- Manual opt-in per transaction
- Simple savings account integration

**Phase 2 (Enhanced)**
- Custom round-up amounts ($1, $2, $5)
- Automatic round-up rules
- Goal-based savings buckets

**Phase 3 (Advanced)**
- Investment round-ups (stocks/crypto)
- Social sharing and challenges
- Gamification elements

## The Roast & The Gold

### The Roast 🔥
"You're behind the curve. Your competitors launched this feature 18 months ago. You're losing users to apps that make saving effortless."

### The Gold ✨
"Round-up savings is table stakes in 2025. Build it fast, make it beautiful, and watch your user engagement metrics soar. This feature alone could increase daily active users by 25%."

---

*This is an example report. Click "Use This Template" to create your own board session.*`,
  },
  {
    id: 'example-6',
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'Brainstorm & Ideation Session',
    input: {
      industry: 'EdTech',
      icpTitles: 'Superintendent, Principal, Director of Technology',
      solutions: 'K-12 learning management system',
      coreProblems: 'Student engagement, remote learning challenges',
      feedbackType: 'Brainstorm & Ideation',
      feedbackItem: 'We need fresh ideas for engaging students in hybrid learning environments.',
      circumstances: 'Post-pandemic, we\'re seeing declining engagement in hybrid classrooms. Need innovative approaches to keep students motivated.',
      files: [],
    },
    members: Array.from({ length: 20 }, (_, i) => ({
      id: `ex6-${i + 1}`,
      name: `Member ${i + 1}`,
      role: i % 3 === 0 ? 'Superintendent' : i % 3 === 1 ? 'Principal' : 'Director of Technology',
      companyType: 'K-12 Education',
      expertise: 'Educational Technology',
      personalityArchetype: 'The Innovator',
    })),
    report: `# Brainstorm & Ideation Session - Board Report

## Executive Dashboard

| Category | Status | Observation | Recommended Action |
|----------|--------|-------------|-------------------|
| Engagement Strategy | ⚠️ Needs Innovation | Current approaches are stale | Implement gamification and social learning |
| Technology Integration | ✅ Strong | LMS platform supports advanced features | Leverage existing infrastructure |
| Student Motivation | ⚠️ Declining | Hybrid fatigue affecting participation | Create interactive, collaborative experiences |

## Key Research Findings

### Engagement Trends
- **Gamification Impact**: Increases student participation by 40-60%
- **Social Learning**: Peer collaboration boosts completion rates by 35%
- **Hybrid Challenges**: Students report feeling disconnected in hybrid settings

### Market Insights
- **Best Practices**: Top-performing platforms use real-time collaboration and progress visualization
- **Student Preferences**: Gen Z prefers interactive, visual, and social learning experiences
- **Teacher Needs**: Tools that reduce administrative burden while increasing engagement

## Deep Dive Analysis

### Ideation Session Results

**Top 5 Ideas from Board:**

1. **Virtual Study Groups**
   - AI-matched student groups based on learning styles
   - Real-time collaboration tools
   - Peer accountability features

2. **Progress Visualization Dashboard**
   - Gamified progress tracking with achievements
   - Visual learning paths
   - Milestone celebrations

3. **Interactive Whiteboard Sessions**
   - Real-time collaborative whiteboards
   - Breakout room functionality
   - Screen sharing and annotation tools

4. **Micro-Learning Modules**
   - Bite-sized 5-10 minute lessons
   - Just-in-time learning
   - Mobile-optimized content

5. **Social Learning Feed**
   - Student activity feed (like social media)
   - Peer recognition and badges
   - Class challenges and competitions

### Implementation Roadmap

**Q1: Foundation**
- Build progress visualization dashboard
- Implement basic gamification (badges, points)

**Q2: Collaboration**
- Launch virtual study groups
- Add interactive whiteboard features

**Q3: Social Layer**
- Create social learning feed
- Implement peer recognition system

## The Roast & The Gold

### The Roast 🔥
"Your current platform feels like a digital filing cabinet. Students are bored, teachers are frustrated, and engagement is tanking. You need to make learning fun again."

### The Gold ✨
"Gamification and social learning aren't just nice-to-haves - they're essential for Gen Z. Implement these features and watch your engagement metrics transform. Students want to learn, they just need it to feel modern and interactive."

---

*This is an example report. Click "Use This Template" to create your own board session.*`,
  },
];

/**
 * Get example report by ID
 */
export const getExampleReport = (id: string): SavedSession | undefined => {
  return exampleReports.find(r => r.id === id);
};

/**
 * Get all example reports
 */
export const getAllExampleReports = (): SavedSession[] => {
  return exampleReports;
};

