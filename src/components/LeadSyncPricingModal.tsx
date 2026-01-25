import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, Crown, Rocket, Sparkles, ArrowRight, Mail, Phone, MessageSquare, Users, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LEADSYNC_PLANS_ARRAY, LeadSyncTier, formatLimit } from '@/lib/leadsyncPricing';

interface LeadSyncPricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: LeadSyncTier | null;
  onSelectPlan: (tier: LeadSyncTier) => void;
}

const tierIcons = {
  starter: Zap,
  pro: Crown,
  agency: Rocket,
};

const tierColors = {
  starter: 'from-blue-500 to-cyan-500',
  pro: 'from-violet-500 to-fuchsia-500',
  agency: 'from-amber-500 to-orange-500',
};

export default function LeadSyncPricingModal({
  open,
  onOpenChange,
  currentTier,
  onSelectPlan,
}: LeadSyncPricingModalProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedTier, setSelectedTier] = useState<LeadSyncTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (tier: LeadSyncTier) => {
    if (tier === currentTier) {
      toast.info('You are already on this plan');
      return;
    }

    setSelectedTier(tier);
    setIsProcessing(true);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    onSelectPlan(tier);
    setIsProcessing(false);
    onOpenChange(false);
    toast.success(`🚀 Upgraded to LeadSync AI ${LEADSYNC_PLANS_ARRAY.find(p => p.id === tier)?.name}!`);
  };

  const yearlySavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    return Math.round(((monthlyCost - yearly) / monthlyCost) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <DialogTitle className="text-2xl font-bold text-white">
              LeadSync AI Plans
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            Multi-channel automation that works while you sleep
          </DialogDescription>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <Label className={`text-sm ${!isYearly ? 'text-white' : 'text-slate-500'}`}>
              Monthly
            </Label>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-violet-600"
            />
            <Label className={`text-sm ${isYearly ? 'text-white' : 'text-slate-500'}`}>
              Yearly
            </Label>
            {isYearly && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Save up to 20%
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 py-4">
          {LEADSYNC_PLANS_ARRAY.map((plan, index) => {
            const Icon = tierIcons[plan.id];
            const isCurrentPlan = currentTier === plan.id;
            const isSelected = selectedTier === plan.id;
            const price = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                  plan.popular
                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                } ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-emerald-500 text-white border-0">
                      Current Plan
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierColors[plan.id]} mx-auto mb-3 flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">${price}</span>
                    <span className="text-slate-400">/mo</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-emerald-400 mt-1">
                      Save {yearlySavings(plan.price, plan.yearlyPrice)}% with yearly
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-5">
                  {plan.highlights.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || isProcessing}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {isProcessing && isSelected ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <span className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="border-t border-slate-800 pt-6 mt-2">
          <h4 className="text-lg font-semibold text-white mb-4 text-center">
            Feature Comparison
          </h4>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {/* Headers */}
            <div className="font-medium text-slate-400">Feature</div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="font-medium text-center text-white">
                {plan.name}
              </div>
            ))}

            {/* Leads */}
            <div className="flex items-center gap-2 text-slate-300 py-2 border-t border-slate-800">
              <Users className="w-4 h-4 text-blue-400" />
              Leads/month
            </div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="text-center py-2 border-t border-slate-800 text-slate-300">
                {formatLimit(plan.features.leadsPerMonth)}
              </div>
            ))}

            {/* Emails */}
            <div className="flex items-center gap-2 text-slate-300 py-2 border-t border-slate-800">
              <Mail className="w-4 h-4 text-emerald-400" />
              Emails/month
            </div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="text-center py-2 border-t border-slate-800 text-slate-300">
                {formatLimit(plan.features.emailsPerMonth)}
              </div>
            ))}

            {/* SMS */}
            <div className="flex items-center gap-2 text-slate-300 py-2 border-t border-slate-800">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              SMS/month
            </div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="text-center py-2 border-t border-slate-800 text-slate-300">
                {formatLimit(plan.features.smsPerMonth)}
              </div>
            ))}

            {/* AI Calls */}
            <div className="flex items-center gap-2 text-slate-300 py-2 border-t border-slate-800">
              <Phone className="w-4 h-4 text-violet-400" />
              AI Call Minutes
            </div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="text-center py-2 border-t border-slate-800 text-slate-300">
                {plan.features.aiCallMinutes} min
              </div>
            ))}

            {/* Sequences */}
            <div className="flex items-center gap-2 text-slate-300 py-2 border-t border-slate-800">
              <Zap className="w-4 h-4 text-cyan-400" />
              Active Sequences
            </div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="text-center py-2 border-t border-slate-800 text-slate-300">
                {formatLimit(plan.features.sequences)}
              </div>
            ))}

            {/* Analytics */}
            <div className="flex items-center gap-2 text-slate-300 py-2 border-t border-slate-800">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Advanced Analytics
            </div>
            {LEADSYNC_PLANS_ARRAY.map(plan => (
              <div key={plan.id} className="text-center py-2 border-t border-slate-800">
                {plan.features.advancedAnalytics ? (
                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                ) : (
                  <X className="w-4 h-4 text-slate-600 mx-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-500">
            All plans include 7-day free trial • Cancel anytime • No hidden fees
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
