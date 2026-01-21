/**
 * Email Webhook API - Real-time delivery tracking
 */

import { API_BASE_URL, getAuthHeaders, apiRequest } from './config';

// Types
export interface WebhookEvent {
  id: number;
  event_type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam_report' | 'unsubscribe' | 'deferred';
  recipient_email: string;
  timestamp: string;
  click_url?: string;
  bounce_reason?: string;
  business_name?: string;
  subject?: string;
}

export interface DeliveryStats {
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

export interface DailyStats {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

export interface WebhookStatsResponse {
  success: boolean;
  stats: DeliveryStats;
  daily: DailyStats[];
  recent_events: WebhookEvent[];
  error?: string;
}

export interface WebhookEventsResponse {
  success: boolean;
  events: WebhookEvent[];
  timestamp: string;
  error?: string;
}

const WEBHOOK_ENDPOINTS = {
  events: `${API_BASE_URL}/email-webhook.php?action=events`,
  stats: `${API_BASE_URL}/email-webhook.php?action=stats`,
};

/**
 * Get recent webhook events (for real-time polling)
 */
export async function getWebhookEvents(since?: string, limit: number = 50): Promise<WebhookEventsResponse> {
  try {
    let url = `${WEBHOOK_ENDPOINTS.events}&limit=${limit}`;
    if (since) {
      url += `&since=${encodeURIComponent(since)}`;
    }
    return await apiRequest(url);
  } catch (error: any) {
    return { success: false, events: [], timestamp: new Date().toISOString(), error: error.message };
  }
}

/**
 * Get delivery statistics
 */
export async function getDeliveryStats(period: number = 7): Promise<WebhookStatsResponse> {
  try {
    return await apiRequest(`${WEBHOOK_ENDPOINTS.stats}&period=${period}`);
  } catch (error: any) {
    return { 
      success: false, 
      stats: { total_sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, delivery_rate: 0, open_rate: 0, click_rate: 0 },
      daily: [],
      recent_events: [],
      error: error.message 
    };
  }
}

/**
 * Format event type for display
 */
export function formatEventType(eventType: string): { label: string; icon: string; color: string } {
  const eventMap: Record<string, { label: string; icon: string; color: string }> = {
    delivered: { label: 'Delivered', icon: '📬', color: 'text-success' },
    opened: { label: 'Opened', icon: '👁️', color: 'text-primary' },
    clicked: { label: 'Clicked', icon: '🖱️', color: 'text-info' },
    bounced: { label: 'Bounced', icon: '↩️', color: 'text-destructive' },
    dropped: { label: 'Dropped', icon: '🚫', color: 'text-destructive' },
    spam_report: { label: 'Spam Report', icon: '⚠️', color: 'text-warning' },
    unsubscribe: { label: 'Unsubscribed', icon: '🚪', color: 'text-muted' },
    deferred: { label: 'Deferred', icon: '⏳', color: 'text-warning' },
  };
  
  return eventMap[eventType] || { label: eventType, icon: '📧', color: 'text-muted' };
}
