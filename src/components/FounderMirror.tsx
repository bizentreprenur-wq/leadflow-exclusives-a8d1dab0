import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Layout,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditItem {
  category: string;
  icon: React.ReactNode;
  score: number;
  issues: string[];
  wins: string[];
  priority: "high" | "medium" | "low";
}

const FounderMirror = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  
  const [auditResults, setAuditResults] = useState<AuditItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [topIssue, setTopIssue] = useState("");
  const [quickWin, setQuickWin] = useState("");

  const startAudit = () => {
    setIsAuditing(true);
    setAuditComplete(false);
    setAuditProgress(0);

    // Simulate progressive audit
    const progressInterval = setInterval(() => {
      setAuditProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          completeAudit();
          return 100;
        }
        return prev + 4;
      });
    }, 100);
  };

  const completeAudit = () => {
    const results: AuditItem[] = [
      {
        category: "Funnel Flow",
        icon: <TrendingUp className="h-4 w-4" />,
        score: Math.round(Math.random() * 30 + 50),
        issues: [
          "3-click gap between landing and signup",
          "No exit-intent capture on pricing page",
          "Mobile funnel drops 40% at step 2"
        ],
        wins: [
          "Clear primary CTA above fold",
          "Social proof visible on landing"
        ],
        priority: "high"
      },
      {
        category: "Messaging Clarity",
        icon: <MessageSquare className="h-4 w-4" />,
        score: Math.round(Math.random() * 30 + 45),
        issues: [
          "Value prop requires 8+ seconds to understand",
          "Too many features listed, unclear benefit",
          "Jargon detected: 'synergy', 'leverage', 'holistic'"
        ],
        wins: [
          "Strong headline emotional hook",
          "Customer testimonials are specific"
        ],
        priority: "high"
      },
      {
        category: "Pricing Psychology",
        icon: <DollarSign className="h-4 w-4" />,
        score: Math.round(Math.random() * 30 + 55),
        issues: [
          "No anchor pricing (show premium first)",
          "Missing 'most popular' indicator",
          "Annual discount not prominent enough"
        ],
        wins: [
          "Clear feature comparison table",
          "Free trial removes friction"
        ],
        priority: "medium"
      },
      {
        category: "UX & Layout",
        icon: <Layout className="h-4 w-4" />,
        score: Math.round(Math.random() * 30 + 60),
        issues: [
          "CTA button below fold on mobile",
          "Form asks for phone (friction point)",
          "Loading time: 3.2s (target: <2s)"
        ],
        wins: [
          "Clean, modern design aesthetic",
          "Consistent brand colors"
        ],
        priority: "medium"
      }
    ];

    const avgScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length);
    setOverallScore(avgScore);
    setAuditResults(results);

    // Find top issue
    const highPriorityIssues = results.filter(r => r.priority === "high");
    setTopIssue(highPriorityIssues[0]?.issues[0] || "Review messaging clarity");

    // Find quick win
    const allWins = results.flatMap(r => r.wins);
    setQuickWin("Add exit-intent popup with 10% discount - takes 5 minutes, could increase conversions by 15%");

    setIsAuditing(false);
    setAuditComplete(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Eye className="h-5 w-5 text-orange-500" />
          </div>
          AI Founder Mirror
          <Badge variant="outline" className="ml-auto bg-orange-500/10 text-orange-500 border-orange-500/30">
            BRUTAL HONESTY
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI that audits your funnel and tells you exactly what's wrong
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuditing && !auditComplete && (
          <>
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 text-center">
              <Eye className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold mb-1">Ready for Brutal Feedback?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI will analyze your funnel, messaging, pricing, and UX.
                Warning: This might hurt.
              </p>
              <Button onClick={startAudit} className="bg-orange-500 hover:bg-orange-600">
                <Zap className="h-4 w-4 mr-2" />
                Start Honest Audit
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-primary" />
                Funnel Analysis
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-primary" />
                Messaging Clarity
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-primary" />
                Pricing Psychology
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <Layout className="h-3 w-3 text-primary" />
                UX & Layout
              </div>
            </div>
          </>
        )}

        {isAuditing && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Eye className="h-12 w-12 text-orange-500 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-medium">Analyzing your entire funnel...</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Audit Progress</span>
                <span>{auditProgress}%</span>
              </div>
              <Progress value={auditProgress} className="h-3" />
            </div>
            <div className="text-xs text-muted-foreground text-center animate-pulse">
              {auditProgress < 25 && "Scanning page structure..."}
              {auditProgress >= 25 && auditProgress < 50 && "Analyzing messaging..."}
              {auditProgress >= 50 && auditProgress < 75 && "Evaluating pricing psychology..."}
              {auditProgress >= 75 && "Generating recommendations..."}
            </div>
          </div>
        )}

        {auditComplete && (
          <>
            {/* Overall Score */}
            <div className={cn(
              "p-4 rounded-xl border",
              overallScore >= 70 ? "bg-green-500/10 border-green-500/30" :
              overallScore >= 50 ? "bg-yellow-500/10 border-yellow-500/30" :
              "bg-red-500/10 border-red-500/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Funnel Score</span>
                <span className={cn(
                  "text-3xl font-bold",
                  overallScore >= 70 ? "text-green-500" :
                  overallScore >= 50 ? "text-yellow-500" : "text-red-500"
                )}>
                  {overallScore}/100
                </span>
              </div>
              <Progress value={overallScore} className="h-3" />
            </div>

            {/* Top Issue */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">Biggest Issue</p>
                  <p className="text-xs text-muted-foreground">{topIssue}</p>
                </div>
              </div>
            </div>

            {/* Quick Win */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-500">Quick Win</p>
                  <p className="text-xs text-muted-foreground">{quickWin}</p>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Category Breakdown
              </p>
              {auditResults.map((result, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{result.icon}</span>
                      <span className="text-sm font-medium">{result.category}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px]",
                          result.priority === "high" && "text-red-500 border-red-500/30",
                          result.priority === "medium" && "text-yellow-500 border-yellow-500/30",
                          result.priority === "low" && "text-green-500 border-green-500/30"
                        )}
                      >
                        {result.priority}
                      </Badge>
                    </div>
                    <span className={cn(
                      "font-bold",
                      result.score >= 70 ? "text-green-500" :
                      result.score >= 50 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {result.score}%
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {result.issues.slice(0, 2).map((issue, j) => (
                      <div key={j} className="flex items-start gap-1 text-xs">
                        <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{issue}</span>
                      </div>
                    ))}
                    {result.wins.slice(0, 1).map((win, j) => (
                      <div key={j} className="flex items-start gap-1 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={startAudit}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-audit
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                Get Fix Guide
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FounderMirror;
