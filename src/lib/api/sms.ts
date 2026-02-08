/**
 * SMS API Client for AI Calling Module
 * Handles bi-directional SMS messaging for Autopilot tier
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export interface SMSMessage {
  id: string;
  lead_id: string | number;
  lead_name: string;
  lead_phone: string;
  direction: 'inbound' | 'outbound';
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received';
  created_at: string;
  read: boolean;
}

export interface SMSConversation {
  lead_id: string | number;
  lead_name: string;
  lead_phone: string;
  business_name?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: SMSMessage[];
  ai_suggested_reply?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'interested';
}

export interface SMSTemplate {
  id: string;
  name: string;
  category: 'follow_up' | 'appointment' | 'thank_you' | 'intro' | 'custom';
  message: string;
  variables: string[];
}

export interface SMSSendRequest {
  lead_id: string | number;
  lead_phone: string;
  message: string;
  lead_name?: string;
  business_name?: string;
  use_ai?: boolean;
}

export interface SMSStats {
  total_sent: number;
  total_received: number;
  response_rate: number;
  avg_response_time_minutes: number;
  positive_responses: number;
  appointments_booked: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/**
 * Send an SMS message to a lead
 */
export async function sendSMS(request: SMSSendRequest): Promise<{ 
  success: boolean; 
  message_id?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get SMS conversations for the user
 */
export async function getSMSConversations(limit: number = 50): Promise<{ 
  success: boolean; 
  conversations?: SMSConversation[];
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=conversations&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get SMS conversations:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getSMSMessages(leadId: string | number): Promise<{ 
  success: boolean; 
  messages?: SMSMessage[];
  ai_suggested_reply?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=messages&lead_id=${leadId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get SMS messages:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get AI-generated reply suggestion
 */
export async function getAISMSReply(leadId: string | number, context?: {
  lead_name?: string;
  business_name?: string;
  previous_messages?: SMSMessage[];
  call_outcome?: string;
}): Promise<{ 
  success: boolean; 
  suggested_reply?: string;
  tone?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=ai_reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lead_id: leadId, context }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get AI SMS reply:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Mark messages as read
 */
export async function markSMSRead(leadId: string | number): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=mark_read`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lead_id: leadId }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to mark SMS as read:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get SMS statistics
 */
export async function getSMSStats(): Promise<{ 
  success: boolean; 
  stats?: SMSStats;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get SMS stats:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get SMS templates
 */
export async function getSMSTemplates(): Promise<{ 
  success: boolean; 
  templates?: SMSTemplate[];
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=templates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get SMS templates:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Schedule an SMS for later
 */
export async function scheduleSMS(request: SMSSendRequest & { 
  scheduled_for: string 
}): Promise<{ 
  success: boolean; 
  scheduled_id?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to schedule SMS:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Autonomous SMS: Let AI handle the conversation
 */
export async function enableAutoSMS(leadIds: (string | number)[]): Promise<{ 
  success: boolean; 
  enabled_count?: number;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sms.php?action=enable_auto`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lead_ids: leadIds }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to enable auto SMS:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Default SMS templates for quick replies
 */
export const DEFAULT_SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'follow_up_1',
    name: 'Post-Call Follow Up',
    category: 'follow_up',
    message: 'Hi {name}, great speaking with you! As discussed, I wanted to share more info about how we can help {business}. When works best for a quick follow-up call?',
    variables: ['name', 'business']
  },
  {
    id: 'appointment_1',
    name: 'Appointment Reminder',
    category: 'appointment',
    message: 'Hi {name}, just a friendly reminder about our call scheduled for {date} at {time}. Looking forward to speaking with you!',
    variables: ['name', 'date', 'time']
  },
  {
    id: 'thank_you_1',
    name: 'Thank You',
    category: 'thank_you',
    message: 'Thanks for your time today, {name}! I\'ll send over the proposal we discussed. Feel free to text me if you have any questions.',
    variables: ['name']
  },
  {
    id: 'intro_1',
    name: 'Introduction',
    category: 'intro',
    message: 'Hi {name}, this is {sender} from {company}. I noticed {business} and wanted to share how we\'ve helped similar businesses grow. Got a quick minute to chat?',
    variables: ['name', 'sender', 'company', 'business']
  },
  {
    id: 'missed_call_1',
    name: 'Missed Call Follow Up',
    category: 'follow_up',
    message: 'Hi {name}, I tried reaching you earlier regarding {topic}. Would love to connect when you have a moment. What time works best?',
    variables: ['name', 'topic']
  }
];
