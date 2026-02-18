import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, ArrowUp, Server, FileText, Send, 
  CheckCircle2, Mail, Users, Loader2, Link2, Database,
  Eye, Zap, Rocket, FlaskConical, Home, Brain,
  Clock, TrendingUp, Info, Settings, Phone, X, AlertCircle, Upload, Image, Trash2, Sparkles, Crown, Shield
} from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import CRMIntegrationModal from './CRMIntegrationModal';
import MailboxDripAnimation from './MailboxDripAnimation';
import EmailClientPreviewPanel from './EmailClientPreviewPanel';
import BamLeadCRMPanel from './BamLeadCRMPanel';
import AutoCampaignWizard from './AutoCampaignWizard';
import CampaignAnalyticsDashboard from './CampaignAnalyticsDashboard';
import ABTestingPanel from './ABTestingPanel';
import CRMSelectionPanel from './CRMSelectionPanel';
import AITemplateSuggestions from './AITemplateSuggestions';
import AIEmailAssistant from './AIEmailAssistant';
import EmailConfigurationPanel from './EmailConfigurationPanel';
import LeadIntelligenceReviewPanel from './LeadIntelligenceReviewPanel';
import PersonalizedLeadPreview from './PersonalizedLeadPreview';
import AIStrategyReviewPanel from './AIStrategyReviewPanel';
import { LeadForEmail, SendHealth, getSendHealth, processMyScheduledEmails, sendBulkEmails } from '@/lib/api/email';
import { addLeadsToCRM } from '@/lib/customTemplates';
import EmailDeliveryNotifications from './EmailDeliveryNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { loadBrandingFromBackend, saveUserBranding, deleteUserLogo } from '@/lib/api/branding';
import MailboxDock from '@/components/MailboxDock';
import { DRIP_SETTINGS_KEY, loadDripSettings, saveDripSettings } from '@/lib/dripSettings';
import { saveCampaignLeadsWithContext, getStoredLeadContext } from '@/lib/leadContext';

interface SearchResult {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  // AI Scoring fields
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  successProbability?: number;
  verified?: boolean;
}

interface EmailSetupFlowProps {
  leads: SearchResult[];
  onBack: () => void;
  onComplete: () => void;
  onOpenSettings: () => void;
  /** Search type context - 'gmb' for Super AI Business Search, 'platform' for Agency Lead Finder */
  searchType?: 'gmb' | 'platform' | null;
  /** Callback when AI strategy is selected */
  onStrategySelect?: (strategyId: string) => void;
  /** Callback when email sequence is activated */
  onSequenceSelect?: (sequenceNames: string[]) => void;
}

type SmartDripTab = 'mailbox' | 'intelligence' | 'preview' | 'crm' | 'ab-testing' | 'settings' | 'inbox';

export default function EmailSetupFlow({
  leads,
  onBack,
  onComplete,
  onOpenSettings,
  searchType,
  onStrategySelect,
  onSequenceSelect,
}: EmailSetupFlowProps) {
  const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  const sanitizeLocalStorageJson = () => {
    const keys = [
      'smtp_config',
      'bamlead_selected_template',
      'bamlead_template_customizations',
      'email_branding',
      'bamlead_branding_info',
      'ai_email_template',
      'bamlead_email_leads',
      'bamlead_crm_leads',
    ];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        JSON.parse(raw);
      } catch {
        localStorage.removeItem(key);
      }
    }
  };

  sanitizeLocalStorageJson();

  const [currentPhase, setCurrentPhase] = useState<'smtp' | 'template' | 'send'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    return safeJsonParse(localStorage.getItem('bamlead_selected_template'), null);
  });
  const [customizedContent, setCustomizedContent] = useState<{ subject: string; body: string } | null>(() => {
    return safeJsonParse(localStorage.getItem('bamlead_template_customizations'), null);
  });
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showAutoCampaign, setShowAutoCampaign] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [pendingSendData, setPendingSendData] = useState<{
    validLeads: LeadForEmail[];
    emailSubject: string;
    emailBody: string;
  } | null>(null);
  const [activeCampaignLeads, setActiveCampaignLeads] = useState<LeadForEmail[] | null>(null);
  const [dripSettings, setDripSettings] = useState(() => loadDripSettings());
  // Intelligence panel state removed - now only in Step 2
  const [appliedStrategy, setAppliedStrategy] = useState<{
    id: string;
    name: string;
    subjectTemplate: string;
    openerTemplate: string;
    ctaTemplate: string;
  } | null>(null);
  
  // Auth context for persistent branding
  const { isAuthenticated } = useAuth();
  const planFeatures = usePlanFeatures();
  
  // Business logo for email branding
  const [businessLogo, setBusinessLogo] = useState<string | null>(() => {
    const branding = safeJsonParse<{ logoUrl?: string } | null>(
      localStorage.getItem('email_branding'),
      null
    );
    return branding?.logoUrl || null;
  });
  
  // Load branding from backend on mount (for logged-in users)
  useEffect(() => {
    if (isAuthenticated) {
      loadBrandingFromBackend().then((branding) => {
        if (branding?.logo_url) {
          setBusinessLogo(branding.logo_url);
        }
      });
    }
  }, [isAuthenticated]);
  
  // Ref for Smart Drip Mailbox section
  const smartDripRef = useRef<HTMLDivElement>(null);
  
  // Unified mailbox tab tracking - default to mailbox view
  const [activeTab, setActiveTab] = useState<SmartDripTab>('mailbox');
  const [visitedTabs, setVisitedTabs] = useState<SmartDripTab[]>(['mailbox']);
  const [mailboxUnreadCount, setMailboxUnreadCount] = useState(1);
  
  const markTabVisited = useCallback((tab: SmartDripTab) => {
    setVisitedTabs(prev => (prev.includes(tab) ? prev : [...prev, tab]));
  }, []);

  const handleTabChange = (tab: SmartDripTab) => {
    setActiveTab(tab);
    markTabVisited(tab);
    if (tab === 'inbox') {
      refreshInboxUnreadCount();
      setMailboxOpen(true);
    }
  };

  const refreshInboxUnreadCount = useCallback(() => {
    try {
      const stored = localStorage.getItem('bamlead_inbox_replies');
      if (!stored) {
        setMailboxUnreadCount(1);
        return;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        setMailboxUnreadCount(1);
        return;
      }
      const unread = parsed.filter((reply: { isRead?: boolean }) => !reply.isRead).length;
      setMailboxUnreadCount(unread);
    } catch {
      setMailboxUnreadCount(1);
    }
  }, []);

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setBusinessLogo(base64);
      
      // Sync with email_branding localStorage
      const existing = safeJsonParse<Record<string, unknown>>(localStorage.getItem('email_branding'), {});
      localStorage.setItem('email_branding', JSON.stringify({ ...existing, logoUrl: base64 }));
      
      // Also sync with bamlead_branding_info for proposals/contracts
      const brandingInfo = safeJsonParse<Record<string, unknown>>(localStorage.getItem('bamlead_branding_info'), {});
      localStorage.setItem('bamlead_branding_info', JSON.stringify({ ...brandingInfo, logo: base64 }));
      
      // Persist to backend for logged-in users
      if (isAuthenticated) {
        const saved = await saveUserBranding({ logo_url: base64 });
        if (saved) {
          toast.success('Business logo saved to your account!');
        } else {
          toast.warning('Logo saved locally, but backend save failed. Check your API and the user_branding table.');
        }
      } else {
        toast.success('Business logo uploaded! (Log in to save permanently)');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setBusinessLogo(null);
    const existing = safeJsonParse<Record<string, unknown>>(localStorage.getItem('email_branding'), {});
    delete existing.logoUrl;
    localStorage.setItem('email_branding', JSON.stringify(existing));
    
    const brandingInfo = safeJsonParse<Record<string, unknown>>(localStorage.getItem('bamlead_branding_info'), {});
    delete brandingInfo.logo;
    localStorage.setItem('bamlead_branding_info', JSON.stringify(brandingInfo));
    
    // Remove from backend for logged-in users
    if (isAuthenticated) {
      const deleted = await deleteUserLogo();
      if (!deleted) {
        toast.warning('Logo removed locally, but backend delete failed. Check your API and the user_branding table.');
        return;
      }
    }
    
    toast.success('Logo removed');
  };
  
  // SMTP configuration
  const [smtpConfigured, setSmtpConfigured] = useState(() => {
    const config = safeJsonParse<{ username?: string; password?: string }>(
      localStorage.getItem('smtp_config'),
      {}
    );
    return Boolean(config.username && config.password);
  });

  const refreshSMTPConfigured = useCallback(() => {
    const config = safeJsonParse<{ username?: string; password?: string }>(
      localStorage.getItem('smtp_config'),
      {}
    );
    setSmtpConfigured(Boolean(config.username && config.password));
  }, []);

  useEffect(() => {
    const requestedPhase = localStorage.getItem('bamlead_email_setup_phase');
    if (requestedPhase === 'smtp' || requestedPhase === 'template' || requestedPhase === 'send') {
      setCurrentPhase(requestedPhase);
      localStorage.removeItem('bamlead_email_setup_phase');
    }

    const focusGallery = localStorage.getItem('bamlead_focus_template_gallery');
    if (focusGallery) {
      setTimeout(() => {
        const templateSection = document.querySelector('[data-template-gallery]');
        if (templateSection) {
          templateSection.scrollIntoView({ behavior: 'smooth' });
        }
        localStorage.removeItem('bamlead_focus_template_gallery');
      }, 200);
    }
  }, []);

  // Load AI-generated email template
  useEffect(() => {
    const savedAiTemplate = localStorage.getItem('ai_email_template');
    if (savedAiTemplate && !selectedTemplate) {
      try {
        const { subject, body } = JSON.parse(savedAiTemplate);
        if (subject && body) {
          setSelectedTemplate({
            id: 'ai-generated',
            name: 'AI-Generated Template',
            subject,
            body,
            category: 'ai-generated',
            conversionRate: '0%',
            useCase: 'Custom AI-generated email',
          });
          if (smtpConfigured) {
            setCurrentPhase('send');
          } else {
            setCurrentPhase('template');
          }
          localStorage.removeItem('ai_email_template');
        }
      } catch (e) {
        console.error('Failed to parse AI email template:', e);
      }
    }
  }, [smtpConfigured, selectedTemplate]);

  // Load leads from props, or fallback to stored leads if props are empty
  const [emailLeads, setEmailLeads] = useState<LeadForEmail[]>(() => {
    // First try props
    if (leads.length > 0) {
      return leads.map(l => ({
        email: l.email || '',
        business_name: l.name,
        contact_name: '',
        website: l.website || '',
        phone: l.phone || '',
      }));
    }
    // Fallback to sessionStorage
    const storedLeads = sessionStorage.getItem('bamlead_email_leads');
    if (storedLeads) {
      try {
        return JSON.parse(storedLeads);
      } catch (e) {
        console.error('Failed to parse stored leads:', e);
      }
    }
    // Fallback to CRM localStorage
    const crmLeads = localStorage.getItem('bamlead_crm_leads');
    if (crmLeads) {
      try {
        const parsed = JSON.parse(crmLeads);
        return parsed.map((l: any) => ({
          email: l.email || '',
          business_name: l.name || l.business_name || '',
          contact_name: l.contact_name || '',
          website: l.website || '',
          phone: l.phone || '',
        }));
      } catch (e) {
        console.error('Failed to parse CRM leads:', e);
      }
    }
    return [];
  });

  const leadsWithEmail = emailLeads.filter(l => l.email);
  const leadsWithPhone = leads.filter(l => l.phone);

  const mailboxLeads = useMemo(() => {
    const sourceByEmail = new Map<string, SearchResult>();
    leads.forEach((lead) => {
      const key = String(lead.email || '').trim().toLowerCase();
      if (key && !sourceByEmail.has(key)) {
        sourceByEmail.set(key, lead);
      }
    });

    return effectiveMailboxEmailLeads.map((lead, index) => {
      const emailKey = String(lead.email || '').trim().toLowerCase();
      const sourceLead = sourceByEmail.get(emailKey);
      const resolvedName =
        sourceLead?.name ||
        lead.business_name ||
        lead.contact_name ||
        (lead.email ? lead.email.split('@')[0] : `Lead ${index + 1}`);

      return {
        id: String(lead.id ?? `${emailKey || 'lead'}-${index}`),
        name: resolvedName,
        email: lead.email || sourceLead?.email || '',
        business: lead.business_name || sourceLead?.name || resolvedName,
        category: sourceLead?.aiClassification,
        verified:
          sourceLead?.verified ??
          (sourceLead?.successProbability !== undefined
            ? sourceLead.successProbability >= 60
            : true),
      };
    });
  }, [leads, effectiveMailboxEmailLeads]);

  useEffect(() => {
    if (currentPhase !== 'send') return;
    const stored = sessionStorage.getItem(DRIP_SETTINGS_KEY) || localStorage.getItem(DRIP_SETTINGS_KEY);
    if (!stored) {
      const next = saveDripSettings({
        enabled: true,
        emailsPerHour: 50,
        intervalSeconds: Math.round(3600 / 50),
        source: 'step3',
      });
      setDripSettings(next);
      return;
    }
    setDripSettings(loadDripSettings());
  }, [currentPhase, leadsWithEmail.length]);

  // Persist email leads to both sessionStorage and CRM when leads prop changes
  useEffect(() => {
    if (leads.length > 0) {
      const converted = leads.map(l => ({
        email: l.email || '',
        business_name: l.name,
        contact_name: '',
        website: l.website || '',
        phone: l.phone || '',
      }));
      setEmailLeads(converted);
      sessionStorage.setItem('bamlead_email_leads', JSON.stringify(converted));
      addLeadsToCRM(leads);
      return;
    }

    // Clear stale in-memory lead/send state when all persisted lead sources are empty.
    const hasStoredLeads = Boolean(
      sessionStorage.getItem('bamlead_email_leads') ||
      localStorage.getItem('bamlead_email_leads') ||
      sessionStorage.getItem('bamlead_search_results') ||
      localStorage.getItem('bamlead_search_results')
    );

    if (!hasStoredLeads) {
      setEmailLeads([]);
      setDemoSentCount(0);
      setDemoIsActive(false);
      setRealSendingMode(false);
      setIsSendingPaused(false);
      setPendingSendData(null);
      setActiveCampaignLeads(null);
    }
  }, [leads]);

  // Sending state management
  const [demoSentCount, setDemoSentCount] = useState(0);
  const [demoIsActive, setDemoIsActive] = useState(false);
  const [mailboxAnimationSeed, setMailboxAnimationSeed] = useState(0);
  const [realSendingMode, setRealSendingMode] = useState(false);
  const [isSendingPaused, setIsSendingPaused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [sendHealth, setSendHealth] = useState<SendHealth | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const effectiveMailboxEmailLeads = useMemo(
    () => (realSendingMode && activeCampaignLeads?.length ? activeCampaignLeads : leadsWithEmail),
    [realSendingMode, activeCampaignLeads, leadsWithEmail]
  );

  useEffect(() => {
    if (currentPhase !== 'send') return;
    const total = emailLeads.length;
    if (total <= 0) {
      setDemoIsActive(false);
      setDemoSentCount(0);
      return;
    }
    // Only auto-activate demo mode if not in real sending mode
    if (!realSendingMode) {
      setDemoIsActive(true);
      setDemoSentCount(0);
      const interval = window.setInterval(() => {
        setDemoSentCount((c) => (c >= total ? 0 : c + 1));
      }, 650);
      return () => window.clearInterval(interval);
    }
  }, [currentPhase, emailLeads.length, realSendingMode]);

  const phases = [
    { id: 'template', label: '1. Choose Template', icon: FileText, description: 'Pick an email template' },
    { id: 'smtp', label: '2. SMTP Setup', icon: Server, description: 'Configure your email server' },
    { id: 'send', label: '3. Send Emails', icon: Send, description: 'Review and send campaign' },
  ];

  useEffect(() => {
    refreshSMTPConfigured();
    refreshInboxUnreadCount();
    window.addEventListener('focus', refreshSMTPConfigured);
    window.addEventListener('focus', refreshInboxUnreadCount);
    window.addEventListener('storage', refreshSMTPConfigured);
    window.addEventListener('storage', refreshInboxUnreadCount);
    window.addEventListener('bamlead-smtp-config-updated', refreshSMTPConfigured);
    return () => {
      window.removeEventListener('focus', refreshSMTPConfigured);
      window.removeEventListener('focus', refreshInboxUnreadCount);
      window.removeEventListener('storage', refreshSMTPConfigured);
      window.removeEventListener('storage', refreshInboxUnreadCount);
      window.removeEventListener('bamlead-smtp-config-updated', refreshSMTPConfigured);
    };
  }, [refreshSMTPConfigured, refreshInboxUnreadCount]);

  useEffect(() => {
    if (activeTab !== 'settings') {
      refreshSMTPConfigured();
    }
  }, [activeTab, refreshSMTPConfigured]);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    localStorage.setItem('bamlead_selected_template', JSON.stringify(template));
    // After template selection, check SMTP - if configured go to send, otherwise go to SMTP
    setCurrentPhase(smtpConfigured ? 'send' : 'smtp');
    toast.success(`Template "${template.name}" selected!`);
  };

  const handleSaveCustomization = (subject: string, body: string) => {
    const customizations = { subject, body };
    setCustomizedContent(customizations);
    localStorage.setItem('bamlead_template_customizations', JSON.stringify(customizations));
    toast.success('Your template edits have been saved!');
    setShowTemplateEditor(false);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setCustomizedContent(null);
    localStorage.removeItem('bamlead_selected_template');
    localStorage.removeItem('bamlead_template_customizations');
    toast.info('Template cleared. Choose a new one below.');
  };

  const getSelectedTemplateSubject = () => {
    return customizedContent?.subject || selectedTemplate?.subject || '';
  };

  const getSelectedTemplateBodyHtml = () => {
    if (customizedContent?.body) {
      const hasHtml = /<[^>]+>/.test(customizedContent.body);
      if (hasHtml) return customizedContent.body;
      return customizedContent.body
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => `<p>${line}</p>`)
        .join('');
    }

    return selectedTemplate?.body_html || selectedTemplate?.body || selectedTemplate?.preview || '';
  };

  const getSelectedTemplateBodyPlainText = () => {
    if (customizedContent?.body) {
      return customizedContent.body;
    }

    const body = selectedTemplate?.body_html || selectedTemplate?.body || selectedTemplate?.preview || '';
    return String(body).replace(/<[^>]*>/g, '');
  };

  const runSendHealthCheck = useCallback(async (params?: { silent?: boolean }) => {
    setIsHealthChecking(true);
    try {
      const result = await getSendHealth({
        leads: leadsWithEmail.map((lead) => ({ email: lead.email })),
        total_leads: leadsWithEmail.length,
      });

      if (!result.success || !result.health) {
        if (!params?.silent) {
          toast.error(result.error || 'Failed to run send health check');
        }
        return null;
      }

      setSendHealth(result.health);
      if (!params?.silent) {
        if (result.health.ready) {
          toast.success('Send health check passed');
        } else if (result.health.warnings.length > 0) {
          toast.warning(result.health.warnings[0]);
        } else {
          toast.warning('Send health check found issues');
        }
      }

      return result.health;
    } catch (error) {
      if (!params?.silent) {
        toast.error('Failed to run send health check');
      }
      return null;
    } finally {
      setIsHealthChecking(false);
    }
  }, [leadsWithEmail]);

  useEffect(() => {
    if (currentPhase !== 'send') return;
    runSendHealthCheck({ silent: true });
  }, [currentPhase, runSendHealthCheck]);

  const handleContinueToDrip = useCallback(() => {
    if (!smtpConfigured) {
      setCurrentPhase('smtp');
      toast.info('Configure SMTP first to launch drip sending.');
      return;
    }

    if (!selectedTemplate) {
      setCurrentPhase('template');
      toast.info('Choose a template first before launching drip sending.');
      return;
    }

    const alreadyOnSendPhase = currentPhase === 'send';
    setCurrentPhase('send');
    handleTabChange('mailbox');

    window.setTimeout(() => {
      smartDripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    if (alreadyOnSendPhase) {
      toast.success('Moved to Smart Drip campaign.');
    }
  }, [smtpConfigured, selectedTemplate, currentPhase, handleTabChange]);

  const handleActivatePreviewMode = useCallback(() => {
    setMailboxAnimationSeed((prev) => prev + 1);
    setActiveTab('mailbox');
    setIsSendingPaused(false);
    setDemoSentCount(0);
    setRealSendingMode(false);
    setDemoIsActive(false);
    setActiveCampaignLeads(null);
    window.setTimeout(() => setDemoIsActive(true), 0);
    smartDripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.info('👀 Preview mode activated - simulating email delivery');
  }, []);

  const handlePrepareRealSend = useCallback(async () => {
    if (!smtpConfigured) {
      toast.error('Please configure SMTP settings first');
      handleTabChange('settings');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select an email template first');
      setCurrentPhase('template');
      return;
    }

    const validLeads = leadsWithEmail.filter((l) => l.email && l.email.includes('@'));
    if (validLeads.length === 0) {
      toast.error('No leads with valid email addresses. Please go back and add leads first.');
      return;
    }

    const emailBody = getSelectedTemplateBodyHtml();
    const emailSubject = getSelectedTemplateSubject();
    if (!emailSubject || !emailBody) {
      toast.error('Email subject and body are required');
      return;
    }

    const health = await runSendHealthCheck({ silent: true });
    if (!health?.ready) {
      toast.error(health?.warnings?.[0] || 'Send health check failed. Run checks and fix issues before sending.');
      return;
    }

    setActiveTab('mailbox');
    setPendingSendData({
      validLeads,
      emailSubject,
      emailBody,
    });
    setShowSendConfirmation(true);
  }, [smtpConfigured, selectedTemplate, leadsWithEmail, runSendHealthCheck, handleTabChange, getSelectedTemplateBodyHtml, getSelectedTemplateSubject]);

  const handleSyncQueuedSend = useCallback(async () => {
    if (!realSendingMode) {
      await handlePrepareRealSend();
      return;
    }

    if (isSendingPaused) {
      toast.info('Campaign is paused. Resume to continue processing the queue.');
      return;
    }

    try {
      const result = await processMyScheduledEmails(20);
      if (!result.success) {
        toast.error(result.error || 'Failed to sync queued emails');
        return;
      }

      const processed = Number(result.processed || 0);
      const failed = Number(result.failed || 0);
      if (processed > 0 || failed > 0) {
        toast.success(`Queue sync complete: ${processed} sent, ${failed} failed`);
      } else {
        toast.info('No due emails to process right now');
      }
    } catch (error) {
      console.error('Failed to sync queued emails:', error);
      toast.error('Failed to sync queued emails');
    }
  }, [realSendingMode, handlePrepareRealSend, isSendingPaused]);

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'smtp':
        return (
          <div className="space-y-6">
            {/* Back button at top */}
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentPhase('template')} 
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Templates
              </Button>
            </div>

            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Server className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Step 2: Configure Your Email Server</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Emails are sent through <strong>your own SMTP server</strong> (Gmail, Outlook, custom domain). 
                This ensures better deliverability and keeps your brand consistent.
              </p>
            </div>

            <Card className={`border-2 ${smtpConfigured ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${smtpConfigured ? 'bg-success/15' : 'bg-warning/15'}`}>
                    {smtpConfigured ? '✅' : '⚙️'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">
                      {smtpConfigured ? 'SMTP is Configured!' : 'SMTP Not Yet Configured'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {smtpConfigured 
                        ? 'Your email server is ready. You can proceed to send emails.'
                        : 'Click the button to go to Settings and set up your email server.'
                      }
                    </p>
                  </div>
                  <Button
                    onClick={onOpenSettings}
                    variant={smtpConfigured ? 'outline' : 'default'}
                    className={`gap-2 ${!smtpConfigured ? 'animate-pulse' : ''}`}
                  >
                    <Server className="w-4 h-4" />
                    {smtpConfigured ? 'View Settings' : 'Set Up SMTP →'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {!smtpConfigured && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">
                    Configure SMTP when you're ready to send emails.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentPhase('template')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Templates
              </Button>
            </div>

            {/* EMAIL TEMPLATES - NOW AT THE TOP */}
            <div className="space-y-4" data-template-gallery>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedTemplate ? 'Or Choose a Different Template' : '📧 Step A: Browse Email Templates'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate
                      ? 'Browse our library of high-converting templates' 
                      : 'Pick a template that matches your outreach style. This is your base message for the campaign.'}
                  </p>
                </div>
              </div>

              {!selectedTemplate && (
                <div className="bg-gradient-to-r from-primary/20 to-emerald-500/10 border-2 border-primary/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-lg">👆 Click "READY TO SEND" on any template below</h3>
                      <p className="text-sm text-muted-foreground">After selecting, you can optionally enhance with an AI Follow-Up Strategy</p>
                    </div>
                  </div>
                </div>
              )}

              <HighConvertingTemplateGallery 
                onSelectTemplate={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
              />
            </div>

            {/* ═══════════════ AI STRATEGY SECTION DIVIDER ═══════════════ */}
            <div className="relative my-16 py-8">
              {/* Decorative lines */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-4 border-dashed border-primary/40"></div>
              </div>
              
              {/* Big AI Strategy Headline - Centered */}
              <div className="relative flex justify-center">
                <div className="bg-background px-10 py-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-lg">
                      <Brain className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent mb-2">
                        Review Your AI Strategy
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Intelligent outreach paths tailored to your leads and selected template
                      </p>
                    </div>
                    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 px-4 py-1.5">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Powered by AI
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* AI STRATEGIES - SEPARATE SECTION */}
            <div className="space-y-4" data-strategy-section>
              <AIStrategyReviewPanel
                searchType={searchType || null}
                leads={leads}
                selectedTemplate={selectedTemplate}
                onSendToComposer={(strategy) => {
                  // Apply strategy to template
                  setCustomizedContent({
                    subject: strategy.personalizedOpener.slice(0, 80),
                    body: `${strategy.personalizedOpener}\n\n${strategy.keyTalkingPoints.map(p => `• ${p}`).join('\n')}\n\nBest regards,\n{{sender_name}}`,
                  });
                  localStorage.setItem('bamlead_template_customizations', JSON.stringify({
                    subject: strategy.personalizedOpener.slice(0, 80),
                    body: `${strategy.personalizedOpener}\n\n${strategy.keyTalkingPoints.map(p => `• ${p}`).join('\n')}\n\nBest regards,\n{{sender_name}}`,
                  }));
                  setAppliedStrategy({
                    id: strategy.id,
                    name: strategy.name,
                    subjectTemplate: strategy.personalizedOpener.slice(0, 80),
                    openerTemplate: strategy.personalizedOpener,
                    ctaTemplate: strategy.keyTalkingPoints.join('. '),
                  });
                  // Save follow-up sequence
                  const updatedDrip = { ...dripSettings, followUpDays: [1, 3, 7, 14] };
                  saveDripSettings(updatedDrip);
                  setDripSettings(updatedDrip);
                  // Open the mailbox dock
                  setMailboxOpen(true);
                }}
              />
            </div>

            {/* Lead Intelligence is now ONLY in Step 2 - removed from Step 3 to reduce clutter */}

            {/* Applied Strategy Indicator */}
            {appliedStrategy && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">Strategy Applied: {appliedStrategy.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    AI will use this approach for personalized outreach based on lead analysis
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAppliedStrategy(null)}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {showTemplateEditor && selectedTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/30 bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Edit Your Template
                    </CardTitle>
                    <CardDescription>
                      Customize the subject line and body to match your voice. Your changes are saved automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input 
                        id="subject"
                        value={getSelectedTemplateSubject()}
                        placeholder="Enter your subject line..."
                        className="mt-1"
                        onChange={(e) => {
                          const body = getSelectedTemplateBodyPlainText();
                          handleSaveCustomization(e.target.value, body);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Email Body</Label>
                      <textarea 
                        id="body"
                        value={getSelectedTemplateBodyPlainText()}
                        placeholder="Enter your email content..."
                        className="mt-1 w-full h-48 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(e) => {
                          const subject = getSelectedTemplateSubject();
                          handleSaveCustomization(subject, e.target.value);
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
                        Done Editing
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <AIEmailAssistant
                  template={selectedTemplate}
                  leads={leads}
                  currentSubject={getSelectedTemplateSubject()}
                  currentBody={getSelectedTemplateBodyPlainText()}
                  onApplySubject={(subject) => {
                    const body = getSelectedTemplateBodyPlainText();
                    handleSaveCustomization(subject, body);
                  }}
                  onApplyBody={(newBody) => {
                    const subject = getSelectedTemplateSubject();
                    const currentBody = getSelectedTemplateBodyPlainText();
                    const updatedBody = currentBody ? `${currentBody}\n\n${newBody}` : newBody;
                    handleSaveCustomization(subject, updatedBody.replace(/<[^>]*>/g, ''));
                  }}
                />
              </div>
            )}

            {!selectedTemplate && (
              <AITemplateSuggestions
                leads={leads.map(l => ({
                  id: l.id,
                  name: l.name,
                  email: l.email,
                  phone: l.phone,
                  website: l.website,
                  address: l.address,
                }))}
                onSelectTemplate={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
              />
            )}
          </div>
        );

      case 'send':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentPhase('template')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Templates
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-2">
                  <Mail className="w-3 h-3" />
                  {leadsWithEmail.length} ready to send
                </Badge>
              </div>
            </div>

            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-2">Step 3: Review & Send</h2>
              <p className="text-muted-foreground">
                {selectedTemplate 
                  ? `Using template: "${selectedTemplate.name}". Watch your emails being delivered in real-time.`
                  : 'Review your leads and send your email campaign.'
                }
              </p>
            </div>


            {/* ============================================= */}
            {/* 📬 UNIFIED MAILBOX - PERSISTENT SHELL */}
            {/* ============================================= */}
            <Card ref={smartDripRef} className="border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 overflow-hidden">
              {/* PERSISTENT TOP NAVIGATION BAR - NEVER CHANGES */}
              <CardHeader className="pb-0 border-b border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        📬 Smart Drip Mailbox
                        <Badge className="bg-primary/30 text-primary border-primary/50">
                          {realSendingMode ? 'SENDING' : 'LIVE'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Your unified outreach command center
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Business Logo Upload */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 transition-colors">
                      {businessLogo ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={businessLogo} 
                            alt="Business logo" 
                            className="h-8 w-auto max-w-[100px] object-contain rounded"
                          />
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Branded
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={handleRemoveLogo}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
                            <Image className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">Upload Business Logo</span>
                            <span className="text-xs">Brand your emails</span>
                          </div>
                          <Upload className="w-4 h-4 ml-1" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {/* Real-time Delivery Notifications */}
                  <div className="relative">
                    <EmailDeliveryNotifications enabled={realSendingMode} />
                  </div>
                </div>
                
                {/* UNIFIED TAB BAR - STICKY, ALWAYS VISIBLE */}
                <div className="sticky top-0 z-10 flex items-center gap-1 pb-4 pt-2 -mt-2 bg-card/95 backdrop-blur-sm">
                  <TooltipProvider delayDuration={200}>
                    {[
                      { tab: 'mailbox', icon: Mail, label: 'Mailbox', color: 'blue', tooltip: 'View live email queue, sending progress & campaign stats' },
                      { tab: 'intelligence', icon: Brain, label: 'Intelligence', color: 'emerald', tooltip: 'Review lead analysis & AI-recommended email strategies' },
                      { tab: 'preview', icon: Eye, label: 'Preview', color: 'cyan', tooltip: 'Preview how your email looks in Gmail, Outlook & Apple Mail' },
                      { tab: 'crm', icon: Database, label: 'CRM', color: 'violet', tooltip: 'Connect HubSpot, Salesforce, or use BamLead CRM to manage leads' },
                      { tab: 'ab-testing', icon: FlaskConical, label: 'A/B', color: 'pink', tooltip: 'Create email variants & test which performs best' },
                      { tab: 'settings', icon: Settings, label: 'SMTP', color: 'slate', tooltip: 'Configure your email server (Gmail, Outlook, custom SMTP)' },
                      { tab: 'inbox', icon: Mail, label: 'Inbox', color: 'slate', tooltip: 'Open your live inbox in the mailbox dock' },
                    ].map((item) => {
                      const typedTab = item.tab as SmartDripTab;
                      const isVisited = visitedTabs.includes(typedTab);
                      return (
                        <Tooltip key={item.tab}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleTabChange(typedTab)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                                ${activeTab === item.tab
                                  ? (item.tab === 'mailbox'
                                    ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20'
                                    : 'border-primary bg-primary/20 text-foreground shadow-lg shadow-primary/20')
                                  : (item.tab === 'mailbox'
                                    ? 'border-transparent bg-muted/20 text-white/80 hover:bg-muted/40 hover:text-white'
                                    : 'border-transparent bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground')
                                }`}
                            >
                              <item.icon className={`w-4 h-4 ${item.tab === 'mailbox' ? 'text-white' : ''}`} />
                              <span className={item.tab === 'mailbox' ? 'text-white' : ''}>{item.label}</span>
                              {isVisited && activeTab !== typedTab && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px] text-center">
                            <p>{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
                
                {/* Guidance message - PROMINENT HERO CTA */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-emerald-500 rounded-xl p-5 mb-4 shadow-lg shadow-primary/30 border border-primary/40">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  
                  <div className="relative flex items-center gap-4">
                    {/* Large animated icon */}
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce shadow-lg">
                      <span className="text-3xl">👆</span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">
                        🎯 Your Next Step: Choose a Tab Above!
                      </h3>
                      <p className="text-white/90 text-sm">
                        Click <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Preview</span> to see your emails, 
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">CRM</span> to export leads, 
                        or <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">SMTP</span> to configure sending.
                      </p>
                    </div>
                    
                    {/* Arrow pointing up */}
                    <div className="hidden md:flex flex-col items-center animate-bounce">
                      <ArrowUp className="w-8 h-8 text-white" />
                      <span className="text-xs text-white/80 font-medium">CLICK</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* CONTENT AREA - ONLY THIS CHANGES */}
              <CardContent className="pt-6 min-h-[500px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* MAILBOX VIEW - Default home */}
                    {activeTab === 'mailbox' && (
                      <div className="space-y-6">

                        {/* The Mailbox Animation - THE STAR OF THE SHOW */}
                        <MailboxDripAnimation
                          key={`mailbox-${realSendingMode ? 'real' : 'demo'}-${mailboxAnimationSeed}-${effectiveMailboxEmailLeads.length}`}
                          totalEmails={effectiveMailboxEmailLeads.length}
                          sentCount={demoSentCount}
                          isActive={demoIsActive || realSendingMode}
                          emailsPerHour={dripSettings.emailsPerHour}
                          leads={mailboxLeads}
                          realSendingMode={realSendingMode}
                          campaignId={campaignId || undefined}
                          isPaused={isSendingPaused}
                          onPause={() => {
                            setIsSendingPaused(true);
                            toast.info('Campaign paused');
                          }}
                          onResume={() => {
                            setIsSendingPaused(false);
                            toast.success('Campaign resumed');
                          }}
                          onSend={handleSyncQueuedSend}
                          onPreview={handleActivatePreviewMode}
                          onEmailStatusUpdate={(statuses) => {
                            const sentCount = Object.values(statuses).filter(s => s === 'sent' || s === 'delivered').length;
                            setDemoSentCount(sentCount);
                          }}
                          onOpenMailbox={() => setMailboxOpen(true)}
                          renderAfterBanner={
                            <div className="flex justify-center gap-3">
                              <Button onClick={() => setShowAutoCampaign(true)} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                                <Rocket className="w-4 h-4" />
                                AI Autopilot Campaign
                              </Button>
                              <Button 
                                onClick={() => {
                                  if (!planFeatures.isUnlimited) {
                                    toast.info('Upgrade to Unlimited ($999/mo) for full managed services and no credit limits.');
                                    return;
                                  }
                                  setShowAutoCampaign(true);
                                }} 
                                className={`gap-2 text-white border border-red-500/30 shadow-lg shadow-red-500/20 ${
                                  planFeatures.isUnlimited 
                                    ? "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900" 
                                    : "bg-gradient-to-r from-red-600/50 to-red-800/50 hover:from-red-600/70 hover:to-red-800/70 opacity-80"
                                }`}
                              >
                                <Crown className="w-4 h-4" />
                                Unlimited Mode
                                <Badge className="text-[8px] px-1.5 bg-white/20 text-white border-0 ml-1">$999/mo</Badge>
                              </Button>
                            </div>
                          }
                        />
                        
                        {/* Total Leads Count */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-sm text-muted-foreground">Total Leads Ready</span>
                          <span className="text-2xl font-bold text-primary">{leadsWithEmail.length}</span>
                        </div>
                        
                        {/* SEND EMAILS BUTTON */}
                        <div className="pt-4 border-t border-primary/30">
                          <div className="flex flex-col gap-4">
                            {/* SMTP Check Warning */}
                            {!smtpConfigured && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-warning">SMTP not configured</p>
                                  <p className="text-xs text-muted-foreground">Configure your email server in Settings to send real emails</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleTabChange('settings')} className="text-warning border-warning/30">
                                  Configure SMTP
                                </Button>
                              </div>
                            )}

                            {/* Template Check Warning */}
                            {!selectedTemplate && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                                <FileText className="w-5 h-5 text-warning flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-warning">No template selected</p>
                                  <p className="text-xs text-muted-foreground">Choose an email template before sending</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPhase('template')} className="text-warning border-warning/30">
                                  Choose Template
                                </Button>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                              <div>
                                <p className="text-sm font-semibold text-foreground">Send Health Check</p>
                                <p className="text-xs text-muted-foreground">
                                  Verifies SMTP, recipient coverage, and queued sender status.
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => runSendHealthCheck()}
                                disabled={isHealthChecking}
                                className="gap-2"
                              >
                                {isHealthChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                Check
                              </Button>
                            </div>

                            {sendHealth && (
                              <div className={`p-3 rounded-lg border ${sendHealth.ready ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
                                <p className={`text-sm font-medium ${sendHealth.ready ? 'text-success' : 'text-warning'}`}>
                                  {sendHealth.ready ? 'Ready to send' : 'Send checks need attention'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Valid recipients: {sendHealth.checks.valid_recipients} / {sendHealth.checks.requested_total}
                                  {' '}• Due queue: {sendHealth.checks.scheduled_due}
                                </p>
                                {sendHealth.warnings.length > 0 && (
                                  <p className="text-xs text-warning mt-1">{sendHealth.warnings[0]}</p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-foreground">Ready to launch your campaign?</p>
                                <p className="text-sm text-muted-foreground">
                                  {leadsWithEmail.length} businesses will receive your email via drip sending
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Demo Mode Button */}
                                <Button 
                                  variant="outline"
                                  size="lg"
                                  onClick={handleActivatePreviewMode}
                                  disabled={isSending}
                                  className="gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview
                                </Button>
                                
                                {/* Real Send Button */}
                                <Button 
                                  size="lg"
                                  onClick={handlePrepareRealSend}
                                  disabled={isSending || isHealthChecking || !smtpConfigured || !selectedTemplate}
                                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold px-8 py-6 text-lg shadow-lg shadow-primary/30"
                                >
                                  {isSending ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-5 h-5" />
                                      Send Emails Now
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Campaign Analytics (only appears when real campaign data exists) */}
                        <CampaignAnalyticsDashboard />
                      </div>
                    )}

                    {/* INTELLIGENCE VIEW - Lead Analysis Review */}
                    {activeTab === 'intelligence' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Brain className="w-5 h-5 text-emerald-400" />
                          <h3 className="font-bold text-lg">Lead Intelligence Report</h3>
                          <Badge variant="outline" className="ml-2 text-xs">From Step 1 Analysis</Badge>
                        </div>
                        <LeadIntelligenceReviewPanel
                          searchType={searchType}
                          onOpenSettings={() => handleTabChange('settings')}
                          onApplyStrategy={(strategy) => {
                            setAppliedStrategy({
                              id: strategy.id,
                              name: strategy.name,
                              subjectTemplate: strategy.subjectTemplate,
                              openerTemplate: strategy.openerTemplate,
                              ctaTemplate: strategy.ctaTemplate,
                            });
                            // Apply to template
                            setCustomizedContent({
                              subject: strategy.subjectTemplate,
                              body: `${strategy.openerTemplate}\n\n${strategy.ctaTemplate}`,
                            });
                            localStorage.setItem('bamlead_template_customizations', JSON.stringify({
                              subject: strategy.subjectTemplate,
                              body: `${strategy.openerTemplate}\n\n${strategy.ctaTemplate}`,
                            }));
                            // Save to campaign context for AI Autopilot
                            const leadContext = getStoredLeadContext();
                            saveCampaignLeadsWithContext(leadContext);
                            toast.success(`Applied "${strategy.name}" - AI will use this for personalized outreach`);
                          }}
                          onOpenCompose={(strategy) => {
                            // Apply strategy to template
                            setCustomizedContent({
                              subject: strategy.subjectTemplate,
                              body: `${strategy.openerTemplate}\n\n${strategy.ctaTemplate}`,
                            });
                            localStorage.setItem('bamlead_template_customizations', JSON.stringify({
                              subject: strategy.subjectTemplate,
                              body: `${strategy.openerTemplate}\n\n${strategy.ctaTemplate}`,
                            }));
                            // Save follow-up days if provided
                            if (strategy.followUpDays) {
                              const updatedDrip = { ...dripSettings, followUpDays: strategy.followUpDays };
                              saveDripSettings(updatedDrip);
                              setDripSettings(updatedDrip);
                            }
                            // Save to campaign context for AI Autopilot
                            const leadContext = getStoredLeadContext();
                            saveCampaignLeadsWithContext(leadContext);
                            // Open the mailbox dock
                            setMailboxOpen(true);
                            toast.success(`"${strategy.name}" loaded into composer with follow-up sequence`);
                          }}
                        />
                        
                        {appliedStrategy && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm">Active Strategy: {appliedStrategy.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Both manual campaigns and AI Autopilot will use this approach
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PREVIEW VIEW - WITH EDITABLE TEMPLATE & PERSONALIZED LEAD PREVIEW */}
                    {activeTab === 'preview' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Eye className="w-5 h-5 text-cyan-400" />
                          <h3 className="font-bold text-lg">Email Preview</h3>
                          <Badge variant="outline" className="ml-2 text-xs">Real-time personalization</Badge>
                        </div>
                        
                        {/* Personalized Lead Preview - shows how email looks for each lead */}
                        <PersonalizedLeadPreview
                          subject={customizedContent?.subject || selectedTemplate?.subject || ''}
                          body={customizedContent?.body || selectedTemplate?.body_html || selectedTemplate?.body || ''}
                        />
                        
                        {selectedTemplate && (
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                // Navigate to template phase and open the editor
                                setCurrentPhase('template');
                                setShowTemplateEditor(true);
                                toast.info('Opening template editor...');
                              }}
                              className="gap-2 bg-foreground/10 text-foreground hover:bg-foreground/20 font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              Edit Template
                            </Button>
                          </div>
                        )}
                        
                        {!selectedTemplate && (
                          <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border">
                            <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                            <h3 className="font-semibold mb-2 text-sm">No Template Selected</h3>
                            <p className="text-muted-foreground text-xs mb-3">Select a template to see personalized previews</p>
                            <Button size="sm" onClick={() => setCurrentPhase('template')}>Choose Template</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CRM VIEW */}
                    {activeTab === 'crm' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Database className="w-5 h-5 text-violet-400" />
                          <h3 className="font-bold text-lg">CRM Integration</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Database className="w-4 h-4 text-violet-400" />
                              Connect External CRM
                            </h4>
                            <CRMSelectionPanel leadCount={leads.length} />
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-400" />
                              BamLead CRM
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs">Built-in</Badge>
                            </h4>
                            <p className="text-muted-foreground text-sm mb-4">
                              Manage your leads directly without any external integrations.
                            </p>
                            <BamLeadCRMPanel 
                              leads={leads.map(l => ({
                                id: l.id,
                                name: l.name,
                                email: l.email,
                                phone: l.phone,
                                website: l.website,
                                address: l.address,
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* A/B TESTING VIEW */}
                    {activeTab === 'ab-testing' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FlaskConical className="w-5 h-5 text-pink-400" />
                          <h3 className="font-bold text-lg">A/B Testing</h3>
                        </div>
                        <ABTestingPanel />
                      </div>
                    )}

                    {/* SMTP SETTINGS VIEW */}
                    {activeTab === 'settings' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="w-5 h-5 text-slate-400" />
                          <h3 className="font-bold text-lg">Email Settings (SMTP)</h3>
                        </div>
                        <EmailConfigurationPanel leads={leads} hideTabBar={true} initialTab="smtp" />
                      </div>
                    )}

                    {/* INBOX VIEW */}
                    {activeTab === 'inbox' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Mail className="w-5 h-5 text-cyan-400" />
                          <h3 className="font-bold text-lg">Inbox</h3>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {mailboxUnreadCount} unread
                          </Badge>
                        </div>
                        <Card className="border border-primary/30 bg-primary/5">
                          <CardContent className="p-6 space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Your inbox runs in the mailbox dock so you can keep monitoring sends and replies.
                            </p>
                            <div className="flex items-center gap-2">
                              <Button onClick={() => setMailboxOpen(true)} className="gap-2">
                                <Mail className="w-4 h-4" />
                                {mailboxOpen ? 'Open Inbox Focus' : 'Open Inbox'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleTabChange('mailbox')}
                                className="gap-2"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Mailbox
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCRMModal(true)} className="gap-2">
                <Link2 className="w-4 h-4" />
                Connect External CRM
              </Button>
              <Button 
                variant="outline" 
                onClick={() => smartDripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} 
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Continue to Email
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Floating mailbox on the right (visible throughout Step 3) */}
      <MailboxDock 
        enabled={true} 
        badgeCount={mailboxUnreadCount}
        isOpen={mailboxOpen}
        onOpen={() => {
          refreshInboxUnreadCount();
          setMailboxOpen(true);
        }}
        onClose={() => {
          setMailboxOpen(false);
          refreshInboxUnreadCount();
        }}
        campaignContext={
          realSendingMode ? {
            isActive: true,
            sentCount: demoSentCount,
            totalLeads: leadsWithEmail.length
          } : undefined
        }
        searchType={searchType}
      />

      {/* Back Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/'} className="gap-2 text-muted-foreground hover:text-foreground">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center py-6 bg-gradient-card rounded-2xl border-2 border-primary/20 shadow-card">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">STEP 3: Drip Sequence Email Setup</h1>
        <p className="text-muted-foreground">
          Choose your template, then review your AI strategy
        </p>
      </div>

      {/* Phase Progress */}
      <div className="grid grid-cols-3 gap-2">
        {phases.map((phase, idx) => {
          const isCurrent = phase.id === currentPhase;
          const isComplete = phases.findIndex(p => p.id === currentPhase) > idx;
          
          return (
            <button
              key={phase.id}
              onClick={() => setCurrentPhase(phase.id as any)}
              className={`p-4 rounded-xl text-center transition-all border border-border cursor-pointer hover:scale-102 ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-elevated scale-105 border-primary/30'
                  : isComplete
                  ? 'bg-success/10 text-success hover:bg-success/15 border-success/20'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <phase.icon className="w-6 h-6" />
                )}
                <span className="font-semibold text-sm">{phase.label}</span>
                <span className="text-xs opacity-80 hidden sm:block">{phase.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Phase Content */}
      <Card>
        <CardContent className="p-6">
          {renderPhaseContent()}
        </CardContent>
      </Card>

      {/* Fixed Next Button at Bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 mt-6 shadow-lg rounded-xl">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Step 2
          </Button>
          {smtpConfigured ? (
            <Button
              onClick={handleContinueToDrip}
              type="button"
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-3 text-lg font-bold shadow-elevated"
              size="lg"
            >
              Continue To Drip Sequence Email
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button 
              onClick={() => {
                // Navigate to SMTP setup phase
                setCurrentPhase('smtp');
                toast.success('📧 Now configure your mail server');
              }} 
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-3 text-lg font-bold shadow-elevated"
              size="lg"
            >
              <Server className="w-5 h-5" />
              Next: SMTP Setup
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* CRM Modal */}
      <CRMIntegrationModal
        open={showCRMModal}
        onOpenChange={setShowCRMModal}
        leads={leads.map(l => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phone: l.phone,
          website: l.website,
          email: l.email,
          source: 'gmb' as const,
        }))}
      />

      {/* Auto Campaign Wizard */}
      <AutoCampaignWizard
        open={showAutoCampaign}
        onOpenChange={setShowAutoCampaign}
        leads={leads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
        }))}
        onLaunch={(campaignData) => {
          toast.success(`Campaign "${campaignData.name}" launched!`);
        }}
      />

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirmation} onOpenChange={setShowSendConfirmation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Confirm Email Campaign
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You are about to send emails to <strong>{pendingSendData?.validLeads.length || 0}</strong> recipients.</p>
              
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium truncate max-w-[200px]">{pendingSendData?.emailSubject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipients:</span>
                  <span className="font-medium">{pendingSendData?.validLeads.length} emails</span>
                </div>
              </div>
              
              <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingSendData) return;
                
                const { validLeads, emailSubject, emailBody } = pendingSendData;
                
                // Switch to send phase and show mailbox immediately
                setCurrentPhase('send');
                setActiveTab('mailbox');
                setMailboxAnimationSeed((prev) => prev + 1);
                setRealSendingMode(true);
                setDemoIsActive(true);
                setIsSendingPaused(false);
                smartDripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                setIsSending(true);
                try {
                  console.log('Sending emails to:', validLeads.length, 'leads');
                  
                  // Format leads properly for the email API
                    const formattedLeads = validLeads.map(lead => ({
                      email: lead.email || '',
                    business_name: lead.business_name || 'Business',
                    contact_name: lead.contact_name || 'Contact',
                    website: lead.website || '',
                    phone: lead.phone || '',
                    platform: 'Google',
                    issues: [],
                    leadScore: lead.leadScore || 50,
                    emailValid: true,
                  }));
                  
                  setActiveCampaignLeads(validLeads);

                  const result = await sendBulkEmails({
                    leads: formattedLeads,
                    custom_subject: emailSubject,
                    custom_body: emailBody,
                    send_mode: 'drip',
                    drip_config: {
                      emailsPerHour: dripSettings.emailsPerHour,
                      delayMinutes: Math.max(1, Math.floor(60 / dripSettings.emailsPerHour)),
                    },
                  });
                  
                  if (result.success) {
                    sessionStorage.setItem('emails_sent', 'true');
                    const scheduledCount = result.results?.scheduled || 0;
                    const sentCount = result.results?.sent || 0;
                    toast.success(`🚀 Campaign queued! ${scheduledCount || sentCount} of ${validLeads.length} added to drip queue`, {
                      description: 'The sender worker will deliver due emails automatically.',
                      duration: 6000,
                    });
                    setDemoSentCount(0);
                    onComplete();
                  } else {
                    console.error('Send failed:', result.error);
                    toast.error(result.error || 'Failed to send emails');
                    setRealSendingMode(false);
                    setDemoIsActive(false);
                    setActiveCampaignLeads(null);
                  }
                } catch (error) {
                  console.error('Send error:', error);
                  toast.error('Failed to send emails. Check your connection.');
                  setRealSendingMode(false);
                  setDemoIsActive(false);
                  setActiveCampaignLeads(null);
                } finally {
                  setIsSending(false);
                  setPendingSendData(null);
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Send {pendingSendData?.validLeads.length} Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
