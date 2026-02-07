/**
 * Calling.io API Client
 * Handles AI voice calling configuration and real-time call operations
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export interface CallingConfig {
  agent_id: string;
  phone_number: string;
  voice_id: string;
  language: string;
  greeting_message: string;
  system_prompt: string;
  enabled: boolean;
  provisioned: boolean;
  addon_active: boolean;
}

export interface CallSession {
  token: string;
  websocket_url: string;
  ice_servers: RTCIceServer[];
  agent_id: string;
  expires_at: number;
}

export interface CallRequest {
  destination_number: string;
  script?: string;
  lead?: {
    id?: number;
    name?: string;
    company?: string;
    industry?: string;
  };
}

export interface ActiveCall {
  id: string;
  call_log_id: number;
  session_token: string;
  websocket_url: string;
  status: 'initiating' | 'ringing' | 'connected' | 'ended';
}

export interface CallLog {
  id: number;
  lead_id: number | null;
  lead_name: string | null;
  lead_phone: string | null;
  agent_id: string;
  duration_seconds: number;
  outcome: string;
  notes: string | null;
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

/**
 * Get the current calling.io configuration
 */
export async function getCallingConfig(): Promise<{ success: boolean; config?: CallingConfig | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=get_config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get calling config:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Save calling.io configuration
 */
export async function saveCallingConfig(config: Partial<CallingConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=save_config`, {
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

/**
 * Provision a phone number via calling.io
 */
export async function provisionPhoneNumber(countryCode: string = 'US', areaCode?: string): Promise<{ 
  success: boolean; 
  phone_number?: string; 
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=provision_number`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ country_code: countryCode, area_code: areaCode }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to provision phone number:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Start a real-time voice session
 */
export async function startCallingSession(script?: string, lead?: CallRequest['lead']): Promise<{ 
  success: boolean; 
  session?: CallSession; 
  simulated?: boolean;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=start_session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ script, lead }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to start calling session:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * End a real-time session
 */
export async function endCallingSession(sessionToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=end_session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_token: sessionToken }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to end calling session:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Initiate an outbound call
 */
export async function initiateCall(request: CallRequest): Promise<{ 
  success: boolean; 
  call?: ActiveCall;
  simulated?: boolean;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=initiate_call`, {
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
export async function hangupCall(callId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=hangup_call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ call_id: callId }),
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
export async function getCallStatus(callId: string): Promise<{ 
  success: boolean; 
  status?: string;
  duration_seconds?: number;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=call_status&call_id=${callId}`, {
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
 * Save call log
 */
export async function saveCallLog(log: {
  lead_id?: number;
  lead_name?: string;
  lead_phone?: string;
  agent_id?: string;
  duration_seconds: number;
  outcome: string;
  notes?: string;
  transcript?: TranscriptEntry[];
}): Promise<{ success: boolean; call_log_id?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/calling.php?action=save_call_log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(log),
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

/**
 * Check if user has AI Calling add-on
 */
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

/**
 * Purchase AI Calling add-on
 */
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

/**
 * WebSocket message types from calling.io
 */
export type CallingMessageType = 
  | 'auth_success'
  | 'auth_error'
  | 'call_started'
  | 'call_ringing'
  | 'call_answered'
  | 'call_ended'
  | 'agent_speaking'
  | 'agent_listening'
  | 'transcript_update'
  | 'error';

export interface CallingMessage {
  type: CallingMessageType;
  data?: any;
  timestamp?: number;
}
