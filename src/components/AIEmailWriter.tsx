import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, Loader2, Wand2, Copy, Check, Brain, RefreshCw,
  Target, Flame, ThermometerSun, Snowflake, AlertTriangle,
  TrendingUp, Lightbulb, Star, Clock, MessageSquare, Eye,
  Edit3, Mail, Zap, Send, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { getAIEmailAngles, EmailAngle, ScoredLead } from "@/lib/api/aiLeadScoring";

interface Lead {
  id: string;
  name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
  };
}

interface AIEmailWriterProps {
  onInsert?: (text: string) => void;
  context?: {
    businessName?: string;
    industry?: string;
  };
  // New props for lead-based generation
  lead?: Lead;
  scoredLead?: ScoredLead;
  painPoints?: string[];
  onUseTemplate?: (subject: string, body: string) => void;
  onClose?: () => void;
  mode?: 'simple' | 'advanced';
}

type ToneOption = "professional" | "friendly" | "persuasive" | "casual" | "urgent";
type ContentType = "subject" | "opening" | "full" | "cta";

interface GeneratedEmail {
  id: string;
  angle: string;
  subject: string;
  body: string;
  tone: ToneOption;
  confidence: number;
  tags: string[];
}

const ANGLE_CONFIGS = {
  pain_point: {
    icon: AlertTriangle,
    label: 'Pain Point Focus',
    description: 'Address their specific challenges',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
  },
  value_prop: {
    icon: TrendingUp,
    label: 'Value Proposition',
    description: 'Highlight what you can offer',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
  },
  curiosity: {
    icon: Lightbulb,
    label: 'Curiosity Hook',
    description: 'Create intrigue to get a response',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
  },
  social_proof: {
    icon: Star,
    label: 'Social Proof',
    description: 'Lead with results and testimonials',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
  },
  urgency: {
    icon: Clock,
    label: 'Urgency',
    description: 'Time-sensitive approach',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
  },
};

export default function AIEmailWriter({ 
  onInsert, 
  context,
  lead,
  scoredLead,
  painPoints = [],
  onUseTemplate,
  onClose,
  mode = 'simple'
}: AIEmailWriterProps) {
  // Simple mode state
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<ToneOption>("professional");
  const [contentType, setContentType] = useState<ContentType>("full");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);

  // Advanced mode state
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GeneratedEmail | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAngle, setActiveAngle] = useState<string>('all');

  // Lead-based context
  const leadName = lead?.name || lead?.business_name || context?.businessName || 'Business Owner';
  const businessName = lead?.business_name || lead?.name || context?.businessName || 'Your Business';
  const priority = scoredLead?.priority || 'medium';
  const score = scoredLead?.score || 50;

  // Auto-generate when in advanced mode with a lead
  useEffect(() => {
    if (mode === 'advanced' && lead) {
      generateLeadEmails();
    }
  }, [lead, mode]);

  // Simple mode generation
  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to write");
      return;
    }

    setIsGenerating(true);
    setGeneratedText("");

    try {
      const systemPrompt = buildSystemPrompt(tone, contentType, context);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      setGeneratedText(content);
      toast.success("Content generated!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Advanced mode: Generate emails for lead
  const generateLeadEmails = async () => {
    if (!lead) return;
    
    setIsGenerating(true);
    
    try {
      const result = await getAIEmailAngles([{
        ...lead,
        score: scoredLead?.score,
        priority: scoredLead?.priority,
        painPoints,
      }]);

      if (result.success && result.results && result.results.length > 0) {
        const emails = result.results.map((angle, index) => 
          convertAngleToEmail(angle, index)
        );
        setGeneratedEmails(emails);
        if (emails.length > 0) {
          selectEmail(emails[0]);
        }
        toast.success('AI generated personalized emails!');
      } else {
        const fallbackEmails = generateFallbackEmails();
        setGeneratedEmails(fallbackEmails);
        if (fallbackEmails.length > 0) {
          selectEmail(fallbackEmails[0]);
        }
        toast.info('Generated emails using templates');
      }
    } catch (error) {
      console.error('Email generation error:', error);
      const fallbackEmails = generateFallbackEmails();
      setGeneratedEmails(fallbackEmails);
      if (fallbackEmails.length > 0) {
        selectEmail(fallbackEmails[0]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const buildSystemPrompt = (
    currentTone: ToneOption,
    type: ContentType,
    ctx?: { businessName?: string; industry?: string }
  ): string => {
    const toneDescriptions: Record<ToneOption, string> = {
      professional: "formal, business-appropriate, and credible",
      friendly: "warm, approachable, and conversational",
      persuasive: "compelling, benefit-focused, and action-oriented",
      casual: "relaxed, informal, and personable",
      urgent: "time-sensitive, compelling, with scarcity elements",
    };

    const typeInstructions: Record<ContentType, string> = {
      subject: "Write a compelling email subject line (under 50 characters). Just the subject, no quotes.",
      opening: "Write an engaging email opening paragraph (2-3 sentences). Hook the reader immediately.",
      full: "Write a complete cold outreach email (3-4 paragraphs). Include greeting, value proposition, and call to action.",
      cta: "Write a strong call-to-action closing paragraph. Create urgency and make it easy to respond.",
    };

    let contextInfo = "";
    if (ctx?.businessName) {
      contextInfo += `The recipient's business is: ${ctx.businessName}. `;
    }
    if (ctx?.industry) {
      contextInfo += `Their industry is: ${ctx.industry}. `;
    }

    return `You are an expert email copywriter for B2B outreach. 
Write in a ${toneDescriptions[currentTone]} tone.
${typeInstructions[type]}
${contextInfo}
Keep it concise and impactful. No fluff. Be specific about value.
Do not include placeholder brackets like [Name] - write as if ready to send.`;
  };

  const convertAngleToEmail = (angle: EmailAngle, index: number): GeneratedEmail => {
    const issues = lead?.websiteAnalysis?.issues || [];
    
    return {
      id: angle.id || `email-${index}`,
      angle: getAngleType(angle.tone, index),
      subject: personalizeText(angle.subject_line),
      body: generateBodyFromAngle(angle),
      tone: angle.tone as ToneOption,
      confidence: 75 + Math.random() * 20,
      tags: getTagsFromAngle(angle, issues),
    };
  };

  const getAngleType = (angleTone: string, index: number): string => {
    const angles = ['pain_point', 'value_prop', 'curiosity', 'social_proof', 'urgency'];
    if (angleTone === 'urgent') return 'urgency';
    if (angleTone === 'casual') return 'curiosity';
    return angles[index % angles.length];
  };

  const generateBodyFromAngle = (angle: EmailAngle): string => {
    const firstName = leadName.split(' ')[0];
    const issues = lead?.websiteAnalysis?.issues || [];
    
    return `Hi ${firstName},

${personalizeText(angle.opening_hook)}

${generateMiddleContent(angle.tone, issues)}

${personalizeText(angle.cta)}

Best regards,
[Your Name]

P.S. ${generatePS(angle.tone)}`;
  };

  const generateMiddleContent = (angleTone: string, issues: string[]): string => {
    const issueList = issues.slice(0, 3).join(', ') || 'website performance';
    
    if (angleTone === 'urgent') {
      return `I noticed ${businessName}'s website has some issues that could be costing you leads right now—specifically around ${issueList}. Every day these go unfixed is money left on the table.`;
    } else if (angleTone === 'casual') {
      return `I was checking out ${businessName}'s site and had a few ideas that could really help bring in more customers. Nothing crazy—just some quick wins that tend to work well for businesses like yours.`;
    } else {
      return `After analyzing ${businessName}'s online presence, I've identified specific areas where small improvements could lead to significant results. Businesses similar to yours have seen 40-60% increases in leads after addressing issues like ${issueList}.`;
    }
  };

  const generatePS = (angleTone: string): string => {
    if (angleTone === 'urgent') return "I have availability this week if you want to chat—calendar's filling up fast.";
    if (angleTone === 'casual') return "Reply with 'interested' and I'll send over a quick video walkthrough!";
    return "I'm happy to provide a free analysis with specific recommendations—no strings attached.";
  };

  const personalizeText = (text: string): string => {
    return text
      .replace(/{{first_name}}/gi, leadName.split(' ')[0])
      .replace(/{{business_name}}/gi, businessName)
      .replace(/{{name}}/gi, leadName)
      .replace(/{{website}}/gi, lead?.website || 'your website');
  };

  const getTagsFromAngle = (angle: EmailAngle, issues: string[]): string[] => {
    const tags: string[] = [angle.tone];
    if (issues.length > 0) tags.push('personalized');
    if (angle.tone === 'urgent') tags.push('high-impact');
    if (painPoints.length > 0) tags.push('pain-focused');
    return tags;
  };

  const generateFallbackEmails = (): GeneratedEmail[] => {
    const firstName = leadName.split(' ')[0];
    const issues = lead?.websiteAnalysis?.issues || [];
    const firstIssue = issues[0] || 'website performance';
    
    const templates: GeneratedEmail[] = [
      {
        id: 'pain-1',
        angle: 'pain_point',
        subject: `${businessName}, I noticed something hurting your conversions`,
        body: `Hi ${firstName},

I was looking at ${businessName}'s website and noticed ${firstIssue} might be causing you to lose potential customers.

${painPoints.length > 0 ? `Specifically, I see opportunities around:\n${painPoints.slice(0, 3).map(p => `• ${p}`).join('\n')}` : 'Small fixes in this area typically lead to 30-40% more leads.'}

Would you be open to a quick 10-minute call to discuss some easy wins?

Best,
[Your Name]

P.S. I've helped similar businesses in your area see immediate improvements.`,
        tone: 'professional',
        confidence: 85,
        tags: ['personalized', 'pain-focused'],
      },
      {
        id: 'value-1',
        angle: 'value_prop',
        subject: `How ${businessName} could get 50% more leads`,
        body: `Hi ${firstName},

I help businesses like ${businessName} turn their website into a lead-generating machine.

My clients typically see:
• 50% increase in website inquiries
• Lower cost per lead
• Better quality leads who are ready to buy

I'd love to show you exactly how this would work for ${businessName}—no pressure, just a quick strategy session.

Interested?

Best,
[Your Name]`,
        tone: 'professional',
        confidence: 80,
        tags: ['value-focused', 'results-driven'],
      },
      {
        id: 'curiosity-1',
        angle: 'curiosity',
        subject: `Quick question about ${businessName}`,
        body: `Hey ${firstName},

I found something interesting while researching ${businessName}'s online presence...

There's one specific thing your competitors are doing that you're not (and it's bringing them a lot of new customers).

Would you want me to show you what it is? Takes 5 minutes.

- [Your Name]

P.S. Hint: It's not what you'd expect 😉`,
        tone: 'casual',
        confidence: 78,
        tags: ['curiosity-hook', 'casual-tone'],
      },
      {
        id: 'social-1',
        angle: 'social_proof',
        subject: `What [Similar Business] did to get 40 new customers`,
        body: `Hi ${firstName},

Last month, I helped a business similar to ${businessName} generate 40 new customer inquiries from their website.

They were skeptical at first—thought their site was "fine." But after implementing a few changes I suggested, their phone started ringing.

I'd be happy to share exactly what we did (and how it might apply to ${businessName}).

Interested in a quick walkthrough?

Best,
[Your Name]`,
        tone: 'professional',
        confidence: 82,
        tags: ['social-proof', 'case-study'],
      },
      {
        id: 'urgent-1',
        angle: 'urgency',
        subject: `${firstName}, your competitors just upgraded—here's what to do`,
        body: `Hi ${firstName},

Quick heads up: I noticed several businesses in your area recently upgraded their online presence.

${businessName} could fall behind if similar improvements aren't made soon.

I have availability this week to discuss some quick wins that would keep you competitive. No long-term commitments—just actionable advice you can implement right away.

Can you do a 15-minute call?

- [Your Name]

P.S. I'm only reaching out to a few select businesses, so spots are limited.`,
        tone: 'urgent',
        confidence: 75,
        tags: ['urgency', 'competitive'],
      },
    ];

    // Add personalization based on score
    if (score >= 80) {
      templates.unshift({
        id: 'hot-lead-1',
        angle: 'value_prop',
        subject: `Priority: Quick call about ${businessName}?`,
        body: `Hi ${firstName},

I've been researching ${businessName} and I'm genuinely impressed—you're doing a lot of things right.

That said, I spotted a few opportunities that could take things to the next level. Based on what I've seen, you're perfectly positioned to see major results with just a few tweaks.

I'd love to share my findings with you. 15 minutes is all I need.

What does your schedule look like this week?

Best,
[Your Name]`,
        tone: 'professional',
        confidence: 92,
        tags: ['hot-lead', 'high-priority'],
      });
    }

    return templates;
  };

  const selectEmail = (email: GeneratedEmail) => {
    setSelectedEmail(email);
    setEditedSubject(email.subject);
    setEditedBody(email.body);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleCopyEmail = (email: GeneratedEmail) => {
    const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopiedId(email.id);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = () => {
    onInsert?.(generatedText);
    toast.success("Inserted into email!");
  };

  const handleUseTemplate = () => {
    onUseTemplate?.(editedSubject, editedBody);
    toast.success('Template applied!');
    onClose?.();
  };

  const filteredEmails = activeAngle === 'all' 
    ? generatedEmails 
    : generatedEmails.filter(e => e.angle === activeAngle);

  const getPriorityIndicator = () => {
    if (priority === 'high') return { icon: Flame, color: 'text-red-500', label: 'Hot Lead' };
    if (priority === 'medium') return { icon: ThermometerSun, color: 'text-amber-500', label: 'Warm Lead' };
    return { icon: Snowflake, color: 'text-blue-500', label: 'Nurture Lead' };
  };

  // Advanced mode with lead
  if (mode === 'advanced' && lead) {
    const { icon: PriorityIcon, color: priorityColor, label: priorityLabel } = getPriorityIndicator();

    return (
      <Card className="border-primary/20 bg-gradient-to-b from-background to-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                  <Wand2 className="w-5 h-5 text-primary" />
                </div>
                AI Email Writer
              </CardTitle>
              <CardDescription className="mt-1">
                Personalized emails for{' '}
                <span className="font-semibold text-foreground">{businessName}</span>
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`gap-1 ${priorityColor}`}>
                <PriorityIcon className="w-3 h-3" />
                {priorityLabel}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Target className="w-3 h-3" />
                Score: {score}%
              </Badge>
            </div>
          </div>

          {/* Pain Points Display */}
          {painPoints.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Detected Pain Points
              </div>
              <div className="flex flex-wrap gap-2">
                {painPoints.slice(0, 5).map((point, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {isGenerating ? (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-purple-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-semibold">AI Crafting Personalized Emails...</p>
                <p className="text-sm text-muted-foreground">Analyzing lead data and pain points</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Email Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Email Angles ({generatedEmails.length})
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={generateLeadEmails}
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </Button>
                </div>

                {/* Angle Filters */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <Button
                    variant={activeAngle === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveAngle('all')}
                    className="text-xs h-7"
                  >
                    All
                  </Button>
                  {Object.entries(ANGLE_CONFIGS).map(([key, config]) => {
                    const Icon = config.icon;
                    const count = generatedEmails.filter(e => e.angle === key).length;
                    if (count === 0) return null;
                    
                    return (
                      <Button
                        key={key}
                        variant={activeAngle === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveAngle(key)}
                        className="text-xs h-7 gap-1"
                      >
                        <Icon className="w-3 h-3" />
                        {count}
                      </Button>
                    );
                  })}
                </div>

                <ScrollArea className="h-[400px] pr-2">
                  <AnimatePresence mode="popLayout">
                    {filteredEmails.map((email, index) => {
                      const config = ANGLE_CONFIGS[email.angle as keyof typeof ANGLE_CONFIGS] || ANGLE_CONFIGS.value_prop;
                      const Icon = config.icon;
                      const isSelected = selectedEmail?.id === email.id;
                      
                      return (
                        <motion.div
                          key={email.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => selectEmail(email)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-md ${config.bgColor}`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {config.label}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {Math.round(email.confidence)}% match
                                </Badge>
                              </div>
                              <p className="font-medium text-sm truncate">{email.subject}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {email.body.split('\n')[2] || email.body.substring(0, 80)}...
                              </p>
                              <div className="flex items-center gap-1 mt-2">
                                {email.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEmail(email);
                              }}
                            >
                              {copiedId === email.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </ScrollArea>
              </div>

              {/* Email Preview/Edit */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Edit3 className="w-4 h-4 text-primary" />
                        Edit Email
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-primary" />
                        Preview
                      </>
                    )}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1"
                  >
                    {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                </div>

                {selectedEmail && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Subject Line
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="font-medium"
                        />
                      ) : (
                        <div className="p-2.5 rounded-md bg-muted/50 font-medium text-sm">
                          {editedSubject}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Email Body
                      </label>
                      {isEditing ? (
                        <Textarea
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          className="min-h-[300px] font-mono text-sm"
                        />
                      ) : (
                        <div className="p-3 rounded-md bg-muted/50 min-h-[300px] overflow-auto">
                          <pre className="text-sm whitespace-pre-wrap font-sans">
                            {editedBody}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                        onClick={handleUseTemplate}
                      >
                        <Sparkles className="w-4 h-4" />
                        Use This Template
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => selectedEmail && handleCopyEmail(selectedEmail)}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Simple mode (original)
  return (
    <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">AI Email Writer</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tone</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as ToneOption)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="persuasive">Persuasive</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Generate</Label>
          <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subject">Subject Line</SelectItem>
              <SelectItem value="opening">Opening Hook</SelectItem>
              <SelectItem value="full">Full Email</SelectItem>
              <SelectItem value="cta">Call to Action</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Describe what you're selling or offering
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., We help restaurants increase online orders by 40% with our delivery optimization platform..."
          className="min-h-[80px] text-sm resize-none"
        />
      </div>

      <Button
        onClick={generateContent}
        disabled={isGenerating || !prompt.trim()}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate with AI
          </>
        )}
      </Button>

      {generatedText && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-3 rounded-lg bg-background border border-border">
            <p className="text-sm text-foreground whitespace-pre-wrap">{generatedText}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" className="flex-1 gap-2" onClick={handleInsert}>
              <Sparkles className="w-4 h-4" />
              Insert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
