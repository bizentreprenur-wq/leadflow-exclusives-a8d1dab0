import { API_BASE_URL, apiRequest, USE_MOCK_AUTH } from './config';

const SETUP_ENDPOINTS = {
  createSetupIntent: `${API_BASE_URL}/stripe-setup.php?action=create-setup-intent`,
  savePaymentMethod: `${API_BASE_URL}/stripe-setup.php?action=save-payment-method`,
  checkPaymentMethod: `${API_BASE_URL}/stripe-setup.php?action=check-payment-method`,
};

export interface SetupIntentResponse {
  success: boolean;
  client_secret: string;
  setup_intent_id: string;
}

export interface PaymentMethodStatus {
  success: boolean;
  has_payment_method: boolean;
  has_active_subscription: boolean;
  is_trialing: boolean;
  trial_ends_at: string | null;
  subscription_plan: string | null;
  requires_payment_setup: boolean;
}

export interface SavePaymentMethodResponse {
  success: boolean;
  message: string;
  trial_ends_at: string;
  plan: string;
}

/**
 * Create a SetupIntent for collecting payment method without charging
 */
export async function createSetupIntent(): Promise<SetupIntentResponse> {
  if (USE_MOCK_AUTH) {
    // In demo mode, simulate the response
    return {
      success: true,
      client_secret: 'seti_mock_secret_demo',
      setup_intent_id: 'seti_mock_demo',
    };
  }

  return apiRequest(SETUP_ENDPOINTS.createSetupIntent, {
    method: 'POST',
  });
}

/**
 * Check if user has a valid payment method and subscription status
 */
export async function checkPaymentMethod(): Promise<PaymentMethodStatus> {
  if (USE_MOCK_AUTH) {
    // In demo mode, assume no payment method required
    return {
      success: true,
      has_payment_method: true,
      has_active_subscription: true,
      is_trialing: false,
      trial_ends_at: null,
      subscription_plan: 'demo',
      requires_payment_setup: false,
    };
  }

  return apiRequest(SETUP_ENDPOINTS.checkPaymentMethod);
}

/**
 * Save payment method and start trial subscription
 */
export async function savePaymentMethod(
  setupIntentId: string,
  plan: 'basic' | 'pro' | 'agency' = 'pro'
): Promise<SavePaymentMethodResponse> {
  if (USE_MOCK_AUTH) {
    return {
      success: true,
      message: 'Demo mode - trial activated!',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      plan,
    };
  }

  return apiRequest(SETUP_ENDPOINTS.savePaymentMethod, {
    method: 'POST',
    body: JSON.stringify({ setup_intent_id: setupIntentId, plan }),
  });
}
