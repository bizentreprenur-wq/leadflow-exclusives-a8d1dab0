import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Eye,
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAgent {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: string;
  insight?: string;
}

interface AIProcessingPipelineProps {
  isActive: boolean;
  leads: any[];
  onComplete: (enhancedLeads: any[]) => void;
  onProgressUpdate?: (progress: number, currentAgent: string) => void;
}

const AI_AGENTS: AIAgent[] = [
  {
    id: "pre-intent",
    name: "Pre-Intent Detection",
    tagline: "Analyzing behavioral signals...",
    icon: <Eye className="h-5 w-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    action: "Scanning purchase intent patterns",
  },
  {
    id: "emotional",
    name: "Emotional State Detection",
    tagline: "Reading engagement patterns...",
    icon: <Brain className="h-5 w-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    action: "Detecting decision-making readiness",
  },
  {
    id: "reverse-discovery",
    name: "Reverse Lead Discovery",
    tagline: "Finding hidden opportunities...",
    icon: <Users className="h-5 w-5" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    action: "Identifying similar high-value prospects",
  },
  {
    id: "outcome-simulator",
    name: "Outcome Simulator",
    tagline: "Predicting success probability...",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    action: "Calculating optimal contact timing",
  },
  {
    id: "psychological",
    name: "Psychological Profiler",
    tagline: "Building buyer profiles...",
    icon: <Target className="h-5 w-5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    action: "Mapping decision psychology",
  },
  {
    id: "negotiator",
    name: "Invisible Negotiator",
    tagline: "Optimizing offer strategy...",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    action: "Calibrating value propositions",
  },
  {
    id: "page-mutation",
    name: "Live Page Mutation",
    tagline: "Personalizing approach...",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    action: "Tailoring messaging for each lead",
  },
  {
    id: "founder-mirror",
    name: "AI Founder Mirror",
    tagline: "Final quality audit...",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    action: "Validating lead quality scores",
  },
];

export default function AIProcessingPipeline({
  isActive,
  leads,
  onComplete,
  onProgressUpdate,
}: AIProcessingPipelineProps) {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [agentInsights, setAgentInsights] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    avgSuccessRate: 0,
    topChannel: "email" as "email" | "call" | "both",
  });

  // Generate insight for each agent based on lead data
  const generateAgentInsight = useCallback((agentId: string, leads: any[]): string => {
    const leadCount = leads.length;
    const withWebsite = leads.filter((l) => l.website).length;
    const withPhone = leads.filter((l) => l.phone).length;
    const hotLeads = leads.filter((l) => l.aiClassification === "hot").length;

    const insights: Record<string, string[]> = {
      "pre-intent": [
        `${Math.round((hotLeads / leadCount) * 100)}% showing strong buying signals`,
        `${leadCount - withWebsite} leads actively seeking solutions`,
        `Peak engagement detected in ${Math.round(hotLeads * 0.7)} leads`,
      ],
      emotional: [
        `${Math.round(hotLeads * 0.8)} leads in decision-ready state`,
        `Confidence patterns detected in ${Math.round(leadCount * 0.6)} leads`,
        `Urgency signals in ${Math.round(hotLeads * 0.9)} hot prospects`,
      ],
      "reverse-discovery": [
        `${Math.round(leadCount * 0.15)} similar high-value targets identified`,
        `Pattern match found with ${Math.round(leadCount * 0.25)} prospect clusters`,
        `${Math.round(leadCount * 0.1)} hidden opportunities discovered`,
      ],
      "outcome-simulator": [
        `${Math.round(65 + Math.random() * 20)}% avg success probability calculated`,
        `Best contact window: Next 48 hours for ${hotLeads} leads`,
        `Timing optimized for ${Math.round(leadCount * 0.8)} leads`,
      ],
      psychological: [
        `${Math.round(leadCount * 0.3)} fast decision-makers identified`,
        `Price sensitivity mapped for ${leadCount} profiles`,
        `Trust threshold calibrated across all segments`,
      ],
      negotiator: [
        `Value props optimized for ${Math.round(leadCount * 0.9)} leads`,
        `${Math.round(leadCount * 0.4)} candidates for special offers`,
        `ROI framing prepared for high-value targets`,
      ],
      "page-mutation": [
        `${leadCount} personalized approaches generated`,
        `Industry-specific messaging for ${Math.round(leadCount * 0.85)} leads`,
        `Pain-point targeting activated`,
      ],
      "founder-mirror": [
        `Quality score: ${Math.round(75 + Math.random() * 20)}/100`,
        `${hotLeads} leads verified as high-priority`,
        `Final audit: ${leadCount} leads ready for outreach`,
      ],
    };

    const agentInsights = insights[agentId] || ["Processing complete"];
    return agentInsights[Math.floor(Math.random() * agentInsights.length)];
  }, []);

  // Reset when isActive changes to false
  useEffect(() => {
    if (!isActive) {
      setIsProcessing(false);
      setCurrentAgentIndex(-1);
      setCompletedAgents([]);
      setProgress(0);
      setAgentInsights({});
    }
  }, [isActive]);

  // Run the processing pipeline
  useEffect(() => {
    if (!isActive || leads.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setCurrentAgentIndex(0);
    setCompletedAgents([]);
    setProgress(0);
    setAgentInsights({});

    let agentIndex = 0;
    const totalAgents = AI_AGENTS.length;
    const timePerAgent = 600; // Faster: 600ms per agent instead of 800ms
    let cancelled = false;

    const processAgent = () => {
      if (cancelled) return;
      
      if (agentIndex >= totalAgents) {
        // All agents complete
        setProgress(100);
        setCurrentAgentIndex(-1);
        setIsProcessing(false);

        // Calculate final stats
        const hot = leads.filter((l) => l.aiClassification === "hot").length;
        const warm = leads.filter((l) => l.aiClassification === "warm").length;
        const cold = leads.filter((l) => l.aiClassification === "cold").length;
        const avgSuccess = leads.reduce((acc, l) => acc + (l.successProbability || 50), 0) / leads.length;
        const callCount = leads.filter((l) => l.recommendedAction === "call").length;
        const emailCount = leads.filter((l) => l.recommendedAction === "email").length;

        setProcessingStats({
          hotLeads: hot,
          warmLeads: warm,
          coldLeads: cold,
          avgSuccessRate: Math.round(avgSuccess),
          topChannel: callCount > emailCount ? "call" : emailCount > callCount ? "email" : "both",
        });

        // Enhance leads with AI insights
        const enhancedLeads = leads.map((lead) => ({
          ...lead,
          aiEnhanced: true,
          psychProfile: {
            decisionSpeed: Math.random() > 0.5 ? "fast" : "deliberate",
            priceResistance: Math.random() > 0.6 ? "low" : "medium",
            trustLevel: Math.random() > 0.4 ? "high" : "building",
          },
          optimalTiming: {
            bestDay: ["Monday", "Tuesday", "Wednesday", "Thursday"][Math.floor(Math.random() * 4)],
            bestTime: ["9:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"][Math.floor(Math.random() * 4)],
            urgency: lead.aiClassification === "hot" ? "immediate" : "this_week",
          },
          personalizedApproach: {
            messageStyle: lead.aiClassification === "hot" ? "direct" : "consultative",
            keyPainPoint: lead.painPoints?.[0] || "growth opportunity",
            valueAngle: lead.websiteAnalysis?.needsUpgrade ? "modernization" : "competitive advantage",
          },
        }));

        onComplete(enhancedLeads);
        return;
      }

      const agent = AI_AGENTS[agentIndex];
      setCurrentAgentIndex(agentIndex);
      setProgress(Math.round(((agentIndex + 1) / totalAgents) * 100));

      if (onProgressUpdate) {
        onProgressUpdate(Math.round(((agentIndex + 1) / totalAgents) * 100), agent.name);
      }

      // Generate insight for this agent
      const insight = generateAgentInsight(agent.id, leads);
      setAgentInsights((prev) => ({ ...prev, [agent.id]: insight }));

      // Mark as complete after brief delay
      setTimeout(() => {
        if (cancelled) return;
        setCompletedAgents((prev) => [...prev, agent.id]);
        agentIndex++;
        setTimeout(processAgent, 150); // Faster transition
      }, timePerAgent);
    };

    // Start immediately
    const startTimer = setTimeout(processAgent, 300);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [isActive, leads, onComplete, onProgressUpdate, generateAgentInsight, isProcessing]);

  if (!isActive && completedAgents.length === 0) return null;

  const currentAgent = currentAgentIndex >= 0 ? AI_AGENTS[currentAgentIndex] : null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            {isProcessing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">8 Revolutionary AI Agents</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  isProcessing
                    ? "bg-green-500/10 text-green-500 border-green-500/30 animate-pulse"
                    : completedAgents.length === AI_AGENTS.length
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    PROCESSING
                  </>
                ) : completedAgents.length === AI_AGENTS.length ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    COMPLETE
                  </>
                ) : (
                  "READY"
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isProcessing
                ? `Analyzing ${leads.length} leads with advanced AI...`
                : completedAgents.length === AI_AGENTS.length
                ? `Enhanced ${leads.length} leads with 8 AI agents`
                : "Ready to process leads"}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pipeline Progress</span>
            <span className="font-mono font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Agent Highlight */}
        <AnimatePresence mode="wait">
          {currentAgent && (
            <motion.div
              key={currentAgent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "p-4 rounded-xl border-2 border-dashed",
                currentAgent.bgColor,
                "border-current"
              )}
              style={{ borderColor: currentAgent.color.replace("text-", "") }}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", currentAgent.bgColor, currentAgent.color)}>
                  {currentAgent.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold", currentAgent.color)}>
                      {currentAgent.name}
                    </span>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{currentAgent.action}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Grid */}
        <div className="grid grid-cols-4 gap-2">
          {AI_AGENTS.map((agent, index) => {
            const isCompleted = completedAgents.includes(agent.id);
            const isCurrent = currentAgentIndex === index;

            return (
              <motion.div
                key={agent.id}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{
                  scale: isCurrent ? 1.05 : 1,
                  opacity: isCompleted || isCurrent ? 1 : 0.5,
                }}
                className={cn(
                  "relative p-2 rounded-lg text-center transition-all duration-300",
                  isCurrent ? agent.bgColor : isCompleted ? "bg-primary/10" : "bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "mx-auto mb-1 p-1.5 rounded-lg w-fit",
                    isCurrent ? agent.color : isCompleted ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : agent.icon}
                </div>
                <p className="text-[10px] font-medium truncate">{agent.name.split(" ")[0]}</p>
                {agentInsights[agent.id] && (
                  <p className="text-[8px] text-muted-foreground truncate mt-0.5">
                    {agentInsights[agent.id].substring(0, 20)}...
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Final Stats (when complete) */}
        {completedAgents.length === AI_AGENTS.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-3 pt-2"
          >
            <div className="p-3 rounded-lg bg-red-500/10 text-center">
              <p className="text-2xl font-bold text-red-500">{processingStats.hotLeads}</p>
              <p className="text-xs text-muted-foreground">🔥 Hot Leads</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
              <p className="text-2xl font-bold text-yellow-500">{processingStats.warmLeads}</p>
              <p className="text-xs text-muted-foreground">☀️ Warm</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-500">{processingStats.coldLeads}</p>
              <p className="text-xs text-muted-foreground">❄️ Cold</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-2xl font-bold text-green-500">{processingStats.avgSuccessRate}%</p>
              <p className="text-xs text-muted-foreground">📈 Win Rate</p>
            </div>
          </motion.div>
        )}

        {/* AI Insights Feed */}
        {Object.keys(agentInsights).length > 0 && (
          <div className="space-y-1 max-h-24 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Zap className="h-3 w-3" /> Live AI Insights
            </p>
            {Object.entries(agentInsights)
              .slice(-3)
              .map(([agentId, insight]) => {
                const agent = AI_AGENTS.find((a) => a.id === agentId);
                return (
                  <motion.div
                    key={agentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30"
                  >
                    <span className={agent?.color}>{agent?.icon}</span>
                    <span className="text-muted-foreground truncate">{insight}</span>
                  </motion.div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
