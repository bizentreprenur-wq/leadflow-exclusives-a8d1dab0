import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebhookEvents, WebhookEvent } from '@/lib/api/emailWebhook';
import { toast } from 'sonner';

interface UseEmailWebhookOptions {
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  showNotifications?: boolean;
  onEvent?: (event: WebhookEvent) => void;
}

interface UseEmailWebhookReturn {
  events: WebhookEvent[];
  isPolling: boolean;
  lastPollTime: Date | null;
  error: string | null;
  stats: {
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  refresh: () => Promise<void>;
  clearEvents: () => void;
}

/**
 * Hook for real-time email delivery webhook polling
 * Polls the backend for new delivery events and shows notifications
 */
export function useEmailWebhook(options: UseEmailWebhookOptions = {}): UseEmailWebhookReturn {
  const {
    enabled = true,
    pollInterval = 5000, // 5 seconds default
    showNotifications = true,
    onEvent,
  } = options;

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ delivered: 0, opened: 0, clicked: 0, bounced: 0 });
  
  const lastTimestampRef = useRef<string | null>(null);
  const seenEventIdsRef = useRef<Set<number>>(new Set());

  const pollEvents = useCallback(async () => {
    if (!enabled) return;
    
    setIsPolling(true);
    setError(null);
    
    try {
      const since = lastTimestampRef.current || new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = await getWebhookEvents(since, 50);
      
      if (result.success && result.events) {
        // Filter out events we've already seen
        const newEvents = result.events.filter(e => !seenEventIdsRef.current.has(e.id));
        
        if (newEvents.length > 0) {
          // Add to seen set
          newEvents.forEach(e => seenEventIdsRef.current.add(e.id));
          
          // Prepend new events
          setEvents(prev => [...newEvents, ...prev].slice(0, 100)); // Keep last 100 events
          
          // Update stats
          setStats(prev => ({
            delivered: prev.delivered + newEvents.filter(e => e.event_type === 'delivered').length,
            opened: prev.opened + newEvents.filter(e => e.event_type === 'opened').length,
            clicked: prev.clicked + newEvents.filter(e => e.event_type === 'clicked').length,
            bounced: prev.bounced + newEvents.filter(e => e.event_type === 'bounced' || e.event_type === 'dropped').length,
          }));
          
          // Show notifications for significant events
          if (showNotifications) {
            newEvents.forEach(event => {
              const businessName = event.business_name || event.recipient_email;
              
              switch (event.event_type) {
                case 'delivered':
                  toast.success(`📬 Email delivered to ${businessName}`);
                  break;
                case 'opened':
                  toast.success(`👁️ ${businessName} opened your email!`, {
                    description: event.subject,
                  });
                  break;
                case 'clicked':
                  toast.success(`🖱️ ${businessName} clicked a link!`, {
                    description: event.click_url ? `Clicked: ${event.click_url}` : undefined,
                  });
                  break;
                case 'bounced':
                case 'dropped':
                  toast.error(`↩️ Email to ${businessName} bounced`, {
                    description: event.bounce_reason,
                  });
                  break;
              }
              
              // Call custom handler
              onEvent?.(event);
            });
          }
        }
        
        lastTimestampRef.current = result.timestamp;
      } else if (result.error) {
        setError(result.error);
      }
      
      setLastPollTime(new Date());
    } catch (err) {
      setError('Failed to poll webhook events');
      console.error('Webhook polling error:', err);
    } finally {
      setIsPolling(false);
    }
  }, [enabled, showNotifications, onEvent]);

  // Initial poll and interval setup
  useEffect(() => {
    if (!enabled) return;
    
    // Initial poll
    pollEvents();
    
    // Set up interval
    const intervalId = setInterval(pollEvents, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [enabled, pollInterval, pollEvents]);

  const refresh = useCallback(async () => {
    await pollEvents();
  }, [pollEvents]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setStats({ delivered: 0, opened: 0, clicked: 0, bounced: 0 });
    seenEventIdsRef.current.clear();
  }, []);

  return {
    events,
    isPolling,
    lastPollTime,
    error,
    stats,
    refresh,
    clearEvents,
  };
}
