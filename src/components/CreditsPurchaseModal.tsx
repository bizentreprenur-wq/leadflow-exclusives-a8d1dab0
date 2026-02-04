/**
 * Credits Purchase Modal
 * Allows users to purchase additional AI verification credits when they run out
 * Available on all tiers: Basic, Pro, and Autopilot
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Zap, Sparkles, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCreditsCheckoutSession, type CreditPackageId } from '@/lib/api/stripe';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings?: string;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    credits: 100,
    price: 9.99,
    pricePerCredit: 0.10,
  },
  {
    id: 'standard',
    credits: 500,
    price: 39.99,
    pricePerCredit: 0.08,
    savings: 'Save 20%',
    popular: true,
  },
  {
    id: 'pro',
    credits: 1000,
    price: 69.99,
    pricePerCredit: 0.07,
    savings: 'Save 30%',
  },
  {
    id: 'enterprise',
    credits: 2500,
    price: 149.99,
    pricePerCredit: 0.06,
    savings: 'Save 40%',
  },
];

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
}

export function CreditsPurchaseModal({
  isOpen,
  onClose,
  currentCredits = 0,
}: CreditsPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('standard');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setIsPurchasing(true);
    try {
      const session = await createCreditsCheckoutSession(pkg.id as CreditPackageId);

      toast.info('Redirecting to secure Stripe checkout...');
      window.location.assign(session.checkout_url);
    } catch (error) {
      toast.error('Purchase failed', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const selectedPkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="w-6 h-6 text-amber-500" />
            Purchase AI Verification Credits
          </DialogTitle>
          <DialogDescription>
            Out of credits? No problem! Purchase more to continue verifying leads.
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Current Balance:</span>
          <Badge variant="outline" className="text-lg font-bold">
            <Sparkles className="w-4 h-4 mr-1 text-amber-500" />
            {currentCredits} credits
          </Badge>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                selectedPackage === pkg.id
                  ? 'border-2 border-primary ring-2 ring-primary/20'
                  : 'border border-border'
              } ${pkg.popular ? 'relative' : ''}`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
                  Most Popular
                </Badge>
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{pkg.credits}</span>
                  {pkg.savings && (
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                      {pkg.savings}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">credits</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-primary">${pkg.price}</span>
                  <span className="text-xs text-muted-foreground">
                    (${pkg.pricePerCredit.toFixed(2)}/credit)
                  </span>
                </div>
                {selectedPackage === pkg.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What Credits Are For */}
        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            What are AI Verification Credits?
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Verify lead email addresses and phone numbers</li>
            <li>• Deep-scan websites for decision-maker contacts</li>
            <li>• Enrich leads with business intelligence data</li>
            <li>• Score leads for deal likelihood and urgency</li>
          </ul>
        </div>

        {/* Purchase Button */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isPurchasing || !selectedPkg}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Purchase {selectedPkg?.credits} Credits - ${selectedPkg?.price}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreditsPurchaseModal;
