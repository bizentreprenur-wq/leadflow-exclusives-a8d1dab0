import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Building2, Target, Microscope, Swords, Trophy, 
  Globe, MapPin, ArrowRight, Sparkles, BarChart3, TrendingUp, 
  Users, Eye, Zap, ChevronRight, Info, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ResearchMode = 'niche' | 'competitive';

interface SuperAIResearchModeSelectorProps {
  service: string;
  location: string;
  onServiceChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onModeSelect: (mode: ResearchMode, myBusinessUrl?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function SuperAIResearchModeSelector({
  service,
  location,
  onServiceChange,
  onLocationChange,
  onModeSelect,
  isLoading = false,
  disabled = false
}: SuperAIResearchModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ResearchMode>('niche');
  const [myBusinessUrl, setMyBusinessUrl] = useState('');
  const [myBusinessName, setMyBusinessName] = useState('');

  const canSearch = service.trim() && location.trim();
  const canCompetitiveSearch = canSearch && (myBusinessUrl.trim() || myBusinessName.trim());

  const handleSearch = () => {
    if (selectedMode === 'competitive') {
      onModeSelect('competitive', myBusinessUrl.trim() || myBusinessName.trim());
    } else {
      onModeSelect('niche');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection Header */}
      <div className="text-center">
        <Badge className="mb-3 bg-gradient-to-r from-primary to-emerald-600 text-white border-0">
          <Sparkles className="w-3 h-3 mr-1" />
          Super AI Business Intelligence
        </Badge>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          What would you like to research?
        </h2>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Choose your research goal — our AI adapts the intelligence report to match your needs
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {/* Niche Research Mode */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 relative overflow-hidden group",
            selectedMode === 'niche' 
              ? "border-primary shadow-[0_0_20px_rgba(20,184,166,0.3)] bg-gradient-to-br from-primary/10 to-emerald-500/5" 
              : "border-border hover:border-primary/50 bg-card/50"
          )}
          onClick={() => setSelectedMode('niche')}
        >
          <CardContent className="p-5">
            {/* Selection indicator */}
            {selectedMode === 'niche' && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            )}
            
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-xl shrink-0 transition-all",
                selectedMode === 'niche' 
                  ? "bg-gradient-to-br from-primary to-emerald-600 text-white" 
                  : "bg-primary/10 text-primary group-hover:bg-primary/20"
              )}>
                <Microscope className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg text-foreground mb-1">
                  Niche Research
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Discover businesses in a niche to understand the market, find prospects, or identify opportunities
                </p>
                
                {/* Use cases */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Perfect for:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-primary" />
                      Finding prospects who need your product/service
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-primary" />
                      Market research before entering a niche
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-primary" />
                      Understanding industry gaps & opportunities
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitive Analysis Mode */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 relative overflow-hidden group",
            selectedMode === 'competitive' 
              ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-500/10 to-orange-500/5" 
              : "border-border hover:border-amber-500/50 bg-card/50"
          )}
          onClick={() => setSelectedMode('competitive')}
        >
          <CardContent className="p-5">
            {/* Premium badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              {selectedMode === 'competitive' && (
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
              )}
            </div>
            
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-xl shrink-0 transition-all",
                selectedMode === 'competitive' 
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" 
                  : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
              )}>
                <Swords className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Competitive Analysis
                  </h3>
                  <Badge className="text-[9px] py-0 px-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    PRO
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Compare YOUR business against competitors to find your advantages and improvement areas
                </p>
                
                {/* Use cases */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Perfect for:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      See what competitors are doing better
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      Identify YOUR competitive advantages
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      Get AI recommendations to outrank rivals
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Form */}
      <Card className="max-w-4xl mx-auto border-border bg-card/80 backdrop-blur">
        <CardContent className="p-5">
          {/* Niche/Industry Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {selectedMode === 'competitive' ? 'Your Industry / Niche' : 'Niche / Business Type'}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={service}
                  onChange={(e) => onServiceChange(e.target.value)}
                  placeholder="e.g. plumber, dentist, marketing agency"
                  className="pl-10 bg-secondary/50"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Location / Market
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder="City, State or ZIP code"
                  className="pl-10 bg-secondary/50"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Competitive Mode: Your Business Info */}
          {selectedMode === 'competitive' && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-500">Your Business Details</span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Enter your business info so we can compare you against competitors in the report
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Your Business Name
                  </label>
                  <Input 
                    value={myBusinessName}
                    onChange={(e) => setMyBusinessName(e.target.value)}
                    placeholder="e.g. Acme Plumbing LLC"
                    className="bg-secondary/50 text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Your Website URL <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={myBusinessUrl}
                      onChange={(e) => setMyBusinessUrl(e.target.value)}
                      placeholder="https://yourbusiness.com"
                      className="pl-10 bg-secondary/50 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  We'll analyze your business alongside competitors and show: 
                  <span className="text-amber-500 font-medium"> your advantages</span>, 
                  <span className="text-rose-500 font-medium"> areas to improve</span>, and 
                  <span className="text-emerald-500 font-medium"> AI recommendations to win</span>.
                </p>
              </div>
            </div>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            disabled={disabled || isLoading || (selectedMode === 'niche' ? !canSearch : !canCompetitiveSearch)}
            className={cn(
              "w-full h-12 text-base font-semibold transition-all",
              selectedMode === 'competitive' 
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                : "bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {selectedMode === 'competitive' ? 'Analyzing Competitors...' : 'Researching Niche...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                {selectedMode === 'competitive' ? (
                  <>🏆 Run Competitive Analysis</>
                ) : (
                  <>🔍 Research This Niche</>
                )}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* What You'll Get Section */}
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          "p-4 rounded-xl border transition-all",
          selectedMode === 'competitive' 
            ? "bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20"
            : "bg-gradient-to-r from-primary/5 to-emerald-500/5 border-primary/20"
        )}>
          <h4 className={cn(
            "text-sm font-bold mb-3 flex items-center gap-2",
            selectedMode === 'competitive' ? "text-amber-500" : "text-primary"
          )}>
            <Eye className="w-4 h-4" />
            What You'll Get in the Intelligence Report:
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedMode === 'competitive' ? (
              // Competitive Analysis outputs
              <>
                <ReportFeature icon={BarChart3} label="Side-by-Side Comparison" color="amber" />
                <ReportFeature icon={Trophy} label="Your Competitive Advantages" color="amber" />
                <ReportFeature icon={TrendingUp} label="Improvement Opportunities" color="amber" />
                <ReportFeature icon={Zap} label="AI Win Strategies" color="amber" />
                <ReportFeature icon={Globe} label="Website vs Competitors" color="amber" />
                <ReportFeature icon={Users} label="Market Position Analysis" color="amber" />
                <ReportFeature icon={Target} label="Differentiation Gaps" color="amber" />
                <ReportFeature icon={Sparkles} label="Action Recommendations" color="amber" />
              </>
            ) : (
              // Niche Research outputs
              <>
                <ReportFeature icon={Building2} label="12-Category Business Profiles" color="primary" />
                <ReportFeature icon={Globe} label="Website Health Analysis" color="primary" />
                <ReportFeature icon={Target} label="AI Opportunity Scores" color="primary" />
                <ReportFeature icon={Users} label="Decision Maker Intel" color="primary" />
                <ReportFeature icon={BarChart3} label="Market Insights" color="primary" />
                <ReportFeature icon={TrendingUp} label="Buyer Intent Signals" color="primary" />
                <ReportFeature icon={Zap} label="Pain Points Identified" color="primary" />
                <ReportFeature icon={Sparkles} label="AI Outreach Scripts" color="primary" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for report features
function ReportFeature({ 
  icon: Icon, 
  label, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  color: 'primary' | 'amber';
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg text-xs",
      color === 'amber' ? "bg-amber-500/10 text-amber-100" : "bg-primary/10 text-primary"
    )}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate text-foreground/80">{label}</span>
    </div>
  );
}
