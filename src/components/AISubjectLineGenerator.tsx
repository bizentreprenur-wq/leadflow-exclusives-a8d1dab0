import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw, Check, Zap, Target, TrendingUp } from 'lucide-react';

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
}

// Subject line templates by priority and context
const SUBJECT_TEMPLATES = {
  hot: [
    "Quick question about {{business_name}}",
    "{{first_name}}, saw something interesting about your business",
    "Can we talk? (Re: {{industry}})",
    "Urgent: {{business_name}} opportunity",
    "{{first_name}} — 5 min call this week?",
  ],
  warm: [
    "Idea for {{business_name}}'s growth",
    "{{first_name}}, noticed this about {{industry}}",
    "Could {{business_name}} benefit from this?",
    "Follow-up: {{industry}} trends I mentioned",
    "{{business_name}} + [Our Solution] = 🚀",
  ],
  cold: [
    "{{industry}} businesses are seeing 3x results",
    "Quick win for {{business_name}}?",
    "{{first_name}}, is {{business_name}} looking to grow?",
    "Helping {{industry}} companies like yours",
    "{{business_name}} — saw your listing",
  ],
  noWebsite: [
    "{{business_name}} needs to be found online",
    "{{first_name}}, your customers can't find you",
    "Free website for {{business_name}}?",
    "Missing out on 87% of customers without a website",
    "{{industry}} businesses without websites lose ${{X}}/month",
  ],
  websiteIssues: [
    "Found something on {{business_name}}'s website",
    "{{first_name}}, quick fix for your site",
    "Your website might be turning away customers",
    "{{business_name}} website review (free)",
    "3 things I noticed on your site",
  ],
};

export default function AISubjectLineGenerator({
  templateName,
  currentLead,
  onSelect,
  className,
}: AISubjectLineGeneratorProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const personalizeSubject = (template: string, lead?: Lead): string => {
    if (!lead) return template.replace(/\{\{[^}]+\}\}/g, '');
    
    return template
      .replace(/\{\{business_name\}\}/g, lead.business_name || 'your business')
      .replace(/\{\{first_name\}\}/g, lead.first_name || 'there')
      .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
      .replace(/\{\{X\}\}/g, String(Math.floor(Math.random() * 5000) + 2000));
  };

  const generateSuggestions = () => {
    setIsGenerating(true);
    setSelectedIndex(null);

    // Simulate AI generation delay
    setTimeout(() => {
      let templates: string[] = [];
      const priority = currentLead?.aiClassification || 'cold';

      // Select templates based on lead context
      if (!currentLead?.hasWebsite) {
        templates = [...SUBJECT_TEMPLATES.noWebsite];
      } else if (currentLead?.websiteIssues?.length) {
        templates = [...SUBJECT_TEMPLATES.websiteIssues];
      } else {
        templates = [...SUBJECT_TEMPLATES[priority]];
      }

      // Shuffle and take 4
      const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 4);
      const personalized = shuffled.map(t => personalizeSubject(t, currentLead));

      setSuggestions(personalized);
      setIsGenerating(false);
    }, 600);
  };

  useEffect(() => {
    generateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLead?.business_name, templateName]);

  const handleSelect = (subject: string, index: number) => {
    setSelectedIndex(index);
    onSelect(subject);
  };

  const getPriorityColor = () => {
    switch (currentLead?.aiClassification) {
      case 'hot': return 'border-red-500/30 bg-red-500/5';
      case 'warm': return 'border-amber-500/30 bg-amber-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <div className={cn("rounded-xl border p-4", getPriorityColor(), className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">AI Subject Lines</h4>
            <p className="text-[10px] text-muted-foreground">Optimized for {currentLead?.aiClassification || 'cold'} leads</p>
          </div>
        </div>
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
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3">
        <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
          <Zap className="w-2.5 h-2.5 text-amber-400" />
          Personalized
        </Badge>
        <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
          <Target className="w-2.5 h-2.5 text-purple-400" />
          Priority-Optimized
        </Badge>
        <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
          <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
          High Open Rate
        </Badge>
      </div>
    </div>
  );
}
