/**
 * Hook for progressive lead enrichment using Firecrawl
 * 
 * Automatically enriches leads after search discovery:
 * 1. Queues leads for background processing
 * 2. Polls for status updates
 * 3. Merges enrichment data into leads progressively
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  queueBatchEnrichment, 
  getEnrichmentStatus, 
  triggerProcessing,
  EnrichmentData,
  EnrichmentStatus 
} from '@/lib/api/firecrawl';

interface Lead {
  id?: string;
  leadId?: string;
  website?: string;
  url?: string;
  [key: string]: unknown;
}

interface EnrichedLead extends Lead {
  enrichment?: EnrichmentData;
  enrichmentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface UseLeadEnrichmentOptions {
  searchType?: 'gmb' | 'platform';
  pollIntervalMs?: number;
  autoStart?: boolean;
  maxRetries?: number;
}

interface UseLeadEnrichmentResult {
  enrichedLeads: EnrichedLead[];
  progress: number;
  isEnriching: boolean;
  isComplete: boolean;
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  startEnrichment: (leads: Lead[]) => Promise<void>;
  stopEnrichment: () => void;
}

const DEFAULT_POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_RETRIES = 3;

export function useLeadEnrichment(
  initialLeads: Lead[] = [],
  options: UseLeadEnrichmentOptions = {}
): UseLeadEnrichmentResult {
  const {
    searchType = 'gmb',
    pollIntervalMs = DEFAULT_POLL_INTERVAL,
    autoStart = true,
    maxRetries = MAX_POLL_RETRIES,
  } = options;

  const [enrichedLeads, setEnrichedLeads] = useState<EnrichedLead[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });

  const pollRetryCount = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const leadsMapRef = useRef<Map<string, Lead>>(new Map());

  // Stop polling
  const stopEnrichment = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsEnriching(false);
  }, []);

  // Poll for status updates
  const pollStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const status = await getEnrichmentStatus(sessionId);
      
      if (!status) {
        pollRetryCount.current++;
        if (pollRetryCount.current >= maxRetries) {
          console.warn('Max poll retries reached, stopping enrichment');
          stopEnrichment();
        }
        return;
      }

      pollRetryCount.current = 0;
      setStats(status.status);
      setProgress(status.progress);

      // Merge new results into leads
      if (Object.keys(status.results).length > 0) {
        setEnrichedLeads(prev => {
          return prev.map(lead => {
            const leadId = lead.id || lead.leadId || '';
            const enrichmentData = status.results[leadId];
            
            if (enrichmentData && !lead.enrichment) {
              return {
                ...lead,
                enrichment: enrichmentData,
                enrichmentStatus: 'completed' as const,
                // Also merge key fields for easier access
                email: enrichmentData.emails?.[0] || lead.email,
                phone: enrichmentData.phones?.[0] || lead.phone,
              };
            }
            return lead;
          });
        });
      }

      // Check if complete
      if (status.isComplete) {
        setIsComplete(true);
        stopEnrichment();
        
        // One final trigger to ensure all results are processed
        triggerProcessing(sessionId);
      } else {
        // Trigger more processing
        triggerProcessing(sessionId);
      }
    } catch (error) {
      console.error('Poll status error:', error);
      pollRetryCount.current++;
      if (pollRetryCount.current >= maxRetries) {
        stopEnrichment();
      }
    }
  }, [sessionId, maxRetries, stopEnrichment]);

  // Start enrichment for leads
  const startEnrichment = useCallback(async (leads: Lead[]) => {
    if (leads.length === 0) return;

    // Filter leads that have websites
    const leadsWithWebsites = leads.filter(lead => {
      const url = lead.website || lead.url;
      return url && url.trim().length > 0;
    });

    if (leadsWithWebsites.length === 0) {
      console.log('No leads with websites to enrich');
      return;
    }

    // Initialize enriched leads with pending status
    const initialEnriched: EnrichedLead[] = leads.map(lead => ({
      ...lead,
      enrichmentStatus: (lead.website || lead.url) ? 'pending' : undefined,
    }));
    setEnrichedLeads(initialEnriched);

    // Build leads map for quick lookup
    leadsMapRef.current = new Map(
      leads.map(lead => [lead.id || lead.leadId || '', lead])
    );

    // Queue for enrichment
    setIsEnriching(true);
    setIsComplete(false);
    setProgress(0);
    pollRetryCount.current = 0;

    const result = await queueBatchEnrichment(leadsWithWebsites, searchType);

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      setStats(prev => ({ ...prev, total: result.queued || 0 }));

      // Start polling
      pollIntervalRef.current = setInterval(pollStatus, pollIntervalMs);
      
      // Initial trigger
      triggerProcessing(result.sessionId);
    } else {
      console.error('Failed to queue enrichment:', result.error);
      setIsEnriching(false);
    }
  }, [searchType, pollIntervalMs, pollStatus]);

  // Auto-start enrichment when initial leads change
  useEffect(() => {
    if (autoStart && initialLeads.length > 0) {
      startEnrichment(initialLeads);
    }

    return () => {
      stopEnrichment();
    };
  }, [initialLeads, autoStart, startEnrichment, stopEnrichment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEnrichment();
    };
  }, [stopEnrichment]);

  return {
    enrichedLeads: enrichedLeads.length > 0 ? enrichedLeads : initialLeads as EnrichedLead[],
    progress,
    isEnriching,
    isComplete,
    stats,
    startEnrichment,
    stopEnrichment,
  };
}

export default useLeadEnrichment;