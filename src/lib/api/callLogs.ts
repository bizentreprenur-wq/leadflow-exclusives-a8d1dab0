/**
 * Call Logs API Client
 * Handles voice call transcript and outcome logging
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export type CallOutcome = 
  | 'completed' 
  | 'no_answer' 
  | 'callback_requested' 
  | 'interested' 
  | 'not_interested' 
  | 'wrong_number' 
  | 'other';

export interface TranscriptMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface CallLog {
  id: number;
  user_id: number;
  lead_id: number | null;
  lead_name: string | null;
  lead_phone: string | null;
  agent_id: string;
  duration_seconds: number;
  outcome: CallOutcome;
  notes: string | null;
  transcript: TranscriptMessage[] | null;
  created_at: string;
}

export interface CallStats {
  total_calls: number;
  total_duration_seconds: number;
  average_duration_seconds: number;
  calls_this_week: number;
  outcomes: Record<CallOutcome, number>;
  interested_rate: number;
}

interface SaveCallLogParams {
  agent_id: string;
  duration_seconds: number;
  outcome?: CallOutcome;
  notes?: string;
  transcript?: TranscriptMessage[];
  lead_id?: number;
  lead_name?: string;
  lead_phone?: string;
}

interface ListLogsParams {
  limit?: number;
  offset?: number;
  outcome?: CallOutcome;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/**
 * Save a new call log
 */
export async function saveCallLog(params: SaveCallLogParams): Promise<{ success: boolean; log_id?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/call-logs.php?action=save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to save call log:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * List call logs
 */
export async function listCallLogs(params: ListLogsParams = {}): Promise<{ success: boolean; logs?: CallLog[]; total?: number; error?: string }> {
  try {
    const searchParams = new URLSearchParams({ action: 'list' });
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.outcome) searchParams.set('outcome', params.outcome);
    
    const response = await fetch(`${API_BASE}/call-logs.php?${searchParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to list call logs:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Update a call log
 */
export async function updateCallLog(id: number, updates: { outcome?: CallOutcome; notes?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/call-logs.php?action=update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, ...updates }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to update call log:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Delete a call log
 */
export async function deleteCallLog(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/call-logs.php?action=delete&id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to delete call log:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get call statistics
 */
export async function getCallStats(): Promise<{ success: boolean; stats?: CallStats; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/call-logs.php?action=stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get call stats:', error);
    return { success: false, error: 'Network error' };
  }
}
