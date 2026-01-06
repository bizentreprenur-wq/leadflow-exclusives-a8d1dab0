import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Shield, 
  Zap, 
  Crown, 
  DollarSign, 
  Heart,
  RefreshCw,
  Target,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PsychProfile {
  trait: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface ProfileInsight {
  category: string;
  recommendation: string;
  confidence: number;
}

const PsychologicalProfiler = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  
  const [profile, setProfile] = useState<PsychProfile[]>([
    { trait: "Risk Tolerance", score: 0, icon: <Shield className="h-4 w-4" />, description: "Willingness to try new solutions", color: "text-blue-500" },
    { trait: "Decision Speed", score: 0, icon: <Zap className="h-4 w-4" />, description: "How quickly they commit", color: "text-yellow-500" },
    { trait: "Authority Level", score: 0, icon: <Crown className="h-4 w-4" />, description: "Decision-making power", color: "text-purple-500" },
    { trait: "Price Sensitivity", score: 0, icon: <DollarSign className="h-4 w-4" />, description: "Budget consciousness", color: "text-green-500" },
    { trait: "Trust Threshold", score: 0, icon: <Heart className="h-4 w-4" />, description: "Proof needed before buying", color: "text-red-500" }
  ]);

  const [insights, setInsights] = useState<ProfileInsight[]>([]);
  const [buyerType, setBuyerType] = useState<string>("");
  const [approachStrategy, setApproachStrategy] = useState<string>("");

  const stages = [
    "Analyzing browsing patterns...",
    "Detecting decision signals...",
    "Mapping psychological traits...",
    "Building buyer persona...",
    "Generating approach strategy..."
  ];

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setProfileComplete(false);
    setAnalysisStage(0);

    // Simulate progressive analysis
    const stageInterval = setInterval(() => {
      setAnalysisStage(prev => {
        if (prev >= stages.length - 1) {
          clearInterval(stageInterval);
          completeAnalysis();
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const completeAnalysis = () => {
    const newProfile = profile.map(p => ({
      ...p,
      score: Math.round(Math.random() * 40 + 40) // 40-80 range
    }));

    setProfile(newProfile);

    // Determine buyer type based on scores
    const avgRisk = newProfile.find(p => p.trait === "Risk Tolerance")?.score || 50;
    const avgSpeed = newProfile.find(p => p.trait === "Decision Speed")?.score || 50;
    const avgPrice = newProfile.find(p => p.trait === "Price Sensitivity")?.score || 50;

    let type = "";
    if (avgRisk > 65 && avgSpeed > 60) {
      type = "🚀 Early Adopter";
      setApproachStrategy("Lead with innovation and exclusivity. They want to be first. Emphasize cutting-edge features and competitive advantage.");
    } else if (avgPrice > 70) {
      type = "💰 Value Seeker";
      setApproachStrategy("Focus on ROI and cost-benefit analysis. Show clear numbers and comparisons. Offer flexible pricing or payment plans.");
    } else if (avgSpeed < 40) {
      type = "🔍 Careful Evaluator";
      setApproachStrategy("Provide detailed documentation and case studies. Don't rush. Offer trials and demos. Build relationship over time.");
    } else {
      type = "⚡ Decisive Buyer";
      setApproachStrategy("Be direct and concise. They know what they want. Make the path to purchase frictionless. Highlight key benefits quickly.");
    }

    setBuyerType(type);

    // Generate insights
    setInsights([
      {
        category: "Pricing Presentation",
        recommendation: avgPrice > 60 
          ? "Show payment plans first, emphasize value per dollar"
          : "Lead with premium option, show ROI calculator",
        confidence: 87
      },
      {
        category: "Email Tone",
        recommendation: avgSpeed > 60
          ? "Direct and action-oriented, short paragraphs"
          : "Detailed and educational, include resources",
        confidence: 92
      },
      {
        category: "Follow-up Timing",
        recommendation: avgSpeed > 60
          ? "1-2 days - strike while hot"
          : "5-7 days - give time to evaluate",
        confidence: 78
      },
      {
        category: "Social Proof",
        recommendation: avgRisk < 50
          ? "Lead with testimonials and case studies"
          : "Focus on innovation and unique features",
        confidence: 85
      }
    ]);

    setIsAnalyzing(false);
    setProfileComplete(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-purple-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          Psychological Profiler
          <Badge variant="outline" className="ml-auto bg-purple-500/10 text-purple-500 border-purple-500/30">
            PERSUASION AI
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Build psychological profiles for personalized selling
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAnalyzing && !profileComplete && (
          <>
            {/* Start Analysis */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-primary/10 border border-purple-500/20 text-center">
              <Brain className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold mb-1">Analyze Lead Psychology</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI builds a psychological profile based on behavioral signals,
                not just demographics.
              </p>
              <Button onClick={runAnalysis}>
                <Target className="h-4 w-4 mr-2" />
                Start Psychological Analysis
              </Button>
            </div>

            {/* What We Analyze */}
            <div className="grid grid-cols-2 gap-2">
              {profile.map((p, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                  <div className={p.color}>{p.icon}</div>
                  <span className="text-xs">{p.trait}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="py-8 text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"
                style={{ animationDuration: '1s' }}
              />
              <Brain className="h-8 w-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-500 animate-pulse">
                {stages[analysisStage]}
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {stages.map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i <= analysisStage ? "bg-purple-500" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {profileComplete && (
          <>
            {/* Buyer Type */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-primary/20 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Buyer Type Identified</span>
                <Badge className="bg-purple-500 text-white">{buyerType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{approachStrategy}</p>
            </div>

            {/* Profile Traits */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Psychological Profile
              </p>
              {profile.map((p, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={p.color}>{p.icon}</span>
                      <span>{p.trait}</span>
                    </div>
                    <span className="font-bold">{p.score}%</span>
                  </div>
                  <Progress value={p.score} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                AI-Generated Insights
              </p>
              {insights.map((insight, i) => (
                <div key={i} className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-500">{insight.category}</span>
                    <span className="text-[10px] text-muted-foreground">{insight.confidence}% confidence</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={runAnalysis}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
              <Button className="flex-1">
                Apply to Outreach
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PsychologicalProfiler;
