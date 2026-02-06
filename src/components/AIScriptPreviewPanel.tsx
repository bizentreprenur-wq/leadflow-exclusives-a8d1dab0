/**
 * AI Script Preview Panel
 * Displays AI-generated call scripts based on search context and strategy
 * 
 * RULES:
 * - Free/Basic: Read-only preview
 * - Pro+: Editable
 * - Script auto-generates from search filters + AI strategy
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  Sparkles, 
  RefreshCw,
  Lock,
  Edit3,
  Save,
  Copy,
  MessageSquare,
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { useAICalling } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface AIScriptPreviewPanelProps {
  searchQuery?: string;
  searchLocation?: string;
  selectedStrategy?: string;
  businessType?: string;
  leadName?: string;
  onScriptChange?: (script: CallScript) => void;
}

export interface CallScript {
  greeting: string;
  introduction: string;
  valueProposition: string;
  qualifyingQuestions: string[];
  objectionHandlers: { objection: string; response: string }[];
  closingStatement: string;
  fallbackMessage: string;
}

const SCRIPT_TONES = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'direct', label: 'Direct', description: 'Clear and to-the-point' },
  { value: 'conversational', label: 'Conversational', description: 'Natural and relaxed' },
];

export default function AIScriptPreviewPanel({
  searchQuery = '',
  searchLocation = '',
  selectedStrategy = '',
  businessType = '',
  leadName = '',
  onScriptChange
}: AIScriptPreviewPanelProps) {
  const { capabilities } = useAICalling();
  const { tier } = usePlanFeatures();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [script, setScript] = useState<CallScript>({
    greeting: '',
    introduction: '',
    valueProposition: '',
    qualifyingQuestions: [],
    objectionHandlers: [],
    closingStatement: '',
    fallbackMessage: ''
  });

  // Generate script based on context
  const generateScript = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (in production, this would call the backend)
    setTimeout(() => {
      const generatedScript = createContextualScript();
      setScript(generatedScript);
      onScriptChange?.(generatedScript);
      setIsGenerating(false);
      toast.success('Script generated successfully!');
    }, 1500);
  };

  // Create script based on search context
  const createContextualScript = (): CallScript => {
    const business = businessType || searchQuery || 'business';
    const location = searchLocation || 'your area';
    const strategy = selectedStrategy || 'general outreach';
    const lead = leadName || 'there';

    const toneStyles: Record<string, { greeting: string; style: string }> = {
      professional: {
        greeting: `Good ${getTimeOfDay()}, this is [Your Name] calling from [Your Company].`,
        style: 'professional'
      },
      friendly: {
        greeting: `Hi ${lead}! How are you doing today? This is [Your Name] from [Your Company].`,
        style: 'friendly'
      },
      direct: {
        greeting: `Hello, I'm [Your Name] from [Your Company]. I'll be brief.`,
        style: 'direct'
      },
      conversational: {
        greeting: `Hey ${lead}, this is [Your Name] over at [Your Company]. Got a quick minute?`,
        style: 'conversational'
      }
    };

    const tone = toneStyles[selectedTone] || toneStyles.professional;

    return {
      greeting: tone.greeting,
      introduction: generateIntroduction(business, strategy, tone.style),
      valueProposition: generateValueProp(business, location, tone.style),
      qualifyingQuestions: generateQuestions(business, tone.style),
      objectionHandlers: generateObjectionHandlers(tone.style),
      closingStatement: generateClosing(tone.style),
      fallbackMessage: `I understand you're busy. Could I send you some information via email and follow up later this week?`
    };
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const generateIntroduction = (business: string, strategy: string, style: string): string => {
    const intros: Record<string, string> = {
      professional: `I'm reaching out to ${business} owners in your area who are looking to grow their customer base.`,
      friendly: `I've been chatting with a few ${business} owners lately and thought you might find this interesting!`,
      direct: `We help ${business} businesses get more customers. I have 30 seconds to explain how.`,
      conversational: `So I was doing some research on ${business} businesses and came across yours...`
    };
    return intros[style] || intros.professional;
  };

  const generateValueProp = (business: string, location: string, style: string): string => {
    return `We've helped over 50 ${business} businesses in ${location} increase their leads by an average of 40% in the first 90 days. Our AI-powered system finds and qualifies leads automatically so you can focus on what you do best.`;
  };

  const generateQuestions = (business: string, style: string): string[] => {
    return [
      `What's your biggest challenge right now when it comes to finding new customers?`,
      `On a scale of 1-10, how satisfied are you with your current lead generation efforts?`,
      `If you could wave a magic wand, what would your ideal customer pipeline look like?`,
      `Who handles marketing and lead follow-up for your ${business}?`
    ];
  };

  const generateObjectionHandlers = (style: string): { objection: string; response: string }[] => {
    return [
      {
        objection: "I'm not interested",
        response: "I completely understand. Before I let you go, may I ask - is it the timing, or have you already solved this problem another way?"
      },
      {
        objection: "We're already working with someone",
        response: "That's great to hear! Out of curiosity, what do you like most about what they're doing? I'd love to know what's working in your market."
      },
      {
        objection: "Send me some information",
        response: "Absolutely! To make sure I send you the most relevant case studies, what's your biggest priority right now - more leads, better quality leads, or saving time?"
      },
      {
        objection: "This isn't a good time",
        response: "No problem at all. When would be a better time for a 5-minute call this week? I promise to be brief and bring real value."
      }
    ];
  };

  const generateClosing = (style: string): string => {
    const closings: Record<string, string> = {
      professional: `Based on what you've shared, I'd love to show you exactly how we can help. Would you have 15 minutes this week for a quick demo?`,
      friendly: `This sounds like it could be a really good fit! Want to grab a virtual coffee this week and I can show you how it all works?`,
      direct: `You're clearly a good fit. Let's book 15 minutes. When works for you?`,
      conversational: `I think you'd really dig what we've built. How about we hop on a quick call later this week?`
    };
    return closings[style] || closings.professional;
  };

  // Auto-generate on mount if we have context
  useEffect(() => {
    if (searchQuery && !script.greeting) {
      generateScript();
    }
  }, [searchQuery]);

  const handleSave = () => {
    onScriptChange?.(script);
    setIsEditing(false);
    toast.success('Script saved!');
  };

  const handleCopy = () => {
    const fullScript = `
GREETING:
${script.greeting}

INTRODUCTION:
${script.introduction}

VALUE PROPOSITION:
${script.valueProposition}

QUALIFYING QUESTIONS:
${script.qualifyingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

OBJECTION HANDLERS:
${script.objectionHandlers.map(o => `• "${o.objection}"\n  → ${o.response}`).join('\n\n')}

CLOSING:
${script.closingStatement}

FALLBACK:
${script.fallbackMessage}
    `.trim();
    
    navigator.clipboard.writeText(fullScript);
    toast.success('Script copied to clipboard!');
  };

  const canEdit = capabilities.canEditScripts;
  const isPreviewOnly = !canEdit;

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Call Script
                {isPreviewOnly && (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <Lock className="w-3 h-3" />
                    Preview Only
                  </Badge>
                )}
                {capabilities.scriptGeneration === 'advanced' && (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
                    <Sparkles className="w-3 h-3" />
                    Advanced
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isPreviewOnly 
                  ? 'Upgrade to Pro to edit and customize scripts'
                  : 'AI-generated script based on your search and strategy'
                }
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateScript}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tone Selector */}
        <div className="flex gap-2 flex-wrap">
          {SCRIPT_TONES.map((tone) => (
            <button
              key={tone.value}
              onClick={() => {
                setSelectedTone(tone.value);
                if (script.greeting) generateScript();
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedTone === tone.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>

        {/* Context Info */}
        {searchQuery && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            {searchQuery && (
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>{searchQuery}</span>
              </div>
            )}
            {searchLocation && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{searchLocation}</span>
              </div>
            )}
          </div>
        )}

        {/* Script Content */}
        {script.greeting ? (
          <Tabs defaultValue="script" className="space-y-4">
            <TabsList>
              <TabsTrigger value="script">Full Script</TabsTrigger>
              <TabsTrigger value="objections">Objection Handlers</TabsTrigger>
              <TabsTrigger value="tips">AI Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-4">
              {/* Greeting */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Greeting</Label>
                {canEdit && isEditing ? (
                  <Textarea
                    value={script.greeting}
                    onChange={(e) => setScript({ ...script, greeting: e.target.value })}
                    className="min-h-[60px]"
                  />
                ) : (
                  <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.greeting}</p>
                )}
              </div>

              {/* Introduction */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Introduction</Label>
                {canEdit && isEditing ? (
                  <Textarea
                    value={script.introduction}
                    onChange={(e) => setScript({ ...script, introduction: e.target.value })}
                    className="min-h-[80px]"
                  />
                ) : (
                  <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.introduction}</p>
                )}
              </div>

              {/* Value Proposition */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Value Proposition</Label>
                {canEdit && isEditing ? (
                  <Textarea
                    value={script.valueProposition}
                    onChange={(e) => setScript({ ...script, valueProposition: e.target.value })}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-foreground text-sm">
                    {script.valueProposition}
                  </p>
                )}
              </div>

              {/* Qualifying Questions */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qualifying Questions</Label>
                <div className="space-y-2">
                  {script.qualifyingQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      <span className="text-sm text-foreground">{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Closing Statement</Label>
                {canEdit && isEditing ? (
                  <Textarea
                    value={script.closingStatement}
                    onChange={(e) => setScript({ ...script, closingStatement: e.target.value })}
                    className="min-h-[80px]"
                  />
                ) : (
                  <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.closingStatement}</p>
                )}
              </div>

              {/* Edit/Save Buttons */}
              {canEdit && (
                <div className="flex justify-end gap-2 pt-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit Script
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="objections" className="space-y-4">
              {script.objectionHandlers.map((handler, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3 mb-3">
                    <MessageSquare className="w-4 h-4 text-destructive mt-1" />
                    <span className="font-medium text-foreground">"{handler.objection}"</span>
                  </div>
                  <div className="flex items-start gap-3 ml-7">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                    <span className="text-sm text-muted-foreground">{handler.response}</span>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">AI Recommendations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Best time to call: <span className="text-foreground">Tuesday-Thursday, 10-11am</span></li>
                      <li>• Optimal call duration: <span className="text-foreground">3-5 minutes</span></li>
                      <li>• Key talking point: <span className="text-foreground">Lead with value, not features</span></li>
                      <li>• Watch for: <span className="text-foreground">Mentions of current solutions or pain points</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No script generated yet</p>
            <Button onClick={generateScript} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Script
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
