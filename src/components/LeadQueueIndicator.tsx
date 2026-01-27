import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, ArrowRight, User, Building2 } from 'lucide-react';

interface Lead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  contact_name?: string;
}

interface LeadQueueIndicatorProps {
  leads: Lead[];
  currentIndex: number;
  /** Optional: Index of most recently sent lead (-1 if none) */
  lastSentIndex?: number;
  variant?: 'horizontal' | 'compact';
  className?: string;
}

export default function LeadQueueIndicator({
  leads,
  currentIndex,
  lastSentIndex = -1,
  variant = 'horizontal',
  className,
}: LeadQueueIndicatorProps) {
  // Filter out null/undefined leads to prevent crashes
  const safeLeads = useMemo(() => leads?.filter((l): l is Lead => l != null) ?? [], [leads]);
  
  const prevLead = lastSentIndex >= 0 && lastSentIndex < safeLeads.length ? safeLeads[lastSentIndex] : null;
  const currentLead = currentIndex >= 0 && currentIndex < safeLeads.length ? safeLeads[currentIndex] : null;
  const nextIndex = currentIndex + 1;
  const nextLead = nextIndex < safeLeads.length ? safeLeads[nextIndex] : null;

  const getName = (lead: Lead | null | undefined) => {
    if (!lead) return '—';
    return lead.business_name || lead.name || lead.contact_name || lead.email?.split('@')[0] || 'Lead';
  };

  const getEmail = (lead: Lead | null | undefined) => {
    return lead?.email || '—';
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        {prevLead && (
          <>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] gap-1 px-2">
              <CheckCircle2 className="w-3 h-3" />
              {getName(prevLead)}
            </Badge>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </>
        )}
        {currentLead && (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] gap-1 px-2">
            <Circle className="w-3 h-3 fill-current" />
            {getName(currentLead)}
          </Badge>
        )}
        {nextLead && (
          <>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <Badge variant="outline" className="border-border text-muted-foreground text-[10px] gap-1 px-2">
              <User className="w-3 h-3" />
              {getName(nextLead)}
            </Badge>
          </>
        )}
      </div>
    );
  }

  // Horizontal 3-column layout (like the reference image)
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {/* Last Sent */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Last Sent
        </div>
        {prevLead ? (
          <>
            <p className="text-sm font-medium text-foreground truncate">{getName(prevLead)}</p>
            <p className="text-[10px] text-muted-foreground truncate">{getEmail(prevLead)}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">No emails sent yet</p>
        )}
      </div>

      {/* Sending Now */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 animate-pulse">
            Sending Now →
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-primary mb-1.5 mt-2">
          <Building2 className="w-3 h-3" />
          Current
        </div>
        {currentLead ? (
          <>
            <p className="text-sm font-medium text-foreground truncate">{getName(currentLead)}</p>
            <p className="text-[10px] text-muted-foreground truncate">{getEmail(currentLead)}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">Ready to send</p>
        )}
      </div>

      {/* Up Next */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1.5">
          <User className="w-3 h-3" />
          Up Next
        </div>
        {nextLead ? (
          <>
            <p className="text-sm font-medium text-foreground truncate">{getName(nextLead)}</p>
            <p className="text-[10px] text-muted-foreground truncate">{getEmail(nextLead)}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">Queue complete</p>
        )}
      </div>
    </div>
  );
}
