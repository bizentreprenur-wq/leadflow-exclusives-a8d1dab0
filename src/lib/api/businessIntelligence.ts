/**
 * Business Intelligence API Client
 * Fetches comprehensive 11-category intelligence for leads
 */

import { API_BASE_URL, getAuthHeaders } from './config';
import { BusinessIntelligenceLead } from '@/lib/types/businessIntelligence';

export interface EnrichLeadsResponse {
  success: boolean;
  data?: BusinessIntelligenceLead[];
  error?: string;
  count?: number;
  analyzedAt?: string;
}

/**
 * Enrich leads with comprehensive business intelligence
 */
export async function enrichLeadsWithIntelligence(
  leads: any[],
  onProgress?: (progress: number, message: string) => void
): Promise<EnrichLeadsResponse> {
  if (!API_BASE_URL) {
    throw new Error('API not configured');
  }

  // Batch leads in chunks of 10 for better progress feedback
  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < leads.length; i += batchSize) {
    batches.push(leads.slice(i, i + batchSize));
  }

  const allResults: BusinessIntelligenceLead[] = [];
  let processed = 0;

  for (const batch of batches) {
    if (onProgress) {
      const progressPct = Math.round((processed / leads.length) * 100);
      onProgress(progressPct, `Analyzing ${processed + 1}-${Math.min(processed + batch.length, leads.length)} of ${leads.length} leads...`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/business-intelligence.php`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leads: batch }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BI API] Error:', errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        allResults.push(...data.data);
      }
    } catch (error) {
      console.error('[BI API] Batch error:', error);
      // Continue with remaining batches
    }

    processed += batch.length;
  }

  if (onProgress) {
    onProgress(100, 'Analysis complete!');
  }

  return {
    success: true,
    data: allResults,
    count: allResults.length,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Get intelligence for a single lead
 */
export async function getLeadIntelligence(lead: any): Promise<BusinessIntelligenceLead | null> {
  const response = await enrichLeadsWithIntelligence([lead]);
  return response.data?.[0] || null;
}

/**
 * Quick score leads without full enrichment
 */
export async function quickScoreLeadsBI(leads: any[]): Promise<{
  hot: any[];
  warm: any[];
  cold: any[];
}> {
  // Fast client-side scoring based on available data
  const hot: any[] = [];
  const warm: any[] = [];
  const cold: any[] = [];

  for (const lead of leads) {
    const hasWebsite = lead.url || lead.website;
    const hasPhone = !!lead.phone;
    const hasEmail = !!lead.email;
    const rating = lead.rating || 0;
    
    // No website = hot lead for web design/digital services
    if (!hasWebsite) {
      hot.push(lead);
      continue;
    }
    
    // Has website but missing contact or low rating = warm
    if (!hasPhone || !hasEmail || rating < 3.5) {
      warm.push(lead);
      continue;
    }
    
    // Everything looks good = cold (lower priority)
    cold.push(lead);
  }

  return { hot, warm, cold };
}
