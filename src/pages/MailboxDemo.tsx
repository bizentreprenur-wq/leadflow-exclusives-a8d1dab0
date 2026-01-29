import { Link, useNavigate } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import CleanMailboxLayout from "@/components/CleanMailboxLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crown, Mail, Lock, Rocket, CheckCircle2, CreditCard, Shield, ArrowRight } from "lucide-react";
import { useAutopilotTrial } from "@/hooks/useAutopilotTrial";
import { useAuth } from "@/contexts/AuthContext";

export default function MailboxDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status: trialStatus, startTrial, upgradeToPaid, MONTHLY_PRICE, isOwnerAccount } = useAutopilotTrial();
  const [showSubscriptionGate, setShowSubscriptionGate] = useState(false);

  const searchType =
    (typeof window !== "undefined"
      ? (sessionStorage.getItem("bamlead_search_type") as "gmb" | "platform" | null)
      : null) || null;

  // Set default search type if not set (for demo purposes)
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('bamlead_search_type')) {
      sessionStorage.setItem('bamlead_search_type', 'gmb');
    }
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    // If user is owner/admin, they have free access
    if (isOwnerAccount) return;

    // If user has paid subscription or active trial, allow access
    if (trialStatus.canUseAutopilot) return;

    // Otherwise, show subscription gate
    setShowSubscriptionGate(true);
  }, [trialStatus, isOwnerAccount]);

  const handleStartTrial = () => {
    if (!user) {
      // Redirect to auth with return URL
      navigate('/auth?redirect=/mailbox-demo&plan=autopilot');
      return;
    }
    
    const success = startTrial();
    if (success) {
      setShowSubscriptionGate(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to auth with return URL
      navigate('/auth?redirect=/mailbox-demo&plan=autopilot');
      return;
    }

    const success = await upgradeToPaid();
    if (success) {
      setShowSubscriptionGate(false);
    }
  };

  const handleGoToPricing = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back</Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">BamLead Mailbox</h1>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 border-0 gap-1">
              <Crown className="w-3 h-3" />
              AI Autopilot Campaign - $19.99/mo
            </Badge>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard-demo">Open Full Demo</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {/* Subscription Gate Overlay */}
        {showSubscriptionGate && !isOwnerAccount && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="bg-card border-2 border-amber-500/30 rounded-2xl p-8 space-y-6 shadow-2xl shadow-amber-500/10">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">AI Autopilot Campaign</h2>
                  <p className="text-muted-foreground">
                    Subscribe to unlock the AI-powered outreach system that handles everything automatically.
                  </p>
                </div>

                {/* Price */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                  <p className="text-4xl font-bold text-foreground">
                    ${MONTHLY_PRICE}<span className="text-lg text-muted-foreground">/month</span>
                  </p>
                  <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    7-Day Free Trial
                  </Badge>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {[
                    'Unlimited AI sequences',
                    'Smart response detection',
                    'Priority lead routing',
                    'Performance analytics',
                    'AI handles follow-ups automatically',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleStartTrial}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 py-6 text-lg font-bold"
                  >
                    <Rocket className="w-5 h-5" />
                    Start 7-Day Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleGoToPricing}
                    className="w-full gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    View All Plans
                  </Button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Secure payment • Cancel anytime • 30-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading mailbox...</div>
          </div>
        }>
          <CleanMailboxLayout
            searchType={searchType || 'gmb'}
            campaignContext={{ isActive: false, sentCount: 0, totalLeads: 0 }}
          />
        </Suspense>
      </main>

      {/* Subscription Dialog (fallback) */}
      <Dialog open={false}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Subscribe to AI Autopilot
            </DialogTitle>
            <DialogDescription>
              Get full access to AI-powered outreach automation for ${MONTHLY_PRICE}/month.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
