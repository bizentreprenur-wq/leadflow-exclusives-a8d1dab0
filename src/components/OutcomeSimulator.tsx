import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Mail, 
  Phone, 
  Linkedin, 
  TrendingUp, 
  Calendar,
  Zap,
  Target,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationResult {
  timing: string;
  channel: string;
  probability: number;
  reasoning: string;
  bestTime: string;
  riskLevel: string;
}

const OutcomeSimulator = () => {
  const [selectedTiming, setSelectedTiming] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const timingOptions = [
    { id: "now", label: "Contact Now", icon: Zap },
    { id: "1day", label: "Wait 1 Day", icon: Clock },
    { id: "3days", label: "Wait 3 Days", icon: Calendar },
    { id: "1week", label: "Wait 1 Week", icon: Calendar }
  ];

  const channelOptions = [
    { id: "email", label: "Email", icon: Mail },
    { id: "phone", label: "Phone", icon: Phone },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin }
  ];

  const runSimulation = () => {
    if (!selectedTiming || !selectedChannel) return;

    setIsSimulating(true);
    setShowComparison(false);

    // Simulate AI processing
    setTimeout(() => {
      const baseProb = Math.random() * 30 + 40;
      
      const simulatedResults: SimulationResult[] = [
        {
          timing: "Now",
          channel: "Email",
          probability: Math.round(baseProb + (selectedTiming === "now" && selectedChannel === "email" ? 15 : Math.random() * 10)),
          reasoning: "Immediate outreach catches interest while fresh. Email allows time to review.",
          bestTime: "Tuesday 10:00 AM",
          riskLevel: "Medium"
        },
        {
          timing: "1 Day",
          channel: "Email",
          probability: Math.round(baseProb + 8 + Math.random() * 10),
          reasoning: "Slight delay creates curiosity. Follow-up timing is optimal.",
          bestTime: "Wednesday 2:00 PM",
          riskLevel: "Low"
        },
        {
          timing: "3 Days",
          channel: "Phone",
          probability: Math.round(baseProb + 12 + Math.random() * 8),
          reasoning: "Phone call after research period shows serious intent.",
          bestTime: "Thursday 11:00 AM",
          riskLevel: "Low"
        },
        {
          timing: "1 Week",
          channel: "LinkedIn",
          probability: Math.round(baseProb - 5 + Math.random() * 15),
          reasoning: "Professional connection builds long-term relationship.",
          bestTime: "Monday 9:00 AM",
          riskLevel: "High"
        }
      ];

      // Sort by probability
      simulatedResults.sort((a, b) => b.probability - a.probability);
      
      setResults(simulatedResults);
      setIsSimulating(false);
      setShowComparison(true);
    }, 2000);
  };

  const resetSimulation = () => {
    setSelectedTiming(null);
    setSelectedChannel(null);
    setResults([]);
    setShowComparison(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-blue-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          Outcome Simulation Engine
          <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-500 border-blue-500/30">
            TIME TRAVEL AI
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          "What happens if I contact this lead today vs in 3 days?"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showComparison ? (
          <>
            {/* Timing Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">When to contact?</label>
              <div className="grid grid-cols-2 gap-2">
                {timingOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedTiming === option.id ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => setSelectedTiming(option.id)}
                  >
                    <option.icon className="h-4 w-4" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Channel Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Which channel?</label>
              <div className="grid grid-cols-3 gap-2">
                {channelOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedChannel === option.id ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => setSelectedChannel(option.id)}
                  >
                    <option.icon className="h-4 w-4" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Simulate Button */}
            <Button 
              className="w-full" 
              disabled={!selectedTiming || !selectedChannel || isSimulating}
              onClick={runSimulation}
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Simulating Outcomes...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Simulate Future Outcomes
                </>
              )}
            </Button>

            {/* Lead Context */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium mb-2">Simulation Context</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Industry: SaaS</div>
                <div>Lead Score: 78/100</div>
                <div>Last Activity: 2 days ago</div>
                <div>Previous Opens: 3</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results Comparison */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Simulation Results</p>
                <Button variant="ghost" size="sm" onClick={resetSimulation}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>

              {results.map((result, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    index === 0 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-muted/30 border-muted"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Badge className="bg-green-500 text-white text-[10px]">
                          BEST
                        </Badge>
                      )}
                      <span className="font-medium text-sm">
                        {result.timing} via {result.channel}
                      </span>
                    </div>
                    <span className={cn(
                      "font-bold",
                      result.probability > 60 ? "text-green-500" :
                      result.probability > 40 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {result.probability}%
                    </span>
                  </div>
                  
                  <Progress value={result.probability} className="h-2 mb-2" />
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {result.reasoning}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Best time: {result.bestTime}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px]",
                        result.riskLevel === "Low" && "text-green-500 border-green-500/30",
                        result.riskLevel === "Medium" && "text-yellow-500 border-yellow-500/30",
                        result.riskLevel === "High" && "text-red-500 border-red-500/30"
                      )}
                    >
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">AI Recommendation</p>
                  <p className="text-xs text-muted-foreground">
                    Based on 10,847 similar leads, waiting {results[0]?.timing.toLowerCase()} 
                    and reaching out via {results[0]?.channel.toLowerCase()} yields the highest 
                    conversion rate. Schedule for {results[0]?.bestTime}.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button className="w-full">
              Schedule Optimal Outreach
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OutcomeSimulator;
