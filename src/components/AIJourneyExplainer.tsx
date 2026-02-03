import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Eye, 
  Radar,
  Handshake,
  Wand2,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Mail,
  BarChart3,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyStage {
  id: string;
  stage: string;
  description: string;
  aiFeatures: {
    name: string;
    icon: React.ReactNode;
    color: string;
    whatHappens: string;
    userSees: string;
  }[];
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "discovery",
    stage: "1. Lead Discovery",
    description: "When a user searches for leads using GMB Scanner or Agency Lead Finder for digital professionals",
    aiFeatures: [
      {
        name: "Reverse Lead Discovery",
        icon: <Radar className="h-5 w-5" />,
        color: "text-cyan-500",
        whatHappens: "AI analyzes browsing patterns across the web to find companies who searched for similar solutions but went to competitors instead.",
        userSees: "A 'Hidden Leads' panel showing companies who almost visited, with match reasons like 'Visited 3 competitor sites, searched lead generation tools'."
      }
    ]
  },
  {
    id: "browsing",
    stage: "2. Website Browsing",
    description: "While visitors browse your landing page or pricing page",
    aiFeatures: [
      {
        name: "Pre-Intent Detection",
        icon: <Brain className="h-5 w-5" />,
        color: "text-primary",
        whatHappens: "AI monitors mouse movements, scroll speed, time on pricing page, and hesitation patterns to calculate conversion probability in real-time.",
        userSees: "Dashboard shows live visitor intent scores (e.g., '72% likely to convert') and recommended actions like 'Trigger discount popup now'."
      },
      {
        name: "Live Page Mutation",
        icon: <Wand2 className="h-5 w-5" />,
        color: "text-pink-500",
        whatHappens: "AI detects visitor persona (SaaS Founder, Agency Owner, etc.) and rewrites headlines, CTAs, and value props to match their specific pain points.",
        userSees: "Nothing visible - it happens automatically. A SaaS founder sees 'Scale Your Pipeline Without Hiring SDRs' while an agency owner sees 'Never Run Out of Client Leads'."
      }
    ]
  },
  {
    id: "interaction",
    stage: "3. Form/Chat Interaction",
    description: "When leads type in forms, chat widgets, or search boxes",
    aiFeatures: [
      {
        name: "Emotional State Detection",
        icon: <Heart className="h-5 w-5" />,
        color: "text-pink-500",
        whatHappens: "AI analyzes typing speed, deletions, pauses, and corrections to detect frustration, confidence, curiosity, or anxiety.",
        userSees: "In the email composer, a 'Lead Mood' indicator shows detected emotional state. Messaging tone suggestions auto-adjust based on detected emotions."
      }
    ]
  },
  {
    id: "verification",
    stage: "4. AI Lead Verification",
    description: "After searching, when user clicks 'Email These Leads'",
    aiFeatures: [
      {
        name: "Psychological Profiler",
        icon: <Target className="h-5 w-5" />,
        color: "text-purple-500",
        whatHappens: "AI builds a psychological profile for each lead: risk tolerance, decision speed, price sensitivity, authority level, trust threshold.",
        userSees: "Verification results show a 'Buyer Type' badge (e.g., 'Early Adopter', 'Value Seeker') with recommended approach strategy for each lead."
      }
    ]
  },
  {
    id: "outreach",
    stage: "5. Email Outreach",
    description: "When composing and sending emails to verified leads",
    aiFeatures: [
      {
        name: "AI Email Writer",
        icon: <Mail className="h-5 w-5" />,
        color: "text-blue-500",
        whatHappens: "AI generates personalized email content based on lead industry, detected psychology, and best-performing templates.",
        userSees: "A 'Generate with AI' button in the email composer that creates customized subject lines and body content instantly."
      },
      {
        name: "Sentiment Analyzer",
        icon: <BarChart3 className="h-5 w-5" />,
        color: "text-green-500",
        whatHappens: "AI analyzes your email draft for tone, formality, urgency, and provides improvement suggestions.",
        userSees: "A sentiment panel showing 'Tone: Professional', 'Formality: 78%', 'Urgency: Medium' with specific suggestions like 'Add more social proof'."
      },
      {
        name: "Outcome Simulator",
        icon: <TrendingUp className="h-5 w-5" />,
        color: "text-blue-500",
        whatHappens: "AI simulates what happens if you send the email now vs. in 3 days, via email vs. LinkedIn, etc.",
        userSees: "A 'Best Time to Send' recommendation with conversion probability: 'Send Tuesday 10 AM for 67% open rate (vs. 43% if sent now)'."
      }
    ]
  },
  {
    id: "pricing",
    stage: "6. Pricing & Negotiation",
    description: "When leads view pricing or consider purchasing",
    aiFeatures: [
      {
        name: "Invisible Negotiator",
        icon: <Handshake className="h-5 w-5" />,
        color: "text-emerald-500",
        whatHappens: "AI detects price resistance and automatically offers micro-concessions: payment plans, extended guarantees, bonus incentives.",
        userSees: "Price-sensitive leads automatically see 'Split into 3 payments' while confident buyers see the full annual price with ROI calculator."
      }
    ]
  },
  {
    id: "improvement",
    stage: "7. Continuous Improvement",
    description: "Ongoing optimization of your sales funnel",
    aiFeatures: [
      {
        name: "AI Founder Mirror",
        icon: <Eye className="h-5 w-5" />,
        color: "text-orange-500",
        whatHappens: "AI audits your funnel flow, messaging clarity, pricing psychology, and UX to identify exactly why leads drop off.",
        userSees: "A dashboard with scores for each category and brutal feedback like 'Your value prop takes 8 seconds to understand. That is 6 seconds too long.'"
      }
    ]
  }
];

const AIJourneyExplainer = () => {
  const [activeStage, setActiveStage] = useState<string>("discovery");
  const journeyStages = JOURNEY_STAGES;

  const currentStageIndex = journeyStages.findIndex((s) => s.id === activeStage);
  const currentStage = currentStageIndex >= 0 ? journeyStages[currentStageIndex] : journeyStages[0];
  const totalFeatures = useMemo(
    () => journeyStages.reduce((sum, stage) => sum + stage.aiFeatures.length, 0),
    [journeyStages]
  );

  useEffect(() => {
    if (journeyStages.length === 0) return;
    const isValid = journeyStages.some((s) => s.id === activeStage);
    if (!isValid) {
      setActiveStage(journeyStages[0].id);
    }
  }, [activeStage, journeyStages]);

  const getStageLabel = (stageText: string, index: number) => {
    const split = stageText.split(". ");
    return split[1] || stageText || `Stage ${index + 1}`;
  };

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          When Do Customers See Each AI Feature?
          <Badge className="ml-auto bg-amber-500 text-white">
            CUSTOMER JOURNEY MAP
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click each stage to see which AI features activate and what customers experience
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Timeline */}
        <div className="flex flex-wrap gap-2">
          {journeyStages.map((stage, index) => (
            <Button
              key={stage.id}
              variant={activeStage === stage.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-xs",
                activeStage === stage.id && "bg-amber-500 hover:bg-amber-600"
              )}
              onClick={() => setActiveStage(stage.id)}
            >
              {index + 1}. {getStageLabel(stage.stage, index)}
            </Button>
          ))}
        </div>

        {journeyStages.length > 1 && currentStage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Journey progress</span>
              <span>
                Stage {currentStageIndex + 1} of {journeyStages.length}
              </span>
            </div>
            <Progress value={((currentStageIndex + 1) / journeyStages.length) * 100} className="h-2" />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentStageIndex <= 0}
                onClick={() => setActiveStage(journeyStages[currentStageIndex - 1].id)}
                className="gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentStageIndex >= journeyStages.length - 1}
                onClick={() => setActiveStage(journeyStages[currentStageIndex + 1].id)}
                className="gap-1"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Current Stage Details */}
        {currentStage && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border">
              <h3 className="font-bold text-lg mb-1">{currentStage.stage}</h3>
              <p className="text-sm text-muted-foreground">{currentStage.description}</p>
            </div>

            <div className="space-y-4">
              {currentStage.aiFeatures.map((feature) => (
                <div 
                  key={feature.name}
                  className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("p-2 rounded-lg bg-background", feature.color)}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-bold">{feature.name}</h4>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        ACTIVATES AT THIS STAGE
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-xs font-medium text-blue-500 mb-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        WHAT THE AI DOES
                      </p>
                      <p className="text-sm">{feature.whatHappens}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-xs font-medium text-green-500 mb-1 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        WHAT THE CUSTOMER SEES
                      </p>
                      <p className="text-sm">{feature.userSees}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Summary: {totalFeatures} AI Features Across {journeyStages.length} Journey Stages
          </h4>
          <p className="text-sm text-muted-foreground">
            Unlike competitors who only offer basic lead scoring, BamLead AI features work 
            automatically throughout the entire customer journey — from discovering hidden leads, 
            to reading emotions, to closing deals with invisible negotiation. Most features work 
            in the background; customers just experience better results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIJourneyExplainer;
