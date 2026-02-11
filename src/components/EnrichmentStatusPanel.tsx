/**
 * Enrichment Status Panel
 * 
 * Listens for 'enrichment-status' custom events dispatched by the post-stream
 * enrichment poller and displays live counts for pending/processing/completed/
 * failed items plus an email-found counter.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, CheckCircle2, Mail, Phone, Users,
  AlertTriangle, Database, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrichmentState {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  progress: number;
  isComplete: boolean;
  emailsFound: number;
  phonesFound: number;
  socialsFound: number;
}

const INITIAL: EnrichmentState = {
  pending: 0, processing: 0, completed: 0, failed: 0, total: 0,
  progress: 0, isComplete: false,
  emailsFound: 0, phonesFound: 0, socialsFound: 0,
};

interface EnrichmentStatusPanelProps {
  className?: string;
}

export default function EnrichmentStatusPanel({ className }: EnrichmentStatusPanelProps) {
  const [state, setState] = useState<EnrichmentState>(INITIAL);
  const [visible, setVisible] = useState(false);

  const handleEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;
    setVisible(true);
    setState(prev => ({
      pending: detail.pending ?? prev.pending,
      processing: detail.processing ?? prev.processing,
      completed: detail.completed ?? prev.completed,
      failed: detail.failed ?? prev.failed,
      total: detail.total ?? prev.total,
      progress: detail.progress ?? prev.progress,
      isComplete: detail.isComplete ?? prev.isComplete,
      emailsFound: detail.emailsFound ?? prev.emailsFound,
      phonesFound: detail.phonesFound ?? prev.phonesFound,
      socialsFound: detail.socialsFound ?? prev.socialsFound,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('enrichment-status', handleEvent);
    return () => window.removeEventListener('enrichment-status', handleEvent);
  }, [handleEvent]);

  if (!visible || state.total === 0) return null;

  const isRunning = !state.isComplete && (state.pending > 0 || state.processing > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border bg-card p-4 space-y-3',
          state.isComplete ? 'border-primary/30' : 'border-border',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : state.isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Database className="h-4 w-4 text-muted-foreground" />
            )}
            <span>
              {isRunning
                ? 'Enriching contacts…'
                : state.isComplete
                  ? 'Enrichment complete'
                  : 'Enrichment'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{state.progress}%</span>
        </div>

        {/* Progress */}
        <Progress value={state.progress} className="h-1.5" />

        {/* Counts row */}
        <div className="flex flex-wrap gap-2">
          {state.emailsFound > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Mail className="h-3 w-3" />
              {state.emailsFound} emails
            </Badge>
          )}
          {state.phonesFound > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <Phone className="h-3 w-3" />
              {state.phonesFound} phones
            </Badge>
          )}
          {state.socialsFound > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {state.socialsFound} socials
            </Badge>
          )}
        </div>

        {/* Queue status */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {state.processing > 0 && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {state.processing} processing
            </span>
          )}
          {state.pending > 0 && (
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {state.pending} queued
            </span>
          )}
          {state.completed > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              {state.completed} done
            </span>
          )}
          {state.failed > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-3 w-3" />
              {state.failed} failed
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
