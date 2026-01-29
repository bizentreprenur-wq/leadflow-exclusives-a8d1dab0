/**
 * AI Autopilot Campaign Promo Section
 * Shows only after login, displays 7-day trial CTA
 * Orange styling when trial expired and not renewed
 */

import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Crown, Sparkles, Lock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutopilotTrial } from "@/hooks/useAutopilotTrial";
import { cn } from "@/lib/utils";

interface FreeTrialSectionProps {
  className?: string;
  onStartTrial?: () => void;
  onSubscribe?: () => void;
}

const FreeTrialSection = ({ className, onStartTrial, onSubscribe }: FreeTrialSectionProps) => {
  const { user } = useAuth();
  const { status, startTrial, upgradeToPaid, MONTHLY_PRICE } = useAutopilotTrial();

  // Only show this section to logged-in users
  if (!user) {
    return null;
  }

  // If user has paid subscription, don't show this graphic
  if (status.isPaid) {
    return null;
  }

  // Determine the state
  const isExpired = status.isExpired;
  const hasNeverStartedTrial = !status.hasStartedTrial;
  const isTrialActive = status.isTrialActive;

  const handleAction = async () => {
    if (isExpired || isTrialActive) {
      // Show payment flow
      if (onSubscribe) {
        onSubscribe();
      } else {
        await upgradeToPaid();
      }
    } else if (hasNeverStartedTrial) {
      // Start free trial
      if (onStartTrial) {
        onStartTrial();
      } else {
        startTrial();
      }
    }
  };

  // Expired state - Orange warning theme
  if (isExpired) {
    return (
      <section className={cn("py-24 md:py-32 relative", className)}>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-orange-500/10 to-background pointer-events-none" />
        
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Expired CTA card - Orange Theme */}
            <div className="relative p-8 md:p-12 rounded-2xl border-2 border-orange-500/50 bg-gradient-to-b from-orange-500/20 via-orange-500/10 to-background shadow-lg shadow-orange-500/10 overflow-hidden text-center">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10">
                {/* Warning Icon */}
                <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/40">
                  <AlertTriangle className="w-10 h-10 text-orange-400 animate-pulse" />
                </div>

                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 mb-4">
                  <Lock className="w-3 h-3 mr-1" />
                  Trial Expired
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  AI Autopilot Campaign
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                  Your 7-day trial has ended. Subscribe now to continue using AI-powered 
                  Email Strategies, Drip sequences, follow-ups, lead responses, and smart nurturing.
                </p>

                {/* Pricing */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Badge variant="outline" className="text-muted-foreground line-through">
                    7-day free trial
                  </Badge>
                  <span className="text-muted-foreground">then</span>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-lg px-4 py-1">
                    ${MONTHLY_PRICE}/month
                  </Badge>
                </div>

                <Button 
                  onClick={handleAction}
                  size="xl" 
                  className="group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Subscribe Now - ${MONTHLY_PRICE}/mo
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Active trial state - Show days remaining
  if (isTrialActive) {
    return (
      <section className={cn("py-16 md:py-20 relative bg-secondary/30", className)}>
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="relative p-6 md:p-8 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent shadow-glow overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                  <Crown className="w-8 h-8 text-white" />
                </div>

                <Badge className={cn(
                  "mb-4",
                  status.trialDaysRemaining <= 3 
                    ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                )}>
                  {status.trialDaysRemaining} day{status.trialDaysRemaining !== 1 ? 's' : ''} left in trial
                </Badge>

                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
                  AI Autopilot Campaign Active
                </h2>
                <p className="text-muted-foreground mb-6">
                  Upgrade now to keep your AI automation running after your trial ends.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/40">
                    ✓ Trial Active
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">
                    ${MONTHLY_PRICE}/month
                  </Badge>
                </div>

                <Button 
                  onClick={handleAction}
                  size="lg" 
                  className="mt-6 group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default state - Never started trial (show after login)
  return (
    <section className={cn("py-24 md:py-32 relative bg-secondary/30", className)}>
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* CTA card - Amber/Yellow theme */}
          <div className="relative p-8 md:p-12 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent shadow-glow overflow-hidden text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              {/* Crown Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                AI Autopilot Campaign
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                Let AI handle everything: Email Strategies, Drip sequences, follow-ups, 
                lead responses, and smart nurturing based on your agency services.
              </p>

              {/* Pricing badges */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-sm px-4 py-1">
                  7-day free trial
                </Badge>
                <span className="text-muted-foreground">then</span>
                <Badge className="bg-muted text-muted-foreground border-border text-sm px-4 py-1">
                  ${MONTHLY_PRICE}/month
                </Badge>
              </div>

              <Button 
                onClick={handleAction}
                variant="hero" 
                size="xl" 
                className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeTrialSection;
