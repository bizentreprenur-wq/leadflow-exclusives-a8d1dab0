/**
 * Enrichment Progress Bar Component
 * 
 * Shows progressive enrichment status during lead discovery.
 * Displays without any manual retry buttons - everything is automatic.
 */

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Mail, Phone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrichmentStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface EnrichmentProgressBarProps {
  isEnriching: boolean;
  isComplete: boolean;
  progress: number;
  stats: EnrichmentStats;
  enrichmentCounts?: {
    withEmail: number;
    withPhone: number;
    withSocials: number;
  };
  className?: string;
}

export function EnrichmentProgressBar({
  isEnriching,
  isComplete,
  progress,
  stats,
  enrichmentCounts,
  className,
}: EnrichmentProgressBarProps) {
  if (!isEnriching && !isComplete && stats.total === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        {isEnriching && !isComplete && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        {isComplete && (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        )}
        
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        
        <span className="text-sm text-muted-foreground min-w-[60px] text-right">
          {progress}%
        </span>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEnriching && !isComplete && (
          <Badge variant="outline" className="text-xs">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Enriching contacts...
          </Badge>
        )}
        
        {isComplete && (
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Enrichment complete
          </Badge>
        )}

        {/* Show counts when available */}
        {enrichmentCounts && (
          <>
            {enrichmentCounts.withEmail > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Mail className="h-3 w-3 mr-1" />
                {enrichmentCounts.withEmail} emails found
              </Badge>
            )}
            
            {enrichmentCounts.withPhone > 0 && (
              <Badge variant="outline" className="text-xs">
                <Phone className="h-3 w-3 mr-1" />
                {enrichmentCounts.withPhone} phones found
              </Badge>
            )}
            
            {enrichmentCounts.withSocials > 0 && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {enrichmentCounts.withSocials} socials found
              </Badge>
            )}
          </>
        )}

        {/* Processing stats */}
        {stats.processing > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {stats.processing} processing
          </Badge>
        )}
        
        {stats.pending > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {stats.pending} queued
          </Badge>
        )}
      </div>
    </div>
  );
}

export default EnrichmentProgressBar;