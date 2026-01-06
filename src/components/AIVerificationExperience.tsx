import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldCheck,
  ShieldX,
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Building2,
  Sparkles,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  Zap,
  Eye,
  Send,
  Coins,
  TrendingUp,
  Clock,
  Database,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Lead {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
}

interface VerifiedLead extends Lead {
  verificationStatus: "pending" | "processing" | "verified" | "failed";
  emailValid?: boolean;
  phoneValid?: boolean;
  businessActive?: boolean;
  leadScore?: number;
  issues?: string[];
}

interface AIVerificationExperienceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onComplete: (verifiedLeads: VerifiedLead[]) => void;
  userCredits?: number;
  userPlan?: "free" | "basic" | "pro" | "agency";
}

type Phase = "credits" | "intro" | "processing" | "results";

const planCredits = {
  free: 25,
  basic: 200,
  pro: 500,
  agency: 2000,
};

export default function AIVerificationExperience({
  open,
  onOpenChange,
  leads,
  onComplete,
  userCredits = 150,
  userPlan = "basic",
}: AIVerificationExperienceProps) {
  const [phase, setPhase] = useState<Phase>("credits");
  const [verifiedLeads, setVerifiedLeads] = useState<VerifiedLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aiThought, setAiThought] = useState("");

  const creditsNeeded = leads.length;
  const hasEnoughCredits = userCredits >= creditsNeeded;
  const creditsAfter = userCredits - creditsNeeded;

  const aiThoughts = [
    "Analyzing contact information...",
    "Validating email deliverability...",
    "Checking phone number format...",
    "Verifying business registration...",
    "Scanning online presence...",
    "Cross-referencing data sources...",
    "Calculating lead quality score...",
    "Detecting potential duplicates...",
    "Assessing engagement likelihood...",
    "Finalizing verification...",
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPhase("credits");
      setVerifiedLeads([]);
      setCurrentIndex(0);
    }
  }, [open]);

  // Simulate AI verification process
  useEffect(() => {
    if (phase !== "processing" || currentIndex >= leads.length) return;

    const processLead = async () => {
      // Update AI thought
      setAiThought(aiThoughts[currentIndex % aiThoughts.length]);

      // Simulate processing time (0.5-1 second per lead)
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

      // Simulate verification result
      const lead = leads[currentIndex];
      const emailValid = Math.random() > 0.15;
      const phoneValid = Math.random() > 0.1;
      const businessActive = Math.random() > 0.05;
      const hasIssues = Math.random() > 0.7;

      const verifiedLead: VerifiedLead = {
        ...lead,
        verificationStatus: emailValid && phoneValid && businessActive ? "verified" : "failed",
        emailValid,
        phoneValid,
        businessActive,
        leadScore: Math.floor(50 + Math.random() * 50),
        issues: hasIssues
          ? [
              ...(emailValid ? [] : ["Email may not be deliverable"]),
              ...(phoneValid ? [] : ["Phone format issues detected"]),
              ...(businessActive ? [] : ["Business status unclear"]),
            ]
          : [],
      };

      setVerifiedLeads((prev) => [...prev, verifiedLead]);
      setCurrentIndex((prev) => prev + 1);
    };

    processLead();
  }, [phase, currentIndex, leads]);

  // Move to results when all leads are processed
  useEffect(() => {
    if (phase === "processing" && currentIndex >= leads.length && leads.length > 0) {
      setTimeout(() => setPhase("results"), 500);
    }
  }, [currentIndex, leads.length, phase]);

  const handleStartVerification = () => {
    setVerifiedLeads([]);
    setCurrentIndex(0);
    setPhase("processing");
  };

  const handleComplete = () => {
    onComplete(verifiedLeads);
    onOpenChange(false);
  };

  // Stats for results
  const verifiedCount = verifiedLeads.filter((l) => l.verificationStatus === "verified").length;
  const failedCount = verifiedLeads.filter((l) => l.verificationStatus === "failed").length;
  const avgScore = verifiedLeads.length > 0
    ? Math.round(verifiedLeads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / verifiedLeads.length)
    : 0;

  const pieData = [
    { name: "Verified", value: verifiedCount, color: "hsl(var(--success))" },
    { name: "Needs Review", value: failedCount, color: "hsl(var(--destructive))" },
  ];

  const scoreDistribution = [
    { range: "90-100", count: verifiedLeads.filter((l) => (l.leadScore || 0) >= 90).length },
    { range: "80-89", count: verifiedLeads.filter((l) => (l.leadScore || 0) >= 80 && (l.leadScore || 0) < 90).length },
    { range: "70-79", count: verifiedLeads.filter((l) => (l.leadScore || 0) >= 70 && (l.leadScore || 0) < 80).length },
    { range: "60-69", count: verifiedLeads.filter((l) => (l.leadScore || 0) >= 60 && (l.leadScore || 0) < 70).length },
    { range: "50-59", count: verifiedLeads.filter((l) => (l.leadScore || 0) < 60).length },
  ];

  const progress = leads.length > 0 ? (currentIndex / leads.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* CREDITS PHASE */}
        {phase === "credits" && (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="p-5 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30">
                    <Coins className="w-12 h-12 text-warning" />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-primary border-2 border-background">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">AI Verification Credits</DialogTitle>
              <p className="text-muted-foreground mt-2">
                Review your credits before starting verification
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Credit Overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Database className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">{leads.length}</p>
                  <p className="text-xs text-muted-foreground">Leads to Verify</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <Coins className="w-5 h-5 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold text-warning">{userCredits}</p>
                  <p className="text-xs text-muted-foreground">Credits Available</p>
                </div>
                <div className={`text-center p-4 rounded-xl ${hasEnoughCredits ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'} border`}>
                  <TrendingUp className={`w-5 h-5 mx-auto mb-2 ${hasEnoughCredits ? 'text-success' : 'text-destructive'}`} />
                  <p className={`text-2xl font-bold ${hasEnoughCredits ? 'text-success' : 'text-destructive'}`}>
                    {hasEnoughCredits ? creditsAfter : `-${creditsNeeded - userCredits}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasEnoughCredits ? 'After Verification' : 'Credits Needed'}
                  </p>
                </div>
              </div>

              {/* Credit Usage Info */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Credit Usage</span>
                  <Badge variant="outline" className="capitalize">{userPlan} Plan</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credits this month</span>
                    <span className="font-medium">{userCredits} / {planCredits[userPlan]}</span>
                  </div>
                  <Progress 
                    value={(userCredits / planCredits[userPlan]) * 100} 
                    className="h-2"
                  />
                </div>
              </div>

              {/* Verification Cost */}
              <div className={`p-4 rounded-xl flex items-center gap-4 ${hasEnoughCredits ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'} border`}>
                <div className={`p-3 rounded-xl ${hasEnoughCredits ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {hasEnoughCredits ? (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${hasEnoughCredits ? 'text-success' : 'text-destructive'}`}>
                    {hasEnoughCredits 
                      ? `Ready to verify ${leads.length} leads`
                      : `Not enough credits for ${leads.length} leads`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasEnoughCredits 
                      ? `This will use ${creditsNeeded} credits (1 per lead)`
                      : `You need ${creditsNeeded - userCredits} more credits. Upgrade your plan for more.`
                    }
                  </p>
                </div>
              </div>

              {/* What AI Verification Checks */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">What AI Verification Checks:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Email Deliverability</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Phone Validation</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Business Status</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Lead Scoring</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setPhase("intro")} 
                className="flex-1 gap-2"
                disabled={!hasEnoughCredits}
              >
                <Zap className="w-4 h-4" />
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* INTRO PHASE */}
        {phase === "intro" && (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="p-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <Bot className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-success border-2 border-background">
                    <Sparkles className="w-4 h-4 text-success-foreground" />
                  </div>
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">AI Lead Verification</DialogTitle>
              <p className="text-muted-foreground mt-2">
                Our AI will analyze {leads.length} leads to verify contact info, business status, and calculate quality scores.
              </p>
            </DialogHeader>

            {/* Credit Reminder */}
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3 mb-4">
              <Coins className="w-5 h-5 text-warning shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-foreground font-medium">
                  Using {creditsNeeded} credits
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({creditsAfter} remaining)
                </span>
              </div>
            </div>

            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Email Validation</p>
                  <p className="text-xs text-muted-foreground">Verify deliverability and detect invalid addresses</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Phone Verification</p>
                  <p className="text-xs text-muted-foreground">Check format and carrier information</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Business Status</p>
                  <p className="text-xs text-muted-foreground">Confirm the business is active and operating</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
                <BarChart3 className="w-5 h-5 text-success shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Lead Scoring</p>
                  <p className="text-xs text-muted-foreground">AI-powered quality score for each lead</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setPhase("credits")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStartVerification} className="flex-1 gap-2">
                <Zap className="w-4 h-4" />
                Start Verification
              </Button>
            </div>
          </>
        )}

        {/* PROCESSING PHASE */}
        {phase === "processing" && (
          <>
            <DialogHeader className="text-center pb-2">
              <DialogTitle className="text-xl flex items-center justify-center gap-2">
                <Bot className="w-6 h-6 text-primary animate-pulse" />
                AI Verification in Progress
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verifying leads...</span>
                  <span className="font-medium text-foreground">
                    {currentIndex} / {leads.length}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Credits Being Used */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Coins className="w-4 h-4 text-warning" />
                <span>Using {currentIndex} of {creditsNeeded} credits</span>
              </div>

              {/* AI Thinking Animation */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-pulse">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">AI is analyzing...</p>
                  <p className="text-xs text-primary">{aiThought}</p>
                </div>
              </div>

              {/* Current Lead Being Processed */}
              {currentIndex < leads.length && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Currently Processing
                    </span>
                  </div>
                  <p className="font-semibold text-foreground">{leads[currentIndex]?.name}</p>
                  {leads[currentIndex]?.address && (
                    <p className="text-sm text-muted-foreground mt-1">{leads[currentIndex].address}</p>
                  )}
                </div>
              )}

              {/* Live Results Feed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Live Results</span>
                </div>
                <ScrollArea className="h-[180px] border border-border rounded-xl p-3 bg-card">
                  <div className="space-y-2">
                    {verifiedLeads
                      .slice()
                      .reverse()
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg text-sm animate-in slide-in-from-top-2 duration-300 ${
                            lead.verificationStatus === "verified"
                              ? "bg-success/10 border border-success/20"
                              : "bg-destructive/10 border border-destructive/20"
                          }`}
                        >
                          {lead.verificationStatus === "verified" ? (
                            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <ShieldX className="w-4 h-4 text-destructive shrink-0" />
                          )}
                          <span className="flex-1 truncate font-medium">{lead.name}</span>
                          <Badge
                            variant="outline"
                            className={
                              lead.verificationStatus === "verified"
                                ? "text-success border-success/30"
                                : "text-destructive border-destructive/30"
                            }
                          >
                            {lead.leadScore}%
                          </Badge>
                        </div>
                      ))}
                    {verifiedLeads.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Waiting for results...
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}

        {/* RESULTS PHASE */}
        {phase === "results" && (
          <>
            <DialogHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="p-4 rounded-full bg-success/10 border border-success/20">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">Verification Complete!</DialogTitle>
              <p className="text-muted-foreground mt-1">
                We analyzed {leads.length} leads. Here's what we found:
              </p>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6" style={{ maxHeight: "400px" }}>
              <div className="space-y-6 py-4">
                {/* Credits Used Banner */}
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-foreground">
                      {creditsNeeded} credits used
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {creditsAfter} remaining
                  </span>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                    <ShieldCheck className="w-6 h-6 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold text-success">{verifiedCount}</p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-destructive">{failedCount}</p>
                    <p className="text-xs text-muted-foreground">Needs Review</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary">{avgScore}%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm font-medium text-foreground mb-3 text-center">
                      Verification Status
                    </p>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            dataKey="value"
                            strokeWidth={2}
                            stroke="hsl(var(--background))"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full bg-success" />
                        <span className="text-muted-foreground">Verified</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <span className="text-muted-foreground">Review</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart - Score Distribution */}
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm font-medium text-foreground mb-3 text-center">
                      Lead Quality Scores
                    </p>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistribution} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="range" width={50} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top Leads Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Top Verified Leads
                  </p>
                  <div className="space-y-2">
                    {verifiedLeads
                      .filter((l) => l.verificationStatus === "verified")
                      .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
                      .slice(0, 5)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                        >
                          <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{lead.name}</p>
                            <div className="flex gap-2 mt-0.5">
                              {lead.emailValid && (
                                <span className="text-xs text-success flex items-center gap-0.5">
                                  <Mail className="w-3 h-3" /> Email ✓
                                </span>
                              )}
                              {lead.phoneValid && (
                                <span className="text-xs text-success flex items-center gap-0.5">
                                  <Phone className="w-3 h-3" /> Phone ✓
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-success/20 text-success border-0">
                            {lead.leadScore}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Issues Found */}
                {failedCount > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Leads Needing Review ({failedCount})
                    </p>
                    <div className="space-y-2">
                      {verifiedLeads
                        .filter((l) => l.verificationStatus === "failed")
                        .slice(0, 3)
                        .map((lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                          >
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{lead.name}</p>
                              {lead.issues && lead.issues.length > 0 && (
                                <p className="text-xs text-destructive mt-0.5">
                                  {lead.issues[0]}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-destructive border-destructive/30">
                              {lead.leadScore}%
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={handleComplete} className="flex-1 gap-2">
                <Send className="w-4 h-4" />
                Send to {verifiedCount} Leads
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
