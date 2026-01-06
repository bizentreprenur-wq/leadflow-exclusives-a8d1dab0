import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Handshake, 
  DollarSign, 
  TrendingUp,
  Shield,
  Clock,
  Gift,
  Zap,
  ArrowRight,
  RefreshCw,
  Check,
  Sparkles,
  Target,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadProfile {
  priceResistance: number;
  trustLevel: number;
  urgency: number;
  decisionSpeed: number;
  riskAversion: number;
}

interface Concession {
  type: string;
  value: string;
  trigger: string;
  impact: number;
  icon: React.ReactNode;
}

interface PricingStrategy {
  basePrice: number;
  adjustedPrice: number;
  displayStrategy: string;
  framingApproach: string;
  concessions: Concession[];
  roiReframe: string;
  urgencyTrigger: string;
}

const InvisibleNegotiator = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  
  const [leadProfile, setLeadProfile] = useState<LeadProfile>({
    priceResistance: 0,
    trustLevel: 0,
    urgency: 0,
    decisionSpeed: 0,
    riskAversion: 0
  });

  const [strategy, setStrategy] = useState<PricingStrategy | null>(null);
  const [appliedConcessions, setAppliedConcessions] = useState<string[]>([]);

  const stages = [
    "Analyzing behavioral signals...",
    "Detecting price sensitivity...",
    "Calculating trust threshold...",
    "Building negotiation strategy...",
    "Preparing micro-concessions..."
  ];

  const startNegotiation = () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisStage(0);
    setAppliedConcessions([]);

    const stageInterval = setInterval(() => {
      setAnalysisStage(prev => {
        if (prev >= stages.length - 1) {
          clearInterval(stageInterval);
          completeAnalysis();
          return prev;
        }
        return prev + 1;
      });
    }, 700);
  };

  const completeAnalysis = () => {
    // Generate lead profile
    const profile: LeadProfile = {
      priceResistance: Math.round(Math.random() * 40 + 40),
      trustLevel: Math.round(Math.random() * 30 + 50),
      urgency: Math.round(Math.random() * 50 + 30),
      decisionSpeed: Math.round(Math.random() * 40 + 40),
      riskAversion: Math.round(Math.random() * 40 + 30)
    };
    setLeadProfile(profile);

    // Generate pricing strategy based on profile
    const basePrice = 299;
    const concessions: Concession[] = [];
    let adjustedPrice = basePrice;
    let displayStrategy = "";
    let framingApproach = "";
    let roiReframe = "";
    let urgencyTrigger = "";

    // Price-sensitive leads
    if (profile.priceResistance > 60) {
      concessions.push({
        type: "Payment Plan",
        value: "Split into 3 monthly payments",
        trigger: "High price resistance detected",
        impact: 23,
        icon: <DollarSign className="h-4 w-4" />
      });
      displayStrategy = "Show monthly price first ($99/mo)";
      framingApproach = "Cost-per-lead framing: '$0.12 per qualified lead'";
    } else {
      displayStrategy = "Show annual savings prominently";
      framingApproach = "Premium value positioning with ROI focus";
    }

    // Trust-building for risk-averse leads
    if (profile.riskAversion > 50) {
      concessions.push({
        type: "Extended Guarantee",
        value: "60-day money-back guarantee",
        trigger: "Risk aversion signal detected",
        impact: 31,
        icon: <Shield className="h-4 w-4" />
      });
      roiReframe = "Show guaranteed minimum ROI: '10x return or full refund'";
    } else {
      roiReframe = "Focus on growth potential: 'Average 847% ROI in 90 days'";
    }

    // Urgency for slow decision makers
    if (profile.decisionSpeed < 50) {
      concessions.push({
        type: "Bonus Incentive",
        value: "Free onboarding call ($200 value)",
        trigger: "Slow decision pattern",
        impact: 18,
        icon: <Gift className="h-4 w-4" />
      });
      urgencyTrigger = "Limited spots available (3 remaining this week)";
    } else {
      urgencyTrigger = "Lock in current pricing before next increase";
    }

    // High urgency leads
    if (profile.urgency > 70) {
      concessions.push({
        type: "Fast-Track Setup",
        value: "Same-day account activation",
        trigger: "High urgency detected",
        impact: 15,
        icon: <Zap className="h-4 w-4" />
      });
    }

    // Trust building
    if (profile.trustLevel < 60) {
      concessions.push({
        type: "Case Study Access",
        value: "Industry-specific success stories",
        trigger: "Trust threshold not met",
        impact: 27,
        icon: <BarChart3 className="h-4 w-4" />
      });
    }

    setStrategy({
      basePrice,
      adjustedPrice,
      displayStrategy,
      framingApproach,
      concessions,
      roiReframe,
      urgencyTrigger
    });

    setIsAnalyzing(false);
    setAnalysisComplete(true);
  };

  const applyConcession = (type: string) => {
    if (!appliedConcessions.includes(type)) {
      setAppliedConcessions(prev => [...prev, type]);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Handshake className="h-5 w-5 text-emerald-500" />
          </div>
          AI Invisible Negotiator
          <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            🤝 AUTO-NEGOTIATE
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically adjusts pricing, offers concessions, and reframes value
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAnalyzing && !analysisComplete && (
          <>
            {/* Intro */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-center">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
                  <Handshake className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h3 className="font-bold mb-1">AI-Powered Deal Closer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Analyzes lead psychology and automatically offers the perfect concessions 
                to close deals — without human intervention.
              </p>
              <Button onClick={startNegotiation} className="bg-emerald-500 hover:bg-emerald-600">
                <Target className="h-4 w-4 mr-2" />
                Analyze Lead & Negotiate
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-emerald-500" />
                Dynamic pricing display
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <Gift className="h-3 w-3 text-emerald-500" />
                Auto micro-concessions
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                ROI reframing
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <Clock className="h-3 w-3 text-emerald-500" />
                Urgency triggers
              </div>
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="py-8 space-y-4 text-center">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"
              />
              <Handshake className="h-8 w-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-emerald-500 animate-pulse">
              {stages[analysisStage]}
            </p>
            <div className="flex justify-center gap-1">
              {stages.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i <= analysisStage ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {analysisComplete && strategy && (
          <>
            {/* Lead Psychology Profile */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
              <p className="text-xs font-medium text-emerald-500 mb-3 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Lead Psychology Detected
              </p>
              <div className="space-y-2">
                {Object.entries(leadProfile).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={cn(
                        "font-medium",
                        value > 60 ? "text-red-500" : value > 40 ? "text-yellow-500" : "text-green-500"
                      )}>{value}%</span>
                    </div>
                    <Progress value={value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Negotiation Strategy */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Negotiation Strategy
              </p>

              {/* Display Strategy */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs font-medium text-blue-500">Pricing Display</p>
                <p className="text-sm text-muted-foreground">{strategy.displayStrategy}</p>
              </div>

              {/* Framing Approach */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-xs font-medium text-purple-500">Value Framing</p>
                <p className="text-sm text-muted-foreground">{strategy.framingApproach}</p>
              </div>

              {/* ROI Reframe */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-medium text-green-500">ROI Messaging</p>
                <p className="text-sm text-muted-foreground">{strategy.roiReframe}</p>
              </div>

              {/* Urgency Trigger */}
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-xs font-medium text-orange-500">Urgency Trigger</p>
                <p className="text-sm text-muted-foreground">{strategy.urgencyTrigger}</p>
              </div>
            </div>

            {/* Auto Concessions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Micro-Concessions (Auto-Applied)
              </p>
              {strategy.concessions.map((concession, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    appliedConcessions.includes(concession.type)
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-muted/30 border-muted"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-500">
                        {concession.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{concession.type}</p>
                        <p className="text-xs text-muted-foreground">{concession.value}</p>
                      </div>
                    </div>
                    {appliedConcessions.includes(concession.type) ? (
                      <Badge className="bg-emerald-500 text-white text-[10px]">
                        <Check className="h-3 w-3 mr-1" />
                        APPLIED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        +{concession.impact}% close rate
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Trigger: {concession.trigger}
                  </p>
                  {!appliedConcessions.includes(concession.type) && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => applyConcession(concession.type)}
                    >
                      Apply Concession
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Predicted Outcome */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Predicted Close Rate</p>
              <p className="text-3xl font-bold text-emerald-500">
                {Math.min(95, 45 + appliedConcessions.length * 12 + Math.round(leadProfile.trustLevel * 0.3))}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{appliedConcessions.length * 12}% from concessions applied
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={startNegotiation}>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Lead
              </Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                Deploy Strategy
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InvisibleNegotiator;
