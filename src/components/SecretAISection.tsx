import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Eye, 
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  Radar,
  Handshake,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import PreIntentDetection from "./PreIntentDetection";
import EmotionalStateDetector from "./EmotionalStateDetector";
import OutcomeSimulator from "./OutcomeSimulator";
import PsychologicalProfiler from "./PsychologicalProfiler";
import FounderMirror from "./FounderMirror";
import ReverseLeadDiscovery from "./ReverseLeadDiscovery";
import InvisibleNegotiator from "./InvisibleNegotiator";
import LivePageMutation from "./LivePageMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AIAgent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  component: React.ReactNode;
  badge: string;
}

const SecretAISection = () => {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const agents: AIAgent[] = [
    {
      id: "reverse-discovery",
      name: "Reverse Lead Discovery",
      tagline: "Find companies who almost visited you",
      description: "AI analyzes browsing patterns across the web to find companies with similar intent who haven't discovered you yet. Like mind-reading for sales.",
      icon: <Radar className="h-8 w-8" />,
      color: "text-cyan-500",
      bgColor: "from-cyan-500/20 to-cyan-500/5",
      borderColor: "border-cyan-500/30",
      component: <ReverseLeadDiscovery />,
      badge: "🔮 MIND READING"
    },
    {
      id: "pre-intent",
      name: "Pre-Intent Detection",
      tagline: "Predicts intent before they know they're ready",
      description: "AI watches behavior patterns—mouse movement, scroll speed, pricing dwell time—and predicts conversion probability before a form is even submitted.",
      icon: <Brain className="h-8 w-8" />,
      color: "text-primary",
      bgColor: "from-primary/20 to-primary/5",
      borderColor: "border-primary/30",
      component: <PreIntentDetection />,
      badge: "🔥 NOBODY HAS THIS"
    },
    {
      id: "emotional",
      name: "Emotional State Detection",
      tagline: "Feels what your leads feel",
      description: "Detects frustration, confidence, curiosity, anxiety from typing patterns, deletions, and pauses. Then adapts messaging tone in real-time.",
      icon: <Heart className="h-8 w-8" />,
      color: "text-accent",
      bgColor: "from-accent/20 to-accent/5",
      borderColor: "border-accent/30",
      component: <EmotionalStateDetector />,
      badge: "❤️ FEEL THE LEAD"
    },
    {
      id: "outcome",
      name: "Outcome Simulator",
      tagline: "Time travel for sales",
      description: '"What happens if I contact today vs in 3 days?" AI simulates outcomes using historical patterns to tell you conversion probability and best timing.',
      icon: <TrendingUp className="h-8 w-8" />,
      color: "text-blue-500",
      bgColor: "from-blue-500/20 to-blue-500/5",
      borderColor: "border-blue-500/30",
      component: <OutcomeSimulator />,
      badge: "⏰ TIME TRAVEL"
    },
    {
      id: "psychological",
      name: "Psychological Profiler",
      tagline: "Not demographics. Psychology.",
      description: "Builds profiles of risk tolerance, decision speed, price sensitivity, trust threshold. Real persuasion science, not gimmicks.",
      icon: <Target className="h-8 w-8" />,
      color: "text-purple-500",
      bgColor: "from-purple-500/20 to-purple-500/5",
      borderColor: "border-purple-500/30",
      component: <PsychologicalProfiler />,
      badge: "🧠 PERSUASION AI"
    },
    {
      id: "founder-mirror",
      name: "AI Founder Mirror",
      tagline: "Brutal honesty about your funnel",
      description: "Audits your funnel, messaging, pricing, and UX. Brutally tells you: 'You're losing leads because your positioning is confusing.'",
      icon: <Eye className="h-8 w-8" />,
      color: "text-orange-500",
      bgColor: "from-orange-500/20 to-orange-500/5",
      borderColor: "border-orange-500/30",
      component: <FounderMirror />,
      badge: "💣 BRUTAL FEEDBACK"
    },
    {
      id: "invisible-negotiator",
      name: "Invisible Negotiator",
      tagline: "AI closes deals without human intervention",
      description: "Automatically adjusts pricing display, offers micro-concessions, and reframes ROI based on lead psychology. Closes deals while you sleep.",
      icon: <Handshake className="h-8 w-8" />,
      color: "text-emerald-500",
      bgColor: "from-emerald-500/20 to-emerald-500/5",
      borderColor: "border-emerald-500/30",
      component: <InvisibleNegotiator />,
      badge: "🤝 AUTO-CLOSE"
    },
    {
      id: "live-mutation",
      name: "Live Page Mutation",
      tagline: "Two people never see the same page",
      description: "AI rewrites headlines, CTAs, and value props in real-time based on visitor persona and funnel stage. Not A/B testing — full content shapeshifting.",
      icon: <Wand2 className="h-8 w-8" />,
      color: "text-pink-500",
      bgColor: "from-pink-500/20 to-pink-500/5",
      borderColor: "border-pink-500/30",
      component: <LivePageMutation />,
      badge: "✨ SHAPESHIFTER"
    }
  ];

  const selectedAgent = agents.find(a => a.id === activeAgent);

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-accent">
            <Sparkles className="h-3 w-3 mr-1" />
            AI FEATURES NO ONE ELSE HAS
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              "Wait... How Did It Know That?"
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            These AI agents do things that feel like magic. Predict intent before conversion. 
            Detect emotions from typing. Simulate future outcomes. Real competitive moats.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {agents.map((agent) => (
            <Card 
              key={agent.id}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                `bg-gradient-to-br ${agent.bgColor} ${agent.borderColor}`,
                activeAgent === agent.id && "ring-2 ring-primary"
              )}
              onClick={() => setActiveAgent(agent.id)}
            >
              <CardContent className="p-6">
                {/* Badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-4 right-4 text-[10px] font-bold"
                >
                  {agent.badge}
                </Badge>

                {/* Icon */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                  "bg-background/80 backdrop-blur-sm",
                  agent.color
                )}>
                  {agent.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-1">{agent.name}</h3>
                <p className={cn("text-sm font-medium mb-3", agent.color)}>
                  {agent.tagline}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {agent.description}
                </p>

                {/* CTA */}
                <Button 
                  variant="secondary" 
                  className="w-full group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAgent(agent.id);
                  }}
                >
                  Try It Live
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>

              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-xl" />
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            These features are <span className="font-bold text-primary">criminally underused</span> in the market. 
            Be the first to leverage them.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Zap className="h-5 w-5 mr-2" />
            Start Using AI Agents Free
          </Button>
        </div>
      </div>

      {/* Agent Modal */}
      <Dialog open={!!activeAgent} onOpenChange={() => setActiveAgent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent?.icon}
              {selectedAgent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAgent?.component}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SecretAISection;
