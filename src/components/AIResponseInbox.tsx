import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Mail, Bot, User, Send, Edit3, Check, X, RefreshCw,
  Sparkles, Clock, CheckCircle2, MessageSquare, Loader2,
  ThumbsUp, ThumbsDown, RotateCcw, Eye, ArrowRight, Flame, Zap, 
  TrendingUp, AlertCircle, BarChart3, Brain, Settings, Bell,
  Calendar, Phone, BellRing, ChevronDown, Shield, CalendarCheck,
  FileText, FileSignature, Rocket, Star, Gift, Target, Briefcase,
  ArrowUpRight, Copy, Download, ExternalLink
} from 'lucide-react';
import { PROPOSAL_TEMPLATES, ProposalTemplate, generateProposalHTML } from '@/lib/proposalTemplates';
import { CONTRACT_TEMPLATES, ContractTemplate, generateContractHTML } from '@/lib/contractTemplates';

// AI Automation Settings interface
interface AIAutomationSettings {
  // Response Mode
  responseMode: 'automatic' | 'manual';
  // Auto-scheduling
  autoScheduling: boolean;
  // Auto-proposals
  autoProposals: boolean;
  // Notification settings
  notifyEmail: boolean;
  notifyEmailAddress: string;
  notifySMS: boolean;
  notifyPhone: string;
  // What to notify about
  notifyOnHotLead: boolean;
  notifyOnScheduleRequest: boolean;
  notifyOnAIAction: boolean;
  notifyOnReadyToClose: boolean;
}

const DEFAULT_SETTINGS: AIAutomationSettings = {
  responseMode: 'manual',
  autoScheduling: false,
  autoProposals: true,
  notifyEmail: true,
  notifyEmailAddress: '',
  notifySMS: false,
  notifyPhone: '',
  notifyOnHotLead: true,
  notifyOnScheduleRequest: true,
  notifyOnAIAction: true,
  notifyOnReadyToClose: true,
};

const loadSettings = (): AIAutomationSettings => {
  try {
    const saved = localStorage.getItem('bamlead_ai_inbox_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings: AIAutomationSettings) => {
  localStorage.setItem('bamlead_ai_inbox_settings', JSON.stringify(settings));
};

// Document recommendation types
interface DocumentRecommendation {
  type: 'proposal' | 'contract';
  document: ProposalTemplate | ContractTemplate;
  reason: string;
  confidence: number; // 0-100
  urgency: 'high' | 'medium' | 'low';
}

interface EmailReply {
  id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body: string;
  received_at: string;
  lead_id?: string;
  original_email_id?: string;
  status: 'new' | 'ai_drafted' | 'approved' | 'sent' | 'rejected';
  ai_draft?: string;
  human_response?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // 0-100 confidence
  urgencyLevel?: 'hot' | 'warm' | 'cold';
  buyingSignals?: string[];
  documentRecommendations?: DocumentRecommendation[];
}

interface AIResponseInboxProps {
  onSendResponse?: (replyId: string, response: string) => Promise<void>;
}

// Closing intent keywords - when lead is ready to move forward
const CLOSING_KEYWORDS = [
  'next step', 'move forward', 'get started', 'sign up', 'proceed',
  'let\'s do it', 'sounds good', 'ready to', 'how do we begin', 'send me',
  'contract', 'agreement', 'proposal', 'quote', 'invoice', 'pricing',
  'payment', 'deposit', 'start date', 'when can you start', 'let\'s proceed'
];

// Document type detection keywords
const WEBSITE_KEYWORDS = ['website', 'site', 'web', 'design', 'redesign', 'online presence', 'landing page'];
const MARKETING_KEYWORDS = ['marketing', 'leads', 'customers', 'grow', 'sales', 'advertising', 'ads', 'social media'];
const SEO_KEYWORDS = ['seo', 'search', 'google', 'ranking', 'visibility', 'found online'];

// AI Document Recommendation Engine
const analyzeForDocumentRecommendation = (
  reply: EmailReply
): DocumentRecommendation[] => {
  const recommendations: DocumentRecommendation[] = [];
  const lowerBody = reply.body.toLowerCase();
  const lowerSubject = reply.subject.toLowerCase();
  const combinedText = `${lowerBody} ${lowerSubject}`;
  
  // Check if lead shows closing intent
  const hasClosingIntent = CLOSING_KEYWORDS.some(kw => combinedText.includes(kw));
  const isHotLead = reply.urgencyLevel === 'hot' && (reply.sentimentScore || 0) >= 80;
  
  if (!hasClosingIntent && !isHotLead) {
    return recommendations;
  }
  
  // Detect what type of service they're interested in
  const wantsWebsite = WEBSITE_KEYWORDS.some(kw => combinedText.includes(kw));
  const wantsMarketing = MARKETING_KEYWORDS.some(kw => combinedText.includes(kw));
  const wantsSEO = SEO_KEYWORDS.some(kw => combinedText.includes(kw));
  
  // Add proposal recommendations
  if (wantsWebsite) {
    const websiteProposal = PROPOSAL_TEMPLATES.find(p => p.id === 'website-design');
    if (websiteProposal) {
      recommendations.push({
        type: 'proposal',
        document: websiteProposal,
        reason: 'Lead mentioned website interest',
        confidence: hasClosingIntent ? 95 : 75,
        urgency: hasClosingIntent ? 'high' : 'medium'
      });
    }
    const websiteContract = CONTRACT_TEMPLATES.find(c => c.id === 'website-design-agreement');
    if (websiteContract) {
      recommendations.push({
        type: 'contract',
        document: websiteContract,
        reason: 'Ready to formalize website project',
        confidence: hasClosingIntent ? 90 : 65,
        urgency: hasClosingIntent ? 'high' : 'medium'
      });
    }
  }
  
  if (wantsMarketing || wantsSEO) {
    const marketingProposal = PROPOSAL_TEMPLATES.find(p => p.id === 'lead-generation');
    if (marketingProposal) {
      recommendations.push({
        type: 'proposal',
        document: marketingProposal,
        reason: 'Lead interested in growth/marketing',
        confidence: hasClosingIntent ? 92 : 70,
        urgency: hasClosingIntent ? 'high' : 'medium'
      });
    }
    const marketingContract = CONTRACT_TEMPLATES.find(c => c.id === 'marketing-services-agreement');
    if (marketingContract) {
      recommendations.push({
        type: 'contract',
        document: marketingContract,
        reason: 'Ready to formalize marketing services',
        confidence: hasClosingIntent ? 88 : 60,
        urgency: hasClosingIntent ? 'high' : 'medium'
      });
    }
  }
  
  // If no specific service detected but showing closing intent, recommend general proposal
  if (recommendations.length === 0 && (hasClosingIntent || isHotLead)) {
    const generalProposal = PROPOSAL_TEMPLATES.find(p => p.id === 'custom-scope');
    if (generalProposal) {
      recommendations.push({
        type: 'proposal',
        document: generalProposal,
        reason: 'Lead ready to move forward',
        confidence: 80,
        urgency: 'high'
      });
    }
  }
  
  // Sort by confidence
  return recommendations.sort((a, b) => b.confidence - a.confidence);
};

// Demo replies with enhanced sentiment data and document recommendations
const DEMO_REPLIES: EmailReply[] = [
  {
    id: '1',
    from_email: 'john@acmeplumbing.com',
    from_name: 'John Miller',
    subject: 'Re: Website Upgrade Offer',
    body: "Hi, thanks for reaching out! We've been thinking about updating our website. Can you tell me more about your pricing and timeline?",
    received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'ai_drafted',
    sentiment: 'positive',
    sentimentScore: 87,
    urgencyLevel: 'hot',
    buyingSignals: ['Asking about pricing', 'Expressing interest', 'Timeline question'],
    documentRecommendations: [
      {
        type: 'proposal',
        document: PROPOSAL_TEMPLATES.find(p => p.id === 'website-design')!,
        reason: 'Lead mentioned website interest',
        confidence: 92,
        urgency: 'high'
      }
    ],
    ai_draft: `Hi John,

Thank you for your interest! I'd be happy to provide more details.

**Pricing**: Our website packages start at $2,500 for a basic 5-page site, with custom solutions available based on your specific needs.

**Timeline**: A typical project takes 2-4 weeks from start to launch.

Would you be available for a quick 15-minute call this week to discuss your requirements? I can share some examples of similar work we've done for plumbing businesses.

Best regards`
  },
  {
    id: '2',
    from_email: 'sarah@greenleaflandscaping.com',
    from_name: 'Sarah Chen',
    subject: 'Re: Digital Marketing Proposal',
    body: "This looks interesting but we're not sure if now is the right time. What kind of results have you seen with other landscaping companies?",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'new',
    sentiment: 'neutral',
    sentimentScore: 52,
    urgencyLevel: 'warm',
    buyingSignals: ['Asking for case studies', 'Considering timing']
  },
  {
    id: '3',
    from_email: 'mike@cityautorepair.com',
    from_name: 'Mike Thompson',
    subject: 'Re: Lead Generation Services',
    body: "We're definitely interested! We've been struggling to get new customers. When can we schedule a call? I want to move forward with this.",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: 'approved',
    sentiment: 'positive',
    sentimentScore: 95,
    urgencyLevel: 'hot',
    buyingSignals: ['Ready to schedule call', 'Expressing pain point', 'High urgency', 'Ready to close'],
    documentRecommendations: [
      {
        type: 'proposal',
        document: PROPOSAL_TEMPLATES.find(p => p.id === 'lead-generation')!,
        reason: 'Lead ready to move forward with marketing',
        confidence: 95,
        urgency: 'high'
      },
      {
        type: 'contract',
        document: CONTRACT_TEMPLATES.find(c => c.id === 'marketing-services-agreement')!,
        reason: 'Ready to formalize marketing services',
        confidence: 88,
        urgency: 'high'
      }
    ],
    ai_draft: `Hi Mike,

Fantastic! I'd love to help you attract more customers to City Auto Repair.

I have availability:
- Tomorrow at 2pm or 4pm
- Thursday at 10am or 3pm

Which time works best for you? The call will be about 20 minutes, and I'll walk you through exactly how we can help you get more repair jobs.

Looking forward to connecting!`
  },
  {
    id: '4',
    from_email: 'linda@budgetflooring.com',
    from_name: 'Linda Martinez',
    subject: 'Re: SEO Services',
    body: "We already have an SEO company. Please remove us from your list.",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'new',
    sentiment: 'negative',
    sentimentScore: 18,
    urgencyLevel: 'cold',
    buyingSignals: []
  },
  {
    id: '5',
    from_email: 'david@quickprintshop.com',
    from_name: 'David Kim',
    subject: 'Re: Business Growth Consultation',
    body: "This is exactly what we need! Our sales have been flat and we're looking for ways to reach more customers. What's the next step? Send me a proposal!",
    received_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'new',
    sentiment: 'positive',
    sentimentScore: 98,
    urgencyLevel: 'hot',
    buyingSignals: ['Ready for next step', 'Describing pain point', 'High motivation', 'Requesting proposal'],
    documentRecommendations: [
      {
        type: 'proposal',
        document: PROPOSAL_TEMPLATES.find(p => p.id === 'lead-generation')!,
        reason: 'Lead explicitly requested proposal',
        confidence: 98,
        urgency: 'high'
      },
      {
        type: 'proposal',
        document: PROPOSAL_TEMPLATES.find(p => p.id === 'local-business')!,
        reason: 'Local business growth opportunity',
        confidence: 85,
        urgency: 'medium'
      }
    ]
  },
  {
    id: '6',
    from_email: 'jennifer@coastalrealty.com',
    from_name: 'Jennifer Adams',
    subject: 'Re: Website Redesign Quote',
    body: "This sounds perfect! We've been meaning to update our website for months. Let's proceed - please send me the contract and we can get started this week!",
    received_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'new',
    sentiment: 'positive',
    sentimentScore: 99,
    urgencyLevel: 'hot',
    buyingSignals: ['Ready to sign', 'Requesting contract', 'Immediate timeline', 'Ready to close'],
    documentRecommendations: [
      {
        type: 'contract',
        document: CONTRACT_TEMPLATES.find(c => c.id === 'website-design-agreement')!,
        reason: 'Lead explicitly requested contract',
        confidence: 99,
        urgency: 'high'
      },
      {
        type: 'proposal',
        document: PROPOSAL_TEMPLATES.find(p => p.id === 'website-redesign')!,
        reason: 'Website redesign interest confirmed',
        confidence: 95,
        urgency: 'high'
      }
    ]
  }
];

// Sentiment analysis keywords for scoring
const POSITIVE_SIGNALS = [
  'interested', 'definitely', 'schedule', 'call', 'pricing', 'when can',
  'love to', 'excited', 'perfect', 'great', 'exactly what we need', 'next step',
  'looking for', 'need help', 'struggling', 'want to', 'yes', 'let\'s',
  'move forward', 'proceed', 'get started', 'send me', 'contract', 'proposal'
];

const NEGATIVE_SIGNALS = [
  'not interested', 'remove', 'unsubscribe', 'stop', 'already have', 'no thanks',
  'not now', 'maybe later', 'budget', 'can\'t afford', 'too expensive'
];

// AI Sentiment Analysis function (simulated - in production would use real AI)
const analyzeSentiment = (text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number; signals: string[] } => {
  const lowerText = text.toLowerCase();
  const signals: string[] = [];
  let score = 50; // Start neutral
  
  // Check positive signals
  POSITIVE_SIGNALS.forEach(signal => {
    if (lowerText.includes(signal)) {
      score += 8;
      if (signal === 'schedule' || signal === 'call') signals.push('Ready to talk');
      if (signal === 'pricing') signals.push('Asking about pricing');
      if (signal === 'interested' || signal === 'definitely') signals.push('Expressing interest');
      if (signal === 'next step') signals.push('Ready for next step');
      if (signal === 'struggling' || signal === 'need help') signals.push('Describing pain point');
    }
  });
  
  // Check negative signals
  NEGATIVE_SIGNALS.forEach(signal => {
    if (lowerText.includes(signal)) {
      score -= 15;
      if (signal === 'remove' || signal === 'unsubscribe') signals.push('Opt-out request');
      if (signal === 'already have') signals.push('Has existing solution');
      if (signal === 'budget' || signal === 'too expensive') signals.push('Budget concern');
    }
  });
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score >= 65) sentiment = 'positive';
  else if (score <= 35) sentiment = 'negative';
  
  return { sentiment, score, signals: [...new Set(signals)] };
};

// Get urgency level from sentiment score
const getUrgencyLevel = (score: number): 'hot' | 'warm' | 'cold' => {
  if (score >= 75) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
};

export default function AIResponseInbox({ onSendResponse }: AIResponseInboxProps) {
  const [replies, setReplies] = useState<EmailReply[]>(DEMO_REPLIES);
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [editedDraft, setEditedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoAIDraft, setAutoAIDraft] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'time'>('priority');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AIAutomationSettings>(loadSettings);
  
  // Document preview state
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecommendation | null>(null);
  const [isSendingDocument, setIsSendingDocument] = useState(false);
  const [documentPreviewHTML, setDocumentPreviewHTML] = useState('');

  // Load branding for document generation
  const loadBranding = () => {
    try {
      const saved = localStorage.getItem('bamlead_user_branding');
      return saved ? JSON.parse(saved) : {
        companyName: 'Your Company',
        contactName: 'Your Name',
        email: 'you@company.com',
        phone: '',
        logoUrl: ''
      };
    } catch {
      return {
        companyName: 'Your Company',
        contactName: 'Your Name',
        email: 'you@company.com',
        phone: '',
        logoUrl: ''
      };
    }
  };

  // Generate document preview HTML
  const generateDocumentPreviewHTML = (recommendation: DocumentRecommendation, recipientEmail: string, recipientName: string) => {
    const branding = loadBranding();
    
    if (recommendation.type === 'proposal') {
      return generateProposalHTML(
        recommendation.document as ProposalTemplate,
        {
          businessName: recipientName.split(' ').pop() || recipientName,
          contactName: recipientName,
          email: recipientEmail,
        },
        {
          companyName: branding.companyName,
          contactName: branding.contactName,
          email: branding.email,
          phone: branding.phone,
          logoUrl: branding.logoUrl
        }
      );
    } else {
      return generateContractHTML(
        recommendation.document as ContractTemplate,
        {},
        {
          companyName: branding.companyName,
          logoUrl: branding.logoUrl
        }
      );
    }
  };

  // Handle document preview
  const handlePreviewDocument = (recommendation: DocumentRecommendation) => {
    if (!selectedReply) return;
    
    const html = generateDocumentPreviewHTML(
      recommendation,
      selectedReply.from_email,
      selectedReply.from_name
    );
    
    setSelectedDocument(recommendation);
    setDocumentPreviewHTML(html);
    setShowDocumentPreview(true);
  };

  // Handle sending document
  const handleSendDocument = async () => {
    if (!selectedDocument || !selectedReply) return;
    
    setIsSendingDocument(true);
    
    // Simulate sending - in production this would use the email service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(
      `${selectedDocument.type === 'proposal' ? 'Proposal' : 'Contract'} sent to ${selectedReply.from_email}!`,
      {
        description: `${selectedDocument.document.name} has been delivered.`
      }
    );
    
    setShowDocumentPreview(false);
    setIsSendingDocument(false);
    setSelectedDocument(null);
  };

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof AIAutomationSettings>(key: K, value: AIAutomationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Detect scheduling intent in message
  const hasSchedulingIntent = (body: string): boolean => {
    const schedulingKeywords = ['schedule', 'book', 'appointment', 'call', 'meeting', 'when can', 'available', 'calendar', 'slot', 'time'];
    const lowerBody = body.toLowerCase();
    return schedulingKeywords.some(kw => lowerBody.includes(kw));
  };

  // Check if reply has scheduling intent
  const replyHasSchedulingIntent = selectedReply ? hasSchedulingIntent(selectedReply.body) : false;

  // Sort replies by priority (hot first) or time
  const sortedReplies = [...replies].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { hot: 0, warm: 1, cold: 2 };
      const aPriority = priorityOrder[a.urgencyLevel || 'cold'];
      const bPriority = priorityOrder[b.urgencyLevel || 'cold'];
      if (aPriority !== bPriority) return aPriority - bPriority;
      // Secondary sort by sentiment score
      return (b.sentimentScore || 50) - (a.sentimentScore || 50);
    }
    return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
  });

  // Stats
  const hotCount = replies.filter(r => r.urgencyLevel === 'hot' && r.status !== 'sent').length;
  const warmCount = replies.filter(r => r.urgencyLevel === 'warm' && r.status !== 'sent').length;
  const coldCount = replies.filter(r => r.urgencyLevel === 'cold' && r.status !== 'sent').length;
  const newCount = replies.filter(r => r.status === 'new').length;
  const draftedCount = replies.filter(r => r.status === 'ai_drafted').length;
  const approvedCount = replies.filter(r => r.status === 'approved').length;

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success bg-success/10 border-success/30';
      case 'negative': return 'text-destructive bg-destructive/10 border-destructive/30';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getStatusBadge = (status: EmailReply['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>;
      case 'ai_drafted':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">AI Draft Ready</Badge>;
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'sent':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Sent</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
    }
  };

  const generateAIDraft = async (reply: EmailReply) => {
    setIsGenerating(true);
    
    // Simulate AI generation - in production this would call your AI endpoint
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aiDraft = `Hi ${reply.from_name.split(' ')[0]},

Thank you for getting back to us! I appreciate you taking the time to respond.

Based on your message, I'd love to discuss this further and answer any questions you might have.

Would you be available for a quick 15-minute call this week? I can walk you through exactly how we can help ${reply.from_name.includes(' ') ? reply.from_name.split(' ')[1] : 'your business'} achieve your goals.

Looking forward to hearing from you!

Best regards`;

    setReplies(prev => prev.map(r => 
      r.id === reply.id 
        ? { ...r, status: 'ai_drafted' as const, ai_draft: aiDraft }
        : r
    ));
    
    if (selectedReply?.id === reply.id) {
      setSelectedReply({ ...reply, status: 'ai_drafted', ai_draft: aiDraft });
      setEditedDraft(aiDraft);
    }
    
    setIsGenerating(false);
    toast.success('AI draft generated! Review and approve to send.');
  };

  const handleApprove = async () => {
    if (!selectedReply) return;
    
    const finalResponse = editedDraft || selectedReply.ai_draft || '';
    
    setReplies(prev => prev.map(r => 
      r.id === selectedReply.id 
        ? { ...r, status: 'approved' as const, human_response: finalResponse }
        : r
    ));
    
    setSelectedReply({ ...selectedReply, status: 'approved', human_response: finalResponse });
    toast.success('Response approved! Ready to send.');
  };

  const handleSend = async () => {
    if (!selectedReply) return;
    
    setIsSending(true);
    
    try {
      const finalResponse = selectedReply.human_response || editedDraft || selectedReply.ai_draft || '';
      
      if (onSendResponse) {
        await onSendResponse(selectedReply.id, finalResponse);
      } else {
        // Demo mode - simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setReplies(prev => prev.map(r => 
        r.id === selectedReply.id 
          ? { ...r, status: 'sent' as const }
          : r
      ));
      
      toast.success(`Response sent to ${selectedReply.from_email}!`);
      setSelectedReply(null);
      
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setIsSending(false);
    }
  };

  const handleReject = () => {
    if (!selectedReply) return;
    
    setReplies(prev => prev.map(r => 
      r.id === selectedReply.id 
        ? { ...r, status: 'rejected' as const }
        : r
    ));
    
    toast.info('Response rejected. You can regenerate or write manually.');
    setSelectedReply(null);
  };

  const handleRegenerate = async () => {
    if (!selectedReply) return;
    await generateAIDraft(selectedReply);
  };

  const selectReply = (reply: EmailReply) => {
    setSelectedReply(reply);
    setEditedDraft(reply.ai_draft || reply.human_response || '');
  };

  // Get urgency badge
  const getUrgencyBadge = (urgency?: 'hot' | 'warm' | 'cold') => {
    switch (urgency) {
      case 'hot':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1 animate-pulse">
            <Flame className="w-3 h-3" />
            HOT
          </Badge>
        );
      case 'warm':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
            <Zap className="w-3 h-3" />
            Warm
          </Badge>
        );
      case 'cold':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
            <AlertCircle className="w-3 h-3" />
            Cold
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Automation Settings Panel */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card className={`border-2 transition-all ${settingsOpen ? 'border-primary/50 bg-primary/5' : 'border-primary/20'}`}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      AI Automation Settings
                      {settings.responseMode === 'automatic' && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">Full Auto</Badge>
                      )}
                      {settings.autoScheduling && (
                        <Badge className="bg-emerald-500 text-white text-[10px]">Auto-Schedule</Badge>
                      )}
                      {settings.autoProposals && (
                        <Badge className="bg-gradient-to-r from-primary to-violet-600 text-white text-[10px]">Smart Docs</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure how AI handles responses, scheduling, documents, and notifications
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Response Mode Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  AI Response Mode
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSetting('responseMode', 'automatic')}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      settings.responseMode === 'automatic'
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {settings.responseMode === 'automatic' && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px]">Active</Badge>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        settings.responseMode === 'automatic' ? 'bg-primary text-white' : 'bg-muted'
                      }`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Fully Automatic</h4>
                        <p className="text-xs text-muted-foreground">AI responds instantly</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> AI sends responses automatically
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 24/7 instant engagement
                      </li>
                    </ul>
                  </button>
                  
                  <button
                    onClick={() => updateSetting('responseMode', 'manual')}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      settings.responseMode === 'manual'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg'
                        : 'border-border hover:border-emerald-500/50'
                    }`}
                  >
                    {settings.responseMode === 'manual' && (
                      <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px]">Active</Badge>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        settings.responseMode === 'manual' ? 'bg-emerald-500 text-white' : 'bg-muted'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">You Control</h4>
                        <p className="text-xs text-muted-foreground">Review before sending</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> AI drafts, you approve
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Full control over every reply
                      </li>
                    </ul>
                  </button>
                </div>
              </div>
              
              <Separator />
              
              {/* Auto-Scheduling */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                    Auto-Schedule Appointments
                  </Label>
                  <Switch
                    checked={settings.autoScheduling}
                    onCheckedChange={(v) => updateSetting('autoScheduling', v)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  When a lead asks to schedule a call or meeting, AI will automatically book an appointment based on your calendar availability and send them a confirmation.
                </p>
                {settings.autoScheduling && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium mb-1">
                      <CalendarCheck className="w-4 h-4" />
                      Auto-Schedule Active
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Make sure your Google Calendar is connected for this to work.
                    </p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Auto-Proposals & Contracts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Smart Document Suggestions
                  </Label>
                  <Switch
                    checked={settings.autoProposals}
                    onCheckedChange={(v) => updateSetting('autoProposals', v)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will automatically recommend proposals and contracts when it detects that a lead is ready to move forward.
                </p>
                {settings.autoProposals && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/30 text-sm">
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                      <Rocket className="w-4 h-4" />
                      Smart Documents Active
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When leads show buying intent, you'll see personalized document recommendations.
                    </p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Notification Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  Notification Settings
                </Label>
                
                {/* Email Notifications */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Notifications
                    </Label>
                    <Switch
                      checked={settings.notifyEmail}
                      onCheckedChange={(v) => updateSetting('notifyEmail', v)}
                    />
                  </div>
                  {settings.notifyEmail && (
                    <Input
                      type="email"
                      value={settings.notifyEmailAddress}
                      onChange={(e) => updateSetting('notifyEmailAddress', e.target.value)}
                      placeholder="your@email.com"
                      className="h-9 text-sm"
                    />
                  )}
                </div>
                
                {/* SMS Notifications */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      SMS Notifications
                    </Label>
                    <Switch
                      checked={settings.notifySMS}
                      onCheckedChange={(v) => updateSetting('notifySMS', v)}
                    />
                  </div>
                  {settings.notifySMS && (
                    <Input
                      type="tel"
                      value={settings.notifyPhone}
                      onChange={(e) => updateSetting('notifyPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="h-9 text-sm"
                    />
                  )}
                </div>
                
                {/* What to Notify About */}
                {(settings.notifyEmail || settings.notifySMS) && (
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                    <p className="text-xs font-medium text-muted-foreground">Notify me when:</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifyOnHotLead}
                          onChange={(e) => updateSetting('notifyOnHotLead', e.target.checked)}
                          className="rounded"
                        />
                        <Flame className="w-3.5 h-3.5 text-red-500" />
                        A hot lead replies
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifyOnScheduleRequest}
                          onChange={(e) => updateSetting('notifyOnScheduleRequest', e.target.checked)}
                          className="rounded"
                        />
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Someone wants to schedule
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifyOnAIAction}
                          onChange={(e) => updateSetting('notifyOnAIAction', e.target.checked)}
                          className="rounded"
                        />
                        <Bot className="w-3.5 h-3.5 text-amber-500" />
                        AI takes an action (auto-response, auto-schedule)
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => {
                  toast.success('AI Automation settings saved!');
                  setSettingsOpen(false);
                }}
                className="w-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Header with Mode Toggle and Sort */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              AI-Powered Inbox
              <Badge className="bg-primary/20 text-primary text-[10px]">Sentiment Analysis</Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              {settings.responseMode === 'automatic' 
                ? 'AI responds automatically • Hot leads prioritized' 
                : 'Hot leads prioritized • AI drafts • You approve'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              size="sm"
              variant={sortBy === 'priority' ? 'default' : 'ghost'}
              onClick={() => setSortBy('priority')}
              className="h-7 text-xs gap-1"
            >
              <Flame className="w-3 h-3" />
              Priority
            </Button>
            <Button
              size="sm"
              variant={sortBy === 'time' ? 'default' : 'ghost'}
              onClick={() => setSortBy('time')}
              className="h-7 text-xs gap-1"
            >
              <Clock className="w-3 h-3" />
              Time
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-ai" className="text-xs text-muted-foreground">Auto Draft</Label>
            <Switch 
              id="auto-ai"
              checked={autoAIDraft}
              onCheckedChange={setAutoAIDraft}
            />
          </div>
        </div>
      </div>

      {/* Priority Stats Row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-xl font-bold text-red-400">{hotCount}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Hot Leads</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-bold text-amber-400">{warmCount}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Warm</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span className="text-xl font-bold text-blue-400">{coldCount}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Cold</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-2 text-center">
            <div className="text-xl font-bold text-primary">{newCount}</div>
            <div className="text-[10px] text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card className="bg-violet-500/10 border-violet-500/30">
          <CardContent className="p-2 text-center">
            <div className="text-xl font-bold text-violet-400">{draftedCount}</div>
            <div className="text-[10px] text-muted-foreground">Drafted</div>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-2 text-center">
            <div className="text-xl font-bold text-success">{approvedCount}</div>
            <div className="text-[10px] text-muted-foreground">Ready</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Reply List - Now Sorted by Priority */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Incoming Replies
              </span>
              <Badge variant="outline" className="text-[10px]">
                {sortBy === 'priority' ? '🔥 Priority Sort' : '🕐 Time Sort'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-3">
                {sortedReplies.filter(r => r.status !== 'sent').map(reply => (
                  <motion.button
                    key={reply.id}
                    onClick={() => selectReply(reply)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedReply?.id === reply.id
                        ? 'bg-primary/10 border-primary/50'
                        : reply.urgencyLevel === 'hot'
                        ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/30'
                        : 'bg-card hover:bg-muted/50 border-border/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {reply.urgencyLevel === 'hot' && (
                          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                        )}
                        <span className="font-medium text-sm truncate">{reply.from_name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {reply.documentRecommendations && reply.documentRecommendations.length > 0 && (
                          <Badge className="bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary border-primary/30 text-[9px] gap-0.5">
                            <FileText className="w-2.5 h-2.5" />
                            {reply.documentRecommendations.length} Doc{reply.documentRecommendations.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {hasSchedulingIntent(reply.body) && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            Schedule
                          </Badge>
                        )}
                        {getUrgencyBadge(reply.urgencyLevel)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mb-1">
                      {reply.subject}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Sentiment Score Bar */}
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (reply.sentimentScore || 50) >= 65 ? 'bg-success' :
                              (reply.sentimentScore || 50) <= 35 ? 'bg-destructive' : 'bg-amber-500'
                            }`}
                            style={{ width: `${reply.sentimentScore || 50}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{reply.sentimentScore || 50}%</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(reply.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.button>
                ))}
                
                {replies.filter(r => r.status !== 'sent').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending replies</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Response Editor */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Response Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReply ? (
              <div className="space-y-4">
                {/* Sentiment Analysis Card */}
                <div className={`p-3 rounded-lg border ${
                  selectedReply.urgencyLevel === 'hot' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : selectedReply.urgencyLevel === 'warm'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold">AI Sentiment Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(selectedReply.urgencyLevel)}
                      <Badge variant="outline" className="text-[10px]">
                        {selectedReply.sentimentScore || 50}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Sentiment Score Bar */}
                  <div className="mb-2">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          (selectedReply.sentimentScore || 50) >= 65 ? 'bg-success' :
                          (selectedReply.sentimentScore || 50) <= 35 ? 'bg-destructive' : 'bg-amber-500'
                        }`}
                        style={{ width: `${selectedReply.sentimentScore || 50}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Buying Signals */}
                  {selectedReply.buyingSignals && selectedReply.buyingSignals.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-muted-foreground mr-1">Signals:</span>
                      {selectedReply.buyingSignals.map((signal, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="text-[9px] bg-background/50"
                        >
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduling Intent Alert */}
                {replyHasSchedulingIntent && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium text-emerald-600">Scheduling Intent Detected!</p>
                          <p className="text-xs text-muted-foreground">This lead wants to schedule a call or meeting</p>
                        </div>
                      </div>
                      {settings.autoScheduling ? (
                        <Badge className="bg-emerald-500 text-white">
                          <Zap className="w-3 h-3 mr-1" />
                          Auto-Schedule ON
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => {
                            toast.success('Opening calendar to schedule...');
                            // In production, this would open calendar integration
                          }}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule Now
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 🚀 AI Document Recommendations - The Star Feature */}
                {selectedReply.documentRecommendations && selectedReply.documentRecommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-primary/10 to-amber-500/10 rounded-xl" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
                    
                    <div className="relative p-4 rounded-xl border-2 border-primary/40 bg-background/80 backdrop-blur-sm">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm flex items-center gap-2">
                              AI Recommends: Close This Deal!
                              <Badge className="bg-gradient-to-r from-primary to-violet-600 text-white text-[10px] animate-pulse">
                                <Star className="w-2.5 h-2.5 mr-0.5" />
                                HOT
                              </Badge>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              This lead is ready to move forward — send a proposal or contract now
                            </p>
                          </div>
                        </div>
                        {settings.autoProposals && (
                          <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                            <Zap className="w-2.5 h-2.5 mr-0.5" />
                            Auto-Suggest ON
                          </Badge>
                        )}
                      </div>

                      {/* Document Recommendations Grid */}
                      <div className="grid gap-2">
                        {selectedReply.documentRecommendations.slice(0, 3).map((rec, idx) => (
                          <motion.div
                            key={`${rec.type}-${rec.document.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative group p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                              rec.urgency === 'high'
                                ? 'border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10'
                                : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40'
                            }`}
                            onClick={() => handlePreviewDocument(rec)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                  rec.type === 'proposal'
                                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                                    : 'bg-gradient-to-br from-primary/20 to-violet-500/20'
                                }`}>
                                  {rec.type === 'proposal' ? <FileText className="w-5 h-5 text-amber-600" /> : <FileSignature className="w-5 h-5 text-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-sm truncate">{rec.document.name}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[9px] ${
                                        rec.type === 'proposal' 
                                          ? 'border-amber-500/50 text-amber-600' 
                                          : 'border-primary/50 text-primary'
                                      }`}
                                    >
                                      {rec.type === 'proposal' ? 'Proposal' : 'Contract'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{rec.reason}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
                                          style={{ width: `${rec.confidence}%` }}
                                        />
                                      </div>
                                      <span className="text-[9px] text-muted-foreground font-medium">{rec.confidence}% match</span>
                                    </div>
                                    {rec.urgency === 'high' && (
                                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-[9px] gap-0.5">
                                        <Flame className="w-2.5 h-2.5" />
                                        Urgent
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewDocument(rec);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 gap-1 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewDocument(rec);
                                  }}
                                >
                                  <Send className="w-3 h-3" />
                                  Send
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Quick Send All */}
                      {selectedReply.documentRecommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {selectedReply.documentRecommendations.length} document{selectedReply.documentRecommendations.length > 1 ? 's' : ''} recommended for this conversation
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1 border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => {
                              toast.info('Opening Document Hub...', {
                                description: 'View and customize all proposals and contracts'
                              });
                            }}
                          >
                            <Briefcase className="w-3 h-3" />
                            View All Documents
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Original Message Preview */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedReply.from_name}</span>
                    <span className="text-xs text-muted-foreground">({selectedReply.from_email})</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedReply.body}</p>
                </div>

                <Separator />

                {/* AI Draft or Editor */}
                {selectedReply.status === 'new' && !selectedReply.ai_draft ? (
                  <div className="text-center py-6">
                    <Bot className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Let AI draft a response based on the conversation
                    </p>
                    <Button 
                      onClick={() => generateAIDraft(selectedReply)}
                      disabled={isGenerating}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate AI Draft
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">AI Suggested Response</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="text-xs gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Regenerate
                      </Button>
                    </div>
                    
                    <Textarea
                      value={editedDraft}
                      onChange={(e) => setEditedDraft(e.target.value)}
                      className="min-h-[200px] text-sm"
                      placeholder="Edit the AI draft or write your own response..."
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {selectedReply.status !== 'approved' && (
                        <Button 
                          onClick={handleApprove}
                          className="flex-1 gap-2 bg-success hover:bg-success/90"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Approve Draft
                        </Button>
                      )}
                      
                      {selectedReply.status === 'approved' && (
                        <Button 
                          onClick={handleSend}
                          disabled={isSending}
                          className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Response
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={handleReject}
                        className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a reply to view and respond</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works - Updated */}
      <Card className="bg-gradient-to-r from-violet-500/5 via-primary/5 to-amber-500/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                AI-Powered Inbox + Smart Documents
                <Badge className="bg-primary/20 text-primary text-[9px]">NEW</Badge>
              </h4>
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  AI analyzes sentiment & detects buying signals
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold">2</span>
                  Smart document recommendations when leads are ready
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center text-[10px] font-bold">3</span>
                  One-click send proposals & contracts
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">4</span>
                  Auto-schedule meetings & close deals faster
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              {selectedDocument?.type === 'proposal' ? (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <span className="text-lg">{selectedDocument?.document.name}</span>
                <p className="text-sm font-normal text-muted-foreground">
                  Preview for {selectedReply?.from_name} ({selectedReply?.from_email})
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview and send the {selectedDocument?.type} to the lead
            </DialogDescription>
          </DialogHeader>
          
          {/* Document Preview */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-white">
            <iframe
              srcDoc={documentPreviewHTML}
              className="w-full h-[50vh] border-0"
              title="Document Preview"
            />
          </div>
          
          {/* Actions */}
          <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(documentPreviewHTML);
                  toast.success('HTML copied to clipboard!');
                }}
                className="gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([documentPreviewHTML], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedDocument?.document.name?.replace(/\s+/g, '-').toLowerCase() || 'document'}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Document downloaded!');
                }}
                className="gap-1"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDocumentPreview(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendDocument}
                disabled={isSendingDocument}
                className="gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 min-w-[140px]"
              >
                {isSendingDocument ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to {selectedReply?.from_name?.split(' ')[0]}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
