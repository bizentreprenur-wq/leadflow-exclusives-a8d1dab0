/**
 * Telnyx AI Calling API Client
 * Handles AI voice calling via Telnyx's native gather_using_ai
 * Cost: ~$0.007/min (cheapest option — TTS + STT + LLM included)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export interface CallingConfig {
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
  script?: string;
}

export interface ActiveCall {
  call_control_id: string;
  call_leg_id: string;
  status: 'initiated' | 'ringing' | 'answered' | 'speaking' | 'listening' | 'ended';
  destination_number: string;
  lead_name?: string;
  duration_seconds?: number;
}

export interface CallLog {
  id: number;
  lead_id: number | null;
  lead_name: string | null;
  lead_phone: string | null;
  agent_id: string;
  duration_seconds: number;
  outcome: string;
  transcript: TranscriptEntry[] | null;
  created_at: string;
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

/** Get user's calling configuration */
export async function getCallingConfig(): Promise<{ success: boolean; config?: CallingConfig | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=get_config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get calling config:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Save voice agent settings */
export async function saveCallingConfig(config: Partial<CallingConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=save_config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save calling config:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Test Telnyx connection (uses server-side global key) */
export async function testCallingConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=test_connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to test connection:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Auto-provision a phone number for the customer */
export async function provisionNumber(options?: { country_code?: string; area_code?: string }): Promise<{ 
  success: boolean; 
  phone_number?: string;
  status?: string;
  message?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=provision_number`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options || {}),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to provision number:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Release a provisioned phone number */
export async function releaseNumber(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=release_number`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to release number:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Initiate an outbound AI call via Telnyx */
export async function initiateCall(request: CallRequest): Promise<{ 
  success: boolean; 
  call_control_id?: string;
  call_leg_id?: string;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=initiate_call`, {
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
export async function hangupCall(callControlId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=hangup_call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ call_control_id: callControlId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to hangup call:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Get call status */
export async function getCallStatus(callControlId: string): Promise<{ 
  success: boolean; 
  status?: string;
  duration_seconds?: number;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=call_status&call_control_id=${callControlId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get call status:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Get live transcript for an active call */
export async function getCallTranscript(callControlId: string): Promise<{ 
  success: boolean; 
  transcript?: TranscriptEntry[];
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=get_transcript&call_control_id=${callControlId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get transcript:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Get call logs */
export async function getCallLogs(limit: number = 50, offset: number = 0): Promise<{ 
  success: boolean; 
  logs?: CallLog[];
  total?: number;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=get_call_logs&limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get call logs:', error);
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
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=check_addon`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to check calling addon:', error);
    return { success: false, error: 'Network error' };
  }
}

/** Purchase AI Calling add-on ($8/mo) */
export async function purchaseCallingAddon(): Promise<{ 
  success: boolean; 
  addon_active?: boolean;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=purchase_addon`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to purchase calling addon:', error);
    return { success: false, error: 'Network error' };
  }
}
