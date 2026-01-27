import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Brain, Sparkles, ThumbsUp, ThumbsDown, Minus, AlertTriangle,
  Flame, Clock, Reply, MessageSquare, Phone, Mail, ArrowRight,
  Bell, CheckCircle2, XCircle, Zap, Target, TrendingUp, Filter
} from 'lucide-react';

interface LeadResponse {
  id: string;
  leadName: string;
  leadEmail: string;
  businessName: string;
  subject: string;
  preview: string;
  fullContent: string;
  receivedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'interested' | 'question' | 'objection' | 'unsubscribe' | 'scheduling' | 'unclear';
  urgency: 'hot' | 'warm' | 'cold';
  confidence: number;
  suggestedAction: string;
  autoRouted: boolean;
  read: boolean;
}

// Sentiment analysis keywords
const POSITIVE_KEYWORDS = [
  'interested', 'yes', 'love', 'great', 'amazing', 'perfect', 'sounds good',
  'let\'s talk', 'schedule', 'call me', 'when can we', 'looking forward',
  'please send', 'more info', 'pricing', 'quote', 'proposal', 'sign up'
];

const NEGATIVE_KEYWORDS = [
  'not interested', 'no thanks', 'unsubscribe', 'remove', 'stop', 'don\'t contact',
  'spam', 'already have', 'not right now', 'too expensive', 'not a fit',
  'no budget', 'not looking', 'wrong person', 'not the decision maker'
];

const QUESTION_KEYWORDS = [
  'how much', 'what is', 'can you', 'do you', 'tell me more', 'what\'s included',
  'how does', 'when', 'where', 'who', 'why', 'which', '?'
];

const DEMO_RESPONSES: LeadResponse[] = [
  {
    id: '1',
    leadName: 'Sarah Johnson',
    leadEmail: 'sarah@techstartup.com',
    businessName: 'TechStartup Inc',
    subject: 'Re: Website Optimization for TechStartup',
    preview: 'This sounds exactly like what we need! Can we schedule a call this week?',
    fullContent: 'Hi there,\n\nThis sounds exactly like what we need! We\'ve been struggling with our website performance and your approach seems comprehensive.\n\nCan we schedule a call this week? I\'m available Tuesday or Wednesday afternoon.\n\nLooking forward to hearing from you.\n\nBest,\nSarah',
    receivedAt: '2024-01-20T14:32:00Z',
    sentiment: 'positive',
    intent: 'scheduling',
    urgency: 'hot',
    confidence: 95,
    suggestedAction: 'Schedule call immediately - high buying intent detected',
    autoRouted: true,
    read: false
  },
  {
    id: '2',
    leadName: 'Mike Chen',
    leadEmail: 'mike@retailco.com',
    businessName: 'RetailCo',
    subject: 'Re: Local SEO Services',
    preview: 'How much would this cost for a business with 3 locations?',
    fullContent: 'Hi,\n\nThanks for reaching out. I\'m curious about your services.\n\nHow much would this cost for a business with 3 locations? Also, what\'s the typical timeline to see results?\n\nThanks,\nMike',
    receivedAt: '2024-01-20T11:15:00Z',
    sentiment: 'neutral',
    intent: 'question',
    urgency: 'warm',
    confidence: 82,
    suggestedAction: 'Send pricing information with multi-location discount offer',
    autoRouted: false,
    read: false
  },
  {
    id: '3',
    leadName: 'Jennifer Williams',
    leadEmail: 'jwilliams@lawfirm.com',
    businessName: 'Williams & Associates',
    subject: 'Re: Google Business Profile Management',
    preview: 'We already have someone handling this, but thanks for reaching out.',
    fullContent: 'Hi,\n\nThanks for the email, but we already have someone handling our Google Business Profile.\n\nIf things change in the future, I\'ll keep you in mind.\n\nBest,\nJennifer',
    receivedAt: '2024-01-20T09:45:00Z',
    sentiment: 'negative',
    intent: 'objection',
    urgency: 'cold',
    confidence: 88,
    suggestedAction: 'Add to nurture sequence - follow up in 6 months',
    autoRouted: false,
    read: true
  },
  {
    id: '4',
    leadName: 'David Park',
    leadEmail: 'david@restaurant.com',
    businessName: 'Seoul Kitchen',
    subject: 'Re: Reputation Management',
    preview: 'Yes! We\'ve been getting negative reviews lately and need help ASAP',
    fullContent: 'YES! We\'ve been getting negative reviews lately and it\'s really hurting our business. We need help ASAP!\n\nCan someone call me today? This is urgent.\n\nDavid\n555-123-4567',
    receivedAt: '2024-01-20T08:20:00Z',
    sentiment: 'positive',
    intent: 'interested',
    urgency: 'hot',
    confidence: 98,
    suggestedAction: 'URGENT: Call immediately - distressed buyer with pain point',
    autoRouted: true,
    read: false
  },
  {
    id: '5',
    leadName: 'Amanda Foster',
    leadEmail: 'amanda@boutique.com',
    businessName: 'Chic Boutique',
    subject: 'Re: Social Media Marketing',
    preview: 'Please remove me from your mailing list.',
    fullContent: 'Please remove me from your mailing list.\n\nThank you.',
    receivedAt: '2024-01-19T16:30:00Z',
    sentiment: 'negative',
    intent: 'unsubscribe',
    urgency: 'cold',
    confidence: 99,
    suggestedAction: 'Process unsubscribe request immediately',
    autoRouted: false,
    read: true
  }
];

interface LeadResponseDetectionProps {
  onFollowUp?: (response: LeadResponse) => void;
  onDismiss?: (responseId: string) => void;
}

export default function LeadResponseDetection({ onFollowUp, onDismiss }: LeadResponseDetectionProps) {
  const [responses, setResponses] = useState<LeadResponse[]>(DEMO_RESPONSES);
  const [filter, setFilter] = useState<'all' | 'hot' | 'positive' | 'negative'>('all');
  const [selectedResponse, setSelectedResponse] = useState<LeadResponse | null>(null);
  const [autoRouting, setAutoRouting] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Analyze new incoming email (simulation)
  const analyzeEmail = (content: string): Partial<LeadResponse> => {
    const lowerContent = content.toLowerCase();
    
    // Check sentiment
    const positiveScore = POSITIVE_KEYWORDS.filter(k => lowerContent.includes(k)).length;
    const negativeScore = NEGATIVE_KEYWORDS.filter(k => lowerContent.includes(k)).length;
    const questionScore = QUESTION_KEYWORDS.filter(k => lowerContent.includes(k)).length;

    let sentiment: 'positive' | 'neutral' | 'negative';
    if (positiveScore > negativeScore + 1) sentiment = 'positive';
    else if (negativeScore > positiveScore) sentiment = 'negative';
    else sentiment = 'neutral';

    // Determine intent
    let intent: LeadResponse['intent'];
    if (lowerContent.includes('unsubscribe') || lowerContent.includes('remove')) intent = 'unsubscribe';
    else if (lowerContent.includes('schedule') || lowerContent.includes('call')) intent = 'scheduling';
    else if (questionScore > 0) intent = 'question';
    else if (negativeScore > 0) intent = 'objection';
    else if (positiveScore > 0) intent = 'interested';
    else intent = 'unclear';

    // Calculate urgency
    let urgency: 'hot' | 'warm' | 'cold';
    if (sentiment === 'positive' && (intent === 'scheduling' || intent === 'interested')) urgency = 'hot';
    else if (sentiment === 'neutral' || intent === 'question') urgency = 'warm';
    else urgency = 'cold';

    // Confidence score
    const confidence = Math.min(95, 60 + positiveScore * 5 + negativeScore * 5 + questionScore * 3);

    return { sentiment, intent, urgency, confidence };
  };

  const filteredResponses = useMemo(() => {
    return responses.filter(r => {
      if (filter === 'all') return true;
      if (filter === 'hot') return r.urgency === 'hot';
      if (filter === 'positive') return r.sentiment === 'positive';
      if (filter === 'negative') return r.sentiment === 'negative';
      return true;
    });
  }, [responses, filter]);

  const stats = useMemo(() => ({
    total: responses.length,
    hot: responses.filter(r => r.urgency === 'hot').length,
    positive: responses.filter(r => r.sentiment === 'positive').length,
    negative: responses.filter(r => r.sentiment === 'negative').length,
    unread: responses.filter(r => !r.read).length
  }), [responses]);

  const handleFollowUp = (response: LeadResponse) => {
    onFollowUp?.(response);
    setResponses(prev => prev.map(r => 
      r.id === response.id ? { ...r, read: true } : r
    ));
    toast.success(`Opening follow-up for ${response.leadName}`);
  };

  const handleDismiss = (responseId: string) => {
    onDismiss?.(responseId);
    setResponses(prev => prev.filter(r => r.id !== responseId));
    toast.success('Response dismissed');
  };

  const markAsRead = (responseId: string) => {
    setResponses(prev => prev.map(r => 
      r.id === responseId ? { ...r, read: true } : r
    ));
  };

  const getSentimentIcon = (sentiment: LeadResponse['sentiment']) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4 text-emerald-400" />;
      case 'negative': return <ThumbsDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-amber-400" />;
    }
  };

  const getUrgencyBadge = (urgency: LeadResponse['urgency']) => {
    switch (urgency) {
      case 'hot':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><Flame className="w-3 h-3" />Hot</Badge>;
      case 'warm':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="w-3 h-3" />Warm</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Cold</Badge>;
    }
  };

  const getIntentLabel = (intent: LeadResponse['intent']) => {
    const labels = {
      interested: '✨ Interested',
      question: '❓ Question',
      objection: '🤔 Objection',
      unsubscribe: '🚫 Unsubscribe',
      scheduling: '📅 Scheduling',
      unclear: '🔍 Unclear'
    };
    return labels[intent] || intent;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Lead Response Detection</h3>
            <p className="text-xs text-muted-foreground">AI classifies replies and routes hot leads for immediate follow-up</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto-routing</span>
            <Switch
              checked={autoRouting}
              onCheckedChange={setAutoRouting}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Alerts</span>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Replies', value: stats.total, icon: Reply, color: 'text-muted-foreground' },
          { label: 'Hot Leads', value: stats.hot, icon: Flame, color: 'text-red-400', pulse: stats.hot > 0 },
          { label: 'Positive', value: stats.positive, icon: ThumbsUp, color: 'text-emerald-400' },
          { label: 'Negative', value: stats.negative, icon: ThumbsDown, color: 'text-red-400' },
          { label: 'Unread', value: stats.unread, icon: Bell, color: 'text-amber-400', pulse: stats.unread > 0 }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn("w-4 h-4", stat.color, stat.pulse && "animate-pulse")} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { value: 'all', label: 'All Replies', count: stats.total },
          { value: 'hot', label: '🔥 Hot Leads', count: stats.hot },
          { value: 'positive', label: '👍 Positive', count: stats.positive },
          { value: 'negative', label: '👎 Negative', count: stats.negative }
        ].map(tab => (
          <Button
            key={tab.value}
            size="sm"
            variant={filter === tab.value ? 'default' : 'outline'}
            onClick={() => setFilter(tab.value as typeof filter)}
            className="gap-1.5"
          >
            {tab.label}
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{tab.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Responses List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List Panel */}
        <div className="space-y-3">
          {filteredResponses.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No responses match this filter</p>
              </CardContent>
            </Card>
          ) : (
            filteredResponses.map(response => (
              <Card 
                key={response.id}
                className={cn(
                  "bg-card border cursor-pointer transition-all hover:border-primary/50",
                  selectedResponse?.id === response.id && "border-primary",
                  !response.read && "bg-primary/5",
                  response.urgency === 'hot' && "border-red-500/30"
                )}
                onClick={() => {
                  setSelectedResponse(response);
                  markAsRead(response.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Sentiment Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        response.sentiment === 'positive' && "bg-emerald-500/20",
                        response.sentiment === 'negative' && "bg-red-500/20",
                        response.sentiment === 'neutral' && "bg-amber-500/20"
                      )}>
                        {getSentimentIcon(response.sentiment)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground truncate">{response.leadName}</span>
                          {!response.read && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{response.businessName}</p>
                        <p className="text-sm text-foreground/80 mt-1 line-clamp-2">{response.preview}</p>
                      </div>
                    </div>

                    {/* Urgency Badge */}
                    <div className="flex flex-col items-end gap-2">
                      {getUrgencyBadge(response.urgency)}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(response.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* AI Analysis Badge */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {getIntentLabel(response.intent)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {response.confidence}% confidence
                      </span>
                    </div>
                    {response.autoRouted && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                        <Zap className="w-3 h-3" />
                        Auto-routed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:sticky lg:top-4">
          {selectedResponse ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      selectedResponse.sentiment === 'positive' && "bg-emerald-500/20",
                      selectedResponse.sentiment === 'negative' && "bg-red-500/20",
                      selectedResponse.sentiment === 'neutral' && "bg-amber-500/20"
                    )}>
                      {getSentimentIcon(selectedResponse.sentiment)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedResponse.leadName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{selectedResponse.leadEmail}</p>
                    </div>
                  </div>
                  {getUrgencyBadge(selectedResponse.urgency)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Subject</p>
                  <p className="text-sm font-medium text-foreground">{selectedResponse.subject}</p>
                </div>

                {/* Full Content */}
                <ScrollArea className="h-48">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                      {selectedResponse.fullContent}
                    </pre>
                  </div>
                </ScrollArea>

                {/* AI Analysis */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-foreground">AI Analysis</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {selectedResponse.confidence}% confidence
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      <p className="text-sm font-medium text-foreground capitalize flex items-center gap-1.5">
                        {getSentimentIcon(selectedResponse.sentiment)}
                        {selectedResponse.sentiment}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Intent</p>
                      <p className="text-sm font-medium text-foreground">
                        {getIntentLabel(selectedResponse.intent)}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Suggested Action</p>
                    <p className="text-sm text-foreground">{selectedResponse.suggestedAction}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleFollowUp(selectedResponse)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                  >
                    <Reply className="w-4 h-4" />
                    Reply Now
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDismiss(selectedResponse.id)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border h-96">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Select a response to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
