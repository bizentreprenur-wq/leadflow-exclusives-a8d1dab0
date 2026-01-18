import { API_BASE_URL, getAuthHeaders } from './config';
import { toast } from 'sonner';

export type CRMProvider = 'hubspot' | 'salesforce' | 'pipedrive';

export interface CRMConnection {
  configured: boolean;
  connected: boolean;
  requires_api_key: boolean;
  instance_url?: string;
  api_domain?: string;
}

export interface CRMStatusResponse {
  success: boolean;
  connections: Record<CRMProvider, CRMConnection>;
  error?: string;
}

export interface CRMAuthResponse {
  success: boolean;
  auth_url?: string;
  provider?: string;
  error?: string;
  requires_api_key?: boolean;
}

export interface CRMExportResult {
  success: number;
  failed: number;
  errors: { lead: string; error: string }[];
}

export interface CRMExportResponse {
  success: boolean;
  results?: CRMExportResult;
  message?: string;
  error?: string;
  needs_auth?: boolean;
}

/**
 * Get status of all CRM connections
 */
export async function getCRMStatus(): Promise<CRMStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/crm-oauth.php?action=status`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        connections: {} as Record<CRMProvider, CRMConnection>,
        error: 'Failed to check CRM status' 
      };
    }
    
    return response.json();
  } catch (error) {
    console.error('CRM status error:', error);
    return { 
      success: false, 
      connections: {} as Record<CRMProvider, CRMConnection>,
      error: 'Network error' 
    };
  }
}

/**
 * Start OAuth flow for a CRM provider
 */
export async function connectCRM(provider: CRMProvider): Promise<CRMAuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/crm-oauth.php?action=auth&provider=${provider}`, {
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.requires_api_key) {
        return { 
          success: false, 
          requires_api_key: true,
          error: data.error 
        };
      }
      return { success: false, error: data.error };
    }
    
    if (data.auth_url) {
      window.open(data.auth_url, '_blank', 'width=600,height=700');
      toast.info('Complete the authorization in the new window');
    }
    
    return data;
  } catch (error) {
    console.error('CRM connect error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Disconnect a CRM provider
 */
export async function disconnectCRM(provider: CRMProvider): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/crm-oauth.php?action=disconnect&provider=${provider}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  } catch (error) {
    console.error('CRM disconnect error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Save API key for a CRM (fallback for providers without OAuth configured)
 */
export async function saveCRMApiKey(
  provider: CRMProvider, 
  apiKey: string, 
  instanceUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/crm-oauth.php?action=save_api_key&provider=${provider}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ api_key: apiKey, instance_url: instanceUrl }),
    });
    return response.json();
  } catch (error) {
    console.error('Save API key error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Export leads to a CRM
 */
export async function exportLeadsToCRM(
  provider: CRMProvider,
  leads: any[]
): Promise<CRMExportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/crm-export.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ provider, leads }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.needs_auth) {
        toast.error(`Please connect ${provider} first`);
        return { success: false, needs_auth: true, error: data.error };
      }
      return { success: false, error: data.error };
    }
    
    if (data.results) {
      const { success, failed } = data.results;
      if (success > 0) {
        toast.success(`Exported ${success} leads to ${provider}!`, {
          description: failed > 0 ? `${failed} failed` : undefined
        });
      } else {
        toast.error(`Export failed`, { description: data.results.errors?.[0]?.error });
      }
    }
    
    return data;
  } catch (error) {
    console.error('CRM export error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Check URL params for CRM connection callbacks
 */
export function handleCRMCallbackParams(): { connected?: string; error?: string } {
  const urlParams = new URLSearchParams(window.location.search);
  const connected = urlParams.get('crm_connected');
  const error = urlParams.get('crm_error');
  const provider = urlParams.get('provider');
  
  if (connected) {
    toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
    // Clean up URL
    window.history.replaceState({}, '', window.location.pathname);
    return { connected };
  }
  
  if (error) {
    toast.error(`CRM connection failed: ${error}`, {
      description: provider ? `Provider: ${provider}` : undefined
    });
    window.history.replaceState({}, '', window.location.pathname);
    return { error };
  }
  
  return {};
}
