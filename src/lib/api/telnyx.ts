/**
 * Telnyx API Client
 * Handles voice calling configuration and call operations
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export interface TelnyxConfig {
  api_key: string;
  connection_id: string;
  phone_number: string;
  voice: string;
  greeting_message: string;
  system_prompt: string;
  enabled: boolean;
}

export interface CallRequest {
  destination_number: string;
  lead_id?: number;
  lead_name?: string;
}

export interface ActiveCall {
  call_control_id: string;
  call_leg_id: string;
  status: 'initiated' | 'ringing' | 'answered' | 'speaking' | 'listening' | 'ended';
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

/**
 * Get the current Telnyx configuration
 */
export async function getTelnyxConfig(): Promise<{ success: boolean; config?: TelnyxConfig; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=get_config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get Telnyx config:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Save Telnyx configuration
 */
export async function saveTelnyxConfig(config: TelnyxConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=save_config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to save Telnyx config:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Test Telnyx connection
 */
export async function testTelnyxConnection(config: TelnyxConfig): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=test_connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ api_key: config.api_key }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to test Telnyx connection:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get phone numbers from Telnyx account
 */
export async function getTelnyxPhoneNumbers(): Promise<{ success: boolean; phone_numbers?: string[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=get_phone_numbers`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get Telnyx phone numbers:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Initiate an outbound call
 */
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

/**
 * Hang up an active call
 */
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

/**
 * Get call status
 */
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

/**
 * Get call transcript
 */
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
    console.error('Failed to get call transcript:', error);
    return { success: false, error: 'Network error' };
  }
}
