import { API_BASE_URL, getAuthHeaders } from './config';

interface GoogleDriveAuthResponse {
  success: boolean;
  auth_url?: string;
  error?: string;
}

interface GoogleDriveStatusResponse {
  success: boolean;
  connected: boolean;
}

interface GoogleDriveExportResponse {
  success: boolean;
  file_id?: string;
  file_name?: string;
  web_view_link?: string;
  error?: string;
  needs_auth?: boolean;
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
  const response = await fetch(`${API_BASE_URL}/google-drive-auth.php?action=auth`, {
    headers: getAuthHeaders(),
  });
  return response.json();
}

/**
 * Check if user has Google Drive connected
 */
export async function checkGoogleDriveStatus(): Promise<GoogleDriveStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/google-drive-auth.php?action=status`, {
    headers: getAuthHeaders(),
  });
  return response.json();
}

/**
 * Disconnect Google Drive
 */
export async function disconnectGoogleDrive(): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/google-drive-auth.php?action=disconnect`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return response.json();
}

/**
 * Export verified leads to Google Drive
 */
export async function exportToGoogleDrive(
  leads: VerifiedLead[],
  filename?: string
): Promise<GoogleDriveExportResponse> {
  const response = await fetch(`${API_BASE_URL}/google-drive-export.php`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      leads,
      filename: filename || `verified-leads-${new Date().toISOString().split('T')[0]}`,
    }),
  });
  return response.json();
}
