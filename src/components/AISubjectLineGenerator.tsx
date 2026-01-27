import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw, Check, Zap, Target, TrendingUp, Flame, ThermometerSun, Snowflake, BarChart3 } from 'lucide-react';

interface Lead {
  business_name?: string;
  first_name?: string;
  industry?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  hasWebsite?: boolean;
  websiteIssues?: string[];
}

interface AISubjectLineGeneratorProps {
  templateName?: string;
  currentLead?: Lead;
  onSelect: (subject: string) => void;
  className?: string;
  campaignType?: 'hot' | 'warm' | 'cold' | 'all';
  searchType?: 'gmb' | 'platform' | null;
}

// Industry-specific templates for higher performance
const INDUSTRY_TEMPLATES: Record<string, string[]> = {
  restaurant: [
    "{{business_name}}: Get 50+ more reservations this month",
    "{{first_name}}, your competitors are getting found online",
    "Empty tables = lost revenue. Let's fix that.",
    "Google searches for restaurants near you → Are you showing up?",
  ],
  automotive: [
    "{{business_name}}: More service appointments without advertising",
    "{{first_name}}, 3 ways to get more car owners to your shop",
    "Your shop's online reviews could use a boost",
    "Auto repair marketing that actually works",
  ],
  healthcare: [
    "{{business_name}}: Patient acquisition without the high costs",
    "{{first_name}}, streamline your patient booking process",
    "Your practice's online presence matters more than ever",
    "Healthcare marketing done right for {{industry}}",
  ],
  legal: [
    "{{business_name}}: Quality leads without the price tag",
    "{{first_name}}, law firm marketing that converts",
    "Your potential clients are searching online right now",
    "Legal services + digital presence = more clients",
  ],
  realestate: [
    "{{business_name}}: More qualified buyer leads",
    "{{first_name}}, real estate marketing in the digital age",
    "Your listings deserve more visibility",
    "Property marketing that actually closes deals",
  ],
  construction: [
    "{{business_name}}: Get found by homeowners near you",
    "{{first_name}}, your website could be your best salesperson",
    "Contractors who get found online win more bids",
    "Local visibility = more construction projects",
  ],
  default: [
    "{{business_name}}: Quick growth opportunity",
    "{{first_name}}, noticed something about your business",
    "Your competitors might be ahead online",
    "Digital presence check for {{industry}} businesses",
  ],
};

// Subject line templates by priority and context
const SUBJECT_TEMPLATES = {
  hot: [
    "Quick question about {{business_name}} — time sensitive",
    "{{first_name}}, saw something urgent about your business",
    "Can we talk today? (Re: {{industry}} opportunity)",
    "Urgent: {{business_name}} is losing customers",
    "{{first_name}} — 5 min call this week? (Priority)",
    "🔥 Hot lead: {{business_name}} needs this now",
  ],
  warm: [
    "Idea for {{business_name}}'s growth",
    "{{first_name}}, noticed this about {{industry}}",
    "Could {{business_name}} benefit from this?",
    "Follow-up: {{industry}} trends I mentioned",
    "{{business_name}} + our solution = 📈",
    "Quick win for {{business_name}}?",
  ],
  cold: [
    "{{industry}} businesses are seeing 3x results",
    "Quick win for {{business_name}}?",
    "{{first_name}}, is {{business_name}} looking to grow?",
    "Helping {{industry}} companies like yours",
    "{{business_name}} — saw your listing",
    "Introduction: Helping {{industry}} businesses thrive",
  ],
  noWebsite: [
    "{{business_name}} needs to be found online",
    "{{first_name}}, your customers can't find you",
    "Free website consultation for {{business_name}}?",
    "Missing out on 87% of customers without a website",
    "{{industry}} businesses without websites lose $5K/month",
    "No website? Here's what you're missing",
  ],
  websiteIssues: [
    "Found issues on {{business_name}}'s website",
    "{{first_name}}, quick fix for your site",
    "Your website might be turning away customers",
    "{{business_name}} website review (free)",
    "3 things I noticed on your site that need fixing",
    "⚠️ Website alert for {{business_name}}",
  ],
  agencyFinder: [
    "{{business_name}}'s website needs professional help",
    "{{first_name}}, let's modernize your online presence",
    "Website redesign proposal for {{business_name}}",
    "Your competitors have better websites — let's change that",
    "Free website audit for {{business_name}}",
  ],
  superAI: [
    "{{business_name}}: Business intelligence report ready",
    "{{first_name}}, deep insights about your {{industry}} business",
    "Competitive analysis for {{business_name}}",
    "Market opportunities for {{business_name}}",
    "{{industry}} trends + {{business_name}} = growth",
  ],
};

// Performance stats by category
const PERFORMANCE_STATS: Record<string, { openRate: number; clickRate: number }> = {
  hot: { openRate: 45, clickRate: 12 },
  warm: { openRate: 32, clickRate: 8 },
  cold: { openRate: 22, clickRate: 5 },
  noWebsite: { openRate: 38, clickRate: 10 },
  websiteIssues: { openRate: 35, clickRate: 9 },
};

export default function AISubjectLineGenerator({
  templateName,
  currentLead,
  onSelect,
  className,
  campaignType,
  searchType,
}: AISubjectLineGeneratorProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);

  const personalizeSubject = (template: string, lead?: Lead): string => {
    if (!lead) return template.replace(/\{\{[^}]+\}\}/g, '');
    
    return template
      .replace(/\{\{business_name\}\}/g, lead.business_name || 'your business')
      .replace(/\{\{first_name\}\}/g, lead.first_name || 'there')
      .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
      .replace(/\{\{X\}\}/g, String(Math.floor(Math.random() * 5000) + 2000));
  };

  const getIndustryKey = (industry?: string): string => {
    if (!industry) return 'default';
    const lower = industry.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe')) return 'restaurant';
    if (lower.includes('auto') || lower.includes('car') || lower.includes('mechanic')) return 'automotive';
    if (lower.includes('health') || lower.includes('medical') || lower.includes('dental')) return 'healthcare';
    if (lower.includes('law') || lower.includes('legal') || lower.includes('attorney')) return 'legal';
    if (lower.includes('real estate') || lower.includes('property') || lower.includes('realtor')) return 'realestate';
    if (lower.includes('construction') || lower.includes('contractor') || lower.includes('roofing')) return 'construction';
    return 'default';
  };

  const generateSuggestions = () => {
    setIsGenerating(true);
    setSelectedIndex(null);

    // Simulate AI generation delay
    setTimeout(() => {
      let templates: string[] = [];
      const priority = campaignType || currentLead?.aiClassification || 'cold';
      const industryKey = getIndustryKey(currentLead?.industry);

      // Select templates based on lead context
      if (!currentLead?.hasWebsite) {
        templates = [...SUBJECT_TEMPLATES.noWebsite];
      } else if (currentLead?.websiteIssues?.length) {
        templates = [...SUBJECT_TEMPLATES.websiteIssues];
      } else if (searchType === 'platform') {
        templates = [...SUBJECT_TEMPLATES.agencyFinder, ...SUBJECT_TEMPLATES[priority]];
      } else if (searchType === 'gmb') {
        templates = [...SUBJECT_TEMPLATES.superAI, ...SUBJECT_TEMPLATES[priority]];
      } else {
        templates = [...SUBJECT_TEMPLATES[priority]];
      }

      // Add industry-specific templates
      const industryTemplates = INDUSTRY_TEMPLATES[industryKey] || INDUSTRY_TEMPLATES.default;
      templates = [...templates, ...industryTemplates];

      // Shuffle and take 5
      const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 5);
      const personalized = shuffled.map(t => personalizeSubject(t, currentLead));

      setSuggestions(personalized);
      setIsGenerating(false);
    }, 800);
  };

  useEffect(() => {
    generateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLead?.business_name, templateName, campaignType, searchType]);

  const handleSelect = (subject: string, index: number) => {
    setSelectedIndex(index);
    onSelect(subject);
  };

  const getPriorityColor = () => {
    const priority = campaignType || currentLead?.aiClassification;
    switch (priority) {
      case 'hot': return 'border-red-500/30 bg-red-500/5';
      case 'warm': return 'border-amber-500/30 bg-amber-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const getPriorityIcon = () => {
    const priority = campaignType || currentLead?.aiClassification;
    switch (priority) {
      case 'hot': return <Flame className="w-4 h-4 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-4 h-4 text-amber-400" />;
      default: return <Snowflake className="w-4 h-4 text-blue-400" />;
    }
  };

  const currentStats = PERFORMANCE_STATS[campaignType || currentLead?.aiClassification || 'cold'];

  return (
    <div className={cn("rounded-xl border p-4", getPriorityColor(), className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              AI Subject Lines
              {getPriorityIcon()}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {searchType === 'gmb' ? 'Super AI Search' : searchType === 'platform' ? 'Agency Finder' : 'Optimized'} • {(campaignType || currentLead?.aiClassification || 'cold').toUpperCase()} priority
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowStats(!showStats)}
            className="h-7 text-xs gap-1"
          >
            <BarChart3 className="w-3 h-3" />
            Stats
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="h-7 text-xs gap-1.5"
          >
            <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Performance Stats */}
      {showStats && (
        <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium">Expected Performance ({(campaignType || currentLead?.aiClassification || 'cold').toUpperCase()} leads)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{currentStats.openRate}%</p>
              <p className="text-[9px] text-muted-foreground">Open Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">{currentStats.clickRate}%</p>
              <p className="text-[9px] text-muted-foreground">Click Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-2">
        {isGenerating ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 animate-pulse text-primary" />
              <span className="text-sm">Generating personalized subjects...</span>
            </div>
          </div>
        ) : (
          suggestions.map((subject, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(subject, idx)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm",
                "hover:border-primary/50 hover:bg-primary/5",
                selectedIndex === idx
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1 truncate">{subject}</span>
                {selectedIndex === idx && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Performance Hints */}
      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
          <Zap className="w-2.5 h-2.5 text-amber-400" />
          Personalized
        </Badge>
        <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
          <Target className="w-2.5 h-2.5 text-purple-400" />
          Industry-Optimized
        </Badge>
        <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
          <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
          High Open Rate
        </Badge>
        {currentLead?.industry && (
          <Badge className="text-[9px] gap-1 px-1.5 py-0.5 bg-primary/10 text-primary border-primary/30">
            {currentLead.industry}
          </Badge>
        )}
      </div>
    </div>
  );
}
