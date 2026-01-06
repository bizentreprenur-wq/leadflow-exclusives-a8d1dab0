import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Radar, 
  Building2, 
  MapPin, 
  Users, 
  TrendingUp,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  RefreshCw,
  Globe,
  Activity,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlmostVisitor {
  company: string;
  industry: string;
  location: string;
  employees: string;
  intentScore: number;
  matchReason: string;
  lastActivity: string;
  website: string;
  status: "hot" | "warm" | "emerging";
}

const ReverseLeadDiscovery = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [almostVisitors, setAlmostVisitors] = useState<AlmostVisitor[]>([]);
  const [selectedLead, setSelectedLead] = useState<AlmostVisitor | null>(null);
  const [clusterData, setClusterData] = useState({
    totalAnalyzed: 0,
    intentClusters: 0,
    matchingPatterns: 0
  });

  const sampleCompanies: AlmostVisitor[] = [
    {
      company: "TechFlow Solutions",
      industry: "SaaS",
      location: "San Francisco, CA",
      employees: "50-200",
      intentScore: 87,
      matchReason: "Visited 3 competitor sites, searched 'lead generation tools', pricing page patterns match",
      lastActivity: "2 hours ago",
      website: "techflow.io",
      status: "hot"
    },
    {
      company: "GrowthMetrics Inc",
      industry: "Marketing Agency",
      location: "Austin, TX",
      employees: "20-50",
      intentScore: 79,
      matchReason: "Similar browsing path to your converters, downloaded competitor case study",
      lastActivity: "5 hours ago",
      website: "growthmetrics.com",
      status: "hot"
    },
    {
      company: "CloudScale Pro",
      industry: "Cloud Services",
      location: "Seattle, WA",
      employees: "200-500",
      intentScore: 72,
      matchReason: "Industry cluster match, keyword searches align with your value prop",
      lastActivity: "1 day ago",
      website: "cloudscale.pro",
      status: "warm"
    },
    {
      company: "DataDriven Labs",
      industry: "Analytics",
      location: "New York, NY",
      employees: "100-200",
      intentScore: 68,
      matchReason: "Follows similar LinkedIn content, engaged with industry thought leaders",
      lastActivity: "1 day ago",
      website: "datadrivenlabs.co",
      status: "warm"
    },
    {
      company: "Nexus Ventures",
      industry: "VC/Investment",
      location: "Boston, MA",
      employees: "10-20",
      intentScore: 61,
      matchReason: "Portfolio companies match your ICP, research patterns indicate evaluation phase",
      lastActivity: "3 days ago",
      website: "nexusvc.com",
      status: "emerging"
    }
  ];

  const startScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setScanProgress(0);
    setAlmostVisitors([]);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          completeScan();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const completeScan = () => {
    setIsScanning(false);
    setScanComplete(true);
    setAlmostVisitors(sampleCompanies);
    setClusterData({
      totalAnalyzed: 12847,
      intentClusters: 23,
      matchingPatterns: 156
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot": return "bg-red-500/10 text-red-500 border-red-500/30";
      case "warm": return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "emerging": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      default: return "bg-muted";
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-cyan-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Radar className="h-5 w-5 text-cyan-500" />
          </div>
          Reverse Lead Discovery
          <Badge variant="outline" className="ml-auto bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
            🔮 MIND READING
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Companies who <span className="font-semibold text-cyan-500">almost visited</span> you but didn't — yet
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !scanComplete && (
          <>
            {/* Intro */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-center">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-cyan-500/30 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
                  <Radar className="h-8 w-8 text-cyan-500" />
                </div>
              </div>
              <h3 className="font-bold mb-1">Discover Invisible Leads</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI analyzes browsing patterns across the web to find companies 
                with similar intent who haven't found you yet.
              </p>
              <Button onClick={startScan} className="bg-cyan-500 hover:bg-cyan-600">
                <Eye className="h-4 w-4 mr-2" />
                Scan for Hidden Leads
              </Button>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-muted/50">
                <Globe className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
                <p className="text-muted-foreground">Analyzes web patterns</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Activity className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
                <p className="text-muted-foreground">Finds intent clusters</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Target className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
                <p className="text-muted-foreground">Matches your ICP</p>
              </div>
            </div>
          </>
        )}

        {isScanning && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"
                  style={{ animationDuration: '1s' }}
                />
                <Radar className="h-8 w-8 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-medium text-cyan-500">
                Scanning intent signals across the web...
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Discovery Progress</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-3" />
            </div>
            <div className="text-xs text-muted-foreground text-center animate-pulse">
              {scanProgress < 25 && "Analyzing industry clusters..."}
              {scanProgress >= 25 && scanProgress < 50 && "Mapping browsing patterns..."}
              {scanProgress >= 50 && scanProgress < 75 && "Identifying intent signals..."}
              {scanProgress >= 75 && "Matching to your ICP..."}
            </div>
          </div>
        )}

        {scanComplete && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
                <p className="text-xl font-bold text-cyan-500">{clusterData.totalAnalyzed.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Companies Analyzed</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
                <p className="text-xl font-bold text-cyan-500">{clusterData.intentClusters}</p>
                <p className="text-[10px] text-muted-foreground">Intent Clusters</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
                <p className="text-xl font-bold text-cyan-500">{almostVisitors.length}</p>
                <p className="text-[10px] text-muted-foreground">Hidden Leads Found</p>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <EyeOff className="h-3 w-3 inline mr-1" />
                  Companies Who Almost Visited
                </p>
                <Button variant="ghost" size="sm" onClick={startScan}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Rescan
                </Button>
              </div>

              {almostVisitors.map((visitor, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                    selectedLead?.company === visitor.company 
                      ? "bg-cyan-500/10 border-cyan-500/30" 
                      : "bg-muted/30 border-muted hover:border-cyan-500/30"
                  )}
                  onClick={() => setSelectedLead(visitor)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{visitor.company}</p>
                        <p className="text-[10px] text-muted-foreground">{visitor.website}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn("text-[10px]", getStatusColor(visitor.status))}>
                        {visitor.status.toUpperCase()}
                      </Badge>
                      <p className="text-lg font-bold text-cyan-500">{visitor.intentScore}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {visitor.industry}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {visitor.location.split(',')[0]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {visitor.employees}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-background/50 text-[10px] text-muted-foreground">
                    <span className="font-medium text-cyan-500">Why they match: </span>
                    {visitor.matchReason}
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="text-muted-foreground">Last activity: {visitor.lastActivity}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]">
                      <Zap className="h-3 w-3 mr-1" />
                      Reach Out
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
              Export All Hidden Leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReverseLeadDiscovery;
