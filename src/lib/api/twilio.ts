/**
 * Twilio API Client
 * Handles voice calling configuration and call operations via Twilio
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export interface TwilioConfig {
  phone_number: string;
  voice: string;
  greeting_message: string;
  system_prompt: string;
  enabled: boolean;
  provisioned: boolean;
  provision_status: 'none' | 'pending' | 'active' | 'failed' | 'released';
}

export interface CallRequest {
  destination_number: string;
  lead_id?: number;
  lead_name?: string;
}

export interface ActiveCall {
  call_sid: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed' | 'canceled';
  duration_seconds: number;
  transcript: TranscriptEntry[];
}

export interface TranscriptEntry {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/** Get the current Twilio configuration */
export async function getTwilioConfig(): Promise<{ success: boolean; config?: TwilioConfig; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=get_config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get Twilio config:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Save Twilio configuration */
export async function saveTwilioConfig(config: TwilioConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=save_config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save Twilio config:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Test Twilio connection */
export async function testTwilioConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=test_connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to test Twilio connection:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Provision a phone number for the user */
export async function provisionPhoneNumber(areaCode?: string, countryCode = 'US'): Promise<{ 
  success: boolean; 
  phone_number?: string;
  status?: string;
  error?: string;
  requires_addon?: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=provision_number`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ area_code: areaCode, country_code: countryCode }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to provision number:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Release a provisioned phone number */
export async function releasePhoneNumber(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=release_number`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to release number:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Check if user has AI Calling add-on */
export async function checkCallingAddon(): Promise<{ 
  success: boolean; 
  has_addon?: boolean;
  included_with_plan?: boolean;
  plan?: string;
  addon_price?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=check_addon`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to check addon:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Purchase AI Calling add-on ($8/mo) */
export async function purchaseCallingAddon(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=purchase_addon`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to purchase addon:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Save a call log */
export async function saveCallLog(data: {
  lead_id?: number;
  lead_name?: string;
  lead_phone?: string;
  duration_seconds?: number;
  outcome?: string;
  notes?: string;
  transcript?: TranscriptEntry[];
}): Promise<{ success: boolean; call_log_id?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=save_call_log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save call log:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Get call logs */
export async function getCallLogs(limit = 50, offset = 0): Promise<{ 
  success: boolean; 
  logs?: any[];
  total?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=get_call_logs&limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get call logs:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Initiate an outbound call */
export async function initiateCall(request: CallRequest): Promise<{ 
  success: boolean; 
  call_sid?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=initiate_call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to initiate call:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Hang up an active call */
export async function hangupCall(callSid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=hangup_call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ call_sid: callSid }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to hangup call:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Get call status */
export async function getCallStatus(callSid: string): Promise<{ 
  success: boolean; 
  status?: string;
  duration_seconds?: number;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=call_status&call_sid=${callSid}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get call status:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Get call transcript */
export async function getCallTranscript(callSid: string): Promise<{ 
  success: boolean; 
  transcript?: TranscriptEntry[];
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/twilio.php?action=get_transcript&call_sid=${callSid}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get call transcript:', error);
    return { success: false, error: 'Network error' };
  }
}
