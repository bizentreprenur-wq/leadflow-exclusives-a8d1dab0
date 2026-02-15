/**
 * Add Credits Modal — Lovable-style credit purchase experience
 * Card-based package selection with clear pricing tiers
 */

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Crown, Sparkles, Loader2, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { createCreditsCheckoutSession, CreditPackageId } from '@/lib/api/stripe';
import { cn } from '@/lib/utils';

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number;
  isOutOfCredits?: boolean;
}

const CREDIT_PACKAGES = [
  { id: 'starter' as CreditPackageId, credits: 50, price: 30, perCredit: '0.60', label: 'Starter', popular: false },
  { id: 'standard' as CreditPackageId, credits: 100, price: 45, perCredit: '0.45', label: 'Standard', popular: true },
  { id: 'pro' as CreditPackageId, credits: 250, price: 100, perCredit: '0.40', label: 'Growth', popular: false },
  { id: 'enterprise' as CreditPackageId, credits: 1000, price: 288, perCredit: '0.29', label: 'Scale', popular: false },
  { id: 'enterprise' as CreditPackageId, credits: 2500, price: 499, perCredit: '0.20', label: 'Agency', popular: false },
];

export default function AddCreditsModal({
  open,
  onOpenChange,
  currentCredits,
  isOutOfCredits = false,
}: AddCreditsModalProps) {
  const [selectedIdx, setSelectedIdx] = useState(1); // Default to Standard (most popular)
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { tier } = usePlanFeatures();

  const selectedPkg = CREDIT_PACKAGES[selectedIdx];

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setIsLoading(true);
    try {
      const { checkout_url } = await createCreditsCheckoutSession(selectedPkg.id);
      window.location.href = checkout_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-[hsl(var(--card))] border-border overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isOutOfCredits ? "You've run out of credits" : "Add more credits"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  You have <span className={cn("font-semibold", currentCredits <= 10 ? "text-destructive" : currentCredits <= 50 ? "text-amber-500" : "text-primary")}>{currentCredits}</span> credits remaining
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Credit Packages Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-5 gap-2">
            {CREDIT_PACKAGES.map((pkg, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center",
                  selectedIdx === idx
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/40 bg-muted/20"
                )}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-2 bg-primary text-primary-foreground border-0 whitespace-nowrap">
                    Best Value
                  </Badge>
                )}
                <span className="text-lg font-bold text-foreground">{pkg.credits}</span>
                <span className="text-[10px] text-muted-foreground mb-1">credits</span>
                <span className="text-base font-bold text-foreground">${pkg.price}</span>
                <span className="text-[9px] text-muted-foreground">${pkg.perCredit}/credit</span>
                {selectedIdx === idx && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Button */}
        <div className="px-6 pb-4">
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Redirecting to checkout...</>
            ) : (
              <>Buy {selectedPkg.credits} credits for ${selectedPkg.price}</>
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            One-time purchase · Credits never expire · Powered by Stripe
          </p>
        </div>

        {/* Upgrade Plan Section */}
        {tier !== 'unlimited' && tier !== 'autopilot' && (
          <div className="px-6 pb-4">
            <div className="h-px bg-border mb-4" />
            <button
              onClick={() => { onOpenChange(false); navigate('/pricing'); }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/40 bg-muted/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-semibold text-foreground">Want more credits monthly?</span>
                  <p className="text-[11px] text-muted-foreground">Upgrade your plan for more included credits each month</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                View Plans
              </Badge>
            </button>
          </div>
        )}

        {/* Unlimited Promo */}
        {tier !== 'unlimited' && (
          <div className="px-6 pb-6">
            <button
              onClick={() => { onOpenChange(false); navigate('/pricing'); }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-red-500/30 hover:border-red-500/60 bg-red-500/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <span className="text-sm font-semibold text-foreground">Go Unlimited — never run out</span>
                  <p className="text-[11px] text-muted-foreground">Unlimited credits, AI calling, proposals — $999/mo</p>
                </div>
              </div>
              <Badge className="bg-red-500 text-white border-0 text-xs">$999/mo</Badge>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
