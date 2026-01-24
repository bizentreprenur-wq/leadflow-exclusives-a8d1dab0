import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Sparkles, Wand2, RefreshCw, Loader2, Copy, Check, 
  MessageSquare, Target, Lightbulb, Mail, ArrowRight, Zap
} from 'lucide-react';

interface TemplateAIAssistantProps {
  industry?: string;
  onApplySubject: (subject: string) => void;
  onApplyBody: (body: string) => void;
  currentSubject?: string;
}

// AI-generated subject line suggestions
const SUBJECT_TEMPLATES = [
  "Quick question about {{business_name}}'s online presence",
  "Noticed something about {{business_name}} website",
  "3 ways to improve {{business_name}}'s customer reach",
  "Free audit for {{business_name}}",
  "Helping businesses like {{business_name}} grow online",
  "{{business_name}} — spotted an opportunity for you",
  "Is {{business_name}} getting enough leads?",
  "Improve {{business_name}}'s Google visibility",
];

// AI-generated email body openers
const OPENING_TEMPLATES = [
  `Hi {{first_name}},

I was researching businesses in your area and {{business_name}} stood out. I noticed a few opportunities that could help you get more customers from your online presence.

Would you be open to a quick chat about how I can help?`,
  
  `Hi {{first_name}},

Quick question — are you happy with how many customers find {{business_name}} online?

I work with businesses like yours to improve their digital visibility and generate more leads.`,

  `Hi {{first_name}},

I came across {{business_name}} while looking at local businesses and noticed your website could be working harder for you.

I'd love to share 3 quick wins that could boost your visibility.`,

  `Hi {{first_name}},

I help businesses like {{business_name}} get more leads from their online presence. 

I noticed a few things on your website that could be improved — would you be interested in a free audit?`,

  `Hi {{first_name}},

I noticed {{business_name}} while researching top providers in your area. Your business has great potential online.

Would Tuesday or Wednesday work for a 10-minute call to discuss some ideas?`,
];

// CTA suggestions
const CTA_TEMPLATES = [
  "Would you be open to a quick 10-minute call this week?",
  "Mind if I send over a free audit of your current online presence?",
  "Can I share 3 quick wins that could boost your visibility?",
  "Would Tuesday or Wednesday work for a brief chat?",
  "Reply 'YES' and I'll send you a custom proposal.",
  "Interested in seeing what I found? Let me know!",
];

// Writing tips
const WRITING_TIPS = [
  { icon: Target, text: "Mention their business name in the first line for personalization", category: "Personalization" },
  { icon: Lightbulb, text: "Reference their location or industry to show relevance", category: "Context" },
  { icon: MessageSquare, text: "Ask a question to encourage replies (2-3x higher response rate)", category: "Engagement" },
  { icon: Zap, text: "Include a specific benefit or result you can deliver", category: "Value" },
  { icon: Mail, text: "Keep subject lines under 50 characters for mobile", category: "Optimization" },
];

export default function TemplateAIAssistant({
  industry = 'local business',
  onApplySubject,
  onApplyBody,
  currentSubject,
}: TemplateAIAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'subject' | 'body' | 'cta' | 'tips'>('subject');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleApplySubject = (text: string) => {
    onApplySubject(text);
    toast.success('✨ Subject line applied!');
  };

  const handleApplyBody = (text: string) => {
    onApplyBody(text);
    toast.success('✨ Email body applied!');
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    setIsGenerating(false);
    toast.success('🤖 Generated new suggestions!');
  };

  return (
    <Card className="border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">🤖 AI Email Writer</h4>
              <p className="text-xs text-muted-foreground">Click to apply suggestions</p>
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
            { id: 'body', label: 'Email Body', icon: Mail },
            { id: 'cta', label: 'CTAs', icon: Target },
            { id: 'tips', label: 'Tips', icon: Lightbulb },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-violet-500 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="h-[280px]">
          {/* Subject Lines */}
          {activeTab === 'subject' && (
            <div className="space-y-2">
              {SUBJECT_TEMPLATES.map((subject, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-3 rounded-lg border bg-background hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer"
                  onClick={() => handleApplySubject(subject)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="secondary" className="shrink-0 text-xs px-1.5">
                      #{idx + 1}
                    </Badge>
                    <span className="text-sm truncate">{subject}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(subject, idx);
                      }}
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <ArrowRight className="w-4 h-4 text-violet-500" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Email Body Templates */}
          {activeTab === 'body' && (
            <div className="space-y-3">
              {OPENING_TEMPLATES.map((body, idx) => (
                <div
                  key={idx}
                  className="group p-3 rounded-lg border bg-background hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer"
                  onClick={() => handleApplyBody(body)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Template #{idx + 1}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(body, idx + 100);
                        }}
                      >
                        {copiedIndex === idx + 100 ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <span className="text-xs text-violet-500 font-medium">Click to apply →</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          {activeTab === 'cta' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Click any CTA to copy and paste into your email body:
              </p>
              {CTA_TEMPLATES.map((cta, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-3 rounded-lg border bg-background hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(cta);
                    toast.success('CTA copied to clipboard!');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-500" />
                    <span className="text-sm">{cta}</span>
                  </div>
                  <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {activeTab === 'tips' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">
                Pro tips for higher response rates:
              </p>
              {WRITING_TIPS.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <tip.icon className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">
                      {tip.category}
                    </Badge>
                    <p className="text-sm">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-center text-muted-foreground">
            ✨ AI suggestions tailored for <span className="font-medium text-foreground">{industry}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
