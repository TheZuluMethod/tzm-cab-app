/**
 * Type Definitions
 * 
 * Centralized type definitions for the TZM CAB application.
 * All interfaces and enums used throughout the application are defined here.
 * 
 * @module types
 */

/**
 * File data structure for uploaded files
 * 
 * Represents a file that has been uploaded and encoded as base64.
 * Used for file attachments in user input.
 */
export interface FileData {
  /** Original filename */
  name: string;
  /** MIME type of the file (e.g., 'image/png', 'application/pdf') */
  mimeType: string;
  /** Base64-encoded file content */
  data: string;
}

/**
 * User input data structure
 * 
 * Contains all user-provided information for board generation and analysis.
 * Includes ICP definition, feedback details, and optional file attachments.
 */
export interface UserInput {
  // Step 1: ICP Definition
  /** Company website URL for deep research (optional) */
  companyWebsite?: string;
  /** Industry with optional NAICS codes & TAM */
  industry: string;
  /** Comma-separated titles like "CEO, CRO, Director of Development" */
  icpTitles: string;
  /** Your solution(s) - what you offer */
  solutions?: string;
  /** The core problem(s) you solve */
  coreProblems?: string;
  /** Top competitors (optional, comma-separated) */
  competitors?: string;
  /** Top SEO keywords (optional, comma-separated) */
  seoKeywords?: string;
  /** Company size ranges (multi-select) */
  companySize?: string[];
  /** Company revenue ranges (multi-select) */
  companyRevenue?: string[];
  
  // Step 2: Feedback Details
  /** Feedback type: Branding/Positioning/Messaging, Product/Feature, Pricing/Packaging, Brainstorming, Other */
  feedbackType: string;
  /** The "ask" - URL, text, or idea to analyze */
  feedbackItem: string;
  /** Additional circumstances or context */
  circumstances: string;
  /** Array of uploaded files */
  files: FileData[];
  
  // Legacy field for backward compatibility
  /** Legacy ICP definition field (deprecated, use icpTitles instead) */
  icpDefinition?: string;
}

/**
 * Board member representation
 * 
 * Represents a single member of the Customer Advisory Board.
 * Each member is a fictional persona with specific characteristics.
 */
export interface BoardMember {
  /** Unique identifier for the board member */
  id: string;
  /** Full name of the board member */
  name: string;
  /** Job title/role */
  role: string;
  /** Type of company they work for */
  companyType: string;
  /** Area of expertise */
  expertise: string;
  /** Personality archetype (e.g., "The Skeptic", "The Visionary") */
  personalityArchetype: string;
  /** Avatar style for UI visualization (optional) */
  avatarStyle?: string;
}

/**
 * Ideal Customer Profile (ICP) structure
 * 
 * Comprehensive profile defining target customer characteristics,
 * signals, attributes, and title groupings.
 */
export interface ICPProfile {
  /** Target customer types/use cases */
  useCaseFit: string[];
  /** Signals and attributes that indicate potential customers */
  signalsAndAttributes: {
    /** Category name for the signal/attribute */
    category: string;
    /** Detailed description */
    description: string;
    /** Optional trigger question in quotes */
    triggerQuestion?: string;
  }[];
  /** Title groupings organized by department */
  titles: {
    /** Department name */
    department: string;
    /** Array of role titles in this department */
    roles: string[];
  }[];
  /** Psychographics - psychological characteristics, values, attitudes, interests */
  psychographics?: string[];
  /** Buying triggers - what motivates them to buy */
  buyingTriggers?: string[];
  /** Language patterns - how they communicate, terminology they use */
  languagePatterns?: string[];
  /** Narrative frames - stories and frameworks they use to understand the world */
  narrativeFrames?: string[];
  /** Objections - common concerns and pushbacks */
  objections?: string[];
  /** Copy angles - messaging approaches that resonate */
  copyAngles?: string[];
  /** Lead-specific behavioral patterns - how they behave as leads */
  leadBehavioralPatterns?: string[];
}

/**
 * Persona breakdown structure
 * 
 * Comprehensive persona profile including demographics, decision-making
 * process, jobs-to-be-done, and challenges.
 */
export interface PersonaBreakdown {
  /** Creative nickname (e.g., "Price-Conscious Paula") */
  personaName: string;
  /** Professional title in ALL CAPS (e.g., "PROCUREMENT PROFESSIONAL") */
  personaTitle: string;
  /** Buyer type (e.g., "Influencer Buyer", "Decision Maker") */
  buyerType: string;
  /** Age range (e.g., "25 - 55") */
  ageRange: string;
  /** Preferred communication channels */
  preferredCommunicationChannels: string[];
  /** Job titles associated with this persona */
  titles: string[];
  /** Other relevant contextual information */
  otherRelevantInfo: string[];
  /** Key attributes (e.g., "Reduced time to fill", "Tech Focused") */
  attributes: string[];
  /** Jobs to be done in "When X, I want Y so I can Z" format */
  jobsToBeDone: string[];
  /** Decision-making process breakdown */
  decisionMakingProcess: {
    /** Research phase */
    research: {
      description: string;
      sources: string[];
    };
    /** Evaluation phase */
    evaluation: {
      description: string;
      factors: string[];
    };
    /** Purchase phase */
    purchase: {
      description: string;
      hesitations: string[];
      purchaseFactors: string[];
    };
  };
  /** Key challenges and pain points */
  challenges: string[];
  /** Firmographic information (company size, revenue, industry, location) */
  firmographics?: {
    companySize?: string;
    companyRevenue?: string;
    industry?: string;
    location?: string;
    companyType?: string;
  };
  /** Demographic information (education, years of experience, etc.) */
  demographics?: {
    education?: string;
    yearsOfExperience?: string;
    geographicLocation?: string;
    householdIncome?: string;
  };
  /** Online presence and digital behavior */
  onlinePresence?: {
    /** Where they spend time online (platforms, websites, communities) */
    onlineHangouts?: string[];
    /** Social media platforms they actively use */
    socialMediaPlatforms?: string[];
    /** Online communities and forums they participate in */
    communities?: string[];
    /** Professional networks they're part of */
    professionalNetworks?: string[];
  };
  /** Advertising and content reachability */
  advertisingReachability?: {
    /** Best platforms to reach them with ads */
    adPlatforms?: string[];
    /** Best content channels to reach them */
    contentChannels?: string[];
    /** Preferred content formats */
    contentFormats?: string[];
    /** Best times to reach them */
    optimalReachTimes?: string[];
  };
  /** Work habits and behaviors */
  workHabits?: {
    /** Typical work schedule and hours */
    workSchedule?: string;
    /** How they start their workday */
    morningRoutine?: string[];
    /** How they end their workday */
    endOfDayRoutine?: string[];
    /** Work-related activities and tasks */
    workActivities?: string[];
  };
  /** After-work habits and behaviors */
  afterWorkHabits?: {
    /** Activities they engage in after work */
    activities?: string[];
    /** Hobbies and interests */
    hobbies?: string[];
    /** How they unwind */
    unwindingActivities?: string[];
    /** Weekend and off-hours behaviors */
    offHoursBehaviors?: string[];
  };
}

/**
 * Saved session structure
 * 
 * Represents a complete board session that can be saved and reloaded.
 * Includes all user input, generated board members, report, and profiles.
 */
export interface SavedSession {
  /** Unique session identifier */
  id: string;
  /** Date string (e.g., "12/25/2024") */
  date: string;
  /** Optional timestamp for display (e.g., "2:30 PM") */
  timestamp?: string;
  /** Generated summary title */
  title?: string;
  /** Original user input */
  input: UserInput;
  /** Generated board members */
  members: BoardMember[];
  /** Generated analysis report */
  report: string;
  /** Optional ICP profile */
  icpProfile?: ICPProfile;
  /** Optional persona breakdowns */
  personaBreakdowns?: PersonaBreakdown[];
  /** Optional dashboard data (industry information) */
  dashboardData?: any;
  /** Optional QC status */
  qcStatus?: any;
  /** Optional competitor analysis data */
  competitorAnalysis?: any;
  /** Optional app state for session recovery */
  appState?: string;
}

/**
 * Application state enumeration
 * 
 * Represents the current state of the application workflow.
 * Used to control UI rendering and application flow.
 */
export enum AppState {
  /** Initial welcome screen */
  WELCOME = 'WELCOME',
  /** Step 1: Define ICP */
  ICP_SETUP = 'ICP_SETUP',
  /** Step 2: What to test */
  SETUP = 'SETUP',
  /** Generating personas */
  ASSEMBLING = 'ASSEMBLING',
  /** Show the board before starting analysis */
  BOARD_READY = 'BOARD_READY',
  /** Streaming feedback */
  ANALYZING = 'ANALYZING',
  /** Analysis complete */
  COMPLETE = 'COMPLETE',
  /** Error state */
  ERROR = 'ERROR'
}