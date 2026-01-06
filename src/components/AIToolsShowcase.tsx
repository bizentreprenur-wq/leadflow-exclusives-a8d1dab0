import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  MessageSquare,
  Mail,
  Wand2,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Users,
  Globe,
  Clock,
  Bot,
  Star,
} from "lucide-react";

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  features: string[];
  demo?: () => React.ReactNode;
}

export default function AIToolsShowcase() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [demoInput, setDemoInput] = useState("");
  const [demoResult, setDemoResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tools: AITool[] = [
    {
      id: "lead-scorer",
      name: "AI Lead Scoring",
      description: "Instantly score leads based on 50+ data points",
      icon: Target,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      features: ["Business size detection", "Website quality analysis", "Social presence score", "Industry fit matching"],
    },
    {
      id: "email-optimizer",
      name: "Email Subject Optimizer",
      description: "AI-powered subject lines that get opened",
      icon: Mail,
      color: "text-primary",
      bgColor: "bg-primary/10",
      features: ["A/B variant generation", "Open rate prediction", "Spam score check", "Personalization tokens"],
    },
    {
      id: "competitor-analyzer",
      name: "Competitor Intelligence",
      description: "Analyze competitor websites and strategies",
      icon: Globe,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      features: ["Tech stack detection", "Traffic estimation", "SEO analysis", "Content strategy insights"],
    },
    {
      id: "timing-predictor",
      name: "Best Time Predictor",
      description: "AI finds the perfect time to reach out",
      icon: Clock,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      features: ["Timezone optimization", "Industry patterns", "Day-of-week analysis", "Response rate history"],
    },
    {
      id: "response-generator",
      name: "AI Response Writer",
      description: "Generate personalized follow-up responses",
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      features: ["Context-aware replies", "Tone matching", "Objection handling", "Meeting scheduler"],
    },
    {
      id: "enrichment-engine",
      name: "Data Enrichment",
      description: "Automatically fill in missing lead details",
      icon: Brain,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      features: ["Email finder", "Phone lookup", "Social profiles", "Company info"],
    },
  ];

  const runDemo = async (toolId: string) => {
    setIsProcessing(true);
    setDemoResult(null);

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1500));

    switch (toolId) {
      case "lead-scorer":
        setDemoResult({
          score: 87,
          breakdown: [
            { label: "Website Quality", value: 92 },
            { label: "Online Presence", value: 78 },
            { label: "Industry Match", value: 95 },
            { label: "Company Size", value: 83 },
          ],
          recommendation: "High priority - Contact within 24h",
        });
        break;
      case "email-optimizer":
        setDemoResult({
          variants: [
            { text: "Quick question about your website, {{name}}", score: 89 },
            { text: "Noticed something interesting about {{company}}", score: 84 },
            { text: "{{name}}, a 2-minute idea for you", score: 82 },
          ],
          spamScore: 2,
          bestTime: "Tuesday 10:30 AM",
        });
        break;
      case "timing-predictor":
        setDemoResult({
          bestDays: ["Tuesday", "Wednesday", "Thursday"],
          bestTime: "10:00 AM - 11:30 AM",
          timezone: "EST",
          responseRate: "+34% vs average",
        });
        break;
      default:
        setDemoResult({ message: "Demo completed successfully!" });
    }

    setIsProcessing(false);
    toast.success("AI analysis complete!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge className="gap-1">
          <Sparkles className="w-3 h-3" />
          AI-Powered Tools
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">Supercharge Your Outreach</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Our AI tools work 24/7 to help you find, analyze, and convert more leads
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card 
            key={tool.id}
            className={`cursor-pointer transition-all hover:shadow-lg border-border ${
              activeTool === tool.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${tool.bgColor}`}>
                  <tool.icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <Badge variant="outline" className="text-xs">
                  <Bot className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              </div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                {tool.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              {activeTool === tool.id && (
                <div className="pt-3 border-t border-border space-y-3">
                  <Button 
                    className="w-full gap-2" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      runDemo(tool.id);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Try Demo
                      </>
                    )}
                  </Button>

                  {demoResult && activeTool === tool.id && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20 space-y-2">
                      {tool.id === "lead-scorer" && demoResult.score && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">Lead Score</span>
                            <span className="text-2xl font-bold text-success">{demoResult.score}</span>
                          </div>
                          <Progress value={demoResult.score} className="h-2" />
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {demoResult.breakdown.map((item: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="text-muted-foreground">{item.label}</span>
                                <div className="flex items-center gap-1">
                                  <Progress value={item.value} className="h-1 flex-1" />
                                  <span className="font-medium">{item.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-success font-medium mt-2">
                            {demoResult.recommendation}
                          </p>
                        </>
                      )}

                      {tool.id === "email-optimizer" && demoResult.variants && (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">Top Subject Lines:</p>
                          {demoResult.variants.map((v: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded bg-card text-sm">
                              <span className="text-foreground">{v.text}</span>
                              <Badge variant="secondary">{v.score}%</Badge>
                            </div>
                          ))}
                        </>
                      )}

                      {tool.id === "timing-predictor" && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Best Days</span>
                            <span className="font-medium text-foreground">
                              {demoResult.bestDays.join(", ")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Best Time</span>
                            <span className="font-medium text-foreground">{demoResult.bestTime}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Expected Lift</span>
                            <span className="font-medium text-success">{demoResult.responseRate}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground mb-3">
          All AI tools included with Pro and Agency plans
        </p>
        <Button className="gap-2">
          Upgrade for Full Access
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
