// Campaign Mode Configurations
// Defines the exact behaviors for Basic, Co-Pilot, and Autopilot modes

export type CampaignMode = 'basic' | 'copilot' | 'autopilot';

export interface ModeCapabilities {
  // Sending behaviors
  initialEmailSending: 'manual' | 'manual-with-approval' | 'automatic';
  followUpSending: 'manual' | 'automatic-after-first' | 'fully-automatic';
  
  // Strategy & Sequence selection
  strategySelection: 'user-chooses' | 'ai-recommends-user-approves' | 'ai-auto-selects';
  sequenceSelection: 'user-chooses' | 'user-chooses' | 'ai-auto-assigns';
  
  // Response handling
  responseHandling: 'manual' | 'ai-notifies' | 'ai-auto-responds';
  responseClassification: boolean;
  autoPauseOnPositive: boolean;
  
  // Proposals & Documents
  proposalCreation: 'manual' | 'ai-prepares-user-sends' | 'ai-auto-sends';
  whitelabelReports: boolean;
  
  // Search & Credits
  searchesPerDay: number | 'unlimited';
  aiVerificationCredits: number;
  
  // Advanced features
  aiResurrectionSequences: boolean;
  smartResponseDetection: boolean;
  intelligentLeadScoring: boolean;
  multiChannelSupport: boolean;
}

export interface CampaignModeConfig {
  id: CampaignMode;
  name: string;
  tagline: string;
  description: string;
  price: number;
  priceDisplay: string;
  aiLevel: string;
  icon: string;
  color: string;
  capabilities: ModeCapabilities;
  keyBenefits: string[];
  timeSavings: string;
}

// ============================================================================
// BASIC MODE ($49/mo) - Manual Mode
// User does everything, AI assists with writing only
// ============================================================================
export const BASIC_MODE: CampaignModeConfig = {
  id: 'basic',
  name: 'Basic',
  tagline: 'AI-Assisted Writing',
  description: 'AI assists with writing — you click Send',
  price: 49,
  priceDisplay: '$49/mo',
  aiLevel: 'Manual Mode',
  icon: '⚡',
  color: 'cyan',
  capabilities: {
    initialEmailSending: 'manual',
    followUpSending: 'manual',
    strategySelection: 'user-chooses',
    sequenceSelection: 'user-chooses',
    responseHandling: 'manual',
    responseClassification: false,
    autoPauseOnPositive: false,
    proposalCreation: 'manual',
    whitelabelReports: false,
    searchesPerDay: 50,
    aiVerificationCredits: 100,
    aiResurrectionSequences: false,
    smartResponseDetection: false,
    intelligentLeadScoring: true,
    multiChannelSupport: false,
  },
  keyBenefits: [
    'AI helps write emails',
    'Basic lead scoring',
    '50 searches/day',
    '100 AI verification credits',
    'You control every send',
  ],
  timeSavings: '~20% (writing time only)',
};

// ============================================================================
// CO-PILOT MODE ($99/mo) - AI Assistant Mode
// AI drafts & suggests, user approves. Auto follow-ups AFTER first approved email.
// ============================================================================
export const COPILOT_MODE: CampaignModeConfig = {
  id: 'copilot',
  name: 'Pro',
  tagline: 'AI Co-Pilot Assistant',
  description: 'AI manages sequences — you jump in to close',
  price: 99,
  priceDisplay: '$99/mo',
  aiLevel: 'Co-Pilot Mode',
  icon: '🏢',
  color: 'primary',
  capabilities: {
    initialEmailSending: 'manual-with-approval',
    followUpSending: 'automatic-after-first', // KEY DIFFERENCE: Auto follow-ups after first approval
    strategySelection: 'ai-recommends-user-approves',
    sequenceSelection: 'user-chooses', // KEY DIFFERENCE: User still picks sequences
    responseHandling: 'ai-notifies',
    responseClassification: true,
    autoPauseOnPositive: false, // User handles manually
    proposalCreation: 'ai-prepares-user-sends',
    whitelabelReports: false,
    searchesPerDay: 200,
    aiVerificationCredits: 500,
    aiResurrectionSequences: true,
    smartResponseDetection: true,
    intelligentLeadScoring: true,
    multiChannelSupport: true,
  },
  keyBenefits: [
    'AI drafts emails for approval',
    'Auto follow-ups after first send',
    'AI recommends strategies',
    'You choose sequences',
    'Smart response detection',
    '200 searches/day',
    '500 AI verification credits',
    'AI Resurrection sequences',
  ],
  timeSavings: '~50% (writing + follow-ups)',
};

// ============================================================================
// AUTOPILOT MODE ($249/mo) - Autonomous Agent Mode
// AI does everything. User only handles closings.
// ============================================================================
export const AUTOPILOT_MODE: CampaignModeConfig = {
  id: 'autopilot',
  name: 'Autopilot',
  tagline: 'Autonomous Sales Rep',
  description: 'AI handles everything — Discovery → Nurture → Proposal',
  price: 249,
  priceDisplay: '$249/mo',
  aiLevel: 'Agentic Mode',
  icon: '🚀',
  color: 'amber',
  capabilities: {
    initialEmailSending: 'automatic',
    followUpSending: 'fully-automatic', // 7-step sequences run autonomously
    strategySelection: 'ai-auto-selects', // KEY DIFFERENCE: AI picks strategy
    sequenceSelection: 'ai-auto-assigns', // KEY DIFFERENCE: AI assigns sequences per lead
    responseHandling: 'ai-auto-responds', // KEY DIFFERENCE: AI reads & responds
    responseClassification: true,
    autoPauseOnPositive: true, // KEY DIFFERENCE: AI pauses when positive detected
    proposalCreation: 'ai-auto-sends', // KEY DIFFERENCE: AI sends proposals automatically
    whitelabelReports: true, // KEY DIFFERENCE: White-label reports
    searchesPerDay: 'unlimited', // KEY DIFFERENCE: Unlimited searches
    aiVerificationCredits: 2000, // KEY DIFFERENCE: 4x more credits
    aiResurrectionSequences: true,
    smartResponseDetection: true,
    intelligentLeadScoring: true,
    multiChannelSupport: true,
  },
  keyBenefits: [
    'Fully autonomous sending',
    'AI selects strategies intelligently',
    'AI assigns sequences per lead',
    'AI reads & responds to replies',
    'Auto-pause on positive response',
    'Auto proposal delivery',
    'White-label reports',
    'Unlimited searches',
    '2,000 AI verification credits',
    'You only handle closings',
  ],
  timeSavings: '~90% (only close deals)',
};

// Get mode config by ID
export function getModeConfig(mode: CampaignMode): CampaignModeConfig {
  switch (mode) {
    case 'basic':
      return BASIC_MODE;
    case 'copilot':
      return COPILOT_MODE;
    case 'autopilot':
      return AUTOPILOT_MODE;
    default:
      return BASIC_MODE;
  }
}

// Get all mode configs
export function getAllModeConfigs(): CampaignModeConfig[] {
  return [BASIC_MODE, COPILOT_MODE, AUTOPILOT_MODE];
}

// Check if a capability is available for a mode
export function hasCapability(
  mode: CampaignMode,
  capability: keyof ModeCapabilities
): boolean {
  const config = getModeConfig(mode);
  const value = config.capabilities[capability];
  
  // For boolean capabilities
  if (typeof value === 'boolean') return value;
  
  // For string capabilities, check if not 'manual'
  if (typeof value === 'string') return value !== 'manual';
  
  // For numeric capabilities
  return true;
}

// Get the sending behavior description for a mode
export function getSendingBehavior(mode: CampaignMode): {
  initial: string;
  followUp: string;
} {
  const config = getModeConfig(mode);
  
  const initialDescriptions = {
    'manual': 'You write and send each email manually',
    'manual-with-approval': 'AI drafts emails, you approve and send',
    'automatic': 'AI sends automatically on schedule',
  };
  
  const followUpDescriptions = {
    'manual': 'You trigger each follow-up manually',
    'automatic-after-first': 'Follow-ups send automatically after your first approved email',
    'fully-automatic': '7-step sequences run fully autonomously',
  };
  
  return {
    initial: initialDescriptions[config.capabilities.initialEmailSending],
    followUp: followUpDescriptions[config.capabilities.followUpSending],
  };
}

// Get the strategy/sequence behavior description for a mode
export function getSelectionBehavior(mode: CampaignMode): {
  strategy: string;
  sequence: string;
} {
  const config = getModeConfig(mode);
  
  const strategyDescriptions = {
    'user-chooses': 'You choose your outreach strategy',
    'ai-recommends-user-approves': 'AI recommends a strategy, you approve',
    'ai-auto-selects': 'AI intelligently selects the best strategy',
  };
  
  const sequenceDescriptions = {
    'user-chooses': 'You select which email sequence to use',
    'ai-auto-assigns': 'AI assigns personalized sequences to each lead',
  };
  
  return {
    strategy: strategyDescriptions[config.capabilities.strategySelection],
    sequence: sequenceDescriptions[config.capabilities.sequenceSelection],
  };
}

// Get response handling behavior description
export function getResponseBehavior(mode: CampaignMode): string {
  const config = getModeConfig(mode);
  
  const descriptions = {
    'manual': 'You read and respond to all replies manually',
    'ai-notifies': 'AI notifies you of replies and classifies sentiment',
    'ai-auto-responds': 'AI reads replies, classifies sentiment, and auto-responds to FAQs',
  };
  
  return descriptions[config.capabilities.responseHandling];
}

// Comparison table data for UI
export interface ComparisonRow {
  feature: string;
  category: 'sending' | 'intelligence' | 'automation' | 'limits' | 'extras';
  basic: string | boolean | number;
  copilot: string | boolean | number;
  autopilot: string | boolean | number;
  highlight?: 'basic' | 'copilot' | 'autopilot';
}

export function getComparisonData(): ComparisonRow[] {
  return [
    // Sending
    { feature: 'Initial Email Sending', category: 'sending', basic: 'Manual', copilot: 'AI drafts → You send', autopilot: 'Fully automatic', highlight: 'autopilot' },
    { feature: 'Follow-up Emails', category: 'sending', basic: 'Manual', copilot: 'Auto after first approval', autopilot: '7-step autonomous', highlight: 'autopilot' },
    { feature: 'Sequence Steps', category: 'sending', basic: '4 steps', copilot: '4 steps', autopilot: '7 steps', highlight: 'autopilot' },
    
    // Intelligence
    { feature: 'Strategy Selection', category: 'intelligence', basic: 'You choose', copilot: 'AI recommends', autopilot: 'AI auto-selects', highlight: 'autopilot' },
    { feature: 'Sequence Selection', category: 'intelligence', basic: 'You choose', copilot: 'You choose', autopilot: 'AI assigns per lead', highlight: 'autopilot' },
    { feature: 'Lead Scoring', category: 'intelligence', basic: true, copilot: true, autopilot: true },
    { feature: 'Response Classification', category: 'intelligence', basic: false, copilot: true, autopilot: true },
    { feature: 'Smart Response Detection', category: 'intelligence', basic: false, copilot: true, autopilot: true },
    
    // Automation
    { feature: 'Response Handling', category: 'automation', basic: 'Manual', copilot: 'AI notifies', autopilot: 'AI auto-responds', highlight: 'autopilot' },
    { feature: 'Auto-pause on Positive', category: 'automation', basic: false, copilot: false, autopilot: true, highlight: 'autopilot' },
    { feature: 'AI Resurrection Sequences', category: 'automation', basic: false, copilot: true, autopilot: true },
    { feature: 'Proposal Delivery', category: 'automation', basic: 'Manual', copilot: 'AI prepares', autopilot: 'AI auto-sends', highlight: 'autopilot' },
    
    // Limits
    { feature: 'Searches per Day', category: 'limits', basic: 50, copilot: 200, autopilot: 'Unlimited', highlight: 'autopilot' },
    { feature: 'AI Verification Credits', category: 'limits', basic: 100, copilot: 500, autopilot: 2000, highlight: 'autopilot' },
    
    // Extras
    { feature: 'White-label Reports', category: 'extras', basic: false, copilot: false, autopilot: true, highlight: 'autopilot' },
    { feature: 'Multi-channel Support', category: 'extras', basic: false, copilot: true, autopilot: true },
    { feature: 'Time Savings', category: 'extras', basic: '~20%', copilot: '~50%', autopilot: '~90%', highlight: 'autopilot' },
  ];
}
