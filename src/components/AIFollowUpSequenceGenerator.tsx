import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Bot, Sparkles, Wand2, Clock, Mail, ArrowRight, CheckCircle2,
  Play, Pause, Calendar, Target, Flame, ThermometerSun, Snowflake,
  Globe, Store, Zap, TrendingUp, RefreshCw, Settings2
} from 'lucide-react';

interface Lead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  intent?: 'interested' | 'scheduling' | 'objection' | 'info_request' | 'none';
}

interface SequenceStep {
  id: string;
  day: number;
  type: 'email' | 'follow-up' | 'final';
  subject: string;
  description: string;
  optimalTime: string;
}

interface GeneratedSequence {
  id: string;
  name: string;
  intent: string;
  priority: 'hot' | 'warm' | 'cold';
  steps: SequenceStep[];
  estimatedConversion: number;
}

interface AIFollowUpSequenceGeneratorProps {
  leads: Lead[];
  searchType: 'gmb' | 'platform' | null;
  onApplySequence: (sequence: GeneratedSequence, leads: Lead[]) => void;
  hasSubscription: boolean;
  onStartTrial: () => void;
}

// Search A (GMB / Niche) Sequences
const GMB_SEQUENCES: GeneratedSequence[] = [
  {
    id: 'gmb-high-intent',
    name: 'High-Intent Niche Buyers',
    intent: 'Active buyers showing purchase signals',
    priority: 'hot',
    estimatedConversion: 35,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: 'Quick question about {{business_name}}', description: 'Personalized intro referencing their specific needs', optimalTime: '10:00 AM' },
      { id: 's2', day: 2, type: 'follow-up', subject: 'Did you see my previous note?', description: 'Soft reminder with added value proposition', optimalTime: '2:00 PM' },
      { id: 's3', day: 5, type: 'follow-up', subject: 'Last chance: Special offer for {{industry}}', description: 'Urgency + exclusive offer for their niche', optimalTime: '11:00 AM' },
      { id: 's4', day: 8, type: 'final', subject: 'Closing the loop on our conversation', description: 'Final touchpoint with clear CTA', optimalTime: '9:00 AM' },
    ],
  },
  {
    id: 'gmb-competitor-analysis',
    name: 'Competitor Research Sequence',
    intent: 'Businesses analyzing competition',
    priority: 'warm',
    estimatedConversion: 22,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: 'I noticed something about your competitors...', description: 'Lead with competitive insight', optimalTime: '9:00 AM' },
      { id: 's2', day: 3, type: 'follow-up', subject: 'Market insights for {{industry}}', description: 'Share relevant market data', optimalTime: '11:00 AM' },
      { id: 's3', day: 7, type: 'follow-up', subject: 'How {{competitor}} is getting ahead', description: 'Competitor comparison hook', optimalTime: '2:00 PM' },
      { id: 's4', day: 10, type: 'final', subject: 'Your competitive advantage awaits', description: 'Final push with differentiation angle', optimalTime: '10:00 AM' },
    ],
  },
  {
    id: 'gmb-nurture',
    name: 'Long-Term Nurture Sequence',
    intent: 'Not ready now but potential future buyer',
    priority: 'cold',
    estimatedConversion: 12,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: 'Resource: {{industry}} trends for 2025', description: 'Lead with pure value, no ask', optimalTime: '10:00 AM' },
      { id: 's2', day: 7, type: 'follow-up', subject: 'Another helpful resource for {{business_name}}', description: 'Continue providing value', optimalTime: '11:00 AM' },
      { id: 's3', day: 14, type: 'follow-up', subject: 'Case study: How similar businesses succeeded', description: 'Social proof without hard sell', optimalTime: '2:00 PM' },
      { id: 's4', day: 21, type: 'final', subject: 'Whenever you\'re ready...', description: 'Low-pressure door opener', optimalTime: '9:00 AM' },
    ],
  },
];

// Search B (Agency / Platform) Sequences  
const PLATFORM_SEQUENCES: GeneratedSequence[] = [
  {
    id: 'platform-website-issues',
    name: 'Website Problem Solver',
    intent: 'Businesses with detectable website issues',
    priority: 'hot',
    estimatedConversion: 42,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: 'I found 3 issues with {{business_name}}\'s website', description: 'Lead with specific problems you can fix', optimalTime: '9:00 AM' },
      { id: 's2', day: 1, type: 'follow-up', subject: 'Quick fix for your mobile experience', description: 'Offer quick win solution', optimalTime: '11:00 AM' },
      { id: 's3', day: 3, type: 'follow-up', subject: 'Your competitors are loading 2x faster', description: 'Competitive speed comparison', optimalTime: '10:00 AM' },
      { id: 's4', day: 5, type: 'final', subject: 'Free audit expires Friday', description: 'Time-limited offer', optimalTime: '2:00 PM' },
    ],
  },
  {
    id: 'platform-seo-services',
    name: 'SEO Opportunity Sequence',
    intent: 'Businesses missing SEO opportunities',
    priority: 'warm',
    estimatedConversion: 28,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: '{{business_name}} is invisible on Google', description: 'Open with SEO gap analysis', optimalTime: '10:00 AM' },
      { id: 's2', day: 2, type: 'follow-up', subject: '47 keywords your competitors rank for', description: 'Specific keyword opportunity data', optimalTime: '11:00 AM' },
      { id: 's3', day: 5, type: 'follow-up', subject: 'Your traffic could be 3x higher', description: 'Traffic projection based on fixes', optimalTime: '9:00 AM' },
      { id: 's4', day: 8, type: 'final', subject: 'SEO strategy call this week?', description: 'Direct meeting request', optimalTime: '2:00 PM' },
    ],
  },
  {
    id: 'platform-social-media',
    name: 'Social Media Growth Sequence',
    intent: 'Businesses with weak social presence',
    priority: 'warm',
    estimatedConversion: 24,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: 'Your Instagram could be driving sales', description: 'Social opportunity opening', optimalTime: '11:00 AM' },
      { id: 's2', day: 3, type: 'follow-up', subject: 'How {{competitor}} gets 10x your engagement', description: 'Competitor social comparison', optimalTime: '2:00 PM' },
      { id: 's3', day: 6, type: 'follow-up', subject: 'Content calendar that actually works', description: 'Offer practical solution', optimalTime: '10:00 AM' },
      { id: 's4', day: 9, type: 'final', subject: 'Free social audit for {{business_name}}', description: 'No-obligation audit offer', optimalTime: '9:00 AM' },
    ],
  },
  {
    id: 'platform-gmb-missing',
    name: 'Missing GMB Profile Sequence',
    intent: 'Local businesses without Google presence',
    priority: 'hot',
    estimatedConversion: 38,
    steps: [
      { id: 's1', day: 0, type: 'email', subject: '{{business_name}} doesn\'t show up on Google Maps', description: 'Highlight visibility problem', optimalTime: '9:00 AM' },
      { id: 's2', day: 1, type: 'follow-up', subject: 'You\'re losing 46% of local searches', description: 'Stats-driven urgency', optimalTime: '10:00 AM' },
      { id: 's3', day: 3, type: 'follow-up', subject: 'Your competitors are getting YOUR customers', description: 'Competitive loss framing', optimalTime: '11:00 AM' },
      { id: 's4', day: 5, type: 'final', subject: 'I can set up your GMB this week', description: 'Direct action offer', optimalTime: '2:00 PM' },
    ],
  },
];

export default function AIFollowUpSequenceGenerator({
  leads,
  searchType,
  onApplySequence,
  hasSubscription,
  onStartTrial,
}: AIFollowUpSequenceGeneratorProps) {
  const [selectedSequence, setSelectedSequence] = useState<GeneratedSequence | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSequences, setGeneratedSequences] = useState<GeneratedSequence[]>([]);
  const [showAIRecommendation, setShowAIRecommendation] = useState(true);

  const sequences = useMemo(() => {
    return searchType === 'gmb' ? GMB_SEQUENCES : PLATFORM_SEQUENCES;
  }, [searchType]);

  // AI analyzes leads and recommends best sequence
  const aiRecommendation = useMemo(() => {
    const hotLeads = leads.filter(l => l.aiClassification === 'hot').length;
    const warmLeads = leads.filter(l => l.aiClassification === 'warm').length;
    const coldLeads = leads.filter(l => l.aiClassification === 'cold').length;

    if (hotLeads > leads.length * 0.3) {
      return sequences.find(s => s.priority === 'hot') || sequences[0];
    } else if (warmLeads > leads.length * 0.4) {
      return sequences.find(s => s.priority === 'warm') || sequences[1];
    }
    return sequences.find(s => s.priority === 'cold') || sequences[2];
  }, [leads, sequences]);

  const handleGenerateCustomSequence = async () => {
    if (!hasSubscription) {
      toast.error('Please subscribe to AI Autopilot Campaign to use AI generation');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));

    const customSequence: GeneratedSequence = {
      id: `custom-${Date.now()}`,
      name: 'AI-Generated Custom Sequence',
      intent: 'Personalized based on your lead data',
      priority: 'hot',
      estimatedConversion: 33,
      steps: [
        { id: 'c1', day: 0, type: 'email', subject: 'Personalized for {{business_name}}', description: 'AI-crafted opening based on lead signals', optimalTime: '10:00 AM' },
        { id: 'c2', day: 2, type: 'follow-up', subject: 'Following up with value', description: 'Smart follow-up based on engagement', optimalTime: '2:00 PM' },
        { id: 'c3', day: 5, type: 'follow-up', subject: 'A quick thought about {{industry}}', description: 'Industry-specific insights', optimalTime: '11:00 AM' },
        { id: 'c4', day: 7, type: 'final', subject: 'Last touch: Ready when you are', description: 'Graceful sequence close', optimalTime: '9:00 AM' },
      ],
    };

    setGeneratedSequences(prev => [customSequence, ...prev]);
    setSelectedSequence(customSequence);
    setIsGenerating(false);
    toast.success('AI generated a custom sequence based on your leads!');
  };

  const handleApply = () => {
    if (!selectedSequence) {
      toast.error('Please select a sequence first');
      return;
    }
    if (!hasSubscription) {
      toast.error('Please subscribe to AI Autopilot Campaign to apply sequences');
      return;
    }
    onApplySequence(selectedSequence, leads);
    toast.success(`Applied "${selectedSequence.name}" to ${leads.length} leads`);
  };

  const getPriorityColor = (priority: 'hot' | 'warm' | 'cold') => {
    switch (priority) {
      case 'hot': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warm': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cold': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getPriorityIcon = (priority: 'hot' | 'warm' | 'cold') => {
    switch (priority) {
      case 'hot': return <Flame className="w-3.5 h-3.5" />;
      case 'warm': return <ThermometerSun className="w-3.5 h-3.5" />;
      case 'cold': return <Snowflake className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              AI Follow-Up Sequence Generator
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px]">
                PRO
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Create drip campaigns based on lead intent
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          {searchType === 'gmb' ? (
            <><Globe className="w-3 h-3" /> Option A: Super AI</>
          ) : (
            <><Store className="w-3 h-3" /> Option B: Agency</>
          )}
        </Badge>
      </div>

      {/* Subscription Gate */}
      {!hasSubscription && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Unlock AI Sequences
                </p>
                <p className="text-xs text-muted-foreground">
                  $19.99/month or start 7-day free trial
                </p>
              </div>
              <Button 
                onClick={onStartTrial}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="sm"
              >
                Start Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendation */}
      {showAIRecommendation && aiRecommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl border-2 border-dashed",
            hasSubscription 
              ? "border-purple-500/50 bg-purple-500/5" 
              : "border-muted opacity-50"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">AI Recommends:</p>
                <Badge className={cn("text-[10px]", getPriorityColor(aiRecommendation.priority))}>
                  {getPriorityIcon(aiRecommendation.priority)}
                  {aiRecommendation.priority}
                </Badge>
              </div>
              <p className="text-sm font-medium text-purple-400">{aiRecommendation.name}</p>
              <p className="text-xs text-muted-foreground">{aiRecommendation.intent}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-muted-foreground">
                  {aiRecommendation.steps.length} steps
                </span>
                <span className="text-xs text-muted-foreground">
                  {aiRecommendation.steps[aiRecommendation.steps.length - 1].day} days
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  ~{aiRecommendation.estimatedConversion}% conversion
                </span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setSelectedSequence(aiRecommendation)}
              disabled={!hasSubscription}
              className={cn(
                hasSubscription 
                  ? "bg-purple-500 hover:bg-purple-600" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Use This
            </Button>
          </div>
        </motion.div>
      )}

      {/* Generate Custom Button */}
      <Button
        onClick={handleGenerateCustomSequence}
        disabled={!hasSubscription || isGenerating}
        className={cn(
          "w-full gap-2",
          hasSubscription
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            AI is analyzing your leads...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Custom Sequence with AI
          </>
        )}
      </Button>

      {/* Sequence Library */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {searchType === 'gmb' ? 'Niche Selling' : 'Agency Services'} Sequences
        </p>
        <ScrollArea className="h-[250px]">
          <div className="space-y-2 pr-4">
            {[...generatedSequences, ...sequences].map((seq) => (
              <button
                key={seq.id}
                onClick={() => hasSubscription && setSelectedSequence(seq)}
                disabled={!hasSubscription}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all",
                  selectedSequence?.id === seq.id
                    ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20"
                    : hasSubscription
                    ? "border-border hover:border-purple-500/50 bg-card"
                    : "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground text-sm">{seq.name}</h4>
                    {seq.id.startsWith('custom-') && (
                      <Badge className="bg-purple-500/20 text-purple-400 text-[9px]">AI Generated</Badge>
                    )}
                  </div>
                  <Badge className={cn("text-[10px]", getPriorityColor(seq.priority))}>
                    {getPriorityIcon(seq.priority)}
                    {seq.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{seq.intent}</p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {seq.steps.length} emails
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {seq.steps[seq.steps.length - 1].day} days
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    ~{seq.estimatedConversion}% conversion
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Sequence Preview */}
      <AnimatePresence>
        {selectedSequence && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-muted/30 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground text-sm">
                    Sequence Preview: {selectedSequence.name}
                  </h4>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!hasSubscription}
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Apply to {leads.length} Leads
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedSequence.steps.map((step, idx) => (
                    <div 
                      key={step.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        step.type === 'email' ? "bg-blue-500/20 text-blue-400" :
                        step.type === 'follow-up' ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{step.subject}</p>
                        <p className="text-[10px] text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-foreground">Day {step.day}</p>
                        <p className="text-[10px] text-muted-foreground">{step.optimalTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
