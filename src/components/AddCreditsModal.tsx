/**
 * Add More Credits Modal — Lovable-style branded for BamLead
 * Shows when credits drop below 50 or hit 0
 * Offers plan upgrade, top-up credits, or Unlimited plan
 */

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Crown, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number;
  isOutOfCredits?: boolean;
}

const TOP_UP_PACKAGES = [
  { id: '200', credits: 200, price: 30, originalPrice: 60 },
  { id: '500', credits: 500, price: 65, originalPrice: 130 },
  { id: '1000', credits: 1000, price: 110, originalPrice: 220 },
  { id: '2500', credits: 2500, price: 225, originalPrice: 500 },
];

export default function AddCreditsModal({
  open,
  onOpenChange,
  currentCredits,
  isOutOfCredits = false,
}: AddCreditsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'upgrade' | 'topup'>('upgrade');
  const [selectedTopUp, setSelectedTopUp] = useState('200');
  const navigate = useNavigate();
  const { tier, tierInfo } = usePlanFeatures();

  const currentPlanCredits = tier === 'free' ? 25 : tier === 'basic' ? 200 : tier === 'pro' ? 500 : tier === 'autopilot' ? 2000 : Infinity;
  const currentPlanPrice = tier === 'free' ? 0 : tier === 'basic' ? 49 : tier === 'pro' ? 99 : tier === 'autopilot' ? 249 : 999;
  
  const nextTier = tier === 'free' ? 'basic' : tier === 'basic' ? 'pro' : tier === 'pro' ? 'autopilot' : tier === 'autopilot' ? 'unlimited' : null;
  const nextTierCredits = nextTier === 'basic' ? 200 : nextTier === 'pro' ? 500 : nextTier === 'autopilot' ? 2000 : nextTier === 'unlimited' ? 'Unlimited' : null;
  const nextTierPrice = nextTier === 'basic' ? 49 : nextTier === 'pro' ? 99 : nextTier === 'autopilot' ? 249 : nextTier === 'unlimited' ? 999 : null;

  const selectedPkg = TOP_UP_PACKAGES.find(p => p.id === selectedTopUp);

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleGetUnlimited = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleTopUp = async () => {
    if (!selectedPkg) return;
    toast.info('Redirecting to checkout...');
    // In production this would call the Stripe credits checkout
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 bg-[hsl(var(--card))] border-border overflow-hidden">
        {/* Header with BamLead branding */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎯</span>
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

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {isOutOfCredits ? "You're out of credits" : "Add more credits"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isOutOfCredits 
              ? "Purchase credits or upgrade your plan to continue."
              : "Choose a long-term upgrade or a one-time top-up."
            }
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 space-y-3">
          <RadioGroup value={selectedOption} onValueChange={(v) => setSelectedOption(v as 'upgrade' | 'topup')}>
            {/* Option 1: Upgrade Plan */}
            {nextTier && (
              <div 
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  selectedOption === 'upgrade' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedOption('upgrade')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="font-semibold text-foreground cursor-pointer">Upgrade your plan</Label>
                      <RadioGroupItem value="upgrade" id="upgrade" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Current plan</span>
                      <span>{currentPlanCredits === Infinity ? 'Unlimited' : currentPlanCredits} credits/mo · ${currentPlanPrice}/mo</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-0.5">
                      <span>Upgrade to</span>
                      <span className="text-foreground font-medium">{nextTierCredits} credits/mo · ${nextTierPrice}/mo</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-muted-foreground line-through text-lg">${currentPlanPrice}</span>
                        <span className="text-2xl font-bold text-foreground ml-2">$0</span>
                        <span className="text-muted-foreground ml-2 text-sm">due today</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleUpgrade}
                        className="bg-primary text-primary-foreground"
                      >
                        Subscribe & save 17%
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Option 2: Top-up Credits */}
            <div 
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                selectedOption === 'topup' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedOption('topup')}
            >
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-semibold text-foreground cursor-pointer">Top up credits</Label>
                <RadioGroupItem value="topup" id="topup" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">Purchase credits on demand. Valid for 12 months.</p>
              
              <Select value={selectedTopUp} onValueChange={setSelectedTopUp}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOP_UP_PACKAGES.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center justify-between w-full gap-8">
                        <span>+{pkg.credits} additional credits</span>
                        <span>
                          <span className="line-through text-muted-foreground">${pkg.originalPrice.toFixed(2)}</span>
                          {' '}
                          <span className="font-semibold">${pkg.price.toFixed(2)}</span>
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedOption === 'topup' && selectedPkg && (
                <Button 
                  onClick={handleTopUp}
                  className="w-full mt-3 bg-primary text-primary-foreground"
                >
                  Purchase {selectedPkg.credits} Credits — ${selectedPkg.price}
                </Button>
              )}
            </div>
          </RadioGroup>

          {/* Unlimited Plan Promo */}
          {tier !== 'unlimited' && (
            <div 
              className="rounded-xl border-2 border-red-500/50 p-4 cursor-pointer transition-all hover:border-red-500 bg-red-500/5"
              onClick={handleGetUnlimited}
            >
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-foreground">Go Unlimited</span>
                <Badge className="bg-red-500 text-white border-0 text-[10px]">$999/mo</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Never worry about credits again. Unlimited everything — searches, verifications, AI calling, proposals.
              </p>
              <Button 
                size="sm" 
                className="mt-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
              >
                Get Unlimited
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}