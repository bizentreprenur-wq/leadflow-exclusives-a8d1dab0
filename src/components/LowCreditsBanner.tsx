/**
 * Low Credits Banner — Sticky banner shown when credits ≤ 25
 * Only for Basic through Autopilot tiers. NEVER for Unlimited/owner.
 */

import { useState } from 'react';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCredits } from './CreditCounter';
import AddCreditsModal from './AddCreditsModal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function LowCreditsBanner() {
  const { credits, isLow, isOut, isUnlimited } = useCredits();
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // NEVER show for unlimited users, the owner, or unauthenticated visitors
  const isOwner = user?.is_owner || user?.email === 'adrianlsthill@gmail.com';
  if (!isAuthenticated || isUnlimited || isOwner || !isLow || dismissed) return null;

  return (
    <>
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-center gap-3 shadow-lg border-t backdrop-blur-sm",
        isOut
          ? "bg-destructive/90 border-destructive/50 text-destructive-foreground"
          : "bg-amber-500/90 border-amber-500/50 text-black"
      )}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          {isOut
            ? "You're out of credits. Add more to continue using BamLead."
            : `You have ${credits} credits remaining. Add more to avoid interruption.`
          }
        </span>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className={cn(
            "gap-1.5 font-semibold",
            isOut
              ? "bg-white text-destructive hover:bg-white/90"
              : "bg-black text-white hover:bg-black/80"
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Add Credits
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AddCreditsModal
        open={showModal}
        onOpenChange={setShowModal}
        currentCredits={credits}
        isOutOfCredits={isOut}
      />
    </>
  );
}
