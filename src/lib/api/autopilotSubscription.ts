/**
 * AI Autopilot Campaign Subscription API
 * Handles the $19.99/month subscription for AI automation features
 */

import { API_BASE_URL, apiRequest, USE_MOCK_AUTH } from './config';

const ENDPOINTS = {
  createCheckout: `${API_BASE_URL}/stripe.php?action=create-checkout`,
  checkSubscription: `${API_BASE_URL}/stripe.php?action=check-autopilot-subscription`,
  cancelSubscription: `${API_BASE_URL}/stripe.php?action=cancel-autopilot`,
  createSetupIntent: `${API_BASE_URL}/stripe-setup.php?action=create-setup-intent`,
};

export interface AutopilotSubscriptionStatus {
  success: boolean;
  hasSubscription: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isPaid: boolean;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  checkout_url?: string;
  session_id?: string;
  error?: string;
}

/**
 * Check current AI Autopilot subscription status
 */
export async function checkAutopilotSubscription(): Promise<AutopilotSubscriptionStatus> {
  if (USE_MOCK_AUTH) {
    // Check localStorage for demo trial
    try {
      const stored = localStorage.getItem('bamlead_autopilot_trial');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.isPaid) {
          return {
            success: true,
            hasSubscription: true,
            isTrialActive: false,
            trialDaysRemaining: 0,
            isPaid: true,
            subscriptionId: 'sub_demo_paid',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false,
          };
        }
        if (data.trialStartDate) {
          const startDate = new Date(data.trialStartDate);
          const now = new Date();
          const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const remaining = Math.max(0, 14 - diffDays);
          return {
            success: true,
            hasSubscription: remaining > 0,
            isTrialActive: remaining > 0,
            trialDaysRemaining: remaining,
            isPaid: false,
            subscriptionId: remaining > 0 ? 'sub_demo_trial' : null,
            currentPeriodEnd: remaining > 0 ? new Date(Date.now() + remaining * 24 * 60 * 60 * 1000).toISOString() : null,
            cancelAtPeriodEnd: false,
          };
        }
      }
      return {
        success: true,
        hasSubscription: false,
        isTrialActive: false,
        trialDaysRemaining: 0,
        isPaid: false,
        subscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    } catch {
      return {
        success: false,
        hasSubscription: false,
        isTrialActive: false,
        trialDaysRemaining: 0,
        isPaid: false,
        subscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }
  }

  return apiRequest(ENDPOINTS.checkSubscription);
}

/**
 * Create Stripe checkout session for AI Autopilot subscription
 */
export async function createAutopilotCheckout(returnUrl?: string): Promise<CheckoutResponse> {
  if (USE_MOCK_AUTH) {
    // Demo mode - start trial directly
    const trialData = {
      isTrialActive: true,
      trialDaysRemaining: 14,
      trialStartDate: new Date().toISOString(),
      isPaid: false,
    };
    localStorage.setItem('bamlead_autopilot_trial', JSON.stringify(trialData));
    return {
      success: true,
      checkout_url: undefined, // No redirect needed for demo
    };
  }

  return apiRequest(ENDPOINTS.createCheckout, {
    method: 'POST',
    body: JSON.stringify({
      product: 'autopilot',
      return_url: returnUrl || window.location.href,
    }),
  });
}

/**
 * Start free trial for AI Autopilot Campaign
 */
export function startAutopilotTrial(): AutopilotSubscriptionStatus {
  const trialData = {
    isTrialActive: true,
    trialDaysRemaining: 14,
    trialStartDate: new Date().toISOString(),
    isPaid: false,
  };
  localStorage.setItem('bamlead_autopilot_trial', JSON.stringify(trialData));
  
  return {
    success: true,
    hasSubscription: true,
    isTrialActive: true,
    trialDaysRemaining: 14,
    isPaid: false,
    subscriptionId: 'trial_local',
    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  };
}

/**
 * Upgrade from trial to paid subscription
 */
export async function upgradeAutopilotToPaid(): Promise<CheckoutResponse> {
  if (USE_MOCK_AUTH) {
    const paidData = {
      isTrialActive: false,
      trialDaysRemaining: 0,
      trialStartDate: null,
      isPaid: true,
      subscribedAt: new Date().toISOString(),
    };
    localStorage.setItem('bamlead_autopilot_trial', JSON.stringify(paidData));
    return { success: true };
  }

  return apiRequest(ENDPOINTS.createCheckout, {
    method: 'POST',
    body: JSON.stringify({
      product: 'autopilot',
      mode: 'payment_required',
      return_url: window.location.href,
    }),
  });
}

/**
 * Cancel AI Autopilot subscription
 */
export async function cancelAutopilotSubscription(): Promise<{ success: boolean; message?: string }> {
  if (USE_MOCK_AUTH) {
    localStorage.removeItem('bamlead_autopilot_trial');
    return { success: true, message: 'Subscription cancelled' };
  }

  return apiRequest(ENDPOINTS.cancelSubscription, {
    method: 'POST',
  });
}
