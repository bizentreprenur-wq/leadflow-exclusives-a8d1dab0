// LeadSync AI Pricing Tiers Configuration

export type LeadSyncTier = 'starter' | 'pro' | 'agency';

export interface LeadSyncPlan {
  id: LeadSyncTier;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  popular?: boolean;
  features: {
    leadsPerMonth: number;
    emailsPerMonth: number;
    smsPerMonth: number;
    aiCallMinutes: number;
    sequences: number;
    teamMembers: number;
    whiteLabel: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
    apiAccess: boolean;
    advancedAnalytics: boolean;
    dedicatedManager: boolean;
  };
  highlights: string[];
}

export const LEADSYNC_PLANS: Record<LeadSyncTier, LeadSyncPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    yearlyPrice: 470,
    description: 'Perfect for solo entrepreneurs testing automation',
    features: {
      leadsPerMonth: 500,
      emailsPerMonth: 1000,
      smsPerMonth: 100,
      aiCallMinutes: 15,
      sequences: 3,
      teamMembers: 1,
      whiteLabel: false,
      prioritySupport: false,
      customIntegrations: false,
      apiAccess: false,
      advancedAnalytics: false,
      dedicatedManager: false,
    },
    highlights: [
      '500 leads/month',
      '1,000 emails/month',
      '100 SMS messages',
      '15 min AI calls',
      '3 active sequences',
      'Basic reporting',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    yearlyPrice: 950,
    description: 'Full automation suite for growing businesses',
    popular: true,
    features: {
      leadsPerMonth: 2000,
      emailsPerMonth: 5000,
      smsPerMonth: 500,
      aiCallMinutes: 60,
      sequences: 10,
      teamMembers: 3,
      whiteLabel: false,
      prioritySupport: true,
      customIntegrations: true,
      apiAccess: false,
      advancedAnalytics: true,
      dedicatedManager: false,
    },
    highlights: [
      '2,000 leads/month',
      '5,000 emails/month',
      '500 SMS messages',
      '60 min AI calls',
      '10 active sequences',
      'Advanced analytics',
      'CRM integrations',
      'Priority support',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 199,
    yearlyPrice: 1910,
    description: 'Unlimited power for agencies & teams',
    features: {
      leadsPerMonth: -1, // Unlimited
      emailsPerMonth: -1, // Unlimited
      smsPerMonth: 2000,
      aiCallMinutes: 300,
      sequences: -1, // Unlimited
      teamMembers: -1, // Unlimited
      whiteLabel: true,
      prioritySupport: true,
      customIntegrations: true,
      apiAccess: true,
      advancedAnalytics: true,
      dedicatedManager: true,
    },
    highlights: [
      'Unlimited leads',
      'Unlimited emails',
      '2,000 SMS messages',
      '300 min AI calls (5 hours)',
      'Unlimited sequences',
      'White-label reports',
      'API access',
      'Dedicated account manager',
    ],
  },
};

export const LEADSYNC_PLANS_ARRAY = Object.values(LEADSYNC_PLANS);

// Helper to format limit display
export function formatLimit(value: number): string {
  if (value === -1) return 'Unlimited';
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
}

// Check if user has access to a feature based on their tier
export function hasFeatureAccess(
  userTier: LeadSyncTier | null,
  feature: keyof LeadSyncPlan['features']
): boolean {
  if (!userTier) return false;
  const plan = LEADSYNC_PLANS[userTier];
  const value = plan.features[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
}

// Get remaining usage based on current usage and tier limits
export function getRemainingUsage(
  userTier: LeadSyncTier,
  feature: keyof LeadSyncPlan['features'],
  currentUsage: number
): { remaining: number; limit: number; isUnlimited: boolean } {
  const plan = LEADSYNC_PLANS[userTier];
  const limit = plan.features[feature] as number;
  
  if (limit === -1) {
    return { remaining: -1, limit: -1, isUnlimited: true };
  }
  
  return {
    remaining: Math.max(0, limit - currentUsage),
    limit,
    isUnlimited: false,
  };
}

// Get upgrade recommendation based on current tier
export function getUpgradeRecommendation(currentTier: LeadSyncTier | null): LeadSyncTier | null {
  if (!currentTier) return 'starter';
  if (currentTier === 'starter') return 'pro';
  if (currentTier === 'pro') return 'agency';
  return null; // Already at highest tier
}
