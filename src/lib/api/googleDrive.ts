import { API_BASE_URL, getAuthHeaders } from './config';
import { toast } from 'sonner';

interface GoogleDriveAuthResponse {
  success: boolean;
  auth_url?: string;
  error?: string;
  message?: string;
}

interface GoogleDriveStatusResponse {
  success: boolean;
  connected: boolean;
  error?: string;
}

interface GoogleDriveExportResponse {
  success: boolean;
  file_id?: string;
  file_name?: string;
  web_view_link?: string;
  error?: string;
  needs_auth?: boolean;
  message?: string;
}

interface VerifiedLead {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  leadScore?: number;
  conversionProbability?: string;
  bestContactTime?: string;
  marketingAngle?: string;
  predictedResponse?: number;
  emailValid?: boolean;
  talkingPoints?: string[];
  painPoints?: string[];
}

/**
 * Get Google Drive OAuth authorization URL
 */
export async function getGoogleDriveAuthUrl(): Promise<GoogleDriveAuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-drive-auth.php?action=auth`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 503) {
        return { 
          success: false, 
          error: 'Google Drive integration is being configured. Please try again later or contact support.' 
        };
      }
      return { success: false, error: errorData.error || 'Failed to get auth URL' };
    }
    
    return response.json();
  } catch (error) {
    console.error('Google Drive auth error:', error);
    return { success: false, error: 'Network error - please check your connection' };
  }
}

/**
 * Check if user has Google Drive connected
 */
export async function checkGoogleDriveStatus(): Promise<GoogleDriveStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-drive-auth.php?action=status`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      return { success: false, connected: false, error: 'Could not check status' };
    }
    
    return response.json();
  } catch (error) {
    console.error('Google Drive status error:', error);
    return { success: false, connected: false, error: 'Network error' };
  }
}

/**
 * Disconnect Google Drive
 */
export async function disconnectGoogleDrive(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-drive-auth.php?action=disconnect`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  } catch (error) {
    console.error('Google Drive disconnect error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Export verified leads to Google Drive
 */
export async function exportToGoogleDrive(
  leads: VerifiedLead[],
  filename?: string
): Promise<GoogleDriveExportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-drive-export.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        leads,
        filename: filename || `verified-leads-${new Date().toISOString().split('T')[0]}`,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 503 - service not configured
      if (response.status === 503) {
        return { 
          success: false, 
          error: 'Google Drive integration is being configured. Please use CSV/Excel export for now.',
          needs_auth: false
        };
      }
      
      // Handle 403 - needs auth
      if (response.status === 403 && errorData.needs_auth) {
        return { 
          success: false, 
          error: 'Please connect your Google Drive first',
          needs_auth: true
        };
      }
      
      return { success: false, error: errorData.error || 'Export failed' };
    }
    
    return response.json();
  } catch (error) {
    console.error('Google Drive export error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Initialize Google Drive connection flow
 */
export async function connectGoogleDrive(): Promise<boolean> {
  const authResponse = await getGoogleDriveAuthUrl();
  
  if (!authResponse.success || !authResponse.auth_url) {
    toast.error(authResponse.error || 'Could not start Google Drive connection');
    return false;
  }
  
  // Open auth URL in new window
  window.open(authResponse.auth_url, '_blank', 'width=600,height=700');
  toast.info('Complete the authorization in the new window');
  return true;
}
