import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Eye, MousePointer, Clock, TrendingUp, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentSignal {
  type: string;
  weight: number;
  detected: boolean;
  description: string;
}

interface VisitorIntent {
  conversionProbability: number;
  hesitationReason: string | null;
  recommendedAction: string;
  confidence: number;
  signals: IntentSignal[];
}

const PreIntentDetection = () => {
  const [intent, setIntent] = useState<VisitorIntent>({
    conversionProbability: 0,
    hesitationReason: null,
    recommendedAction: "Analyzing behavior patterns...",
    confidence: 0,
    signals: []
  });
  
  const [mouseData, setMouseData] = useState({
    hesitations: 0,
    speed: 0,
    scrollDepth: 0,
    timeOnPage: 0,
    backtracking: 0,
    pricingDwell: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showPrediction, setShowPrediction] = useState(false);

  // Track mouse movements and detect hesitation
  const trackMouse = useCallback((e: MouseEvent) => {
    setMouseData(prev => ({
      ...prev,
      speed: Math.min(100, prev.speed + Math.random() * 2),
      hesitations: prev.hesitations + (Math.random() > 0.95 ? 1 : 0)
    }));
  }, []);

  // Track scroll behavior
  const trackScroll = useCallback(() => {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    setMouseData(prev => ({
      ...prev,
      scrollDepth: Math.max(prev.scrollDepth, scrollPercent),
      backtracking: prev.scrollDepth > scrollPercent ? prev.backtracking + 1 : prev.backtracking
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', trackMouse);
    window.addEventListener('scroll', trackScroll);

    // Simulate time tracking
    const timeInterval = setInterval(() => {
      setMouseData(prev => ({
        ...prev,
        timeOnPage: prev.timeOnPage + 1,
        pricingDwell: prev.pricingDwell + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 1000);

    // Show prediction after analysis
    const analysisTimer = setTimeout(() => {
      setIsAnalyzing(false);
      setShowPrediction(true);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', trackMouse);
      window.removeEventListener('scroll', trackScroll);
      clearInterval(timeInterval);
      clearTimeout(analysisTimer);
    };
  }, [trackMouse, trackScroll]);

  // Calculate intent based on behavioral signals
  useEffect(() => {
    if (!showPrediction) return;

    const signals: IntentSignal[] = [
      {
        type: "Engagement Depth",
        weight: Math.min(100, mouseData.scrollDepth),
        detected: mouseData.scrollDepth > 30,
        description: "User exploring content thoroughly"
      },
      {
        type: "Time Investment",
        weight: Math.min(100, mouseData.timeOnPage * 3),
        detected: mouseData.timeOnPage > 10,
        description: "Extended session indicates interest"
      },
      {
        type: "Decision Hesitation",
        weight: Math.max(0, 100 - mouseData.hesitations * 10),
        detected: mouseData.hesitations > 3,
        description: "Mouse hesitation near CTAs detected"
      },
      {
        type: "Backtracking Pattern",
        weight: Math.max(0, 100 - mouseData.backtracking * 15),
        detected: mouseData.backtracking > 2,
        description: "User re-reading content sections"
      },
      {
        type: "Pricing Interest",
        weight: Math.min(100, mouseData.pricingDwell * 5),
        detected: mouseData.pricingDwell > 5,
        description: "Significant time on pricing elements"
      }
    ];

    const avgWeight = signals.reduce((acc, s) => acc + s.weight, 0) / signals.length;
    const conversionProb = Math.min(95, Math.max(15, avgWeight + (Math.random() * 20 - 10)));
    
    const hesitationReasons = [
      { condition: mouseData.pricingDwell > 8, reason: "Price sensitivity - considering budget fit" },
      { condition: mouseData.backtracking > 3, reason: "Trust hesitation - needs social proof" },
      { condition: mouseData.hesitations > 5, reason: "Decision paralysis - too many options" },
      { condition: mouseData.timeOnPage > 30 && conversionProb < 50, reason: "Unclear value proposition" }
    ];

    const detectedHesitation = hesitationReasons.find(h => h.condition);

    const actions = [
      { condition: conversionProb > 70, action: "Show limited-time offer to close" },
      { condition: detectedHesitation?.reason.includes("Price"), action: "Trigger discount popup or payment plan" },
      { condition: detectedHesitation?.reason.includes("Trust"), action: "Display testimonials and case studies" },
      { condition: conversionProb < 40, action: "Launch AI micro-dialogue for engagement" },
      { condition: true, action: "Personalize CTA based on behavior pattern" }
    ];

    setIntent({
      conversionProbability: Math.round(conversionProb),
      hesitationReason: detectedHesitation?.reason || null,
      recommendedAction: actions.find(a => a.condition)?.action || "Continue monitoring",
      confidence: Math.min(95, 60 + mouseData.timeOnPage),
      signals
    });
  }, [mouseData, showPrediction]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          Pre-Intent Detection AI
          <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-500 border-green-500/30">
            <Zap className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Predicting visitor intent before they even know they're ready
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Eye className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Analyzing behavioral patterns...
            </p>
          </div>
        ) : (
          <>
            {/* Main Prediction */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Conversion Probability</span>
                <span className={cn(
                  "text-2xl font-bold",
                  intent.conversionProbability > 70 ? "text-green-500" :
                  intent.conversionProbability > 40 ? "text-yellow-500" : "text-red-500"
                )}>
                  {intent.conversionProbability}%
                </span>
              </div>
              <Progress 
                value={intent.conversionProbability} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Confidence: {intent.confidence}%
              </p>
            </div>

            {/* Hesitation Detection */}
            {intent.hesitationReason && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Hesitation Detected</p>
                    <p className="text-xs text-muted-foreground">{intent.hesitationReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Behavioral Signals */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Behavioral Signals
              </p>
              <div className="grid grid-cols-2 gap-2">
                {intent.signals.map((signal, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "p-2 rounded-lg text-xs transition-all",
                      signal.detected 
                        ? "bg-primary/10 border border-primary/30" 
                        : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {signal.type === "Engagement Depth" && <MousePointer className="h-3 w-3" />}
                      {signal.type === "Time Investment" && <Clock className="h-3 w-3" />}
                      {signal.type === "Decision Hesitation" && <Brain className="h-3 w-3" />}
                      {signal.type === "Backtracking Pattern" && <TrendingUp className="h-3 w-3" />}
                      {signal.type === "Pricing Interest" && <Target className="h-3 w-3" />}
                      <span className="font-medium truncate">{signal.type}</span>
                    </div>
                    <Progress value={signal.weight} className="h-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-500">AI Recommended Action</p>
                  <p className="text-xs text-muted-foreground">{intent.recommendedAction}</p>
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-primary">{mouseData.timeOnPage}s</p>
                <p className="text-[10px] text-muted-foreground">Session Time</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-primary">{Math.round(mouseData.scrollDepth)}%</p>
                <p className="text-[10px] text-muted-foreground">Scroll Depth</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-primary">{mouseData.hesitations}</p>
                <p className="text-[10px] text-muted-foreground">Hesitations</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PreIntentDetection;
