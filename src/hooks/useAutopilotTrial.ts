/**
 * AI Autopilot Trial Hook
 * Manages the 7-day free trial state, warnings, and subscription status
 * Owner accounts get free unlimited access
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  checkAutopilotSubscription, 
  startAutopilotTrial,
  createAutopilotCheckout,
  AutopilotSubscriptionStatus 
} from '@/lib/api/autopilotSubscription';

export interface TrialStatus {
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialStartDate: string | null;
  isPaid: boolean;
  isExpired: boolean;
  hasStartedTrial: boolean;
  subscriptionId: string | null;
  canUseAutopilot: boolean;
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'expired';
  warningMessage: string;
}

const TRIAL_DURATION_DAYS = 7;
const STORAGE_KEY = 'bamlead_autopilot_trial';

export function useAutopilotTrial() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<TrialStatus>(() => getInitialStatus());

  // Owner accounts get free unlimited access
  const isOwnerAccount = useMemo(() => {
    return user?.is_owner === true || user?.role === 'admin';
  }, [user]);

  // Create owner status with unlimited access
  const ownerStatus: TrialStatus = useMemo(() => ({
    isTrialActive: false,
    trialDaysRemaining: 0,
    trialStartDate: null,
    isPaid: true, // Treated as paid for access purposes
    isExpired: false,
    hasStartedTrial: false,
    subscriptionId: 'owner_complimentary',
    canUseAutopilot: true,
    warningLevel: 'none',
    warningMessage: '',
  }), []);

  // Calculate status from localStorage
  function getInitialStatus(): TrialStatus {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return createDefaultStatus();
      }

      const data = JSON.parse(stored);
      
      if (data.isPaid) {
        return {
          isTrialActive: false,
          trialDaysRemaining: 0,
          trialStartDate: data.trialStartDate,
          isPaid: true,
          isExpired: false,
          hasStartedTrial: true,
          subscriptionId: data.subscriptionId,
          canUseAutopilot: true,
          warningLevel: 'none',
          warningMessage: '',
        };
      }

      if (data.trialStartDate) {
        const startDate = new Date(data.trialStartDate);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - diffDays);
        const isExpired = daysRemaining <= 0;
        
        return {
          isTrialActive: !isExpired,
          trialDaysRemaining: daysRemaining,
          trialStartDate: data.trialStartDate,
          isPaid: false,
          isExpired,
          hasStartedTrial: true,
          subscriptionId: null,
          canUseAutopilot: !isExpired,
          warningLevel: getWarningLevel(daysRemaining, isExpired),
          warningMessage: getWarningMessage(daysRemaining, isExpired),
        };
      }

      return createDefaultStatus();
    } catch {
      return createDefaultStatus();
    }
  }

  function createDefaultStatus(): TrialStatus {
    return {
      isTrialActive: false,
      trialDaysRemaining: TRIAL_DURATION_DAYS,
      trialStartDate: null,
      isPaid: false,
      isExpired: false,
      hasStartedTrial: false,
      subscriptionId: null,
      canUseAutopilot: false,
      warningLevel: 'none',
      warningMessage: '',
    };
  }

  function getWarningLevel(daysRemaining: number, isExpired: boolean): TrialStatus['warningLevel'] {
    if (isExpired) return 'expired';
    if (daysRemaining <= 1) return 'high';
    if (daysRemaining <= 3) return 'medium';
    if (daysRemaining <= 7) return 'low';
    return 'none';
  }

  function getWarningMessage(daysRemaining: number, isExpired: boolean): string {
    if (isExpired) {
      return 'Your 7-day trial has ended. Subscribe now to continue using AI Autopilot.';
    }
    if (daysRemaining === 1) {
      return '⚠️ Last day of your trial! Subscribe to keep AI Autopilot active.';
    }
    if (daysRemaining <= 2) {
      return `⚠️ Only ${daysRemaining} days left in your trial! Don't lose your AI automation.`;
    }
    return `${daysRemaining} days remaining in your free trial.`;
  }

  // Refresh status from backend or localStorage
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiStatus = await checkAutopilotSubscription();
      
      if (apiStatus.success) {
        const newStatus: TrialStatus = {
          isTrialActive: apiStatus.isTrialActive,
          trialDaysRemaining: apiStatus.trialDaysRemaining,
          trialStartDate: localStorage.getItem(STORAGE_KEY) 
            ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').trialStartDate 
            : null,
          isPaid: apiStatus.isPaid,
          isExpired: apiStatus.hasSubscription === false && !apiStatus.isTrialActive,
          hasStartedTrial: apiStatus.hasSubscription || apiStatus.isTrialActive || apiStatus.isPaid,
          subscriptionId: apiStatus.subscriptionId,
          canUseAutopilot: apiStatus.hasSubscription || apiStatus.isTrialActive || apiStatus.isPaid,
          warningLevel: getWarningLevel(apiStatus.trialDaysRemaining, !apiStatus.hasSubscription && !apiStatus.isTrialActive),
          warningMessage: getWarningMessage(apiStatus.trialDaysRemaining, !apiStatus.hasSubscription && !apiStatus.isTrialActive),
        };
        setStatus(newStatus);
      } else {
        // Fallback to localStorage
        setStatus(getInitialStatus());
      }
    } catch {
      setStatus(getInitialStatus());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start free trial
  const startTrial = useCallback(() => {
    const result = startAutopilotTrial();
    if (result.success) {
      const newStatus: TrialStatus = {
        isTrialActive: true,
        trialDaysRemaining: 7,
        trialStartDate: result.currentPeriodEnd 
          ? new Date(new Date(result.currentPeriodEnd).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : new Date().toISOString(),
        isPaid: false,
        isExpired: false,
        hasStartedTrial: true,
        subscriptionId: result.subscriptionId,
        canUseAutopilot: true,
        warningLevel: 'none',
        warningMessage: '7 days remaining in your free trial.',
      };
      setStatus(newStatus);
      return true;
    }
    return false;
  }, []);

  // Upgrade to paid subscription
  const upgradeToPaid = useCallback(async () => {
    try {
      const result = await createAutopilotCheckout(window.location.href);
      if (result.success) {
        if (result.checkout_url) {
          window.location.href = result.checkout_url;
        } else {
          // Demo mode - instant upgrade
          const newStatus: TrialStatus = {
            ...status,
            isPaid: true,
            isTrialActive: false,
            isExpired: false,
            canUseAutopilot: true,
            warningLevel: 'none',
            warningMessage: '',
            subscriptionId: `sub_${Date.now()}`,
          };
          
          // Update localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            isTrialActive: false,
            isPaid: true,
            trialStartDate: status.trialStartDate,
            subscribedAt: new Date().toISOString(),
          }));
          
          setStatus(newStatus);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [status]);

  // Check status on mount
  useEffect(() => {
    refreshStatus();
    
    // Refresh every minute to update countdown
    const interval = setInterval(() => {
      setStatus(getInitialStatus());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Badge color based on warning level - Yellow/Amber theme
  const badgeColor = useMemo(() => {
    switch (status.warningLevel) {
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  }, [status.warningLevel]);

  return {
    status: isOwnerAccount ? ownerStatus : status,
    isLoading: isOwnerAccount ? false : isLoading,
    badgeColor: isOwnerAccount ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : badgeColor,
    startTrial,
    upgradeToPaid,
    refreshStatus,
    TRIAL_DURATION_DAYS,
    MONTHLY_PRICE: 19.99,
    isOwnerAccount,
  };
}

export default useAutopilotTrial;
