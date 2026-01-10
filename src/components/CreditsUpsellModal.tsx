import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Check, 
  TrendingUp,
  Rocket,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CreditsUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits?: number;
  requiredCredits?: number;
}

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 19,
    popular: false,
    perCredit: 0.19,
  },
  {
    id: 'growth',
    name: 'Growth Pack',
    credits: 500,
    price: 79,
    popular: true,
    perCredit: 0.158,
    savings: '17%',
  },
  {
    id: 'scale',
    name: 'Scale Pack',
    credits: 1500,
    price: 199,
    popular: false,
    perCredit: 0.133,
    savings: '30%',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 5000,
    price: 499,
    popular: false,
    perCredit: 0.10,
    savings: '47%',
  },
];

export default function CreditsUpsellModal({
  open,
  onOpenChange,
  currentCredits = 0,
  requiredCredits = 0,
}: CreditsUpsellModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('growth');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setIsPurchasing(true);
    
    // Simulate purchase - in production this would call Stripe
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`🎉 ${pkg.credits} credits added to your account!`);
    setIsPurchasing(false);
    onOpenChange(false);
  };

  const needsCredits = requiredCredits > currentCredits;
  const shortfall = requiredCredits - currentCredits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {needsCredits ? "You Need More AI Credits! ⚡" : "Boost Your AI Power 🚀"}
              </DialogTitle>
              <DialogDescription>
                {needsCredits 
                  ? `You need ${shortfall.toLocaleString()} more credits to verify all selected leads`
                  : "Get more credits to verify leads and unlock insights"
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Balance */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="font-medium">Your Current Balance</span>
          </div>
          <Badge variant={currentCredits < 25 ? "destructive" : "secondary"} className="text-base px-3 py-1">
            {currentCredits.toLocaleString()} credits
          </Badge>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {CREDIT_PACKAGES.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setSelectedPackage(pkg.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                  selectedPackage === pkg.id
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-border hover:border-amber-500/50 bg-card'
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lg">{pkg.name}</p>
                    <p className="text-2xl font-bold text-amber-500">
                      {pkg.credits.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground ml-1">credits</span>
                    </p>
                  </div>
                  {selectedPackage === pkg.id && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">${pkg.price}</span>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">${pkg.perCredit.toFixed(2)}/credit</span>
                    {pkg.savings && (
                      <Badge variant="outline" className="ml-2 text-emerald-500 border-emerald-500/50">
                        Save {pkg.savings}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* What You Get */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 mt-2">
          <p className="font-medium text-sm mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-500" />
            Each credit unlocks:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>AI-verified contact info</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Lead quality score</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Personalized outreach</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Best time to contact</span>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <div className="flex items-center gap-3 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold gap-2"
          >
            {isPurchasing ? (
              <>Processing...</>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Get {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits.toLocaleString()} Credits - ${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price}
              </>
            )}
          </Button>
        </div>

        {/* Trust Badge */}
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
          <TrendingUp className="w-3 h-3" />
          Credits never expire • Secure payment via Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
}
