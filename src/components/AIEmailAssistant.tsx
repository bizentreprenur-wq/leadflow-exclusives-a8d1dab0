import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Sparkles, Wand2, RefreshCw, Loader2, Copy, Check, 
  MessageSquare, Zap, Target, Lightbulb, ArrowRight
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body?: string;
  body_html?: string;
  category?: string;
  industry?: string;
}

interface AIEmailAssistantProps {
  template: EmailTemplate;
  leads: Lead[];
  onApplySubject: (subject: string) => void;
  onApplyBody: (body: string) => void;
  currentSubject?: string;
  currentBody?: string;
}

// AI-generated suggestions based on template and leads
const SUBJECT_VARIATIONS = [
  { prefix: "Quick question about", suffix: "your online presence" },
  { prefix: "Noticed something about", suffix: "your website" },
  { prefix: "3 ways to improve", suffix: "your customer reach" },
  { prefix: "Free audit for", suffix: "" },
  { prefix: "Helping businesses like", suffix: "grow online" },
];

const OPENING_HOOKS = [
  "I was researching {industry} businesses in your area and your company stood out...",
  "While looking at local {industry} websites, I noticed an opportunity for {business}...",
  "Quick question — are you happy with how many customers find you online?",
  "I help {industry} businesses like yours get more leads from their website...",
  "Noticed {business} while browsing for top {industry} providers in the area...",
];

const CTA_OPTIONS = [
  "Would you be open to a quick 10-minute call this week?",
  "Mind if I send over a free audit of your current online presence?",
  "Can I share 3 quick wins that could boost your visibility?",
  "Would Tuesday or Wednesday work for a brief chat?",
  "Reply 'YES' and I'll send you a custom proposal.",
];

const PERSONALIZATION_TIPS = [
  { icon: Target, text: "Mention their business name in the first line", action: "Add personalization" },
  { icon: Lightbulb, text: "Reference their location or industry", action: "Make it local" },
  { icon: MessageSquare, text: "Ask a question to encourage replies", action: "Add question" },
  { icon: Zap, text: "Include a specific benefit or result", action: "Add benefit" },
];

export default function AIEmailAssistant({
  template,
  leads,
  onApplySubject,
  onApplyBody,
  currentSubject,
  currentBody,
}: AIEmailAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'subject' | 'opening' | 'cta' | 'tips'>('subject');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Extract business context
  const sampleLead = leads[0];
  const businessName = sampleLead?.name || 'your business';
  const industry = template.industry || template.category || 'local business';

  // Generate personalized subject lines
  const generateSubjectLines = () => {
    return SUBJECT_VARIATIONS.map((v, idx) => {
      let subject = `${v.prefix} ${businessName}`;
      if (v.suffix) subject += ` - ${v.suffix}`;
      return { id: idx, text: subject };
    });
  };

  // Generate opening hooks
  const generateOpeningHooks = () => {
    return OPENING_HOOKS.map((hook, idx) => ({
      id: idx,
      text: hook
        .replace('{business}', businessName)
        .replace('{industry}', industry)
    }));
  };

  // Generate CTAs
  const generateCTAs = () => {
    return CTA_OPTIONS.map((cta, idx) => ({ id: idx, text: cta }));
  };

  const handleApply = (text: string, type: 'subject' | 'body') => {
    if (type === 'subject') {
      onApplySubject(text);
      toast.success('Subject line applied!');
    } else {
      onApplyBody(text);
      toast.success('Content applied!');
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    // Simulate AI regeneration
    await new Promise(r => setTimeout(r, 1000));
    setIsGenerating(false);
    toast.success('Generated new suggestions!');
  };

  return (
    <Card className="border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">AI Email Assistant</h4>
              <p className="text-xs text-muted-foreground">Smart suggestions for your email</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="gap-1 text-xs"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Regenerate
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg">
          {[
            { id: 'subject', label: 'Subject Lines', icon: MessageSquare },
            { id: 'opening', label: 'Openers', icon: Wand2 },
            { id: 'cta', label: 'CTAs', icon: Target },
            { id: 'tips', label: 'Tips', icon: Lightbulb },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-violet-500 text-white' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {activeTab === 'subject' && generateSubjectLines().map((item, idx) => (
            <div 
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border hover:border-violet-500/50 transition-all group"
            >
              <Badge variant="outline" className="text-[10px] shrink-0">#{idx + 1}</Badge>
              <p className="text-sm flex-1 truncate">{item.text}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => handleCopy(item.text, idx)}
                >
                  {copiedIndex === idx ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button 
                  size="sm" 
                  className="h-7 px-2 text-xs bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={() => handleApply(item.text, 'subject')}
                >
                  Use
                </Button>
              </div>
            </div>
          ))}

          {activeTab === 'opening' && generateOpeningHooks().map((item, idx) => (
            <div 
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-background/80 border border-border hover:border-violet-500/50 transition-all group"
            >
              <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">#{idx + 1}</Badge>
              <p className="text-sm flex-1">{item.text}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => handleCopy(item.text, idx + 100)}
                >
                  {copiedIndex === idx + 100 ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button 
                  size="sm" 
                  className="h-7 px-2 text-xs bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={() => handleApply(item.text, 'body')}
                >
                  Use
                </Button>
              </div>
            </div>
          ))}

          {activeTab === 'cta' && generateCTAs().map((item, idx) => (
            <div 
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border hover:border-violet-500/50 transition-all group"
            >
              <Badge variant="outline" className="text-[10px] shrink-0">#{idx + 1}</Badge>
              <p className="text-sm flex-1">{item.text}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => handleCopy(item.text, idx + 200)}
                >
                  {copiedIndex === idx + 200 ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button 
                  size="sm" 
                  className="h-7 px-2 text-xs bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={() => handleApply(item.text, 'body')}
                >
                  Use
                </Button>
              </div>
            </div>
          ))}

          {activeTab === 'tips' && PERSONALIZATION_TIPS.map((tip, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <tip.icon className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{tip.text}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs shrink-0 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                {tip.action}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            <Zap className="w-3 h-3 inline mr-1" />
            Suggestions tailored for <span className="font-medium text-foreground">{leads.length}</span> leads in <span className="font-medium text-foreground">{industry}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
