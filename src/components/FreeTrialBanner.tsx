import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Gift,
  X,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface FreeTrialBannerProps {
  variant?: "full" | "compact" | "floating";
  onDismiss?: () => void;
  ctaTo?: string;
  ctaLabel?: string;
}

export default function FreeTrialBanner({
  variant = "full",
  onDismiss,
  ctaTo = "/auth",
  ctaLabel,
}: FreeTrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === "floating") {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="relative p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-elevated max-w-sm">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Try Pro Free for 7 Days!</p>
              <p className="text-sm opacity-90">No credit card required</p>
            </div>
          </div>
          
          <Link to={ctaTo}>
            <Button 
              variant="secondary" 
              className="w-full gap-2 bg-white text-primary hover:bg-white/90"
            >
              {ctaLabel || "Start Free Trial"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">7-Day Pro Trial</p>
              <p className="text-sm text-muted-foreground">Try all features free</p>
            </div>
          </div>
          <Link to={ctaTo}>
            <Button size="sm" className="gap-2">
              {ctaLabel || "Start Trial"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Left Content */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-4">
              <Clock className="w-4 h-4" />
              Limited Time Offer
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Try Pro Free for 7 Days
            </h2>
            
            <p className="text-lg opacity-90 mb-6 max-w-lg">
              Find businesses that need website design, social media marketing & digital services. Cancel anytime, no credit card required.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6 max-w-md mx-auto md:mx-0">
              {[
                "Unlimited searches",
                "500 AI verifications",
                "Email automation",
                "Priority support",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <Link to={ctaTo}>
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <Zap className="w-5 h-5" />
                {ctaLabel || "Start Your Free Trial"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Right Content - Stats */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm opacity-80">Days Free</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-sm opacity-80">To Start</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-3xl font-bold">500</p>
              <p className="text-sm opacity-80">AI Credits</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-3xl font-bold">∞</p>
              <p className="text-sm opacity-80">Searches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
