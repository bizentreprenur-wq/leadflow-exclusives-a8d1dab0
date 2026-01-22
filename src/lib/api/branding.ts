/**
 * User Branding API
 * Handles persistent storage of user branding (logo, company name, colors) on the backend
 */

import { API_BASE_URL, getAuthHeaders } from './config';

export interface UserBranding {
  logo_url: string | null;
  company_name: string | null;
  primary_color: string;
  email_signature: string | null;
  footer_text: string | null;
}

interface BrandingResponse {
  success: boolean;
  branding?: UserBranding;
  error?: string;
  migration_needed?: boolean;
  migration_file?: string;
}

const BRANDING_ENDPOINT = `${API_BASE_URL}/user-branding.php`;

/**
 * Fetch user branding from the backend
 */
export async function getUserBranding(): Promise<UserBranding | null> {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const response = await fetch(`${BRANDING_ENDPOINT}?action=get`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.warn('Failed to fetch branding:', response.status);
      return null;
    }

    const data: BrandingResponse = await response.json();
    
    if (data.migration_needed) {
      console.warn('Branding table migration needed:', data.migration_file);
      return null;
    }

    return data.branding || null;
  } catch (error) {
    console.error('Error fetching branding:', error);
    return null;
  }
}

/**
 * Save user branding to the backend
 */
export async function saveUserBranding(branding: Partial<UserBranding>): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  try {
    const response = await fetch(`${BRANDING_ENDPOINT}?action=save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(branding),
    });

    if (!response.ok) {
      console.warn('Failed to save branding:', response.status);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error saving branding:', error);
    return false;
  }
}

/**
 * Delete user logo from the backend
 */
export async function deleteUserLogo(): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  try {
    const response = await fetch(`${BRANDING_ENDPOINT}?action=delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.warn('Failed to delete logo:', response.status);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error deleting logo:', error);
    return false;
  }
}

/**
 * Sync local branding to backend (call after login or when local changes)
 */
export async function syncBrandingToBackend(): Promise<void> {
  const emailBranding = localStorage.getItem('email_branding');
  const brandingInfo = localStorage.getItem('bamlead_branding_info');

  const branding: Partial<UserBranding> = {};

  if (emailBranding) {
    const parsed = JSON.parse(emailBranding);
    if (parsed.logoUrl) branding.logo_url = parsed.logoUrl;
    if (parsed.companyName) branding.company_name = parsed.companyName;
    if (parsed.primaryColor) branding.primary_color = parsed.primaryColor;
    if (parsed.signature) branding.email_signature = parsed.signature;
    if (parsed.footerText) branding.footer_text = parsed.footerText;
  }

  if (brandingInfo) {
    const parsed = JSON.parse(brandingInfo);
    if (parsed.logo && !branding.logo_url) branding.logo_url = parsed.logo;
    if (parsed.companyName && !branding.company_name) branding.company_name = parsed.companyName;
  }

  if (Object.keys(branding).length > 0) {
    await saveUserBranding(branding);
  }
}

/**
 * Load branding from backend and sync to localStorage
 */
export async function loadBrandingFromBackend(): Promise<UserBranding | null> {
  const branding = await getUserBranding();
  
  if (branding) {
    // Sync to email_branding localStorage
    const emailBranding = JSON.parse(localStorage.getItem('email_branding') || '{}');
    if (branding.logo_url) emailBranding.logoUrl = branding.logo_url;
    if (branding.company_name) emailBranding.companyName = branding.company_name;
    if (branding.primary_color) emailBranding.primaryColor = branding.primary_color;
    if (branding.email_signature) emailBranding.signature = branding.email_signature;
    if (branding.footer_text) emailBranding.footerText = branding.footer_text;
    localStorage.setItem('email_branding', JSON.stringify(emailBranding));

    // Sync to bamlead_branding_info localStorage
    const brandingInfo = JSON.parse(localStorage.getItem('bamlead_branding_info') || '{}');
    if (branding.logo_url) brandingInfo.logo = branding.logo_url;
    if (branding.company_name) brandingInfo.companyName = branding.company_name;
    localStorage.setItem('bamlead_branding_info', JSON.stringify(brandingInfo));
  }

  return branding;
}
