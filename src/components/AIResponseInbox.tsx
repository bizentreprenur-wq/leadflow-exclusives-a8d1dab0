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
import { cn } from '@/lib/utils';
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
  Filter, Search, ChevronLeft, MailOpen, Trash2, Image, Bold, Italic,
  Underline, List, Link2, PenTool, Wand2, CalendarPlus, WifiOff, Server,
  GripVertical, ListChecks
} from 'lucide-react';
import { PROPOSAL_TEMPLATES, ProposalTemplate, generateProposalHTML } from '@/lib/proposalTemplates';
import { CONTRACT_TEMPLATES, ContractTemplate, generateContractHTML } from '@/lib/contractTemplates';
import { getUserLogoFromStorage } from '@/hooks/useUserBranding';
import { 
  sendSingleEmail, 
  isSMTPConfigured, 
  getEmailBranding, 
  applyBrandingToHtml 
} from '@/lib/emailService';
import { getSends, EmailSend } from '@/lib/api/email';

// Import the tab content components
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import BamLeadCRMPanel from './BamLeadCRMPanel';
import ABTestingPanel from './ABTestingPanel';
import AutoFollowUpBuilder from './AutoFollowUpBuilder';
import SMTPConfigPanel from './SMTPConfigPanel';
import ProposalsContractsPanel from './ProposalsContractsPanel';
import EmailActivityFeed from './EmailActivityFeed';
import SequenceBuilderModule from './SequenceBuilderModule';
import LeadJourneyDashboard from './LeadJourneyDashboard';

// Email template interface
interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body?: string;
  html?: string;
  category?: string;
}

// Lead interface
interface Lead {
  id?: string | number;
  title?: string;
  name?: string;
  email?: string;
  phone?: string;
  category?: 'hot' | 'warm' | 'cold';
  verified?: boolean;
}

// Compose email interface
interface ComposeEmail {
  to: string;
  toName: string;
  subject: string;
  body: string;
  attachedDocument?: {
    type: 'proposal' | 'contract';
    document: ProposalTemplate | ContractTemplate;
  };
  includeAppointmentLink: boolean;
  appointmentSlots: string[];
  isAIGenerated: boolean;
  selectedTemplate?: EmailTemplate | null;
  selectedLeadCategory?: 'hot' | 'warm' | 'cold' | 'all';
}

// Appointment slot interface
interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
}

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
  /** Campaign context passed from MailboxDock */
  campaignContext?: {
    isActive: boolean;
    sentCount: number;
    totalLeads: number;
  };
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

// Default appointment slots
const DEFAULT_APPOINTMENT_SLOTS = [
  'Tomorrow at 2:00 PM',
  'Tomorrow at 4:00 PM',
  'Thursday at 10:00 AM',
  'Thursday at 3:00 PM',
  'Friday at 11:00 AM'
];

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

export default function AIResponseInbox({ onSendResponse, campaignContext }: AIResponseInboxProps) {
  // State
  const [activeTab, setActiveTab] = useState<MailboxTab>('inbox');
  const [mailboxTheme, setMailboxTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bamlead_mailbox_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
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
  
  // Sent emails tracking for drip campaign sync
  const [sentEmails, setSentEmails] = useState<EmailSend[]>([]);
  const [isLoadingSentEmails, setIsLoadingSentEmails] = useState(false);
  
  // Compose email state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeEmail, setComposeEmail] = useState<ComposeEmail>({
    to: '',
    toName: '',
    subject: '',
    body: '',
    includeAppointmentLink: false,
    appointmentSlots: [],
    isAIGenerated: false,
    selectedTemplate: null,
    selectedLeadCategory: 'all'
  });
  const [composeAIMode, setComposeAIMode] = useState(true);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [isGeneratingComposeAI, setIsGeneratingComposeAI] = useState(false);
  const [selectedAppointmentSlots, setSelectedAppointmentSlots] = useState<string[]>([]);
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [newSequenceSteps, setNewSequenceSteps] = useState<SequenceStep[]>([]);
  
  // Default email templates
  const defaultEmailTemplates: EmailTemplate[] = [
    { id: 'aggressive', name: 'Aggressive Pitch', subject: 'Quick question about {{business}}', category: 'hot' },
    { id: 'friendly', name: 'Friendly Intro', subject: 'Helping {{business}} grow online', category: 'warm' },
    { id: 'educational', name: 'Educational Value', subject: 'Free tips for {{business}}', category: 'cold' },
    { id: 'followup', name: 'Follow-Up', subject: 'Following up on my last email', category: 'all' },
    { id: 'referral', name: 'Referral Request', subject: 'Quick favor to ask', category: 'warm' },
  ];
  
  // Demo leads for selection
  const [availableLeads] = useState<Lead[]>([
    { id: '1', name: 'Acme Plumbing Co', email: 'john@acmeplumbing.com', category: 'hot', verified: true },
    { id: '2', name: 'Green Leaf Landscaping', email: 'sarah@greenleaf.com', category: 'hot', verified: true },
    { id: '3', name: 'City Auto Repair', email: 'mike@cityauto.com', category: 'warm', verified: true },
    { id: '4', name: 'Budget Flooring', email: 'linda@budgetflooring.com', category: 'warm', verified: false },
    { id: '5', name: 'Quick Print Shop', email: 'david@quickprint.com', category: 'cold', verified: false },
  ]);
  
  // Top-level mailbox navigation state
  type TopNavTab = 'mailbox' | 'preview' | 'crm' | 'ab' | 'smtp';
  type MailboxSubTab = 'inbox' | 'sent' | 'journey' | 'activity' | 'sequences' | 'followups' | 'documents';
  type DocumentWorkspaceTab = 'proposals' | 'contracts' | 'my-documents';
  const [topTab, setTopTab] = useState<TopNavTab>('mailbox');
  const [mailboxSubTab, setMailboxSubTab] = useState<MailboxSubTab>('inbox');
  const [documentWorkspaceTab, setDocumentWorkspaceTab] = useState<DocumentWorkspaceTab>('proposals');
  
  // Custom user documents storage
  const [customProposals, setCustomProposals] = useState<ProposalTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('bamlead_custom_proposals');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [customContracts, setCustomContracts] = useState<ContractTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('bamlead_custom_contracts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // Document selection for auto-compose
  const [selectedDocForCompose, setSelectedDocForCompose] = useState<{
    type: 'proposal' | 'contract';
    document: ProposalTemplate | ContractTemplate;
  } | null>(null);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [editingDocument, setEditingDocument] = useState<{
    type: 'proposal' | 'contract';
    document: ProposalTemplate | ContractTemplate;
    isNew: boolean;
  } | null>(null);
  
  // Handle document selection and auto-compose
  const handleDocumentSelect = (type: 'proposal' | 'contract', document: ProposalTemplate | ContractTemplate) => {
    setSelectedDocForCompose({ type, document });
    toast.success(`✅ "${document.name}" selected! Click "Use This" to compose email.`);
  };
  
  const handleUseDocument = () => {
    if (!selectedDocForCompose) return;
    setComposeEmail(prev => ({
      ...prev,
      attachedDocument: selectedDocForCompose
    }));
    openComposeModal();
    toast.success(`📧 Email composer opened with ${selectedDocForCompose.document.name}!`);
    setSelectedDocForCompose(null);
  };
  
  // Create/Edit custom document
  const handleSaveCustomDocument = (type: 'proposal' | 'contract', document: ProposalTemplate | ContractTemplate) => {
    if (type === 'proposal') {
      const newDoc = { ...(document as ProposalTemplate), id: `custom-${Date.now()}` } as ProposalTemplate;
      const updated = [newDoc, ...customProposals];
      setCustomProposals(updated);
      localStorage.setItem('bamlead_custom_proposals', JSON.stringify(updated));
      toast.success(`✅ Proposal "${document.name}" saved to My Documents!`);
    } else {
      const newDoc = { ...(document as ContractTemplate), id: `custom-${Date.now()}` } as ContractTemplate;
      const updated = [newDoc, ...customContracts];
      setCustomContracts(updated);
      localStorage.setItem('bamlead_custom_contracts', JSON.stringify(updated));
      toast.success(`✅ Contract "${document.name}" saved to My Documents!`);
    }
    setShowDocumentEditor(false);
    setEditingDocument(null);
  };
  
  const handleDuplicateDocument = (type: 'proposal' | 'contract', document: ProposalTemplate | ContractTemplate) => {
    if (type === 'proposal') {
      const duplicated = { ...(document as ProposalTemplate), id: `copy-${Date.now()}`, name: `Copy of ${document.name}` } as ProposalTemplate;
      const updated = [duplicated, ...customProposals];
      setCustomProposals(updated);
      localStorage.setItem('bamlead_custom_proposals', JSON.stringify(updated));
    } else {
      const duplicated = { ...(document as ContractTemplate), id: `copy-${Date.now()}`, name: `Copy of ${document.name}` } as ContractTemplate;
      const updated = [duplicated, ...customContracts];
      setCustomContracts(updated);
      localStorage.setItem('bamlead_custom_contracts', JSON.stringify(updated));
    }
    toast.success(`📋 Duplicated "${document.name}" to My Documents!`);
  };

  // Save settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Persist mailbox theme locally (mailbox-only)
  useEffect(() => {
    localStorage.setItem('bamlead_mailbox_theme', mailboxTheme);
  }, [mailboxTheme]);

  // Fetch sent emails for Sent tab - syncs with drip campaign
  const fetchSentEmails = async () => {
    setIsLoadingSentEmails(true);
    try {
      const result = await getSends({ limit: 100 });
      if (result.success && result.sends) {
        setSentEmails(result.sends);
      }
    } catch (error) {
      console.error('Failed to fetch sent emails:', error);
    }
    setIsLoadingSentEmails(false);
  };

  // Load sent emails when switching to sent tab
  useEffect(() => {
    if (activeTab === 'sent' || mailboxSubTab === 'sent') {
      fetchSentEmails();
    }
  }, [activeTab, mailboxSubTab]);

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
    
    // Check if SMTP is configured
    if (!isSMTPConfigured()) {
      toast.error('SMTP not configured', {
        description: 'Please configure your SMTP settings first.',
      });
      return;
    }
    
    setIsSendingDocument(true);
    
    try {
      const branding = loadBranding();
      const docType = selectedDocument.type === 'proposal' ? 'Proposal' : 'Contract';
      const docName = selectedDocument.document.name;
      
      // Build the email with embedded document
      const emailSubject = `${docType}: ${docName}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Hi ${selectedReply.from_name.split(' ')[0]},</p>
          <p>Thank you for your interest! As discussed, please find the ${docType.toLowerCase()} attached below.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          ${documentPreviewHTML}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p>Please review and let me know if you have any questions. I'm happy to discuss any details.</p>
          <p>Best regards,<br/>${branding.contactName || 'Your Team'}</p>
        </div>
      `;
      
      const result = await sendSingleEmail({
        to: selectedReply.from_email,
        subject: emailSubject,
        bodyHtml: emailBody,
        bodyText: `Please find the ${docType.toLowerCase()} "${docName}" attached. Review and let me know if you have any questions.`,
        personalization: {
          business_name: selectedReply.from_name,
          first_name: selectedReply.from_name.split(' ')[0],
        },
      });
      
      if (result.success) {
        toast.success(`${docType} sent to ${selectedReply.from_email}!`, { 
          description: `${docName} has been delivered successfully.` 
        });
        setShowDocumentPreview(false);
        setSelectedDocument(null);
      } else {
        toast.error('Failed to send document', {
          description: result.error || 'Please check your SMTP settings.',
        });
      }
    } catch (error) {
      console.error('Send document error:', error);
      toast.error('Failed to send document', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSendingDocument(false);
    }
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
    
    // Check if SMTP is configured
    if (!isSMTPConfigured()) {
      toast.error('SMTP not configured', {
        description: 'Please configure your SMTP settings first.',
      });
      return;
    }
    
    setIsSending(true);
    try {
      const finalResponse = selectedReply.human_response || editedDraft || selectedReply.ai_draft || '';
      const branding = loadBranding();
      const logoUrl = getUserLogoFromStorage();
      
      // Build HTML email body
      let htmlBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">`;
      htmlBody += finalResponse
        .split('\n\n')
        .map(para => `<p style="margin-bottom: 16px;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      // Add signature with logo
      htmlBody += `
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${branding.companyName || 'Company Logo'}" style="height: 40px; max-width: 150px; margin-bottom: 12px;" />` : ''}
          <p style="margin: 0; font-weight: 600; color: #374151;">${branding.contactName || ''}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${branding.companyName || ''}</p>
          ${branding.email ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${branding.email}</p>` : ''}
          ${branding.phone ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${branding.phone}</p>` : ''}
        </div>
      `;
      htmlBody += `</div>`;
      
      // Apply branding wrapper if enabled
      const emailBranding = getEmailBranding();
      const finalHtml = emailBranding?.enabled 
        ? applyBrandingToHtml(htmlBody, emailBranding)
        : htmlBody;
      
      // Use real API if no custom handler provided
      if (onSendResponse) {
        await onSendResponse(selectedReply.id, finalResponse);
      } else {
        const result = await sendSingleEmail({
          to: selectedReply.from_email,
          subject: `Re: ${selectedReply.subject}`,
          bodyHtml: finalHtml,
          bodyText: finalResponse,
          personalization: {
            business_name: selectedReply.from_name,
            first_name: selectedReply.from_name.split(' ')[0],
          },
          applyBranding: false,
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }
      }
      
      setReplies(prev => prev.map(r => r.id === selectedReply.id ? { ...r, status: 'sent' as const } : r));
      toast.success(`Response sent to ${selectedReply.from_email}!`);
      setSelectedReply(null);
    } catch (error) {
      console.error('Send response error:', error);
      toast.error('Failed to send response', {
        description: error instanceof Error ? error.message : 'Please check your SMTP settings.',
      });
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

  // Compose email handlers
  const openComposeModal = (prefillTo?: string, prefillName?: string) => {
    setComposeEmail({
      to: prefillTo || '',
      toName: prefillName || '',
      subject: '',
      body: '',
      includeAppointmentLink: false,
      appointmentSlots: [],
      isAIGenerated: false
    });
    setSelectedAppointmentSlots([]);
    setShowComposeModal(true);
  };

  const generateAIEmailContent = async () => {
    if (!composeEmail.to || !composeEmail.toName) {
      toast.error('Please enter recipient details first');
      return;
    }
    setIsGeneratingComposeAI(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const branding = loadBranding();
    const firstName = composeEmail.toName.split(' ')[0];
    
    let aiSubject = `Exciting Opportunity for ${composeEmail.toName.split(' ').pop() || 'Your Business'}`;
    let aiBody = `Hi ${firstName},\n\nI hope this email finds you well! I came across your business and was impressed by what you're doing.\n\nI wanted to reach out because I believe we could help you take your business to the next level with our proven lead generation and marketing solutions.\n\n`;
    
    if (composeEmail.attachedDocument) {
      aiBody += `I've attached a ${composeEmail.attachedDocument.type} that outlines exactly how we can help: "${composeEmail.attachedDocument.document.name}"\n\n`;
    }
    
    if (selectedAppointmentSlots.length > 0) {
      aiBody += `I'd love to schedule a quick call to discuss this further. Here are some available times:\n`;
      selectedAppointmentSlots.forEach(slot => {
        aiBody += `• ${slot}\n`;
      });
      aiBody += `\nJust reply with the time that works best for you, and I'll send a calendar invite right away.\n\n`;
    }
    
    aiBody += `Looking forward to connecting!\n\nBest regards,\n${branding.contactName || 'Your Name'}\n${branding.companyName || 'Your Company'}`;
    
    setComposeEmail(prev => ({
      ...prev,
      subject: aiSubject,
      body: aiBody,
      isAIGenerated: true
    }));
    setIsGeneratingComposeAI(false);
    toast.success('AI generated email content! Review and customize as needed.');
  };

  const attachDocumentToEmail = (doc: ProposalTemplate | ContractTemplate, type: 'proposal' | 'contract') => {
    setComposeEmail(prev => ({
      ...prev,
      attachedDocument: { type, document: doc }
    }));
    setShowDocumentPicker(false);
    toast.success(`${type === 'proposal' ? 'Proposal' : 'Contract'} attached to email`);
  };

  const toggleAppointmentSlot = (slot: string) => {
    setSelectedAppointmentSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  const handleSendComposedEmail = async () => {
    if (!composeEmail.to || !composeEmail.subject || !composeEmail.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if SMTP is configured
    if (!isSMTPConfigured()) {
      toast.error('SMTP not configured', {
        description: 'Please configure your SMTP settings first in the Settings panel.',
      });
      return;
    }

    setIsSending(true);
    
    try {
      const branding = loadBranding();
      const logoUrl = getUserLogoFromStorage();
      
      // Build HTML email body with proper formatting
      let htmlBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">`;
      
      // Convert plain text to HTML paragraphs
      htmlBody += composeEmail.body
        .split('\n\n')
        .map(para => `<p style="margin-bottom: 16px;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      // Add attached document reference if any
      if (composeEmail.attachedDocument) {
        const docName = composeEmail.attachedDocument.document.name;
        const docType = composeEmail.attachedDocument.type;
        htmlBody += `
          <div style="margin: 24px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
            <p style="margin: 0; font-weight: 600; color: #374151;">
              📎 Attached ${docType === 'proposal' ? 'Proposal' : 'Contract'}: ${docName}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
              Please review the attached document and let me know if you have any questions.
            </p>
          </div>
        `;
      }
      
      // Add signature with logo
      htmlBody += `
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${branding.companyName || 'Company Logo'}" style="height: 40px; max-width: 150px; margin-bottom: 12px;" />` : ''}
          <p style="margin: 0; font-weight: 600; color: #374151;">${branding.contactName || ''}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${branding.companyName || ''}</p>
          ${branding.email ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${branding.email}</p>` : ''}
          ${branding.phone ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${branding.phone}</p>` : ''}
        </div>
      `;
      
      htmlBody += `</div>`;
      
      // Apply branding wrapper if enabled
      const emailBranding = getEmailBranding();
      const finalHtml = emailBranding?.enabled 
        ? applyBrandingToHtml(htmlBody, emailBranding)
        : htmlBody;
      
      // Send the email via the real API
      const result = await sendSingleEmail({
        to: composeEmail.to,
        subject: composeEmail.subject,
        bodyHtml: finalHtml,
        bodyText: composeEmail.body,
        personalization: {
          business_name: composeEmail.toName,
          first_name: composeEmail.toName.split(' ')[0],
        },
        applyBranding: false, // We already applied it above
      });
      
      if (result.success) {
        toast.success(`Email sent to ${composeEmail.toName || composeEmail.to}!`, {
          description: composeEmail.attachedDocument 
            ? `Included: ${composeEmail.attachedDocument.document.name}` 
            : 'Your email has been delivered successfully.',
        });
        
        setShowComposeModal(false);
        setComposeEmail({
          to: '',
          toName: '',
          subject: '',
          body: '',
          includeAppointmentLink: false,
          appointmentSlots: [],
          isAIGenerated: false
        });
        setSelectedAppointmentSlots([]);
      } else {
        toast.error('Failed to send email', {
          description: result.error || 'Please check your SMTP configuration and try again.',
        });
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send email', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Sequence builder handlers
  const addSequenceStep = (type: SequenceStep['type']) => {
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      type,
      content: type === 'wait' ? undefined : `${type.charAt(0).toUpperCase() + type.slice(1)} content`,
      subject: type === 'email' ? 'Email Subject' : undefined,
      waitDays: type === 'wait' ? 2 : undefined
    };
    setNewSequenceSteps(prev => [...prev, newStep]);
  };

  const removeSequenceStep = (stepId: string) => {
    setNewSequenceSteps(prev => prev.filter(s => s.id !== stepId));
  };

  // Drag-and-drop state and handlers for sequence steps
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', stepId);
  };

  const handleDragOver = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (stepId !== draggedStepId) {
      setDragOverStepId(stepId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStepId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStepId || draggedStepId === targetStepId) {
      setDraggedStepId(null);
      setDragOverStepId(null);
      return;
    }

    setNewSequenceSteps(prev => {
      const draggedIndex = prev.findIndex(s => s.id === draggedStepId);
      const targetIndex = prev.findIndex(s => s.id === targetStepId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newSteps = [...prev];
      const [draggedItem] = newSteps.splice(draggedIndex, 1);
      newSteps.splice(targetIndex, 0, draggedItem);
      return newSteps;
    });

    setDraggedStepId(null);
    setDragOverStepId(null);
    toast.success('Step reordered');
  };

  const handleDragEnd = () => {
    setDraggedStepId(null);
    setDragOverStepId(null);
  };

  const saveNewSequence = () => {
    if (!newSequenceName || newSequenceSteps.length === 0) {
      toast.error('Please add a name and at least one step');
      return;
    }
    const newSequence: Sequence = {
      id: Date.now().toString(),
      name: newSequenceName,
      steps: newSequenceSteps,
      status: 'draft',
      leadsEnrolled: 0,
      stats: { sent: 0, opened: 0, replied: 0 }
    };
    setSequences(prev => [...prev, newSequence]);
    setShowSequenceBuilder(false);
    setNewSequenceName('');
    setNewSequenceSteps([]);
    toast.success('Sequence created! Activate it to start enrolling leads.');
  };

  const generateAISequence = async () => {
    setIsGeneratingComposeAI(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiSteps: SequenceStep[] = [
      { id: '1', type: 'email', subject: 'Introduction Email', content: 'Personalized intro' },
      { id: '2', type: 'wait', waitDays: 2 },
      { id: '3', type: 'linkedin', content: 'Connection request' },
      { id: '4', type: 'wait', waitDays: 3 },
      { id: '5', type: 'email', subject: 'Follow-up Value', content: 'Share case study' },
      { id: '6', type: 'wait', waitDays: 4 },
      { id: '7', type: 'call', content: 'Personal outreach call' },
    ];
    
    setNewSequenceSteps(aiSteps);
    setNewSequenceName('AI-Optimized Outreach');
    setIsGeneratingComposeAI(false);
    toast.success('AI generated an optimized sequence! Review and customize.');
  };

  // Navigation items
  const navItems = [
    { id: 'inbox' as MailboxTab, label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'sent' as MailboxTab, label: 'Sent', icon: Send },
    { id: 'drafts' as MailboxTab, label: 'Drafts', icon: Edit3 },
    { id: 'templates' as MailboxTab, label: 'Templates', icon: FileText },
    { id: 'sequences' as MailboxTab, label: 'Sequences & Follow-Up', icon: Workflow },
  ];

  const quickFilters = [
    { id: 'all' as QuickFilter, label: 'All' },
    { id: 'unread' as QuickFilter, label: 'Unread', count: unreadCount },
    { id: 'flagged' as QuickFilter, label: 'Flagged', count: flaggedCount },
    { id: 'followup' as QuickFilter, label: 'Follow-Up' },
  ];
  const topNavTabs: { id: TopNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'mailbox', label: 'Mailbox', icon: <Mail className="w-4 h-4" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'crm', label: 'CRM', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'ab', label: 'A/B', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'smtp', label: 'SMTP', icon: <Settings className="w-4 h-4" /> },
  ];

  const mailboxSubTabs: { id: MailboxSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" /> },
    { id: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" /> },
    { id: 'journey', label: 'Lead Journey', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'sequences', label: 'Multi-Channel Sequences', icon: <Workflow className="w-4 h-4" /> },
    { id: 'followups', label: 'Auto Follow-Ups', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'documents', label: 'Done For You', icon: <FileSignature className="w-4 h-4" /> },
  ];

  // AI Auto-Send Document (for autopilot mode)
  const autoSendDocumentForLead = async (reply: EmailReply) => {
    if (!reply.documentRecommendations || reply.documentRecommendations.length === 0) return;
    
    const bestRec = reply.documentRecommendations.reduce((best, rec) => 
      rec.confidence > best.confidence ? rec : best
    );
    
    if (bestRec.confidence >= 85) {
      const html = generateDocumentPreviewHTML(bestRec, reply.from_email, reply.from_name);
      
      try {
        const branding = loadBranding();
        const docType = bestRec.type === 'proposal' ? 'Proposal' : 'Contract';
        
        const result = await sendSingleEmail({
          to: reply.from_email,
          subject: `${docType}: ${bestRec.document.name}`,
          bodyHtml: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <p>Hi ${reply.from_name.split(' ')[0]},</p>
              <p>Based on our conversation, I've prepared this ${docType.toLowerCase()} for you. Please review and let me know if you have any questions!</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              ${html}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p>Best regards,<br/>${branding.contactName || 'Your Team'}</p>
            </div>
          `,
          bodyText: `Please find the ${docType.toLowerCase()} "${bestRec.document.name}" attached.`,
        });
        
        if (result.success) {
          toast.success(`🤖 AI Auto-sent ${docType} to ${reply.from_name}!`, {
            description: `${bestRec.document.name} - ${bestRec.confidence}% match`
          });
          
          // Send notification if enabled
          if (settings.notifyOnAIAction && settings.notifyEmail && settings.notifyEmailAddress) {
            // Trigger notification (in real app, would send email/SMS)
            console.log(`Notification: AI sent ${docType} to ${reply.from_email}`);
          }
        }
      } catch (error) {
        console.error('Auto-send document error:', error);
      }
    }
  };

  // AI Auto-Response Effect (when in autopilot mode)
  useEffect(() => {
    if (settings.responseMode !== 'automatic') return;
    
    // Process new emails automatically
    const newReplies = replies.filter(r => r.status === 'new' && r.urgencyLevel === 'hot');
    
    newReplies.forEach(async (reply) => {
      // Generate and send AI response
      if (!reply.ai_draft) {
        await generateAIDraft(reply);
      }
      
      // Auto-send documents for high-confidence matches
      if (settings.autoProposals && reply.documentRecommendations) {
        await autoSendDocumentForLead(reply);
      }
      
      // Notify on hot leads
      if (settings.notifyOnHotLead) {
        toast.info(`🔥 Hot Lead Alert: ${reply.from_name}`, {
          description: 'AI is handling this lead automatically'
        });
      }
    });
  }, [replies, settings.responseMode]);

  // Render the full-screen mailbox layout with top nav bar
  return (
    <div
      className="mailbox-scope w-full h-full min-h-screen flex flex-col bg-slate-950"
      data-mailbox-theme="dark"
    >
      {/* TOP NAVIGATION BAR - Dark theme */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">Smart Drip Mailbox</span>
                <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">PRO</Badge>
              </div>
              <p className="text-xs text-slate-400">Your unified outreach command center</p>
            </div>
          </div>

          {/* Center: Main Tabs - Matching reference */}
          <nav className="flex items-center gap-1">
            {topNavTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTopTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  topTab === tab.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: AI Autopilot + Actions */}
          <div className="flex items-center gap-3">
            {/* AI Autopilot Master Toggle */}
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">AI Autopilot</span>
                <span className="text-[10px] text-slate-400">
                  {settings.responseMode === 'automatic' ? 'Sends automatically' : 'You approve'}
                </span>
              </div>
              <Switch
                checked={settings.responseMode === 'automatic'}
                onCheckedChange={(checked) => {
                  updateSetting('responseMode', checked ? 'automatic' : 'manual');
                  toast.success(checked 
                    ? '🤖 AI Autopilot ON - AI sends sequences & follow-ups automatically' 
                    : 'Autopilot OFF - You control all outreach'
                  );
                }}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setMailboxTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
              className="p-2.5 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
              aria-label="Toggle theme"
            >
              {mailboxTheme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-300" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </button>

            {/* Settings */}
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
            >
              <Settings className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Sub-tabs for Mailbox (only visible when mailbox tab is active) */}
        {topTab === 'mailbox' && (
          <div className="mt-4 flex items-center gap-2">
            {mailboxSubTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setMailboxSubTab(tab.id);
                  // Sync with activeTab for content rendering
                  if (tab.id === 'inbox') setActiveTab('inbox');
                  else if (tab.id === 'sent') setActiveTab('sent');
                  else if (tab.id === 'activity') setActiveTab('sent'); // Activity uses sent tab area
                  else if (tab.id === 'sequences') setActiveTab('sequences');
                  else if (tab.id === 'followups') setActiveTab('sequences');
                  else if (tab.id === 'documents') setActiveTab('contracts');
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                  mailboxSubTab === tab.id
                    ? "bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800 hover:border-slate-600"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'inbox' && unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 ml-1">{unreadCount}</Badge>
                )}
              </button>
            ))}
            
            {/* Create Sequence Button */}
            <Button
              size="sm"
              onClick={() => setShowSequenceBuilder(true)}
              className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Create Sequence
            </Button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA - Changes based on top tab */}
      {topTab === 'mailbox' && mailboxSubTab === 'followups' ? (
        /* AUTO FOLLOW-UPS: FULL-SCREEN LAYOUT */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <AutoFollowUpBuilder campaignContext={campaignContext} />
        </div>
      ) : topTab === 'mailbox' && mailboxSubTab === 'documents' ? (
        /* DONE FOR YOU DOCUMENTS: FULL-SCREEN LAYOUT */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <ProposalsContractsPanel />
        </div>
      ) : topTab === 'mailbox' && mailboxSubTab === 'sequences' ? (
        /* MULTI-CHANNEL SEQUENCES: FULL-SCREEN LAYOUT */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-6">
          <SequenceBuilderModule />
        </div>
      ) : topTab === 'mailbox' && mailboxSubTab === 'journey' ? (
        /* LEAD JOURNEY DASHBOARD: FULL-SCREEN LAYOUT */
        <div className="flex-1 flex flex-col overflow-hidden">
          <LeadJourneyDashboard 
            isAutopilotActive={settings.responseMode === 'automatic'}
            onToggleAutopilot={(active) => {
              setSettings(prev => ({ ...prev, responseMode: active ? 'automatic' : 'manual' }));
              saveSettings({ ...settings, responseMode: active ? 'automatic' : 'manual' });
            }}
            campaignContext={campaignContext}
          />
        </div>
      ) : topTab === 'mailbox' && mailboxSubTab === 'activity' ? (
        /* ACTIVITY FEED: FULL-SCREEN LAYOUT */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <EmailActivityFeed />
        </div>
      ) : topTab === 'mailbox' ? (
        /* MAILBOX: 3-PANEL LAYOUT - Only for Inbox and Sent */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR - Dark Theme */}
          <aside className={cn(
            "flex flex-col border-r border-slate-800 bg-slate-900 transition-all",
            sidebarCollapsed ? "w-16" : "w-56"
          )}>
            {/* Sidebar Toggle */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              {!sidebarCollapsed && (
                <span className="font-semibold text-white text-sm">Navigation</span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 hover:bg-slate-800 rounded-md transition-colors ml-auto"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Gmail-style Compose Button */}
            <div className="p-3">
              <Button 
                onClick={() => openComposeModal()}
                className={cn(
                  "gap-3 bg-white hover:bg-slate-100 text-slate-800 shadow-md hover:shadow-lg transition-all duration-200 border-0",
                  sidebarCollapsed ? "w-12 h-12 p-0 rounded-full" : "w-full py-3.5 rounded-2xl"
                )}
                size={sidebarCollapsed ? "icon" : "lg"}
              >
                <div className="relative">
                  <PenTool className="w-5 h-5 text-slate-700" />
                  {sidebarCollapsed && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="font-semibold text-base">Compose</span>
                )}
              </Button>
            </div>

            {/* Unread notification - subtle inline badge */}
            {!sidebarCollapsed && unreadCount > 0 && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span>{unreadCount} unread • {hotCount} hot leads</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === item.id
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
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

            {/* Sidebar Footer - Branded Documents hint */}
            {!sidebarCollapsed && (
              <div className="p-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMailboxSubTab('documents');
                    setActiveTab('contracts');
                  }}
                  className="w-full flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group"
                >
                  <FileSignature className="w-5 h-5 text-emerald-400" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-300">Done For You</p>
                    <p className="text-[10px] text-slate-400">Proposals & Contracts</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            )}

            {/* Sidebar Settings Button */}
            <div className="p-2 border-t border-slate-800">
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            </div>
          </aside>

          {/* CENTER PANEL - Email List / Tab Content - Dark Theme */}
          <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900">
            {activeTab === 'inbox' ? (
              <>
                {/* Search & Filters */}
                <div className="p-3 border-b border-slate-800 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {filter.label}
                        {filter.count && filter.count > 0 && (
                          <span className={`px-1 rounded-full text-[10px] ${
                            quickFilter === filter.id ? 'bg-white/20' : 'bg-slate-700'
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
                  <div className="divide-y divide-slate-800">
                    {filteredReplies.map(reply => (
                      <button
                        key={reply.id}
                        onClick={() => selectReply(reply)}
                        className={`w-full p-3 text-left transition-all hover:bg-slate-800 ${
                          selectedReply?.id === reply.id ? 'bg-emerald-900/30 border-l-2 border-l-emerald-500' : ''
                        } ${!reply.isRead ? 'bg-slate-800/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                            reply.urgencyLevel === 'hot' ? 'bg-red-500' :
                            reply.urgencyLevel === 'warm' ? 'bg-amber-500' : 'bg-slate-600'
                          }`}>
                            {reply.from_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-sm truncate ${!reply.isRead ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                                {reply.from_name}
                              </span>
                              <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">
                                {new Date(reply.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <p className={`text-xs truncate mb-1 ${!reply.isRead ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>
                              {reply.subject}
                            </p>
                            
                            <p className="text-xs text-slate-500 truncate">{reply.body}</p>
                            
                            {/* Status indicators */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {reply.urgencyLevel === 'hot' && (
                                <Badge className="bg-red-900/50 text-red-300 border border-red-700 text-[10px] gap-0.5 px-1.5">
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
                                <Badge className="bg-violet-900/50 text-violet-300 border border-violet-700 text-[10px] px-1.5">
                                  <FileText className="w-2.5 h-2.5 mr-0.5" /> Doc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {filteredReplies.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <MailOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No emails match your filter</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : activeTab === 'sent' ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-emerald-400" />
                        Sent Emails
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        {sentEmails.length > 0 ? `${sentEmails.length} emails sent` : 'Track your sent emails and their status'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchSentEmails}
                      disabled={isLoadingSentEmails}
                      className="gap-1.5 border-slate-700 text-slate-300 hover:text-white"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isLoadingSentEmails && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                    {isLoadingSentEmails ? (
                      <div className="text-center py-12 text-slate-500">
                        <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-emerald-400" />
                        <p className="text-sm">Loading sent emails...</p>
                      </div>
                    ) : sentEmails.length > 0 ? (
                      sentEmails.map(email => (
                        <div
                          key={email.id || email.recipient_email + email.sent_at}
                          className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                              email.status === 'delivered' ? 'bg-emerald-500' :
                              email.status === 'opened' ? 'bg-cyan-500' :
                              email.status === 'clicked' ? 'bg-violet-500' :
                              email.status === 'failed' || email.status === 'bounced' ? 'bg-red-500' :
                              'bg-slate-600'
                            }`}>
                              {email.recipient_email?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-medium text-slate-300 truncate">
                                  {email.recipient_email}
                                </span>
                                <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">
                                  {email.sent_at ? new Date(email.sent_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mb-1">{email.subject}</p>
                              <div className="flex items-center gap-1.5">
                                <Badge className={cn("text-[10px] px-1.5", 
                                  email.status === 'delivered' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700' :
                                  email.status === 'opened' ? 'bg-cyan-900/50 text-cyan-300 border-cyan-700' :
                                  email.status === 'clicked' ? 'bg-violet-900/50 text-violet-300 border-violet-700' :
                                  email.status === 'failed' || email.status === 'bounced' ? 'bg-red-900/50 text-red-300 border-red-700' :
                                  email.status === 'sent' ? 'bg-blue-900/50 text-blue-300 border-blue-700' :
                                  'bg-slate-700 text-slate-300'
                                )}>
                                  {email.status === 'delivered' && <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />}
                                  {email.status === 'opened' && <MailOpen className="w-2.5 h-2.5 mr-0.5" />}
                                  {email.status === 'clicked' && <MousePointer className="w-2.5 h-2.5 mr-0.5" />}
                                  {(email.status === 'failed' || email.status === 'bounced') && <X className="w-2.5 h-2.5 mr-0.5" />}
                                  {email.status === 'sent' && <Send className="w-2.5 h-2.5 mr-0.5" />}
                                  {email.status?.charAt(0).toUpperCase()}{email.status?.slice(1)}
                                </Badge>
                                {email.opened_at && (
                                  <span className="text-[10px] text-slate-500">
                                    Opened {new Date(email.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Send className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No sent emails yet</p>
                        <p className="text-xs text-slate-600 mt-1">Start sending to see your history here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-slate-400">Select a tab to view content</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Email Viewer / Editor - Dark Theme */}
          <div className="flex-1 flex flex-col bg-slate-950">
            {selectedReply ? (
              <>
                {/* Email Header - Dark Theme */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        selectedReply.urgencyLevel === 'hot' ? 'bg-red-500' :
                        selectedReply.urgencyLevel === 'warm' ? 'bg-amber-500' : 'bg-slate-600'
                      }`}>
                        {selectedReply.from_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h2 className="font-bold text-white">{selectedReply.from_name}</h2>
                        <p className="text-sm text-slate-400">{selectedReply.from_email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {selectedReply.urgencyLevel === 'hot' && (
                        <Badge className="bg-red-900/50 text-red-300 border border-red-700 gap-1">
                          <Flame className="w-3 h-3" /> Hot Lead
                        </Badge>
                      )}
                      <button
                        onClick={() => toggleFlag(selectedReply.id)}
                        className={`p-2 rounded-lg transition-colors ${selectedReply.isFlagged ? 'bg-amber-900/50' : 'hover:bg-slate-800'}`}
                      >
                        <Flag className={`w-4 h-4 ${selectedReply.isFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <Archive className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-white mb-1">{selectedReply.subject}</h3>
                  <p className="text-xs text-slate-500">
                    Received {new Date(selectedReply.received_at).toLocaleString()}
                  </p>
                </div>

                {/* Email Body + AI Analysis - Dark Theme */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Original Email */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-slate-300 whitespace-pre-wrap">{selectedReply.body}</p>
                    </div>
                    
                    {/* AI Sentiment Analysis - Dark Theme */}
                    {selectedReply.sentiment && (
                      <div className={`p-4 rounded-xl border ${
                        selectedReply.sentiment === 'positive' ? 'bg-emerald-900/30 border-emerald-700' :
                        selectedReply.sentiment === 'negative' ? 'bg-red-900/30 border-red-700' :
                        'bg-slate-800 border-slate-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className={`w-4 h-4 ${
                            selectedReply.sentiment === 'positive' ? 'text-emerald-400' :
                            selectedReply.sentiment === 'negative' ? 'text-red-400' : 'text-slate-400'
                          }`} />
                          <span className="text-sm font-semibold text-white">AI Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-slate-500">Sentiment</p>
                            <p className={`font-semibold capitalize ${
                              selectedReply.sentiment === 'positive' ? 'text-emerald-400' :
                              selectedReply.sentiment === 'negative' ? 'text-red-400' : 'text-slate-300'
                            }`}>
                              {selectedReply.sentiment} ({selectedReply.sentimentScore}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Urgency</p>
                            <p className={`font-semibold capitalize ${
                              selectedReply.urgencyLevel === 'hot' ? 'text-red-400' :
                              selectedReply.urgencyLevel === 'warm' ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              🔥 {selectedReply.urgencyLevel}
                            </p>
                          </div>
                        </div>
                        
                        {selectedReply.buyingSignals && selectedReply.buyingSignals.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Buying Signals Detected:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedReply.buyingSignals.map((signal, i) => (
                                <Badge key={i} className="bg-emerald-900/50 text-emerald-300 border border-emerald-700 text-xs">
                                  ✓ {signal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Document Recommendations - Dark Theme */}
                    {selectedReply.documentRecommendations && selectedReply.documentRecommendations.length > 0 && (
                      <div className="p-4 rounded-xl bg-violet-900/30 border border-violet-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold text-white">AI Document Recommendations</span>
                          </div>
                          {settings.responseMode === 'automatic' && (
                            <Badge className="bg-emerald-900/50 text-emerald-400 border border-emerald-700 text-xs">
                              <Bot className="w-3 h-3 mr-1" /> Auto-Send Enabled
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          {selectedReply.documentRecommendations.map((rec, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                              <div className="flex items-center gap-3">
                                {rec.type === 'proposal' ? (
                                  <FileText className="w-5 h-5 text-amber-400" />
                                ) : (
                                  <FileSignature className="w-5 h-5 text-blue-400" />
                                )}
                                <div>
                                  <p className="font-semibold text-sm text-white">{rec.document.name}</p>
                                  <p className="text-xs text-slate-400">{rec.reason}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${
                                  rec.urgency === 'high' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                                  rec.urgency === 'medium' ? 'bg-amber-900/50 text-amber-300 border border-amber-700' :
                                  'bg-slate-700 text-slate-400'
                                }`}>
                                  {rec.confidence}% match
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDocument(rec);
                                    setShowDocumentPreview(true);
                                    setDocumentPreviewHTML(
                                      generateDocumentPreviewHTML(rec, selectedReply.from_email, selectedReply.from_name)
                                    );
                                  }}
                                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDocument(rec);
                                    setDocumentPreviewHTML(
                                      generateDocumentPreviewHTML(rec, selectedReply.from_email, selectedReply.from_name)
                                    );
                                    setTimeout(() => handleSendDocument(), 100);
                                  }}
                                  disabled={isSendingDocument}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
                                >
                                  <Send className="w-3 h-3" /> Send
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* AI Draft - Dark Theme */}
                    {selectedReply.ai_draft && (
                      <div className="p-4 rounded-xl bg-amber-900/30 border border-amber-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-semibold text-white">AI Draft Response</span>
                          </div>
                          <Badge className={settings.responseMode === 'automatic' 
                            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' 
                            : 'bg-amber-900/50 text-amber-400 border border-amber-700'
                          }>
                            {settings.responseMode === 'automatic' ? '🤖 Will send automatically' : 'Awaiting approval'}
                          </Badge>
                        </div>
                        
                        <Textarea
                          value={editedDraft}
                          onChange={(e) => setEditedDraft(e.target.value)}
                          className="min-h-[150px] bg-slate-800 border-slate-700 text-white mb-3"
                        />
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleApprove()}
                            disabled={isSending}
                            className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                          >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => selectedReply && generateAIDraft(selectedReply)}
                            disabled={isGenerating}
                            className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Regenerate
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleReject}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 gap-2"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-400 mb-1">Select an email</h3>
                  <p className="text-sm text-slate-500">Choose an email from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : topTab === 'preview' ? (
        /* PREVIEW: Email Templates Gallery - Dark Theme */
        <div className="flex-1 overflow-auto bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Eye className="w-6 h-6 text-emerald-400" />
                Email Templates
              </h2>
              <p className="text-slate-400">Browse and select templates for your campaigns</p>
            </div>
            <HighConvertingTemplateGallery 
              onSelectTemplate={(template) => {
                localStorage.setItem('bamlead_selected_template', JSON.stringify(template));
                toast.success(`Template "${template.name}" selected!`);
              }}
            />
          </div>
        </div>
      ) : topTab === 'crm' ? (
        /* CRM: Lead Management - Dark Theme */
        <div className="flex-1 overflow-auto bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-emerald-400" />
                CRM Dashboard
              </h2>
              <p className="text-slate-400">Manage your leads and track outreach progress</p>
            </div>
            <BamLeadCRMPanel leads={[]} />
          </div>
        </div>
      ) : topTab === 'ab' ? (
        /* A/B Testing - Dark Theme */
        <div className="flex-1 overflow-auto bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
                A/B Testing
              </h2>
              <p className="text-slate-400">Test and optimize your email campaigns</p>
            </div>
            <ABTestingPanel />
          </div>
        </div>
      ) : topTab === 'smtp' ? (
        /* SMTP Configuration - Dark Theme */
        <div className="flex-1 overflow-auto bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Server className="w-6 h-6 text-emerald-400" />
                SMTP Configuration
              </h2>
              <p className="text-slate-400">Configure your email server settings</p>
            </div>
            <SMTPConfigPanel />
          </div>
        </div>
      ) : null}

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

      {/* Compose Email Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg">Compose New Email</span>
                <p className="text-sm font-normal text-slate-500">Create and send personalized emails with AI assistance</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Compose a new email</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* SMTP Warning if not configured */}
            {!isSMTPConfigured() && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 text-sm">SMTP Not Configured</p>
                  <p className="text-xs text-amber-700">Configure your SMTP settings to send real emails.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setShowComposeModal(false); setSettingsOpen(true); }}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Configure
                </Button>
              </div>
            )}

            {/* AI Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">AI Writing Assistant</p>
                  <p className="text-xs text-slate-500">Let AI help craft the perfect message</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">{composeAIMode ? 'AI Mode' : 'Manual'}</span>
                <Switch 
                  checked={composeAIMode} 
                  onCheckedChange={setComposeAIMode}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>

            {/* Template & Lead Category Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Email Template
                </Label>
                <select 
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md"
                  value={composeEmail.selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const tmpl = defaultEmailTemplates.find(t => t.id === e.target.value);
                    if (tmpl) {
                      setComposeEmail(prev => ({ 
                        ...prev, 
                        selectedTemplate: tmpl,
                        subject: tmpl.subject.replace('{{business}}', prev.toName || 'Your Business')
                      }));
                    }
                  }}
                >
                  <option value="">Select template...</option>
                  {defaultEmailTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.category === 'hot' ? '🔥 ' : t.category === 'warm' ? '🌡️ ' : t.category === 'cold' ? '❄️ ' : '📧 '}
                      {t.name}
                    </option>
                  ))}
                </select>
                {composeEmail.selectedTemplate && (
                  <p className="text-xs text-slate-500">Subject: "{composeEmail.selectedTemplate.subject}"</p>
                )}
              </div>

              {/* Lead Category Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Send to Lead Category
                </Label>
                <div className="flex gap-2">
                  {(['all', 'hot', 'warm', 'cold'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setComposeEmail(prev => ({ ...prev, selectedLeadCategory: cat }))}
                      className={cn(
                        "flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all",
                        composeEmail.selectedLeadCategory === cat
                          ? cat === 'hot' ? "bg-red-100 border-red-500 text-red-700"
                            : cat === 'warm' ? "bg-amber-100 border-amber-500 text-amber-700"
                            : cat === 'cold' ? "bg-blue-100 border-blue-500 text-blue-700"
                            : "bg-emerald-100 border-emerald-500 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400"
                      )}
                    >
                      {cat === 'hot' ? '🔥' : cat === 'warm' ? '🌡️' : cat === 'cold' ? '❄️' : '📋'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {composeEmail.selectedLeadCategory === 'all' 
                    ? `${availableLeads.length} leads selected`
                    : `${availableLeads.filter(l => l.category === composeEmail.selectedLeadCategory).length} ${composeEmail.selectedLeadCategory} leads`
                  }
                </p>
              </div>
            </div>

            {/* Quick Lead Selection */}
            {composeEmail.selectedLeadCategory !== 'all' && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Quick Select Lead ({composeEmail.selectedLeadCategory})
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableLeads
                    .filter(l => l.category === composeEmail.selectedLeadCategory)
                    .map(lead => (
                      <button
                        key={String(lead.id)}
                        onClick={() => setComposeEmail(prev => ({
                          ...prev,
                          to: lead.email || '',
                          toName: lead.name || ''
                        }))}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border transition-all flex items-center gap-1",
                          composeEmail.to === lead.email
                            ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400"
                        )}
                      >
                        {lead.verified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        {lead.name}
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Recipient Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Recipient Email *</Label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  value={composeEmail.to}
                  onChange={(e) => setComposeEmail(prev => ({ ...prev, to: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Recipient Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={composeEmail.toName}
                  onChange={(e) => setComposeEmail(prev => ({ ...prev, toName: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Subject *</Label>
              <Input
                placeholder="Your email subject..."
                value={composeEmail.subject}
                onChange={(e) => setComposeEmail(prev => ({ ...prev, subject: e.target.value }))}
                className="h-10"
              />
            </div>

            {/* Attachments Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Attach Document */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentPicker(true)}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                {composeEmail.attachedDocument 
                  ? composeEmail.attachedDocument.document.name 
                  : 'Attach Proposal/Contract'}
              </Button>

              {composeEmail.attachedDocument && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setComposeEmail(prev => ({ ...prev, attachedDocument: undefined }))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              {/* Include Appointment */}
              <div className="flex items-center gap-2 ml-auto">
                <CalendarPlus className="w-4 h-4 text-emerald-600" />
                <Label className="text-sm">Include Appointment Slots</Label>
                <Switch
                  checked={composeEmail.includeAppointmentLink}
                  onCheckedChange={(v) => setComposeEmail(prev => ({ ...prev, includeAppointmentLink: v }))}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            {/* Appointment Slots Picker */}
            {composeEmail.includeAppointmentLink && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-sm text-emerald-900">Select Available Time Slots (like jeeva.ai)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_APPOINTMENT_SLOTS.map(slot => (
                    <button
                      key={slot}
                      onClick={() => toggleAppointmentSlot(slot)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedAppointmentSlots.includes(slot)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {selectedAppointmentSlots.length > 0 && (
                  <p className="text-xs text-emerald-600">
                    ✓ {selectedAppointmentSlots.length} slots selected - AI will intelligently respond and book appointments
                  </p>
                )}
              </div>
            )}

            {/* AI Generate Button */}
            {composeAIMode && (
              <Button
                onClick={generateAIEmailContent}
                disabled={isGeneratingComposeAI || !composeEmail.to || !composeEmail.toName}
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {isGeneratingComposeAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is writing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Email with AI
                  </>
                )}
              </Button>
            )}

            {/* Email Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Email Body *</Label>
                {composeEmail.isAIGenerated && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">AI Generated</Badge>
                )}
              </div>
              
              {/* Simple Formatting Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-t-lg border border-b-0 border-slate-200">
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <Bold className="w-4 h-4 text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <Italic className="w-4 h-4 text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <Underline className="w-4 h-4 text-slate-600" />
                </button>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <List className="w-4 h-4 text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <Link2 className="w-4 h-4 text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <Image className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              
              <Textarea
                value={composeEmail.body}
                onChange={(e) => setComposeEmail(prev => ({ ...prev, body: e.target.value, isAIGenerated: false }))}
                className="min-h-[200px] rounded-t-none border-t-0 text-sm"
                placeholder="Write your email content here..."
              />
            </div>

            {/* Logo Reminder */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden">
                {getUserLogoFromStorage() ? (
                  <img src={getUserLogoFromStorage()!} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Your Logo Will Be Included</p>
                <p className="text-xs text-slate-500">
                  {getUserLogoFromStorage() 
                    ? 'Your business logo will appear in the email footer' 
                    : 'Upload a logo in Settings to include it in emails'}
                </p>
              </div>
              {!getUserLogoFromStorage() && (
                <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                  Add Logo
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setShowComposeModal(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Save Draft
              </Button>
              <Button
                onClick={handleSendComposedEmail}
                disabled={isSending || !composeEmail.to || !composeEmail.subject || !composeEmail.body}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 min-w-[140px]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Picker Modal */}
      <Dialog open={showDocumentPicker} onOpenChange={setShowDocumentPicker}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Attach Proposal or Contract
            </DialogTitle>
            <DialogDescription>Select a document to include with your email</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Proposals */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Proposals
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {PROPOSAL_TEMPLATES.slice(0, 4).map(proposal => (
                  <button
                    key={proposal.id}
                    onClick={() => attachDocumentToEmail(proposal, 'proposal')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{proposal.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{proposal.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contracts */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-violet-500" />
                Contracts
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {CONTRACT_TEMPLATES.slice(0, 4).map(contract => (
                  <button
                    key={contract.id}
                    onClick={() => attachDocumentToEmail(contract, 'contract')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                        <FileSignature className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{contract.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{contract.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sequence Builder Modal */}
      <Dialog open={showSequenceBuilder} onOpenChange={setShowSequenceBuilder}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg">Create Email Sequence</span>
                <p className="text-sm font-normal text-slate-500">Build automated multi-channel outreach flows</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Create a new email sequence</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* AI Mode Toggle for Sequences */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-violet-600" />
                <div>
                  <p className="font-semibold text-slate-900">AI Sequence Builder</p>
                  <p className="text-xs text-slate-500">Let AI create an optimized outreach sequence</p>
                </div>
              </div>
              <Button
                onClick={generateAISequence}
                disabled={isGeneratingComposeAI}
                size="sm"
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                {isGeneratingComposeAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate with AI
              </Button>
            </div>

            {/* Sequence Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Sequence Name</Label>
              <Input
                placeholder="e.g., Cold Outreach Sequence"
                value={newSequenceName}
                onChange={(e) => setNewSequenceName(e.target.value)}
              />
            </div>

            {/* Add Step Buttons */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Add Steps</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'email' as const, icon: Mail, label: 'Email', color: 'emerald' },
                  { type: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn', color: 'blue' },
                  { type: 'sms' as const, icon: MessageSquare, label: 'SMS', color: 'violet' },
                  { type: 'call' as const, icon: Phone, label: 'Call', color: 'amber' },
                  { type: 'wait' as const, icon: Clock, label: 'Wait', color: 'slate' },
                ].map(item => (
                  <Button
                    key={item.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addSequenceStep(item.type)}
                    className={`gap-2 hover:bg-${item.color}-50 hover:border-${item.color}-300`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Sequence Steps ({newSequenceSteps.length})</Label>
              {newSequenceSteps.length === 0 ? (
                <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 text-center">
                  <Workflow className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">Click the buttons above to add steps</p>
                  <p className="text-xs text-slate-400">Or use AI to generate a complete sequence</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {newSequenceSteps.map((step, idx) => (
                    <div 
                      key={step.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, step.id)}
                      onDragOver={(e) => handleDragOver(e, step.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, step.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        `flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-150`,
                        step.type === 'email' ? 'bg-emerald-50 border-emerald-200' :
                        step.type === 'linkedin' ? 'bg-blue-50 border-blue-200' :
                        step.type === 'sms' ? 'bg-violet-50 border-violet-200' :
                        step.type === 'call' ? 'bg-amber-50 border-amber-200' :
                        'bg-slate-50 border-slate-200',
                        draggedStepId === step.id && 'opacity-50 scale-95',
                        dragOverStepId === step.id && 'ring-2 ring-emerald-400 ring-offset-2'
                      )}
                    >
                      {/* Drag Handle */}
                      <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-400 w-6">{idx + 1}</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        step.type === 'email' ? 'bg-emerald-200 text-emerald-700' :
                        step.type === 'linkedin' ? 'bg-blue-200 text-blue-700' :
                        step.type === 'sms' ? 'bg-violet-200 text-violet-700' :
                        step.type === 'call' ? 'bg-amber-200 text-amber-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {step.type === 'email' && <Mail className="w-4 h-4" />}
                        {step.type === 'linkedin' && <Linkedin className="w-4 h-4" />}
                        {step.type === 'sms' && <MessageSquare className="w-4 h-4" />}
                        {step.type === 'call' && <Phone className="w-4 h-4" />}
                        {step.type === 'wait' && <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900 capitalize">
                          {step.type === 'wait' ? `Wait ${step.waitDays} days` : step.type}
                        </p>
                        {step.subject && <p className="text-xs text-slate-500">{step.subject}</p>}
                        {step.content && step.type !== 'wait' && <p className="text-xs text-slate-500">{step.content}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSequenceStep(step.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowSequenceBuilder(false); setNewSequenceSteps([]); setNewSequenceName(''); }}>
              Cancel
            </Button>
            <Button
              onClick={saveNewSequence}
              disabled={!newSequenceName || newSequenceSteps.length === 0}
              className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
            >
              <CheckCircle2 className="w-4 h-4" />
              Create Sequence
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
