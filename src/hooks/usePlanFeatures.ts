/**
 * Plan Features Hook
 * Central hook for tier-based feature gating
 * Maps subscription plans to available features
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscription } from '@/lib/api/stripe';

export type PlanTier = 'free' | 'basic' | 'pro' | 'autopilot';

export interface PlanFeatures {
  tier: PlanTier;
  // Search limits
  dailySearches: number | 'unlimited';
  monthlyVerifications: number;
  // Email features
  manualEmailSend: boolean;
  aiEmailWriter: 'none' | 'basic' | 'full' | 'autonomous';
  emailTemplates: 'none' | 'basic' | 'full' | 'custom';
  dripCampaigns: boolean;
  abTesting: boolean;
  // AI Automation
  autoFollowUps: boolean;
  smartResponseDetection: boolean;
  aiResurrectionSequences: boolean;
  fullAutopilot: boolean;
  autonomousProposals: boolean;
  // CRM
  crmIncluded: boolean;
  crmTrial: boolean;
  externalCrmIntegrations: boolean;
  // Team
  teamMembers: number | 'unlimited';
  // Premium
  apiAccess: boolean;
  webhooks: boolean;
  whiteLabelReports: boolean;
  dedicatedManager: boolean;
  // Onboarding
  requiresOnboarding: boolean;
}

const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    tier: 'free',
    dailySearches: 5,
    monthlyVerifications: 25,
    manualEmailSend: false,
    aiEmailWriter: 'none',
    emailTemplates: 'none',
    dripCampaigns: false,
    abTesting: false,
    autoFollowUps: false,
    smartResponseDetection: false,
    aiResurrectionSequences: false,
    fullAutopilot: false,
    autonomousProposals: false,
    crmIncluded: false,
    crmTrial: false,
    externalCrmIntegrations: false,
    teamMembers: 1,
    apiAccess: false,
    webhooks: false,
    whiteLabelReports: false,
    dedicatedManager: false,
    requiresOnboarding: false,
  },
  basic: {
    tier: 'basic',
    dailySearches: 50,
    monthlyVerifications: 200,
    manualEmailSend: true,
    aiEmailWriter: 'basic',
    emailTemplates: 'basic',
    dripCampaigns: false,
    abTesting: false,
    autoFollowUps: false,
    smartResponseDetection: false,
    aiResurrectionSequences: false,
    fullAutopilot: false,
    autonomousProposals: false,
    crmIncluded: false,
    crmTrial: true,
    externalCrmIntegrations: false,
    teamMembers: 1,
    apiAccess: false,
    webhooks: false,
    whiteLabelReports: false,
    dedicatedManager: false,
    requiresOnboarding: false,
  },
  pro: {
    tier: 'pro',
    dailySearches: 200,
    monthlyVerifications: 500,
    manualEmailSend: true,
    aiEmailWriter: 'full',
    emailTemplates: 'full',
    dripCampaigns: true,
    abTesting: true,
    autoFollowUps: true,
    smartResponseDetection: true,
    aiResurrectionSequences: true,
    fullAutopilot: false, // Not full autopilot, but co-pilot
    autonomousProposals: false,
    crmIncluded: false,
    crmTrial: true,
    externalCrmIntegrations: true,
    teamMembers: 3,
    apiAccess: false,
    webhooks: false,
    whiteLabelReports: false,
    dedicatedManager: false,
    requiresOnboarding: false,
  },
  autopilot: {
    tier: 'autopilot',
    dailySearches: 'unlimited',
    monthlyVerifications: 2000,
    manualEmailSend: true,
    aiEmailWriter: 'autonomous',
    emailTemplates: 'custom',
    dripCampaigns: true,
    abTesting: true,
    autoFollowUps: true,
    smartResponseDetection: true,
    aiResurrectionSequences: true,
    fullAutopilot: true,
    autonomousProposals: true,
    crmIncluded: true,
    crmTrial: false, // No trial needed, it's included
    externalCrmIntegrations: true,
    teamMembers: 'unlimited',
    apiAccess: true,
    webhooks: true,
    whiteLabelReports: true,
    dedicatedManager: true,
    requiresOnboarding: true, // Needs onboarding wizard
  },
};

const STORAGE_KEY = 'bamlead_user_plan';
const ONBOARDING_COMPLETE_KEY = 'bamlead_autopilot_onboarding_complete';

export function usePlanFeatures() {
  const { user, isAuthenticated } = useAuth();
  const [tier, setTier] = useState<PlanTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check if user is owner/admin (gets all features)
  const isOwner = useMemo(() => {
    return user?.is_owner === true || user?.role === 'admin';
  }, [user]);

  // Fetch subscription status
  useEffect(() => {
    const fetchPlan = async () => {
      if (!isAuthenticated) {
        setTier('free');
        setIsLoading(false);
        return;
      }

      try {
        const { subscription, is_owner } = await getSubscription();
        
        if (is_owner) {
          setTier('autopilot'); // Owners get full access
          setNeedsOnboarding(false);
        } else if (subscription) {
          // Map subscription plan to tier
          const planMap: Record<string, PlanTier> = {
            'basic': 'basic',
            'pro': 'pro',
            'autopilot': 'autopilot',
            'agency': 'autopilot', // Legacy mapping
          };
          const userTier = planMap[subscription.plan] || 'free';
          setTier(userTier);
          
          // Check if Autopilot user needs onboarding
          if (userTier === 'autopilot') {
            const onboardingComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
            setNeedsOnboarding(!onboardingComplete);
          }
        } else {
          setTier('free');
        }
        
        // Cache the tier
        localStorage.setItem(STORAGE_KEY, tier);
      } catch (error) {
        // Fallback to cached tier
        const cached = localStorage.getItem(STORAGE_KEY) as PlanTier | null;
        if (cached && ['free', 'basic', 'pro', 'autopilot'].includes(cached)) {
          setTier(cached);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [isAuthenticated, user]);

  // Get features for current tier (or all features if owner)
  const features = useMemo<PlanFeatures>(() => {
    if (isOwner) {
      return { ...PLAN_FEATURES.autopilot, requiresOnboarding: false };
    }
    return PLAN_FEATURES[tier];
  }, [tier, isOwner]);

  // Helper to check if a feature is available
  const hasFeature = useCallback((feature: keyof PlanFeatures): boolean => {
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (value === 'unlimited') return true;
    if (typeof value === 'string') return value !== 'none';
    return false;
  }, [features]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setNeedsOnboarding(false);
  }, []);

  // Get tier display info
  const tierInfo = useMemo(() => {
    const info = {
      free: { name: 'Free', color: 'text-muted-foreground', bgColor: 'bg-muted' },
      basic: { name: 'Basic', color: 'text-primary', bgColor: 'bg-primary/10' },
      pro: { name: 'Pro', color: 'text-primary', bgColor: 'bg-primary/10' },
      autopilot: { name: 'Autopilot', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    };
    return info[tier];
  }, [tier]);

  return {
    tier,
    features,
    isLoading,
    isOwner,
    hasFeature,
    needsOnboarding,
    completeOnboarding,
    tierInfo,
    // Convenience booleans
    isAutopilot: tier === 'autopilot' || isOwner,
    isPro: tier === 'pro' || tier === 'autopilot' || isOwner,
    isPaid: tier !== 'free',
  };
}

// Static helper for components that can't use hooks
export function getCachedTier(): PlanTier {
  try {
    const cached = localStorage.getItem(STORAGE_KEY) as PlanTier | null;
    if (cached && ['free', 'basic', 'pro', 'autopilot'].includes(cached)) {
      return cached;
    }
  } catch {}
  return 'free';
}

export function getPlanFeatures(tier: PlanTier): PlanFeatures {
  return PLAN_FEATURES[tier];
}
