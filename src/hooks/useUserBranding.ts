import { useState, useEffect, useCallback } from 'react';
import { getUserBranding, type UserBranding } from '@/lib/api/branding';

/**
 * Hook to fetch and provide user branding (logo, company name, colors)
 * Falls back to localStorage if not authenticated or backend unavailable
 */
export function useUserBranding() {
  const [branding, setBranding] = useState<UserBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    
    // Try backend first (for logged-in users)
    const token = localStorage.getItem('auth_token');
    if (token) {
      const backendBranding = await getUserBranding();
      if (backendBranding) {
        setBranding(backendBranding);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to localStorage
    const emailBranding = localStorage.getItem('email_branding');
    const brandingInfo = localStorage.getItem('bamlead_branding_info');

    let logoUrl: string | null = null;
    let companyName: string | null = null;
    let primaryColor = '#14b8a6';

    if (emailBranding) {
      try {
        const parsed = JSON.parse(emailBranding);
        if (parsed.logoUrl) logoUrl = parsed.logoUrl;
        if (parsed.companyName) companyName = parsed.companyName;
        if (parsed.primaryColor) primaryColor = parsed.primaryColor;
      } catch (e) {
        console.warn('Failed to parse email_branding');
      }
    }

    if (brandingInfo) {
      try {
        const parsed = JSON.parse(brandingInfo);
        if (parsed.logo && !logoUrl) logoUrl = parsed.logo;
        if (parsed.companyName && !companyName) companyName = parsed.companyName;
      } catch (e) {
        console.warn('Failed to parse bamlead_branding_info');
      }
    }

    setBranding({
      logo_url: logoUrl,
      company_name: companyName,
      primary_color: primaryColor,
      email_signature: null,
      footer_text: null,
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const refetch = useCallback(() => {
    loadBranding();
  }, [loadBranding]);

  return { branding, isLoading, logoUrl: branding?.logo_url, refetch };
}

/**
 * Get user logo URL synchronously from localStorage (for quick access)
 */
export function getUserLogoFromStorage(): string | null {
  // Check email_branding first
  const emailBranding = localStorage.getItem('email_branding');
  if (emailBranding) {
    try {
      const parsed = JSON.parse(emailBranding);
      if (parsed.logoUrl) return parsed.logoUrl;
    } catch (e) {}
  }

  // Fallback to bamlead_branding_info
  const brandingInfo = localStorage.getItem('bamlead_branding_info');
  if (brandingInfo) {
    try {
      const parsed = JSON.parse(brandingInfo);
      if (parsed.logo) return parsed.logo;
    } catch (e) {}
  }

  return null;
}
