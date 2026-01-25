import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Mail, Bot, User, Send, Edit3, Check, X, RefreshCw,
  Sparkles, Clock, CheckCircle2, MessageSquare, Loader2,
  ThumbsUp, ThumbsDown, RotateCcw, Eye, ArrowRight, Flame, Zap, 
  TrendingUp, AlertCircle, BarChart3, Brain, Settings, Bell,
  Calendar, Phone, BellRing, ChevronDown, Shield, CalendarCheck,
  FileText, FileSignature, Rocket, Star, Gift, Target, Briefcase,
  ArrowUpRight, Copy, Download, ExternalLink, Inbox, Workflow,
  Linkedin, Plus, Pause, Play, Users, ChevronRight, MoreHorizontal,
  MousePointer, Sun, Moon, Flag, Archive, Reply, ReplyAll, Forward,
  Filter, Search, ChevronLeft, MailOpen, Trash2
} from 'lucide-react';
import { PROPOSAL_TEMPLATES, ProposalTemplate, generateProposalHTML } from '@/lib/proposalTemplates';
import { CONTRACT_TEMPLATES, ContractTemplate, generateContractHTML } from '@/lib/contractTemplates';

// AI Automation Settings interface
interface AIAutomationSettings {
  responseMode: 'automatic' | 'manual';
  autoScheduling: boolean;
  autoProposals: boolean;
  notifyEmail: boolean;
  notifyEmailAddress: string;
  notifySMS: boolean;
  notifyPhone: string;
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
  confidence: number;
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
  sentimentScore?: number;
  urgencyLevel?: 'hot' | 'warm' | 'cold';
  buyingSignals?: string[];
  documentRecommendations?: DocumentRecommendation[];
  isRead?: boolean;
  isFlagged?: boolean;
}

interface AIResponseInboxProps {
  onSendResponse?: (replyId: string, response: string) => Promise<void>;
}

// Tab types
type MailboxTab = 'inbox' | 'sent' | 'drafts' | 'templates' | 'sequences' | 'contracts';

// Quick filters
type QuickFilter = 'all' | 'unread' | 'flagged' | 'followup';

// Sequence types
interface SequenceStep {
  id: string;
  type: 'email' | 'linkedin' | 'sms' | 'wait' | 'call';
  content?: string;
  subject?: string;
  waitDays?: number;
}

interface Sequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  status: 'active' | 'paused' | 'draft';
  leadsEnrolled: number;
  stats: { sent: number; opened: number; replied: number; };
}

// Demo data
const DEMO_SEQUENCES: Sequence[] = [
  {
    id: '1',
    name: 'LinkedIn Outreach',
    steps: [
      { id: '1a', type: 'linkedin', content: 'Connection request' },
      { id: '1b', type: 'email', subject: 'Email Follow-Up' },
      { id: '1c', type: 'wait', waitDays: 2 },
      { id: '1d', type: 'email', subject: 'Final Email' },
    ],
    status: 'active',
    leadsEnrolled: 47,
    stats: { sent: 188, opened: 142, replied: 23 },
  },
  {
    id: '2',
    name: 'Email Nurture Sequence',
    steps: [
      { id: '2a', type: 'email', subject: 'Initial Email' },
      { id: '2b', type: 'wait', waitDays: 3 },
      { id: '2c', type: 'email', subject: 'Follow-Up Email' },
      { id: '2d', type: 'call', content: 'Final Message' },
    ],
    status: 'active',
    leadsEnrolled: 156,
    stats: { sent: 624, opened: 498, replied: 67 },
  },
  {
    id: '3',
    name: 'SMS Follow-Up',
    steps: [
      { id: '3a', type: 'sms', content: 'Send SMS' },
      { id: '3b', type: 'wait', waitDays: 1 },
      { id: '3c', type: 'email', subject: 'Send Email' },
    ],
    status: 'active',
    leadsEnrolled: 89,
    stats: { sent: 267, opened: 201, replied: 45 },
  },
  {
    id: '4',
    name: 'Cold Email Campaign',
    steps: [
      { id: '4a', type: 'email', subject: 'Intro Email' },
      { id: '4b', type: 'wait', waitDays: 4 },
      { id: '4c', type: 'email', subject: 'Follow-Up' },
      { id: '4d', type: 'email', subject: 'Final Email' },
    ],
    status: 'active',
    leadsEnrolled: 234,
    stats: { sent: 936, opened: 655, replied: 89 },
  },
];

// Demo replies
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
    isRead: false,
    isFlagged: true,
    documentRecommendations: [
      {
        type: 'proposal',
        document: PROPOSAL_TEMPLATES.find(p => p.id === 'website-design')!,
        reason: 'Lead mentioned website interest',
        confidence: 92,
        urgency: 'high'
      }
    ],
    ai_draft: `Hi John,\n\nThank you for your interest! I'd be happy to provide more details.\n\n**Pricing**: Our website packages start at $2,500 for a basic 5-page site, with custom solutions available based on your specific needs.\n\n**Timeline**: A typical project takes 2-4 weeks from start to launch.\n\nWould you be available for a quick 15-minute call this week to discuss your requirements? I can share some examples of similar work we've done for plumbing businesses.\n\nBest regards`
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
    buyingSignals: ['Asking for case studies', 'Considering timing'],
    isRead: true,
    isFlagged: false,
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
    isRead: false,
    isFlagged: true,
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
    ai_draft: `Hi Mike,\n\nFantastic! I'd love to help you attract more customers to City Auto Repair.\n\nI have availability:\n- Tomorrow at 2pm or 4pm\n- Thursday at 10am or 3pm\n\nWhich time works best for you? The call will be about 20 minutes, and I'll walk you through exactly how we can help you get more repair jobs.\n\nLooking forward to connecting!`
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
    buyingSignals: [],
    isRead: true,
    isFlagged: false,
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
    isRead: false,
    isFlagged: false,
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
    isRead: false,
    isFlagged: true,
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

export default function AIResponseInbox({ onSendResponse }: AIResponseInboxProps) {
  // State
  const [activeTab, setActiveTab] = useState<MailboxTab>('inbox');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sequences, setSequences] = useState<Sequence[]>(DEMO_SEQUENCES);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [replies, setReplies] = useState<EmailReply[]>(DEMO_REPLIES);
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [editedDraft, setEditedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AIAutomationSettings>(loadSettings);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecommendation | null>(null);
  const [isSendingDocument, setIsSendingDocument] = useState(false);
  const [documentPreviewHTML, setDocumentPreviewHTML] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Save settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof AIAutomationSettings>(key: K, value: AIAutomationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Computed values
  const unreadCount = replies.filter(r => !r.isRead && r.status !== 'sent').length;
  const flaggedCount = replies.filter(r => r.isFlagged).length;
  const hotCount = replies.filter(r => r.urgencyLevel === 'hot' && r.status !== 'sent').length;

  // Filter replies
  const filteredReplies = replies
    .filter(r => r.status !== 'sent')
    .filter(r => {
      if (quickFilter === 'unread') return !r.isRead;
      if (quickFilter === 'flagged') return r.isFlagged;
      if (quickFilter === 'followup') return r.urgencyLevel === 'hot' || r.urgencyLevel === 'warm';
      return true;
    })
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.from_name.toLowerCase().includes(q) || 
             r.subject.toLowerCase().includes(q) ||
             r.body.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const priorityOrder = { hot: 0, warm: 1, cold: 2 };
      const aPriority = priorityOrder[a.urgencyLevel || 'cold'];
      const bPriority = priorityOrder[b.urgencyLevel || 'cold'];
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
    });

  // Handlers
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
      return { companyName: 'Your Company', contactName: 'Your Name', email: 'you@company.com', phone: '', logoUrl: '' };
    }
  };

  const generateDocumentPreviewHTML = (recommendation: DocumentRecommendation, recipientEmail: string, recipientName: string) => {
    const branding = loadBranding();
    if (recommendation.type === 'proposal') {
      return generateProposalHTML(recommendation.document as ProposalTemplate, { businessName: recipientName.split(' ').pop() || recipientName, contactName: recipientName, email: recipientEmail }, { companyName: branding.companyName, contactName: branding.contactName, email: branding.email, phone: branding.phone, logoUrl: branding.logoUrl });
    } else {
      return generateContractHTML(recommendation.document as ContractTemplate, {}, { companyName: branding.companyName, logoUrl: branding.logoUrl });
    }
  };

  const handlePreviewDocument = (recommendation: DocumentRecommendation) => {
    if (!selectedReply) return;
    const html = generateDocumentPreviewHTML(recommendation, selectedReply.from_email, selectedReply.from_name);
    setSelectedDocument(recommendation);
    setDocumentPreviewHTML(html);
    setShowDocumentPreview(true);
  };

  const handleSendDocument = async () => {
    if (!selectedDocument || !selectedReply) return;
    setIsSendingDocument(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(`${selectedDocument.type === 'proposal' ? 'Proposal' : 'Contract'} sent to ${selectedReply.from_email}!`, { description: `${selectedDocument.document.name} has been delivered.` });
    setShowDocumentPreview(false);
    setIsSendingDocument(false);
    setSelectedDocument(null);
  };

  const hasSchedulingIntent = (body: string): boolean => {
    const keywords = ['schedule', 'book', 'appointment', 'call', 'meeting', 'when can', 'available', 'calendar', 'slot', 'time'];
    return keywords.some(kw => body.toLowerCase().includes(kw));
  };

  const generateAIDraft = async (reply: EmailReply) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const aiDraft = `Hi ${reply.from_name.split(' ')[0]},\n\nThank you for getting back to us! I appreciate you taking the time to respond.\n\nBased on your message, I'd love to discuss this further and answer any questions you might have.\n\nWould you be available for a quick 15-minute call this week? I can walk you through exactly how we can help ${reply.from_name.includes(' ') ? reply.from_name.split(' ')[1] : 'your business'} achieve your goals.\n\nLooking forward to hearing from you!\n\nBest regards`;
    setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, status: 'ai_drafted' as const, ai_draft: aiDraft } : r));
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
    setReplies(prev => prev.map(r => r.id === selectedReply.id ? { ...r, status: 'approved' as const, human_response: finalResponse } : r));
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
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setReplies(prev => prev.map(r => r.id === selectedReply.id ? { ...r, status: 'sent' as const } : r));
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
    setReplies(prev => prev.map(r => r.id === selectedReply.id ? { ...r, status: 'rejected' as const } : r));
    toast.info('Response rejected. You can regenerate or write manually.');
    setSelectedReply(null);
  };

  const selectReply = (reply: EmailReply) => {
    // Mark as read
    setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, isRead: true } : r));
    setSelectedReply({ ...reply, isRead: true });
    setEditedDraft(reply.ai_draft || reply.human_response || '');
  };

  const toggleFlag = (id: string) => {
    setReplies(prev => prev.map(r => r.id === id ? { ...r, isFlagged: !r.isFlagged } : r));
    if (selectedReply?.id === id) {
      setSelectedReply(prev => prev ? { ...prev, isFlagged: !prev.isFlagged } : null);
    }
  };

  const archiveEmail = (id: string) => {
    setReplies(prev => prev.filter(r => r.id !== id));
    if (selectedReply?.id === id) setSelectedReply(null);
    toast.success('Email archived');
  };

  const toggleSequence = (id: string) => {
    setSequences(prev => prev.map(seq => seq.id === id ? { ...seq, status: seq.status === 'active' ? 'paused' : 'active' } : seq));
    toast.success(sequences.find(s => s.id === id)?.status === 'active' ? 'Sequence paused' : 'Sequence activated');
  };

  // Navigation items
  const navItems = [
    { id: 'inbox' as MailboxTab, label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'sent' as MailboxTab, label: 'Sent', icon: Send },
    { id: 'drafts' as MailboxTab, label: 'Drafts', icon: Edit3 },
    { id: 'templates' as MailboxTab, label: 'Templates', icon: FileText },
    { id: 'sequences' as MailboxTab, label: 'Sequences & Follow-Up', icon: Workflow },
    { id: 'contracts' as MailboxTab, label: 'Contracts & Proposals', icon: FileSignature },
  ];

  const quickFilters = [
    { id: 'all' as QuickFilter, label: 'All' },
    { id: 'unread' as QuickFilter, label: 'Unread', count: unreadCount },
    { id: 'flagged' as QuickFilter, label: 'Flagged', count: flaggedCount },
    { id: 'followup' as QuickFilter, label: 'Follow-Up' },
  ];

  // Render the 3-panel mailbox layout
  return (
    <div className="w-full h-[calc(100vh-200px)] min-h-[600px] bg-white rounded-xl shadow-xl overflow-hidden flex border border-slate-200">
      {/* LEFT PANEL - Navigation */}
      <div className={`bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Mailbox</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronLeft className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* New Email Counter */}
        {!sidebarCollapsed && unreadCount > 0 && (
          <div className="px-4 py-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg animate-pulse">
                {unreadCount}
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">New Emails</p>
                <p className="text-xs text-emerald-600">{hotCount} hot leads!</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.count && item.count > 0 && (
                    <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 min-w-[20px] justify-center">
                      {item.count}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>

      {/* CENTER PANEL - Email List / Tab Content */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-white">
        {activeTab === 'inbox' ? (
          <>
            {/* Search & Filters */}
            <div className="p-3 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              
              {/* Quick Filters */}
              <div className="flex gap-1.5 flex-wrap">
                {quickFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setQuickFilter(filter.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                      quickFilter === filter.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                    {filter.count && filter.count > 0 && (
                      <span className={`px-1 rounded-full text-[10px] ${
                        quickFilter === filter.id ? 'bg-white/20' : 'bg-slate-200'
                      }`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Email List */}
            <ScrollArea className="flex-1">
              <div className="divide-y divide-slate-100">
                {filteredReplies.map(reply => (
                  <button
                    key={reply.id}
                    onClick={() => selectReply(reply)}
                    className={`w-full p-3 text-left transition-all hover:bg-slate-50 ${
                      selectedReply?.id === reply.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
                    } ${!reply.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                        reply.urgencyLevel === 'hot' ? 'bg-red-500' :
                        reply.urgencyLevel === 'warm' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}>
                        {reply.from_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate ${!reply.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {reply.from_name}
                          </span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                            {new Date(reply.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <p className={`text-xs truncate mb-1 ${!reply.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                          {reply.subject}
                        </p>
                        
                        <p className="text-xs text-slate-400 truncate">{reply.body}</p>
                        
                        {/* Status indicators */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {reply.urgencyLevel === 'hot' && (
                            <Badge className="bg-red-100 text-red-700 border-0 text-[10px] gap-0.5 px-1.5">
                              <Flame className="w-2.5 h-2.5" /> Hot
                            </Badge>
                          )}
                          {reply.isFlagged && (
                            <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                          {!reply.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                          {reply.documentRecommendations && reply.documentRecommendations.length > 0 && (
                            <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] px-1.5">
                              <FileText className="w-2.5 h-2.5 mr-0.5" /> Doc
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredReplies.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <MailOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No emails match your filter</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : activeTab === 'sequences' ? (
          <>
            {/* Sequences Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900">Sequences</h2>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5">
                  <Plus className="w-4 h-4" /> Create
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Automation:</span>
                <Badge className={`text-xs ${automationEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {automationEnabled ? 'ON' : 'OFF'}
                </Badge>
                <Switch
                  checked={automationEnabled}
                  onCheckedChange={(v) => {
                    setAutomationEnabled(v);
                    toast.success(v ? '🤖 AI automation enabled' : 'Automation paused');
                  }}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            {/* Sequences List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {sequences.map(sequence => (
                  <div
                    key={sequence.id}
                    className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-slate-900">{sequence.name}</h3>
                      <Badge className={`text-[10px] ${sequence.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {sequence.status === 'active' ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    
                    {/* Steps preview */}
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {sequence.steps.slice(0, 4).map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                          <div className={`p-1 rounded text-[10px] ${
                            step.type === 'email' ? 'bg-emerald-100 text-emerald-700' :
                            step.type === 'linkedin' ? 'bg-blue-100 text-blue-700' :
                            step.type === 'sms' ? 'bg-violet-100 text-violet-700' :
                            step.type === 'call' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {step.type === 'email' && <Mail className="w-3 h-3" />}
                            {step.type === 'linkedin' && <Linkedin className="w-3 h-3" />}
                            {step.type === 'sms' && <MessageSquare className="w-3 h-3" />}
                            {step.type === 'call' && <Phone className="w-3 h-3" />}
                            {step.type === 'wait' && <Clock className="w-3 h-3" />}
                          </div>
                          {idx < sequence.steps.length - 1 && idx < 3 && (
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{sequence.leadsEnrolled} leads enrolled</span>
                      <span>{sequence.stats.replied} replies</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Email Viewer / Editor */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedReply ? (
          <>
            {/* Email Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    selectedReply.urgencyLevel === 'hot' ? 'bg-red-500' :
                    selectedReply.urgencyLevel === 'warm' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}>
                    {selectedReply.from_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">{selectedReply.from_name}</h2>
                    <p className="text-sm text-slate-500">{selectedReply.from_email}</p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toast.info('Reply')}>
                    <Reply className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toast.info('Reply All')}>
                    <ReplyAll className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toast.info('Forward')}>
                    <Forward className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => archiveEmail(selectedReply.id)}>
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleFlag(selectedReply.id)}
                    className={selectedReply.isFlagged ? 'text-amber-500' : ''}
                  >
                    <Flag className={`w-4 h-4 ${selectedReply.isFlagged ? 'fill-amber-500' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{selectedReply.subject}</h3>
              
              <div className="flex items-center gap-2 flex-wrap">
                {selectedReply.urgencyLevel === 'hot' && (
                  <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                    <Flame className="w-3 h-3" /> Hot Lead
                  </Badge>
                )}
                {selectedReply.sentiment === 'positive' && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">Positive Sentiment</Badge>
                )}
                {hasSchedulingIntent(selectedReply.body) && (
                  <Badge className="bg-blue-100 text-blue-700 border-0 gap-1">
                    <Calendar className="w-3 h-3" /> Wants to Schedule
                  </Badge>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(selectedReply.received_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Email Content */}
            <ScrollArea className="flex-1 p-4">
              {/* AI Analysis Card */}
              {selectedReply.urgencyLevel && (
                <div className={`mb-4 p-4 rounded-xl border ${
                  selectedReply.urgencyLevel === 'hot' ? 'bg-red-50 border-red-200' :
                  selectedReply.urgencyLevel === 'warm' ? 'bg-amber-50 border-amber-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-slate-900">AI Analysis</span>
                    <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">
                      {selectedReply.sentimentScore}% confidence
                    </Badge>
                  </div>
                  
                  {/* Sentiment bar */}
                  <div className="mb-3">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          (selectedReply.sentimentScore || 50) >= 65 ? 'bg-emerald-500' :
                          (selectedReply.sentimentScore || 50) <= 35 ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${selectedReply.sentimentScore || 50}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Buying Signals */}
                  {selectedReply.buyingSignals && selectedReply.buyingSignals.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-500">Signals:</span>
                      {selectedReply.buyingSignals.map((signal, i) => (
                        <Badge key={i} className="bg-white border border-slate-200 text-slate-700 text-[10px]">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Document Recommendations */}
              {selectedReply.documentRecommendations && selectedReply.documentRecommendations.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-emerald-50 border border-violet-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-slate-900">AI Recommends: Close This Deal!</span>
                    <Badge className="bg-gradient-to-r from-violet-500 to-emerald-500 text-white text-[10px] animate-pulse">
                      Ready to Close
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedReply.documentRecommendations.slice(0, 2).map((rec, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handlePreviewDocument(rec)}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            rec.type === 'proposal' ? 'bg-amber-100' : 'bg-violet-100'
                          }`}>
                            {rec.type === 'proposal' ? 
                              <FileText className="w-5 h-5 text-amber-600" /> : 
                              <FileSignature className="w-5 h-5 text-violet-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{rec.document.name}</p>
                            <p className="text-xs text-slate-500">{rec.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                            {rec.confidence}% match
                          </Badge>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Send className="w-3 h-3 mr-1" /> Send
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Message */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedReply.body}</p>
              </div>

              <Separator className="my-4" />

              {/* Response Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-slate-900">AI Response</span>
                  {selectedReply.status === 'ai_drafted' && (
                    <Badge className="bg-amber-100 text-amber-700">Draft Ready</Badge>
                  )}
                  {selectedReply.status === 'approved' && (
                    <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>
                  )}
                </div>

                {selectedReply.status === 'new' && !selectedReply.ai_draft ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                    <p className="text-sm text-slate-500 mb-4">Let AI draft a response based on the conversation</p>
                    <Button 
                      onClick={() => generateAIDraft(selectedReply)}
                      disabled={isGenerating}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => generateAIDraft(selectedReply)}
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
                      className="min-h-[200px] text-sm border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Edit the AI draft or write your own response..."
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      {selectedReply.status !== 'approved' && (
                        <Button 
                          onClick={handleApprove}
                          className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Approve Draft
                        </Button>
                      )}
                      
                      {selectedReply.status === 'approved' && (
                        <Button 
                          onClick={handleSend}
                          disabled={isSending}
                          className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
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
                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Select an email to view</h3>
              <p className="text-sm">Choose from your inbox to read and respond</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              AI Automation Settings
            </DialogTitle>
            <DialogDescription>Configure how AI handles your responses and notifications</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Response Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">AI Response Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSetting('responseMode', 'automatic')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.responseMode === 'automatic' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Zap className={`w-5 h-5 mb-2 ${settings.responseMode === 'automatic' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <h4 className="font-semibold text-sm">Fully Automatic</h4>
                  <p className="text-xs text-slate-500">AI sends responses instantly</p>
                </button>
                
                <button
                  onClick={() => updateSetting('responseMode', 'manual')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.responseMode === 'manual' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Shield className={`w-5 h-5 mb-2 ${settings.responseMode === 'manual' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <h4 className="font-semibold text-sm">You Control</h4>
                  <p className="text-xs text-slate-500">Review before sending</p>
                </button>
              </div>
            </div>
            
            <Separator />
            
            {/* Auto Features */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Auto-Schedule Appointments</Label>
                  <p className="text-xs text-slate-500">AI books meetings based on your calendar</p>
                </div>
                <Switch checked={settings.autoScheduling} onCheckedChange={(v) => updateSetting('autoScheduling', v)} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Smart Document Suggestions</Label>
                  <p className="text-xs text-slate-500">AI recommends proposals when leads are ready</p>
                </div>
                <Switch checked={settings.autoProposals} onCheckedChange={(v) => updateSetting('autoProposals', v)} />
              </div>
            </div>
            
            <Separator />
            
            {/* Notifications */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </Label>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Email Notifications</Label>
                <Switch checked={settings.notifyEmail} onCheckedChange={(v) => updateSetting('notifyEmail', v)} />
              </div>
              {settings.notifyEmail && (
                <Input
                  type="email"
                  value={settings.notifyEmailAddress}
                  onChange={(e) => updateSetting('notifyEmailAddress', e.target.value)}
                  placeholder="your@email.com"
                  className="h-9"
                />
              )}
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">SMS Notifications</Label>
                <Switch checked={settings.notifySMS} onCheckedChange={(v) => updateSetting('notifySMS', v)} />
              </div>
              {settings.notifySMS && (
                <Input
                  type="tel"
                  value={settings.notifyPhone}
                  onChange={(e) => updateSetting('notifyPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="h-9"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDocument?.type === 'proposal' ? (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <span className="text-lg">{selectedDocument?.document.name}</span>
                <p className="text-sm font-normal text-slate-500">
                  Preview for {selectedReply?.from_name} ({selectedReply?.from_email})
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Preview and send the document</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden rounded-lg border bg-white">
            <iframe srcDoc={documentPreviewHTML} className="w-full h-[50vh] border-0" title="Document Preview" />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(documentPreviewHTML); toast.success('HTML copied!'); }} className="gap-1">
                <Copy className="w-4 h-4" /> Copy HTML
              </Button>
              <Button variant="outline" size="sm" onClick={() => { const blob = new Blob([documentPreviewHTML], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedDocument?.document.name?.replace(/\s+/g, '-').toLowerCase() || 'document'}.html`; a.click(); URL.revokeObjectURL(url); toast.success('Downloaded!'); }} className="gap-1">
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowDocumentPreview(false)}>Cancel</Button>
              <Button onClick={handleSendDocument} disabled={isSendingDocument} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 min-w-[140px]">
                {isSendingDocument ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send to {selectedReply?.from_name?.split(' ')[0]}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
