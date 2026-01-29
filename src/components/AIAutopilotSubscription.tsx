import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Crown, CreditCard, Clock, CheckCircle2, ArrowRight, Zap, Shield, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';

interface AIAutopilotSubscriptionProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export default function AIAutopilotSubscription({ isActive, onToggle }: AIAutopilotSubscriptionProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { 
    status: trialStatus, 
    startTrial, 
    upgradeToPaid, 
    TRIAL_DURATION_DAYS, 
    MONTHLY_PRICE 
  } = useAutopilotTrial();

  const handleToggleAutopilot = () => {
    if (!isActive) {
      // User wants to enable AI Autopilot
      if (trialStatus.isPaid) {
        // Already paid, just enable
        onToggle(true);
        toast.success('🤖 AI Autopilot activated!');
      } else if (trialStatus.isExpired) {
        // Trial expired, show payment modal
        setShowPaymentModal(true);
      } else if (trialStatus.hasStartedTrial) {
        // Trial still active
        onToggle(true);
        toast.success(`🤖 AI Autopilot resumed! ${trialStatus.trialDaysRemaining} days left in trial.`);
      } else {
        // No trial started yet
        const success = startTrial();
        if (success) {
          onToggle(true);
          toast.success('🚀 7-day AI Autopilot trial started! AI will handle your outreach.');
        }
      }
    } else {
      // User wants to switch to manual
      onToggle(false);
      toast.info('👤 Switched to Manual Mode. You can take over anytime.');
    }
  };

  const handleSubscribe = async () => {
    const success = await upgradeToPaid();
    if (success) {
      setShowPaymentModal(false);
      onToggle(true);
      toast.success('🎉 AI Autopilot subscription activated! $' + MONTHLY_PRICE + '/month');
    }
  };

  const canUseAutopilot = trialStatus.canUseAutopilot;
  const progressPercentage = trialStatus.hasStartedTrial 
    ? ((TRIAL_DURATION_DAYS - trialStatus.trialDaysRemaining) / TRIAL_DURATION_DAYS) * 100 
    : 0;

  return (
    <>
      {/* Main Toggle Card - Yellow/Amber AI Autopilot Theme */}
      <div className={cn(
        "p-5 rounded-xl border-2 transition-all relative overflow-hidden",
        trialStatus.isExpired 
          ? "bg-red-500/5 border-red-500/30"
          : isActive 
            ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/10" 
            : "bg-card border-amber-500/30"
      )}>
        {/* Expired Overlay */}
        {trialStatus.isExpired && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-2">Trial Expired</p>
              <Button 
                onClick={() => setShowPaymentModal(true)}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1"
              >
                <Crown className="w-3.5 h-3.5" />
                Subscribe ${MONTHLY_PRICE}/mo
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              trialStatus.isExpired
                ? "bg-red-500/10"
                : isActive 
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" 
                  : "bg-amber-500/20"
            )}>
              <Crown className={cn(
                "w-6 h-6", 
                trialStatus.isExpired
                  ? "text-red-400"
                  : isActive 
                    ? "text-white" 
                    : "text-amber-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">AI Autopilot</h3>
                {trialStatus.isPaid && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] border-0">
                    <Crown className="w-2.5 h-2.5 mr-1" /> PRO
                  </Badge>
                )}
                {trialStatus.isTrialActive && !trialStatus.isPaid && (
                  <Badge className={cn(
                    "text-[10px]",
                    trialStatus.trialDaysRemaining <= 3 
                      ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" 
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    {trialStatus.trialDaysRemaining} days left
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                AI handles everything: Drip → Follow-ups → Responses
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleAutopilot}
            size="lg"
            disabled={trialStatus.isExpired}
            className={cn(
              "gap-2 min-w-[140px]",
              trialStatus.isExpired
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : isActive 
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20" 
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            )}
          >
            {trialStatus.isExpired ? (
              <><Lock className="w-4 h-4" /> Locked</>
            ) : isActive ? (
              <>👤 Switch to Manual</>
            ) : trialStatus.hasStartedTrial ? (
              <><Sparkles className="w-4 h-4" /> Resume AI</>
            ) : (
              <><Zap className="w-4 h-4" /> Start Free Trial</>
            )}
          </Button>
        </div>

        {/* Trial Progress Bar - Yellow Theme */}
        {trialStatus.isTrialActive && !trialStatus.isPaid && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-400 font-medium">Trial Progress</span>
              <span className={cn(
                "text-xs font-medium",
                trialStatus.trialDaysRemaining <= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {trialStatus.trialDaysRemaining} of {TRIAL_DURATION_DAYS} days remaining
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className={cn(
                "h-2",
                trialStatus.trialDaysRemaining <= 3 
                  ? "[&>div]:bg-red-500" 
                  : "[&>div]:bg-amber-500"
              )}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">
                {trialStatus.warningMessage}
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowPaymentModal(true)}
                className="gap-1 text-xs h-7"
              >
                <CreditCard className="w-3 h-3" />
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Features when active - Yellow accents */}
        {isActive && !trialStatus.isExpired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-amber-500/20"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Zap, label: 'AI sends emails from both GMB & Platform searches' },
                { icon: Bot, label: 'Auto follow-ups based on engagement' },
                { icon: Shield, label: 'CRM sync for all AI interactions' },
                { icon: CheckCircle2, label: 'You can take over anytime' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <feature.icon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
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
              {trialStatus.isExpired ? 'Reactivate AI Autopilot' : 'Upgrade to AI Autopilot Pro'}
            </DialogTitle>
            <DialogDescription>
              {trialStatus.isExpired 
                ? 'Your 7-day trial has ended. Subscribe to continue using AI Autopilot.'
                : 'Get unlimited AI-powered outreach and never miss a lead.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Price - Yellow/Amber Theme */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
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
                'Intelligent sequences for GMB & Platform searches',
                'Smart follow-ups based on engagement signals',
                'Full CRM integration for AI interactions',
                'Proposal/contract recommendations when ready',
                'Priority support',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
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
          
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground mt-2">
            <Shield className="w-3 h-3" />
            <span>Secure payment • Cancel anytime • 30-day money-back guarantee</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
