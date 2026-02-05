/**
 * Firecrawl API Integration
 * 
 * Handles website enrichment for lead discovery.
 * - Option A (GMB): Extracts emails, socials, tech stack, decision makers
 * - Option B (Platform): Extracts emails, phones, website issues
 */

import { API_BASE_URL } from './config';

export interface EnrichmentData {
  url: string;
  emails: string[];
  phones: string[];
  socials: Record<string, string>;
  hasEmail: boolean;
  hasPhone: boolean;
  hasSocials: boolean;
  techStack?: string[];
  decisionMakers?: Array<{ name: string; title?: string }>;
  issues?: string[];
  description?: string;
  scrapedAt?: string;
}

export interface EnrichmentStatus {
  sessionId: string;
  status: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  progress: number;
  isComplete: boolean;
  results: Record<string, EnrichmentData>;
}

export interface Lead {
  id?: string;
  leadId?: string;
  website?: string;
  url?: string;
}

/**
 * Scrape a single URL for enrichment data
 */
export async function scrapeUrl(
  url: string, 
  searchType: 'gmb' | 'platform' = 'gmb'
): Promise<{ success: boolean; data?: EnrichmentData; error?: string; cached?: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/firecrawl.php?action=scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url, searchType }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to scrape URL' 
    };
  }
}

/**
 * Queue a batch of leads for background enrichment
 */
export async function queueBatchEnrichment(
  leads: Lead[],
  searchType: 'gmb' | 'platform' = 'gmb',
  sessionId?: string
): Promise<{ success: boolean; sessionId?: string; queued?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/firecrawl.php?action=batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        leads, 
        searchType, 
        sessionId: sessionId || `enrich_${Date.now()}` 
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Firecrawl batch queue error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to queue enrichment' 
    };
  }
}

/**
 * Get enrichment status and completed results
 */
export async function getEnrichmentStatus(
  sessionId: string
): Promise<EnrichmentStatus | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/firecrawl.php?action=status&session_id=${encodeURIComponent(sessionId)}`,
      { credentials: 'include' }
    );
    
    const data = await response.json();
    if (data.success) {
      return data as EnrichmentStatus;
    }
    return null;
  } catch (error) {
    console.error('Firecrawl status error:', error);
    return null;
  }
}

/**
 * Trigger processing of pending queue items
 */
export async function triggerProcessing(sessionId: string): Promise<void> {
  try {
    // Fire and forget - don't wait for response
    fetch(
      `${API_BASE_URL}/firecrawl.php?action=process&session_id=${encodeURIComponent(sessionId)}`,
      { credentials: 'include' }
    ).catch(() => {
      // Ignore errors - processing happens in background
    });
  } catch {
    // Ignore
  }
}