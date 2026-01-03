import { API_BASE_URL, apiRequest, getAuthHeaders, USE_MOCK_AUTH } from './config';

const STRIPE_ENDPOINTS = {
  config: `${API_BASE_URL}/stripe.php?action=config`,
  createCheckout: `${API_BASE_URL}/stripe.php?action=create-checkout`,
  createPortal: `${API_BASE_URL}/stripe.php?action=create-portal`,
  subscription: `${API_BASE_URL}/stripe.php?action=subscription`,
  cancel: `${API_BASE_URL}/stripe.php?action=cancel`,
  resume: `${API_BASE_URL}/stripe.php?action=resume`,
  history: `${API_BASE_URL}/stripe.php?action=history`,
};

export interface Plan {
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
}

export interface StripeConfig {
  publishable_key: string;
  plans: {
    basic: Plan;
    pro: Plan;
    agency: Plan;
  };
}

export interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  date: string;
}

// Mock data for testing
const MOCK_CONFIG: StripeConfig = {
  publishable_key: 'pk_test_mock',
  plans: {
    basic: {
      name: 'Basic',
      monthly_price: 49,
      yearly_price: 470,
      features: [
        '50 searches per day',
        'Basic lead verification',
        'CSV export',
        'Email support',
      ],
    },
    pro: {
      name: 'Pro',
      monthly_price: 99,
      yearly_price: 950,
      features: [
        '200 searches per day',
        'Advanced lead verification',
        'CRM integrations',
        'Priority support',
        'Team collaboration (3 users)',
      ],
    },
    agency: {
      name: 'Agency',
      monthly_price: 249,
      yearly_price: 2390,
      features: [
        'Unlimited searches',
        'Full lead verification',
        'White-label exports',
        'API access',
        'Dedicated account manager',
        'Unlimited team members',
      ],
    },
  },
};

export async function getStripeConfig(): Promise<StripeConfig> {
  if (USE_MOCK_AUTH) {
    return MOCK_CONFIG;
  }
  
  const response = await apiRequest<{ success: boolean } & StripeConfig>(STRIPE_ENDPOINTS.config);
  return response;
}

export async function createCheckoutSession(
  plan: 'basic' | 'pro' | 'agency',
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<{ checkout_url: string; session_id: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    // In mock mode, just show a message
    throw new Error('Stripe checkout not available in demo mode. Configure your Stripe keys to enable payments.');
  }

  const response = await apiRequest<{ success: boolean; checkout_url: string; session_id: string }>(
    STRIPE_ENDPOINTS.createCheckout,
    {
      method: 'POST',
      body: JSON.stringify({ plan, billing_period: billingPeriod }),
    }
  );
  
  return response;
}

export async function createPortalSession(): Promise<{ portal_url: string }> {
  if (USE_MOCK_AUTH) {
    throw new Error('Customer portal not available in demo mode.');
  }

  const response = await apiRequest<{ success: boolean; portal_url: string }>(
    STRIPE_ENDPOINTS.createPortal,
    { method: 'POST' }
  );
  
  return response;
}

export async function getSubscription(): Promise<{
  subscription: Subscription | null;
  is_owner: boolean;
  is_free_account: boolean;
}> {
  if (USE_MOCK_AUTH) {
    return {
      subscription: null,
      is_owner: false,
      is_free_account: false,
    };
  }

  return apiRequest(STRIPE_ENDPOINTS.subscription);
}

export async function cancelSubscription(immediately: boolean = false): Promise<{ message: string }> {
  if (USE_MOCK_AUTH) {
    throw new Error('Not available in demo mode.');
  }

  return apiRequest(STRIPE_ENDPOINTS.cancel, {
    method: 'POST',
    body: JSON.stringify({ immediately }),
  });
}

export async function resumeSubscription(): Promise<{ message: string }> {
  if (USE_MOCK_AUTH) {
    throw new Error('Not available in demo mode.');
  }

  return apiRequest(STRIPE_ENDPOINTS.resume, { method: 'POST' });
}

export async function getPaymentHistory(): Promise<{ payments: Payment[] }> {
  if (USE_MOCK_AUTH) {
    return { payments: [] };
  }

  return apiRequest(STRIPE_ENDPOINTS.history);
}
