/**
 * Email Replies API Client
 * Fetches real email replies from the backend and provides AI response generation
 */

import { API_BASE_URL, getAuthHeaders, apiRequest } from './config';

export interface EmailReplyFromAPI {
  id: number;
  user_id: number;
  campaign_id: number | null;
  original_send_id: number | null;
  from_email: string;
  from_name: string;
  subject: string;
  body_preview: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'interested' | 'scheduling' | 'question' | 'pricing' | 'timing' | 'objection' | 'unsubscribe' | 'general';
  urgency_level: 'hot' | 'warm' | 'cold';
  received_at: string;
  is_read: boolean;
  requires_action: boolean;
  action_taken_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReplyCounts {
  total: number;
  unread: number;
  action_required: number;
  positive: number;
  negative: number;
}

export interface GetRepliesResponse {
  success: boolean;
  replies: EmailReplyFromAPI[];
  counts: ReplyCounts;
  timestamp: string;
  error?: string;
}

const REPLY_ENDPOINTS = {
  getReplies: `${API_BASE_URL}/email-reply-webhook.php?action=get-replies`,
  updateStatus: `${API_BASE_URL}/email-reply-webhook.php?action=update-status`,
  pauseSequence: `${API_BASE_URL}/email-reply-webhook.php?action=pause-sequence`,
};

/**
 * Fetch email replies from the backend
 */
export async function getEmailReplies(
  filter: 'all' | 'unread' | 'action_required' = 'all',
  limit = 50,
  since?: string
): Promise<GetRepliesResponse> {
  try {
    let url = `${REPLY_ENDPOINTS.getReplies}&filter=${filter}&limit=${limit}`;
    if (since) {
      url += `&since=${encodeURIComponent(since)}`;
    }
    return await apiRequest(url);
  } catch (error: any) {
    return {
      success: false,
      replies: [],
      counts: { total: 0, unread: 0, action_required: 0, positive: 0, negative: 0 },
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Update reply status (mark as read, action taken, etc.)
 */
export async function updateReplyStatus(
  replyId: number,
  updates: { is_read?: boolean; requires_action?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiRequest(REPLY_ENDPOINTS.updateStatus, {
      method: 'POST',
      body: JSON.stringify({
        reply_id: replyId,
        is_read: updates.is_read ? 1 : 0,
        requires_action: updates.requires_action ? 1 : 0,
      }),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pause a drip sequence for a specific lead email
 */
export async function pauseSequenceForLead(
  email: string,
  campaignId?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiRequest(REPLY_ENDPOINTS.pauseSequence, {
      method: 'POST',
      body: JSON.stringify({ email, campaign_id: campaignId }),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * AI-powered response generation based on reply context
 * Uses rule-based logic for intelligent, context-aware responses
 */
export function generateAIResponse(
  reply: {
    from_name: string;
    from_email: string;
    subject: string;
    body: string;
    sentiment?: string;
    intent?: string;
    urgency_level?: string;
  },
  senderName: string,
  companyName: string
): string {
  const firstName = reply.from_name?.split(' ')[0] || 'there';
  const businessContext = reply.from_name?.split(' ').slice(1).join(' ') || '';
  const body = (reply.body || '').toLowerCase();
  const intent = reply.intent || detectIntent(body);
  const sentiment = reply.sentiment || detectSentiment(body);

  // Unsubscribe - graceful exit
  if (intent === 'unsubscribe') {
    return `Hi ${firstName},\n\nI completely understand. I've removed you from our mailing list immediately.\n\nIf you ever need help in the future, don't hesitate to reach out.\n\nWishing you all the best!\n\nBest regards,\n${senderName}`;
  }

  // Negative / objection - empathetic response
  if (sentiment === 'negative' || intent === 'objection') {
    return `Hi ${firstName},\n\nThank you for being upfront — I really appreciate that.\n\nI understand this might not be the right fit or timing. No pressure at all.\n\nIf anything changes down the road, I'm always happy to chat. In the meantime, I wish you continued success!\n\nBest regards,\n${senderName}`;
  }

  // Scheduling intent - provide times
  if (intent === 'scheduling') {
    return `Hi ${firstName},\n\nGreat — I'd love to connect!\n\nHere are a few times that work for me:\n\n• Tomorrow at 10:00 AM\n• Tomorrow at 2:00 PM\n• Thursday at 11:00 AM\n• Friday at 3:00 PM\n\nJust let me know which works best for you (or suggest another time), and I'll send over a calendar invite right away.\n\nLooking forward to speaking with you!\n\nBest regards,\n${senderName}\n${companyName}`;
  }

  // Pricing question - value-first response
  if (intent === 'pricing') {
    return `Hi ${firstName},\n\nGreat question! I'd be happy to walk you through our pricing.\n\nOur packages are tailored to each business's specific needs, so I'd love to understand your situation better before quoting — that way I can give you the most accurate and fair pricing.\n\nWould you be available for a quick 10-minute call? I promise it'll be focused and valuable.\n\nAlternatively, I can send over a general pricing overview if you prefer.\n\nBest regards,\n${senderName}\n${companyName}`;
  }

  // Question - helpful, educational response
  if (intent === 'question') {
    return `Hi ${firstName},\n\nThanks for the question — happy to help!\n\nI want to make sure I give you a thorough answer. Could you tell me a bit more about what specifically you'd like to know? That way I can provide the most relevant information for your situation.\n\nIn the meantime, I've helped many businesses in your space and would love to share some insights that might be helpful.\n\nWould a quick call work, or would you prefer I send details via email?\n\nBest regards,\n${senderName}\n${companyName}`;
  }

  // Timing - respect the timeline
  if (intent === 'timing') {
    return `Hi ${firstName},\n\nTotally understand — timing is everything.\n\nI'll make a note to circle back with you at a better time. When do you think would be ideal? I'm happy to reconnect in a few weeks, next quarter, or whenever works for you.\n\nNo rush at all. I just want to make sure I'm here when you're ready.\n\nBest regards,\n${senderName}\n${companyName}`;
  }

  // Interested / Positive - enthusiastic but professional
  if (intent === 'interested' || sentiment === 'positive') {
    return `Hi ${firstName},\n\nThat's great to hear — thank you for getting back to me!\n\nI'm excited about the opportunity to work together. To get started, I'd love to learn a bit more about your goals and challenges so I can put together a tailored plan.\n\nWould you be available for a quick 15-minute call this week? Here are some times that work:\n\n• Tomorrow at 10:00 AM or 3:00 PM\n• Thursday at 11:00 AM or 2:00 PM\n\nAlternatively, feel free to suggest a time that works better for you.\n\nLooking forward to it!\n\nBest regards,\n${senderName}\n${companyName}`;
  }

  // General / fallback - warm follow-up
  return `Hi ${firstName},\n\nThank you for getting back to me! I appreciate you taking the time to respond.\n\nI'd love to discuss this further and answer any questions you might have about how we can help.\n\nWould you be available for a quick call this week? I can walk you through exactly what we offer and how it applies to your specific situation.\n\nLooking forward to hearing from you!\n\nBest regards,\n${senderName}\n${companyName}`;
}

/**
 * Detect intent from email body text
 */
function detectIntent(text: string): string {
  const lower = text.toLowerCase();

  if (/unsubscribe|remove|stop|opt.?out|don't contact/i.test(lower)) return 'unsubscribe';
  if (/schedule|meeting|call|chat|zoom|calendar|available|time|book/i.test(lower)) return 'scheduling';
  if (/interested|tell me more|learn more|curious|want to|sounds good|let's do/i.test(lower)) return 'interested';
  if (/price|cost|budget|afford|expensive|cheap|quote|fee|rate/i.test(lower)) return 'pricing';
  if (/question|how|what|why|explain|clarify|wondering/i.test(lower)) return 'question';
  if (/not now|later|busy|timing|next quarter|next year|maybe later/i.test(lower)) return 'timing';
  if (/already have|competitor|using|alternative|not for us|pass|decline/i.test(lower)) return 'objection';

  return 'general';
}

/**
 * Detect sentiment from email body text
 */
function detectSentiment(text: string): string {
  const lower = text.toLowerCase();
  const positiveWords = ['interested', 'yes', 'great', 'love', 'perfect', 'awesome', 'sounds good', 'absolutely', 'definitely'];
  const negativeWords = ['not interested', 'no thanks', 'spam', 'stop', 'unsubscribe', 'don\'t'];

  let pos = 0;
  let neg = 0;
  for (const w of positiveWords) if (lower.includes(w)) pos++;
  for (const w of negativeWords) if (lower.includes(w)) neg++;

  if (pos > neg) return 'positive';
  if (neg > pos) return 'negative';
  return 'neutral';
}
