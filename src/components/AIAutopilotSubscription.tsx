import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Crown, CreditCard, Clock, CheckCircle2, ArrowRight, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIAutopilotSubscriptionProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

interface TrialStatus {
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialStartDate: string | null;
  isPaid: boolean;
  subscriptionId: string | null;
}

const TRIAL_DURATION_DAYS = 14;
const MONTHLY_PRICE = 39;

export default function AIAutopilotSubscription({ isActive, onToggle }: AIAutopilotSubscriptionProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(() => {
    try {
      const stored = localStorage.getItem('bamlead_autopilot_trial');
      if (stored) {
        const data = JSON.parse(stored);
        // Calculate days remaining
        if (data.trialStartDate) {
          const startDate = new Date(data.trialStartDate);
          const now = new Date();
          const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - diffDays);
          return {
            ...data,
            trialDaysRemaining: daysRemaining,
            isTrialActive: daysRemaining > 0 && !data.isPaid,
          };
        }
        return data;
      }
      return {
        isTrialActive: false,
        trialDaysRemaining: TRIAL_DURATION_DAYS,
        trialStartDate: null,
        isPaid: false,
        subscriptionId: null,
      };
    } catch {
      return {
        isTrialActive: false,
        trialDaysRemaining: TRIAL_DURATION_DAYS,
        trialStartDate: null,
        isPaid: false,
        subscriptionId: null,
      };
    }
  });

  // Save trial status to localStorage
  useEffect(() => {
    localStorage.setItem('bamlead_autopilot_trial', JSON.stringify(trialStatus));
  }, [trialStatus]);

  const handleStartTrial = () => {
    const now = new Date().toISOString();
    setTrialStatus(prev => ({
      ...prev,
      isTrialActive: true,
      trialStartDate: now,
      trialDaysRemaining: TRIAL_DURATION_DAYS,
    }));
    onToggle(true);
    toast.success('🚀 14-day AI Autopilot trial started! AI will handle your outreach.');
  };

  const handleToggleAutopilot = () => {
    if (!isActive) {
      // User wants to enable AI Autopilot
      if (trialStatus.isPaid) {
        // Already paid, just enable
        onToggle(true);
        toast.success('🤖 AI Autopilot activated!');
      } else if (trialStatus.trialStartDate && trialStatus.trialDaysRemaining <= 0) {
        // Trial expired, show payment modal
        setShowPaymentModal(true);
      } else if (trialStatus.trialStartDate) {
        // Trial still active
        onToggle(true);
        toast.success(`🤖 AI Autopilot resumed! ${trialStatus.trialDaysRemaining} days left in trial.`);
      } else {
        // No trial started yet
        handleStartTrial();
      }
    } else {
      // User wants to switch to manual
      onToggle(false);
      toast.info('👤 Switched to Manual Mode. You can take over anytime.');
    }
  };

  const handleSubscribe = () => {
    // In production, this would redirect to Stripe checkout
    setTrialStatus(prev => ({
      ...prev,
      isPaid: true,
      subscriptionId: `sub_${Date.now()}`,
      isTrialActive: false,
    }));
    setShowPaymentModal(false);
    onToggle(true);
    toast.success('🎉 AI Autopilot subscription activated! $39/month');
  };

  const canUseAutopilot = trialStatus.isPaid || (trialStatus.isTrialActive && trialStatus.trialDaysRemaining > 0);

  return (
    <>
      {/* Main Toggle Card */}
      <div className={cn(
        "p-5 rounded-xl border transition-all",
        isActive 
          ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30" 
          : "bg-card border-border"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isActive 
                ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                : "bg-muted"
            )}>
              <Bot className={cn("w-6 h-6", isActive ? "text-white" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">AI Autopilot Mode</h3>
                {trialStatus.isPaid && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                    <Crown className="w-2.5 h-2.5 mr-1" /> PRO
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                AI handles all lead interactions until they respond
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleAutopilot}
            size="lg"
            className={cn(
              "gap-2 min-w-[140px]",
              isActive 
                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            )}
          >
            {isActive ? (
              <>👤 Switch to Manual</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Enable AI</>
            )}
          </Button>
        </div>

        {/* Trial/Subscription Status */}
        {!trialStatus.isPaid && trialStatus.trialStartDate && (
          <div className={cn(
            "mt-3 p-3 rounded-lg flex items-center justify-between",
            trialStatus.trialDaysRemaining > 3 
              ? "bg-emerald-500/10 border border-emerald-500/20" 
              : "bg-amber-500/10 border border-amber-500/20"
          )}>
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "w-4 h-4",
                trialStatus.trialDaysRemaining > 3 ? "text-emerald-400" : "text-amber-400"
              )} />
              <span className="text-sm text-foreground">
                <span className="font-bold">{trialStatus.trialDaysRemaining} days</span> left in free trial
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowPaymentModal(true)}
              className="gap-1 text-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Features when active */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-border"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Zap, label: 'AI sends emails from both GMB & Platform searches' },
                { icon: Bot, label: 'Auto follow-ups based on engagement' },
                { icon: Shield, label: 'CRM sync for all AI interactions' },
                { icon: CheckCircle2, label: 'You can take over anytime' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <feature.icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Upgrade to AI Autopilot Pro
            </DialogTitle>
            <DialogDescription>
              Your 14-day trial has ended. Subscribe to continue using AI Autopilot.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Price */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="text-4xl font-bold text-foreground mb-1">
                ${MONTHLY_PRICE}<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">Billed monthly. Cancel anytime.</p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">What's included:</h4>
              {[
                'AI handles all outreach until lead responds',
                'Auto-sequences for GMB & Platform searches',
                'Smart follow-ups based on engagement',
                'Full CRM integration for AI interactions',
                'Take over manually at any point',
                'Priority support',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button 
              onClick={handleSubscribe} 
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Subscribe Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
