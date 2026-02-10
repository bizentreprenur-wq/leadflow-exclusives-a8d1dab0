import { SEARCH_ENDPOINTS, getAuthHeaders } from './config';

export interface SocialPreviewResultItem {
  title: string;
  snippet: string;
  link: string;
  displayLink?: string;
}

export interface SocialSearchPreviewResponse {
  success: boolean;
  cached: boolean;
  platform: string;
  platformLabel: string;
  query: string;
  results: SocialPreviewResultItem[];
  fallbackSearchUrl: string;
  exactProfileUrl?: string | null;
  warnings?: string[];
  error?: string;
}

export async function fetchSocialSearchPreview(
  businessName: string,
  location: string,
  platform: string
): Promise<SocialSearchPreviewResponse> {
  const response = await fetch(SEARCH_ENDPOINTS.socialSearchPreview, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      business_name: businessName,
      location: location || '',
      platform,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Social preview failed (${response.status})`);
  }

  return data as SocialSearchPreviewResponse;
}
