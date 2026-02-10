/**
 * Telnyx API Client
 * Handles voice calling configuration and call operations
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export interface TelnyxConfig {
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
 * Test Telnyx connection (uses global server key)
 */
export async function testTelnyxConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=test_connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to test Telnyx connection:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Provision a phone number for the user
 */
export async function provisionPhoneNumber(areaCode?: string, countryCode = 'US'): Promise<{ 
  success: boolean; 
  phone_number?: string;
  status?: string;
  error?: string;
  requires_addon?: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=provision_number`, {
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

/**
 * Release a provisioned phone number
 */
export async function releasePhoneNumber(): Promise<{ success: boolean; error?: string }> {
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

/**
 * Check if user has AI Calling add-on
 */
export async function checkCallingAddon(): Promise<{ 
  success: boolean; 
  has_addon?: boolean;
  included_with_plan?: boolean;
  plan?: string;
  addon_price?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=check_addon`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to check addon:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Purchase AI Calling add-on ($8/mo)
 */
export async function purchaseCallingAddon(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=purchase_addon`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to purchase addon:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Save a call log
 */
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
    const response = await fetch(`${API_BASE}/telnyx.php?action=save_call_log`, {
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

/**
 * Get call logs
 */
export async function getCallLogs(limit = 50, offset = 0): Promise<{ 
  success: boolean; 
  logs?: any[];
  total?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/telnyx.php?action=get_call_logs&limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get call logs:', error);
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
