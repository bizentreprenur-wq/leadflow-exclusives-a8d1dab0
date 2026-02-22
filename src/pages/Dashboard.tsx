import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Globe, Mail, Target, TrendingUp,
  Zap, BarChart3, ArrowRight, Sparkles, Menu,
  CheckCircle2, Send, FileText, Chrome,
  Trophy, Bot, Gift, Brain, Server, Building2,
  MapPin, Phone, ExternalLink, Star, Loader2,
  ArrowLeft, Users, ChevronRight, HelpCircle,
  Smartphone, AlertTriangle, XCircle, Crown,
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import LeadVerificationModule, { VerifiedLead } from '@/components/LeadVerificationModule';
import EmailOutreachModule from '@/components/EmailOutreachModule';
import HighConvertingTemplateGallery from '@/components/HighConvertingTemplateGallery';
import EmailTemplateLibrary from '@/components/EmailTemplateLibrary';
import SequenceBuilderModule from '@/components/SequenceBuilderModule';
import CommandPalette from '@/components/CommandPalette';
import ConfettiCelebration, { useCelebration } from '@/components/ConfettiCelebration';
import Mascot3D from '@/components/Mascot3D';
import AffiliateProgram from '@/components/AffiliateProgram';
import FreeTrialBanner from '@/components/FreeTrialBanner';
import ReferralLeaderboard from '@/components/ReferralLeaderboard';
import AISalesMentor from '@/components/AISalesMentor';
import AIJourneyExplainer from '@/components/AIJourneyExplainer';
import ScalabilityDashboard from '@/components/ScalabilityDashboard';
import AdvertisingSpotlight from '@/components/AdvertisingSpotlight';
import VoiceSearchButton from '@/components/VoiceSearchButton';
import SystemDiagnostics from '@/components/SystemDiagnostics';
import { AILeadGrouping } from '@/components/AILeadGrouping';
import SubscriptionManagement from '@/components/SubscriptionManagement';
import EmailWidget from '@/components/EmailWidget';
import AIVerifierWidget from '@/components/AIVerifierWidget';
import PaymentMethodModal from '@/components/PaymentMethodModal';
import EmailVerificationRequired from '@/components/EmailVerificationRequired';
import bamMascot from '@/assets/bamlead-mascot.png';
import { LeadForEmail, clearQueuedEmails } from '@/lib/api/email';
import { searchGMB, GMBResult } from '@/lib/api/gmb';
import type { StreamProgressMeta } from '@/lib/api/gmb';
import type { EnrichmentCallback } from '@/lib/api/gmb';
import { useSMTPConfig } from '@/hooks/useSMTPConfig';
import { searchPlatforms, PlatformResult } from '@/lib/api/platforms';
import { analyzeLeads, LeadGroup, LeadSummary, EmailStrategy, LeadAnalysis } from '@/lib/api/leadAnalysis';
import { quickScoreLeads } from '@/lib/api/aiLeadScoring';
import { HIGH_CONVERTING_TEMPLATES } from '@/lib/highConvertingTemplates';
import { generateMechanicLeads, injectTestLeads } from '@/lib/testMechanicLeads';
import { fetchSearchLeads, saveSearchLeads, deleteSearchLeads, SearchLead } from '@/lib/api/searchLeads';
import { checkPaymentMethod } from '@/lib/api/stripeSetup';
import AutoFollowUpBuilder from '@/components/AutoFollowUpBuilder';
import LeadResultsPanel from '@/components/LeadResultsPanel';
import LeadDocumentViewer from '@/components/LeadDocumentViewer';
import DataFieldSelector, { DATA_FIELD_OPTIONS } from '@/components/DataFieldSelector';
import SettingsPanel from '@/components/SettingsPanel';
import VoiceCallWidget from '@/components/VoiceCallWidget';
import VoiceAgentSetupGuide from '@/components/VoiceAgentSetupGuide';
import CallLogHistory from '@/components/CallLogHistory';
import LeadDecisionPopup from '@/components/LeadDecisionPopup';
import SimpleLeadViewer from '@/components/SimpleLeadViewer';
import EmailSetupFlow from '@/components/EmailSetupFlow';
import CloudCRMIntegrationsPanel from '@/components/CloudCRMIntegrationsPanel';
import CRMIntegrationModal from '@/components/CRMIntegrationModal';
import Step4AICallingHub from '@/components/Step4AICallingHub';
import AILeadScoringDashboard from '@/components/AILeadScoringDashboard';
import ChromeExtensionPanel from '@/components/ChromeExtensionPanel';
import UserManualDownload from '@/components/UserManualDownload';
import { VideoTutorialSection } from '@/components/VideoTutorialSection';
import AIProcessingPipeline from '@/components/AIProcessingPipeline';
import StreamingLeadsIndicator from '@/components/StreamingLeadsIndicator';
import EnrichmentStatusPanel from '@/components/EnrichmentStatusPanel';
import WorkflowOnboardingTour, { startWorkflowTour } from '@/components/WorkflowOnboardingTour';
import SearchTypeOnboarding, { shouldShowSearchOnboarding, trackLoginForOnboarding } from '@/components/SearchTypeOnboarding';
import AutopilotOnboardingWizard from '@/components/AutopilotOnboardingWizard';
import SuperAIResearchModeSelector, { ResearchMode } from '@/components/SuperAIResearchModeSelector';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  // AI Scoring fields
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  successProbability?: number;
  recommendedAction?: 'call' | 'email' | 'both';
  callScore?: number;
  emailScore?: number;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  painPoints?: string[];
  readyToCall?: boolean;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
  // Firecrawl enrichment data
  enrichment?: {
    emails?: string[];
    phones?: string[];
    socials?: Record<string, string>;
    hasEmail?: boolean;
    hasPhone?: boolean;
    hasSocials?: boolean;
    scrapedAt?: string;
    isCatchAll?: boolean;
    sources?: string[];
  };
  enrichmentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  // Social profiles
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
}

// Step configuration - 4 simple steps
const WORKFLOW_STEPS = [
  { id: 1, title: 'STEP 1: Search', description: 'Find businesses', icon: Search, emoji: '🔍' },
  { id: 2, title: 'STEP 2: Leads', description: 'View & decide action', icon: Users, emoji: '📋' },
  { id: 3, title: 'STEP 3: Drip Sequence', description: 'Email Setup & Launch', icon: Send, emoji: '📧' },
  { id: 4, title: 'STEP 4: Call', description: 'AI voice calls', icon: Phone, emoji: '📞' },
];

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('workflow');
  const isFreshLoginRef = useRef(false);
  // Initialize emailLeads from sessionStorage for persistence across steps
  const [emailLeads, setEmailLeads] = useState<LeadForEmail[]>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_email_leads');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { celebrate } = useCelebration();
  const { status: smtpStatus } = useSMTPConfig();
  const { needsOnboarding, completeOnboarding, isAutopilot, tier } = usePlanFeatures();
  
  // Autopilot onboarding wizard state
  const [showAutopilotOnboarding, setShowAutopilotOnboarding] = useState(false);
  
  // Show onboarding wizard for new Autopilot subscribers
  useEffect(() => {
    if (needsOnboarding && isAutopilot) {
      setShowAutopilotOnboarding(true);
    }
  }, [needsOnboarding, isAutopilot]);

  // Workflow state - Initialize from sessionStorage for persistence
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_current_step');
      return saved ? parseInt(saved, 10) : 1;
    } catch { return 1; }
  });
  const [searchType, setSearchType] = useState<'gmb' | 'platform' | null>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_search_type');
      return saved ? (saved as 'gmb' | 'platform') : null;
    } catch { return null; }
  });
  // Research mode for Super AI Search: 'niche' = find prospects, 'competitive' = compare to your business
  const [researchMode, setResearchMode] = useState<'niche' | 'competitive'>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_research_mode');
      return (saved as 'niche' | 'competitive') || 'niche';
    } catch { return 'niche'; }
  });
  // User's own business info for competitive analysis
  const [myBusinessInfo, setMyBusinessInfo] = useState<{ name: string; url: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_my_business_info');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [query, setQuery] = useState(() => sessionStorage.getItem('bamlead_query') || '');
  const [location, setLocation] = useState(() => sessionStorage.getItem('bamlead_location') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchCoverageMeta, setSearchCoverageMeta] = useState<StreamProgressMeta | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const getResultsMap = () => {
    try {
      const raw = localStorage.getItem('bamlead_search_results_by_type');
      return raw ? (JSON.parse(raw) as Record<string, SearchResult[]>) : {};
    } catch {
      return {};
    }
  };

  const setResultsMap = (map: Record<string, SearchResult[]>) => {
    localStorage.setItem('bamlead_search_results_by_type', JSON.stringify(map));
  };

  const getCachedResultsForType = (type: 'gmb' | 'platform' | null) => {
    if (!type) return [];
    const map = getResultsMap();
    if (Array.isArray(map[type])) return map[type];
    try {
      const savedType = localStorage.getItem('bamlead_search_type');
      const generic = localStorage.getItem('bamlead_search_results');
      if (savedType === type && generic) {
        const parsed = JSON.parse(generic);
        if (Array.isArray(parsed)) {
          map[type] = parsed;
          setResultsMap(map);
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return [];
  };

  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    try {
      const savedType = sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' | null;
      const cached = getCachedResultsForType(savedType);
      if (cached.length > 0) {
        return cached;
      }
      const saved = sessionStorage.getItem('bamlead_search_results');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // Platform selection for scanner
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['gmb', 'wordpress', 'wix', 'squarespace', 'joomla']);
  const [searchLimit, setSearchLimit] = useState<number>(100); // Default 100 results
  const [lastRequestedLimit, setLastRequestedLimit] = useState<number | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bamlead_selected_leads');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // AI Lead Grouping state
  const [aiGroups, setAiGroups] = useState<Record<string, LeadGroup> | null>(null);
  const [aiSummary, setAiSummary] = useState<LeadSummary | null>(null);
  const [aiStrategies, setAiStrategies] = useState<Record<string, EmailStrategy> | null>(null);
  const [showAiGrouping, setShowAiGrouping] = useState(false);
  
  // AI Strategy & Email Sequence tracking for Step 4 script generation
  const [selectedAIStrategy, setSelectedAIStrategy] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('bamlead_selected_strategy');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.strategyId || parsed.strategy?.id || null;
      }
      return null;
    } catch { return null; }
  });
  const [activeEmailSequences, setActiveEmailSequences] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bamlead_active_sequence');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [parsed.name || parsed.id].filter(Boolean);
      }
      return [];
    } catch { return []; }
  });
  const [proposalType, setProposalType] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_selected_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.proposalType || null;
      }
      return null;
    } catch { return null; }
  });

  // Widget states
  const [showEmailWidget, setShowEmailWidget] = useState(false);
  const [showVerifierWidget, setShowVerifierWidget] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportAutoPopKey, setReportAutoPopKey] = useState<string | null>(null);
  // Persist lastReportShownKey so the Intelligence Report does NOT auto-open again for the same search
  const [lastReportShownKey, setLastReportShownKey] = useState<string | null>(() => {
    try { return localStorage.getItem('bamlead_last_report_shown_key'); } catch { return null; }
  });
  const [advanceToStep2AfterReport, setAdvanceToStep2AfterReport] = useState(false);
  const [isEmailEnriching, setIsEmailEnriching] = useState(false);
  const [emailEnrichTotal, setEmailEnrichTotal] = useState(0);
  const [emailEnrichCompleted, setEmailEnrichCompleted] = useState(0);
  const emailEnrichRunId = useRef(0);
  // Social contact enrichment state
  const [isSocialEnriching, setIsSocialEnriching] = useState(false);
  const [socialEnrichTotal, setSocialEnrichTotal] = useState(0);
  const [socialEnrichCompleted, setSocialEnrichCompleted] = useState(0);
  const socialEnrichRunId = useRef(0);
  const [autoSelectAllForAIScoring, setAutoSelectAllForAIScoring] = useState(false);
  const [widgetLeads, setWidgetLeads] = useState<SearchResult[]>([]);
  const [verifiedWidgetLeads, setVerifiedWidgetLeads] = useState<any[]>([]);
  
  // Outreach mode toggle (email or verify)
  const [outreachMode, setOutreachMode] = useState<'email' | 'verify'>('email');
  
  // Search filter options - persist in localStorage
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_no_website') === 'true'; } catch { return false; }
  });
  const [notMobileOnly, setNotMobileOnly] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_not_mobile') === 'true'; } catch { return false; }
  });
  const [outdatedOnly, setOutdatedOnly] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_outdated') === 'true'; } catch { return false; }
  });
  const [phoneLeadsOnly, setPhoneLeadsOnly] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_phone_only') === 'true'; } catch { return false; }
  });

  // Persist filter settings to localStorage
  useEffect(() => {
    localStorage.setItem('bamlead_filter_no_website', noWebsiteOnly.toString());
    localStorage.setItem('bamlead_filter_not_mobile', notMobileOnly.toString());
    localStorage.setItem('bamlead_filter_outdated', outdatedOnly.toString());
    localStorage.setItem('bamlead_filter_phone_only', phoneLeadsOnly.toString());
  }, [noWebsiteOnly, notMobileOnly, outdatedOnly, phoneLeadsOnly]);

  // Ensure search type picker shows after a new login (token change)
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        isFreshLoginRef.current = false;
        return;
      }

      const lastToken = sessionStorage.getItem('bamlead_last_auth_token');
      const isFreshLogin = token !== lastToken;
      isFreshLoginRef.current = isFreshLogin;

      if (isFreshLogin) {
        sessionStorage.setItem('bamlead_last_auth_token', token);
        setCurrentStep(1);
        setSearchType(null);
        setQuery('');
        setLocation('');
        sessionStorage.removeItem('bamlead_current_step');
        sessionStorage.removeItem('bamlead_search_type');
        sessionStorage.removeItem('bamlead_query');
        sessionStorage.removeItem('bamlead_location');
        sessionStorage.removeItem('bamlead_search_results');
        sessionStorage.removeItem('bamlead_email_leads');
        sessionStorage.removeItem('leadsToVerify');
        sessionStorage.removeItem('savedLeads');
      }
    } catch {
      isFreshLoginRef.current = false;
    }
  }, []);
  
  // Settings tab to open (for deep-linking)
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('integrations');
  const [hideWebhooksInSettings, setHideWebhooksInSettings] = useState(false);
  
  // CRM Modal state
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showAIScoringDashboard, setShowAIScoringDashboard] = useState(false);

  // AI Processing Pipeline state
  const [showAIPipeline, setShowAIPipeline] = useState(false);
  const [aiPipelineProgress, setAIPipelineProgress] = useState(0);
  const [currentAIAgent, setCurrentAIAgent] = useState<string>('');
  
  // Live data mode indicator (true when real SerpAPI data is being used)
  const [isLiveDataMode, setIsLiveDataMode] = useState(false);

  const persistLastReportShownKey = useCallback((key: string | null) => {
    if (!key) return;
    setLastReportShownKey(key);
    localStorage.setItem('bamlead_last_report_shown_key', key);
  }, []);

  const normalizeLookupKey = (value?: string | null) => {
    const raw = (value || '').trim();
    if (!raw) return '';
    try {
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const path = (parsed.pathname || '/').replace(/\/+$/, '') || '/';
      return `${host}${path === '/' ? '' : path}`;
    } catch {
      return raw
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/+$/, '');
    }
  };


  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{ query?: boolean; location?: boolean; platforms?: boolean }>({});
  
  // Data field preferences - default to fields marked as default
  const [selectedDataFields, setSelectedDataFields] = useState<string[]>(
    DATA_FIELD_OPTIONS.filter(f => f.default).map(f => f.id)
  );

  // Payment method modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSearchType, setPendingSearchType] = useState<'gmb' | 'platform' | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Search Type Onboarding modal - shows first 2 logins
  const [showSearchOnboarding, setShowSearchOnboarding] = useState(() => {
    const shouldShow = shouldShowSearchOnboarding();
    if (shouldShow) {
      // Track this login for the onboarding display logic
      trackLoginForOnboarding();
    }
    return shouldShow;
  });

  // Persist workflow state to localStorage (not sessionStorage) so leads survive logout/login cycles
  // Users must explicitly click "Clear All Data" to remove their leads
  useEffect(() => {
    localStorage.setItem('bamlead_current_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (searchType) {
      localStorage.setItem('bamlead_search_type', searchType);
    }
  }, [searchType, searchResults]);

  useEffect(() => {
    localStorage.setItem('bamlead_query', query);
  }, [query]);

  useEffect(() => {
    localStorage.setItem('bamlead_location', location);
  }, [location]);

  useEffect(() => {
    if (searchResults.length > 0) {
      localStorage.setItem('bamlead_search_results', JSON.stringify(searchResults));
    }
    if (searchType) {
      const map = getResultsMap();
      map[searchType] = searchResults;
      setResultsMap(map);
      sessionStorage.setItem('bamlead_search_results', JSON.stringify(searchResults));
    }
    if (searchResults.length === 0 && searchType) {
      const map = getResultsMap();
      map[searchType] = [];
      setResultsMap(map);
      sessionStorage.setItem('bamlead_search_results', JSON.stringify([]));
      localStorage.setItem('bamlead_search_results', JSON.stringify([]));
    }
  }, [searchResults, searchType]);

  useEffect(() => {
    if (!searchType) return;
    if (searchResults.length > 0 && searchResults.every((lead) => lead.source === searchType)) {
      sessionStorage.setItem('bamlead_search_results', JSON.stringify(searchResults));
      localStorage.setItem('bamlead_search_results', JSON.stringify(searchResults));
      return;
    }
    const cached = getCachedResultsForType(searchType);
    setSearchResults(cached);
    setSelectedLeads([]);
    sessionStorage.setItem('bamlead_search_results', JSON.stringify(cached));
    localStorage.setItem('bamlead_search_results', JSON.stringify(cached));
  }, [searchType]);

  useEffect(() => {
    if (currentStep !== 2 || searchResults.length === 0) return;
    // Only auto-open immediately after a NEW search (never on login/restore).
    const key = reportAutoPopKey;
    if (!key || lastReportShownKey === key || showReportModal) return;
    persistLastReportShownKey(key);
    setShowReportModal(true);
  }, [currentStep, searchResults.length, reportAutoPopKey, lastReportShownKey, showReportModal, persistLastReportShownKey]);

  useEffect(() => {
    if (emailLeads.length > 0) {
      localStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
    }
  }, [emailLeads]);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ target?: string }>).detail;
      if (!detail?.target) return;
      if (detail.target === 'smtp-setup') {
        setCurrentStep(3);
        localStorage.setItem('bamlead_current_step', '3');
        localStorage.setItem('bamlead_email_setup_phase', 'smtp');
      }
      if (detail.target === 'template-gallery') {
        setCurrentStep(3);
        localStorage.setItem('bamlead_current_step', '3');
        localStorage.setItem('bamlead_email_setup_phase', 'template');
        localStorage.setItem('bamlead_focus_template_gallery', '1');
      }
    };

    window.addEventListener('bamlead-navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('bamlead-navigate', handleNavigate as EventListener);
    };
  }, []);

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const paymentType = searchParams.get('type');
    if (paymentStatus === 'success') {
      if (paymentType === 'credits') {
        const credits = Number(searchParams.get('credits') || 0);
        const creditLabel = Number.isFinite(credits) && credits > 0 ? `${credits} credits` : 'your credits';
        toast.success(`Payment successful! ${creditLabel} purchase completed.`);
      } else {
        toast.success('Payment successful! Your subscription is now active.');
        celebrate('subscription-activated');
        refreshUser();
      }
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, refreshUser, celebrate]);

  // Track when leads were restored from a previous session
  const [restoredFromSession, setRestoredFromSession] = useState<{
    source: 'localStorage' | 'database';
    timestamp: string;
    leadCount: number;
  } | null>(null);

  // Track manual save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => {
    try { return localStorage.getItem('bamlead_search_timestamp'); } catch { return null; }
  });

  // Search-time enrichment is now handled by backend custom one-shot fetcher.

  // Manual save function
  const handleManualSave = async (): Promise<boolean> => {
    const token = localStorage.getItem('auth_token');
    if (!token || searchResults.length === 0 || !searchType) {
      toast.error('Cannot save: No leads or not authenticated');
      return false;
    }

    setIsSaving(true);
    try {
      const response = await saveSearchLeads(
        searchResults.map(r => ({
          id: r.id,
          name: r.name,
          address: r.address,
          phone: r.phone,
          website: r.website,
          email: r.email,
          rating: r.rating,
          source: r.source,
          platform: r.platform,
          aiClassification: r.aiClassification,
          leadScore: r.leadScore,
          successProbability: r.successProbability,
          recommendedAction: r.recommendedAction,
          callScore: r.callScore,
          emailScore: r.emailScore,
          urgency: r.urgency,
          painPoints: r.painPoints,
          readyToCall: r.readyToCall,
          websiteAnalysis: r.websiteAnalysis,
        })),
        {
          searchQuery: query,
          searchLocation: location,
          sourceType: searchType,
          clearPrevious: true
        }
      );

      if (response.success) {
        const timestamp = new Date().toISOString();
        localStorage.setItem('bamlead_search_timestamp', timestamp);
        setLastSavedAt(timestamp);
        toast.success(`Saved ${searchResults.length} leads to cloud backup`);
        return true;
      } else {
        toast.error('Failed to save: ' + (response.error || 'Unknown error'));
        return false;
      }
    } catch (error) {
      console.error('[BamLead] Manual save error:', error);
      toast.error('Save failed. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Restore from version snapshot
  const handleRestoreVersion = (version: { leads: SearchResult[]; timestamp: string; query?: string; location?: string }) => {
    setSearchResults(version.leads);
    localStorage.setItem('bamlead_search_results', JSON.stringify(version.leads));
    
    if (version.query) {
      setQuery(version.query);
      localStorage.setItem('bamlead_query', version.query);
    }
    if (version.location) {
      setLocation(version.location);
      localStorage.setItem('bamlead_location', version.location);
    }
    
    setRestoredFromSession({
      source: 'localStorage',
      timestamp: version.timestamp,
      leadCount: version.leads.length
    });
  };

  // Load persisted leads on dashboard init (runs once on mount)
  // Priority: 1) localStorage (survives logout), 2) Database (remote backup)
  // Leads only clear when user explicitly clicks "Clear All Data"
  useEffect(() => {
    const loadPersistedLeads = async () => {
      const shouldRestoreWorkflow = !isFreshLoginRef.current;

      // Check localStorage first for existing results (survives logout/login)
      const localResults = localStorage.getItem('bamlead_search_results');
      const searchTimestamp = localStorage.getItem('bamlead_search_timestamp');
      
      if (localResults) {
        try {
          const parsed = JSON.parse(localResults);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[BamLead] Using localStorage leads:', parsed.length);
            setSearchResults(parsed);
            
            // Mark as restored from localStorage
            setRestoredFromSession({
              source: 'localStorage',
              timestamp: searchTimestamp || new Date().toISOString(),
              leadCount: parsed.length
            });
            
            // Restore search context from localStorage
            if (shouldRestoreWorkflow) {
              const savedStep = localStorage.getItem('bamlead_current_step');
              const savedQuery = localStorage.getItem('bamlead_query');
              const savedLocation = localStorage.getItem('bamlead_location');
              const savedType = localStorage.getItem('bamlead_search_type');
              
              if (savedQuery) setQuery(savedQuery);
              if (savedLocation) setLocation(savedLocation);
              if (savedType) setSearchType(savedType as 'gmb' | 'platform');
              if (savedStep) setCurrentStep(parseInt(savedStep, 10) || 2);
            }
            
            return; // Already have results in localStorage, skip DB fetch
          }
        } catch {
          // Invalid localStorage data, will fetch from DB
        }
      }
      
      // Skip DB fetch for non-authenticated users (use canonical 'auth_token' key)
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      try {
        console.log('[BamLead] Fetching persisted leads from database...');
        const response = await fetchSearchLeads({ limit: 500 });
        
        if (response.success && response.data?.leads && response.data.leads.length > 0) {
          console.log('[BamLead] Loaded persisted leads from DB:', response.data.leads.length);
          
          // Map DB leads to SearchResult format
          const mappedLeads: SearchResult[] = response.data.leads.map(lead => ({
            id: lead.id,
            name: lead.name,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            email: lead.email,
            rating: lead.rating,
            source: lead.source,
            platform: lead.platform,
            aiClassification: lead.aiClassification,
            leadScore: lead.leadScore,
            successProbability: lead.successProbability,
            recommendedAction: lead.recommendedAction,
            callScore: lead.callScore,
            emailScore: lead.emailScore,
            urgency: lead.urgency,
            painPoints: lead.painPoints,
            readyToCall: lead.readyToCall,
            websiteAnalysis: lead.websiteAnalysis,
          }));
          
          setSearchResults(mappedLeads);
          
          // Mark as restored from database
          const dbTimestamp = response.data.latestSearch?.createdAt || new Date().toISOString();
          setRestoredFromSession({
            source: 'database',
            timestamp: dbTimestamp,
            leadCount: mappedLeads.length
          });
          
          // Cache in localStorage so leads survive logout/login
          localStorage.setItem('bamlead_search_results', JSON.stringify(mappedLeads));
          localStorage.setItem('bamlead_search_timestamp', dbTimestamp);
          
          // Restore search context if available
          if (response.data.latestSearch) {
            const { query: savedQuery, location: savedLocation, sourceType } = response.data.latestSearch;
            if (savedQuery) {
              localStorage.setItem('bamlead_query', savedQuery);
            }
            if (savedLocation) {
              localStorage.setItem('bamlead_location', savedLocation);
            }
            if (sourceType) {
              localStorage.setItem('bamlead_search_type', sourceType);
            }
          }

          if (shouldRestoreWorkflow && response.data.latestSearch) {
            const { query: savedQuery, location: savedLocation, sourceType } = response.data.latestSearch;
            if (savedQuery) setQuery(savedQuery);
            if (savedLocation) setLocation(savedLocation);
            if (sourceType) setSearchType(sourceType);
            // Move to step 2 if user has existing leads (returning user)
            setCurrentStep(2);
            localStorage.setItem('bamlead_current_step', '2');
            toast.info(`Restored ${mappedLeads.length} leads from your last search`);
          }
        } else {
          console.log('[BamLead] No persisted leads found in database');
        }
      } catch (error) {
        console.error('[BamLead] Failed to load persisted leads:', error);
      }
    };
    
    loadPersistedLeads();
  }, []);

  // Auto-save leads to database every 60 seconds (when leads exist and user is authenticated)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || searchResults.length === 0 || !searchType) return;
    
    // Don't auto-save mock data
    const hasRealData = searchResults.some(r => !r.id.startsWith('mock_'));
    if (!hasRealData) return;

    const autoSaveInterval = setInterval(async () => {
      console.log('[BamLead] Auto-saving leads to database...');
      try {
        const response = await saveSearchLeads(
          searchResults.map(r => ({
            id: r.id,
            name: r.name,
            address: r.address,
            phone: r.phone,
            website: r.website,
            email: r.email,
            rating: r.rating,
            source: r.source,
            platform: r.platform,
            aiClassification: r.aiClassification,
            leadScore: r.leadScore,
            successProbability: r.successProbability,
            recommendedAction: r.recommendedAction,
            callScore: r.callScore,
            emailScore: r.emailScore,
            urgency: r.urgency,
            painPoints: r.painPoints,
            readyToCall: r.readyToCall,
            websiteAnalysis: r.websiteAnalysis,
          })),
          {
            searchQuery: query,
            searchLocation: location,
            sourceType: searchType,
            clearPrevious: true
          }
        );
        
        if (response.success) {
          console.log('[BamLead] Auto-save successful:', response.data?.saved, 'leads');
          // Update timestamp
          const timestamp = new Date().toISOString();
          localStorage.setItem('bamlead_search_timestamp', timestamp);
          setLastSavedAt(timestamp);
        } else {
          console.warn('[BamLead] Auto-save failed:', response.error);
        }
      } catch (error) {
        console.error('[BamLead] Auto-save error:', error);
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(autoSaveInterval);
  }, [searchResults, searchType, query, location]);

  const handleLogout = async () => {
    // Clear all session/localStorage state so user sees default view on next login
    sessionStorage.removeItem('bamlead_current_step');
    sessionStorage.removeItem('bamlead_search_type');
    sessionStorage.removeItem('bamlead_query');
    sessionStorage.removeItem('bamlead_location');
    sessionStorage.removeItem('bamlead_search_results');
    sessionStorage.removeItem('bamlead_email_leads');
    sessionStorage.removeItem('leadsToVerify');
    sessionStorage.removeItem('savedLeads');
    localStorage.removeItem('bamlead_selected_leads');
    localStorage.removeItem('bamlead_search_results_by_type');
    
    await logout();
    navigate('/');
  };

  // Check payment method and handle search type selection
  const handleSearchTypeClick = async (type: 'gmb' | 'platform') => {
    // If user already has active subscription, proceed directly
    if (user?.has_active_subscription || user?.is_owner || user?.subscription_plan === 'free_granted') {
      setSearchType(type);
      return;
    }

    // Check payment method status from backend
    setIsCheckingPayment(true);
    try {
      const status = await checkPaymentMethod();
      
      if (status.has_active_subscription || status.has_payment_method || !status.requires_payment_setup) {
        // User has valid subscription or payment method, proceed
        setSearchType(type);
      } else {
        // User needs to add payment method for trial
        setPendingSearchType(type);
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error('Payment check failed:', err);
      // On error, still allow proceeding (backend will handle auth)
      setSearchType(type);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Handle successful payment method setup
  const handlePaymentMethodSuccess = () => {
    toast.success('🎉 Your 7-day free trial has started! Enjoy all Pro features.');
    celebrate('subscription-activated');
    refreshUser();
    
    // Proceed with the pending search type selection
    if (pendingSearchType) {
      setSearchType(pendingSearchType);
      setPendingSearchType(null);
    }
  };

  const handleSendToEmail = (leads: VerifiedLead[]) => {
    const convertedLeads: LeadForEmail[] = leads.map((l) => ({
      email: l.email,
      business_name: l.business_name,
      contact_name: l.contact_name,
      website: l.website,
      phone: l.phone,
    }));
    setEmailLeads(convertedLeads);
    setCurrentStep(3);
  };

  const [searchError, setSearchError] = useState<string | null>(null);
  const [partialResultsNotice, setPartialResultsNotice] = useState<{ found: number; requested: number } | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'idle' | 'verifying' | 'retrying' | 'failed'>('idle');
  const [networkRetryAttempt, setNetworkRetryAttempt] = useState<number>(0);

  const handleSearch = async (options?: { append?: boolean }) => {
    const append = options?.append === true;
    // Clear previous error and network status
    setSearchError(null);
    setPartialResultsNotice(null);
    setNetworkStatus('idle');
    setNetworkRetryAttempt(0);
    
    // Validate fields and set error states
    const errors: { query?: boolean; location?: boolean; platforms?: boolean } = {};
    
    if (!query.trim()) {
      errors.query = true;
    }
    if (!location.trim()) {
      errors.location = true;
    }
    if (searchType === 'platform' && selectedPlatforms.length === 0) {
      errors.platforms = true;
    }
    
    setValidationErrors(errors);
    
    if (errors.query || errors.location || errors.platforms) {
      // If a previous Intelligence Report is open, close it.
      setShowReportModal(false);
      toast.error('Please fill in the highlighted fields above');
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setSearchCoverageMeta(null);
    if (!append) {
      setSearchResults([]); // Clear previous results
      setSelectedLeads([]); // Clear previous selections
      setEmailLeads([]); // Clear email leads from previous search
      setAiGroups(null);
      setAiSummary(null);
      setAiStrategies(null);
      setShowAiGrouping(false);
      setShowAIPipeline(false); // Reset AI pipeline for new search
    }
    setAIPipelineProgress(0);
    setCurrentAIAgent('');
    emailEnrichRunId.current += 1;
    setIsEmailEnriching(false);
    setEmailEnrichTotal(0);
    setEmailEnrichCompleted(0);

    // Ensure the Intelligence Report is closed while running a new search
    setShowReportModal(false);
    setAdvanceToStep2AfterReport(false);
    
    // Clear localStorage for previous search data (new search replaces old)
    if (!append) {
      localStorage.removeItem('bamlead_search_results');
      localStorage.removeItem('bamlead_email_leads');
      localStorage.removeItem('bamlead_selected_leads');
    }

    const requestedLimit = searchLimit;
    const minimumAcceptableResults = Math.ceil(requestedLimit * 0.95);
    const startingResults: SearchResult[] = append ? [...searchResults] : [];
    let latestMergedResults: SearchResult[] = startingResults;
    const optionBSearch = searchType === 'platform';
    const backendFilters = {
      phoneOnly: phoneLeadsOnly,
      noWebsite: optionBSearch ? noWebsiteOnly : false,
      notMobile: optionBSearch ? notMobileOnly : false,
      outdated: optionBSearch ? outdatedOnly : false,
      platforms: searchType === 'platform' ? selectedPlatforms : [],
      platformMode: searchType === 'platform',
    };
    const backendFiltersActive =
      backendFilters.phoneOnly ||
      backendFilters.noWebsite ||
      backendFilters.notMobile ||
      backendFilters.outdated ||
      (backendFilters.platforms && backendFilters.platforms.length > 0);
    setLastRequestedLimit(requestedLimit);
    // Backend handles over-fetching, location expansion, and query variants to hit requested volume.
    const effectiveLimit = requestedLimit;

    console.log('[BamLead] Starting search:', {
      searchType,
      query,
      location,
      requestedLimit,
      effectiveLimit
    });

    try {
      let finalResults: SearchResult[] = [];
      
      // Progress callback for streaming results
      let pendingPartialResults: any[] | null = null;
      let progressFlushScheduled = false;
      const flushProgressResults = () => {
        progressFlushScheduled = false;
        const snapshot = pendingPartialResults;
        pendingPartialResults = null;
        if (!snapshot) return;

        const mapped = snapshot.map((r: any, index: number) => ({
          id: r.id || `result-${index}`,
          name: r.name || 'Unknown Business',
          address: r.address,
          phone: r.phone,
          website: r.url || r.website,
          email: r.email || undefined,
          rating: r.rating,
          source: searchType as 'gmb' | 'platform',
          platform: r.websiteAnalysis?.platform || undefined,
          websiteAnalysis: r.websiteAnalysis,
          enrichment: r.enrichment,
          enrichmentStatus: r.enrichmentStatus,
          facebookUrl: r.enrichment?.socials?.facebook,
          linkedinUrl: r.enrichment?.socials?.linkedin,
          instagramUrl: r.enrichment?.socials?.instagram,
          youtubeUrl: r.enrichment?.socials?.youtube,
          tiktokUrl: r.enrichment?.socials?.tiktok,
        }));

        if (append) {
          const merged = mergeLeads(latestMergedResults, mapped);
          latestMergedResults = merged;
          setSearchResults(merged);
        } else {
          setSearchResults(mapped);
        }
      };
      const scheduleProgressFlush = () => {
        if (progressFlushScheduled) return;
        progressFlushScheduled = true;
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(flushProgressResults);
        } else {
          setTimeout(flushProgressResults, 16);
        }
      };

      const handleProgress = (partialResults: any[], progress: number, meta?: StreamProgressMeta) => {
        console.log('[BamLead] Search progress:', progress, 'results:', partialResults.length);
        setSearchProgress(progress);
        if (meta) {
          setSearchCoverageMeta(prev => ({ ...(prev || {}), ...meta }));
        }
        pendingPartialResults = partialResults;
        scheduleProgressFlush();
      };
      
      // Handle real-time enrichment updates from Firecrawl
      const handleEnrichment: EnrichmentCallback = (leadId, enrichmentData) => {
        console.log('[BamLead] Enrichment received for lead:', leadId, enrichmentData);
        
        if (!enrichmentData) return;
        
        // Update the lead in search results with enrichment data
        setSearchResults(prev => prev.map(lead => {
          if (lead.id !== leadId) return lead;
          
          // Merge enrichment data into lead
          const updatedLead = {
            ...lead,
            email: enrichmentData.emails?.[0] || lead.email,
            phone: enrichmentData.phones?.[0] || lead.phone,
            enrichment: enrichmentData,
            enrichmentStatus: 'completed' as const,
          };
          
          // Cache social contacts in sessionStorage for SocialMediaLookup component
          if (enrichmentData.socials && Object.keys(enrichmentData.socials).length > 0) {
            const cacheKey = `social_contacts_${lead.name}_${lead.address || ''}`;
            // Convert socials to profiles format matching SocialContactsResult
            const profiles: Record<string, { url: string }> = {};
            Object.entries(enrichmentData.socials).forEach(([platform, url]) => {
              profiles[platform] = { url };
            });
            
            const socialData = {
              success: true,
              cached: true,
              business_name: lead.name,
              location: lead.address || '',
              contacts: {
                emails: enrichmentData.emails || [],
                phones: enrichmentData.phones || [],
                sources: Object.keys(enrichmentData.socials),
                profiles,
              },
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(socialData));
          }
          
          return updatedLead;
        }));
      };
      
      if (searchType === 'gmb') {
        console.log('[BamLead] Calling searchGMB API...');
        const handleNetworkStatus = (status: 'verifying' | 'retrying' | 'connected' | 'failed', attempt?: number) => {
          console.log('[BamLead] Network status:', status, 'attempt:', attempt);
          if (status === 'verifying' || status === 'retrying') {
            setNetworkStatus(status);
            setNetworkRetryAttempt(attempt || 0);
          } else if (status === 'connected') {
            setNetworkStatus('idle');
          } else if (status === 'failed') {
            setNetworkStatus('failed');
          }
        };
        const response = await searchGMB(query, location, effectiveLimit, handleProgress, backendFilters, handleNetworkStatus, handleEnrichment);
        console.log('[BamLead] GMB response:', response);
        if (response.success && response.data) {
          finalResults = response.data.map((r: GMBResult, index: number) => ({
            id: r.id || `gmb-${index}`,
            name: r.name || 'Unknown Business',
            email: r.email,
            address: r.address,
            phone: r.phone,
            website: r.url,
            rating: r.rating,
            source: 'gmb' as const,
            websiteAnalysis: r.websiteAnalysis,
            enrichment: r.enrichment,
            enrichmentStatus: r.enrichmentStatus,
            facebookUrl: r.enrichment?.socials?.facebook,
            linkedinUrl: r.enrichment?.socials?.linkedin,
            instagramUrl: r.enrichment?.socials?.instagram,
            youtubeUrl: r.enrichment?.socials?.youtube,
            tiktokUrl: r.enrichment?.socials?.tiktok,
          }));
        } else if (response.error) {
          throw new Error(response.error);
        }
      } else if (searchType === 'platform') {
        // Agency Lead Finder now uses GMB search as primary (Google Maps + Yelp + Bing)
        // then filters for platform-specific opportunities
        console.log('[BamLead] Agency Lead Finder: Using GMB search with platform filtering, limit:', effectiveLimit);
        const response = await searchGMB(query, location, effectiveLimit, handleProgress, backendFilters, undefined, handleEnrichment);
        console.log('[BamLead] Agency Lead Finder GMB response:', response);
        if (response.success && response.data) {
          const resultsToUse = backendFiltersActive ? response.data : response.data;
          
          finalResults = resultsToUse.map((r: GMBResult, index: number) => ({
            id: r.id || `agency-${index}`,
            name: r.name || 'Unknown Business',
            email: r.email,
            address: r.address,
            phone: r.phone,
            website: r.url,
            rating: r.rating,
            source: 'platform' as const,
            platform: r.websiteAnalysis?.platform || undefined,
            websiteAnalysis: r.websiteAnalysis,
            enrichment: r.enrichment,
            enrichmentStatus: r.enrichmentStatus,
            facebookUrl: r.enrichment?.socials?.facebook,
            linkedinUrl: r.enrichment?.socials?.linkedin,
            instagramUrl: r.enrichment?.socials?.instagram,
            youtubeUrl: r.enrichment?.socials?.youtube,
            tiktokUrl: r.enrichment?.socials?.tiktok,
          }));
        } else if (response.error) {
          throw new Error(response.error);
        }
      }
      
      if (append) {
        finalResults = mergeLeads(latestMergedResults, finalResults);
      }

      console.log('[BamLead] Search complete, finalResults:', finalResults.length);
      
      // Apply Phone Leads Only filter if enabled
      if (phoneLeadsOnly && !backendFiltersActive) {
        const beforeCount = finalResults.length;
        finalResults = finalResults.filter(r => r.phone && r.phone.trim() !== '');
        console.log(`[BamLead] Phone filter applied: ${beforeCount} → ${finalResults.length} leads with phone numbers`);
        if (finalResults.length === 0) {
          toast.warning('No leads with phone numbers found. Try a broader search.');
        } else {
          toast.info(`Filtered to ${finalResults.length} leads with phone numbers for AI calling`);
        }
      }

      // If we over-fetched to satisfy filters, cap to the user-requested limit
      if (finalResults.length > requestedLimit) {
        finalResults = finalResults.slice(0, requestedLimit);
      }

      // Calculate filter summary for user feedback
      const activeFilters: string[] = [];
      if (phoneLeadsOnly) activeFilters.push('Phone Required');
      if (backendFilters.noWebsite) activeFilters.push('No Website');
      if (backendFilters.notMobile) activeFilters.push('Not Mobile-Friendly');
      if (backendFilters.outdated) activeFilters.push('Outdated Website');

      // Show result summary with context about what was found vs requested
      if (finalResults.length < minimumAcceptableResults) {
        const filterInfo = activeFilters.length > 0 ? ` matching [${activeFilters.join(', ')}]` : '';
        toast.info(
          `Found ${finalResults.length}/${requestedLimit} leads${filterInfo}. ` +
          (activeFilters.length > 0 
            ? 'Try disabling some filters or broadening your search for more results.'
            : 'This may be all available businesses in this area. Try a different location.')
        );
      } else if (activeFilters.length > 0) {
        toast.success(`Found ${finalResults.length} leads matching: ${activeFilters.join(', ')}`);
      }
      
      // Apply AI scoring to all leads immediately (sorts by Hot/Warm/Cold)
      const scoredResults = quickScoreLeads(finalResults) as SearchResult[];
      console.log('[BamLead] AI scoring applied:', {
        hot: scoredResults.filter(r => r.aiClassification === 'hot').length,
        warm: scoredResults.filter(r => r.aiClassification === 'warm').length,
        cold: scoredResults.filter(r => r.aiClassification === 'cold').length,
      });
      
      setSearchResults(scoredResults);
      setSearchProgress(100);
      
      // Clear restored indicator since this is a fresh search
      setRestoredFromSession(null);
      
      // Persist query/location to sessionStorage so the report header always has them
      sessionStorage.setItem('bamlead_query', query);
      sessionStorage.setItem('bamlead_location', location);
      
      // Save the search timestamp for restoration tracking
      const searchTimestamp = new Date().toISOString();
      localStorage.setItem('bamlead_search_timestamp', searchTimestamp);
      setReportAutoPopKey(searchTimestamp);
      
      // Detect if we got real data (live SerpAPI) or mock data
      // Mock results have IDs starting with "mock_"
      const hasRealData = scoredResults.some(r => !r.id.startsWith('mock_'));
      setIsLiveDataMode(hasRealData);

      if (scoredResults.length > 0) {
        // Search is complete: now we can move to Step 2.
        setCurrentStep(2);

        if (scoredResults.length < minimumAcceptableResults) {
          setPartialResultsNotice({ found: scoredResults.length, requested: requestedLimit });
          toast.info(
            `Found ${scoredResults.length} of ${requestedLimit} requested. Review partial results or broaden your search.`
          );
        } else {
          toast.info(
            '🤖 AI Lead Intelligence Report is generating in the background. You can preview your leads now!',
            { duration: 6000 }
          );
        }
        
        setShowAIPipeline(true);
        
        const hotCount = scoredResults.filter(r => r.aiClassification === 'hot').length;
        toast.success(`Found ${scoredResults.length} ${hasRealData ? 'LIVE' : 'demo'} businesses! 🔥 ${hotCount} Hot leads ready for outreach.`);
        
        // Save leads to database for persistence (non-blocking)
        // This ensures leads are available across all areas of the system
        if (hasRealData && searchType) {
          saveSearchLeads(
            scoredResults.map(r => ({
              id: r.id,
              name: r.name,
              address: r.address,
              phone: r.phone,
              website: r.website,
              email: r.email,
              rating: r.rating,
              source: r.source,
              platform: r.platform,
              aiClassification: r.aiClassification,
              leadScore: r.leadScore,
              successProbability: r.successProbability,
              recommendedAction: r.recommendedAction,
              callScore: r.callScore,
              emailScore: r.emailScore,
              urgency: r.urgency,
              painPoints: r.painPoints,
              readyToCall: r.readyToCall,
              websiteAnalysis: r.websiteAnalysis,
            })),
            {
              searchQuery: query,
              searchLocation: location,
              sourceType: searchType,
              clearPrevious: true // Replace previous search results
            }
          ).then(saveResponse => {
            if (saveResponse.success) {
              console.log('[BamLead] Leads saved to database:', saveResponse.data?.saved);
            } else {
              console.warn('[BamLead] Failed to save leads:', saveResponse.error);
            }
          }).catch(err => {
            console.error('[BamLead] Error saving leads to database:', err);
          });
        }
      } else {
        toast.info('No businesses found. Try a different search.');
        setShowReportModal(false);
      }

      // Start AI analysis in background (non-blocking)
      // NOTE: analyze-leads.php is a protected endpoint (requires real JWT).
      // In Demo Mode or when a mock token is present, skip calling it to avoid 401 spam.
      const token = (() => {
        try {
          return localStorage.getItem('auth_token');
        } catch {
          return null;
        }
      })();
      const hasRealToken = !!token && !token.startsWith('mock_token_');

      if (finalResults.length > 0 && hasRealToken) {
        setIsAnalyzing(true);
        analyzeLeads(finalResults)
          .then((analysisResponse) => {
            if (analysisResponse.success) {
              setAiGroups(analysisResponse.data);
              setAiSummary(analysisResponse.summary);
              setAiStrategies(analysisResponse.emailStrategies);
              setShowAiGrouping(true);
              
              // Notify customer that AI report is ready
              toast.success(
                '✅ AI Lead Intelligence Report is ready! Click "View Report" to see detailed analysis.',
                { duration: 8000 }
              );
            }
          })
          .catch((analysisError) => {
            console.error('[BamLead] AI analysis error:', analysisError);
            toast.info('Lead report generation encountered an issue. You can still proceed with your leads.');
          })
          .finally(() => {
            setIsAnalyzing(false);
            setShowAIPipeline(false);
          });
      }
    } catch (error) {
      console.error('[BamLead] Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      if (searchResults.length > 0) {
        setSearchError('Search interrupted before completion. Showing partial results.');
        setShowReportModal(false);
        setShowAIPipeline(false);
        toast.warning('Search interrupted. Showing partial results.');
        if (!append) {
          setCurrentStep(2);
        }
      } else {
        setSearchError(errorMessage);
        setShowReportModal(false);
        setShowAIPipeline(false);
        toast.error(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const mergeLeads = (base: SearchResult[], incoming: SearchResult[]) => {
    const seen = new Map<string, SearchResult>();
    const keyFor = (lead: SearchResult) => {
      const name = (lead.name || '').toLowerCase().trim();
      const address = (lead.address || '').toLowerCase().trim();
      const phone = (lead.phone || '').toLowerCase().trim();
      const website = (lead.website || '').toLowerCase().trim();
      return [name, address, phone, website].filter(Boolean).join('|');
    };
    const mergeLead = (existing: SearchResult, candidate: SearchResult): SearchResult => ({
      ...existing,
      ...candidate,
      id: existing.id,
      email: existing.email || candidate.email || candidate.enrichment?.emails?.[0],
      phone: existing.phone || candidate.phone || candidate.enrichment?.phones?.[0],
      website: existing.website || candidate.website,
      address: existing.address || candidate.address,
      enrichment: {
        ...(existing.enrichment || {}),
        ...(candidate.enrichment || {}),
        emails: Array.from(new Set([...(existing.enrichment?.emails || []), ...(candidate.enrichment?.emails || [])])),
        phones: Array.from(new Set([...(existing.enrichment?.phones || []), ...(candidate.enrichment?.phones || [])])),
        socials: {
          ...(existing.enrichment?.socials || {}),
          ...(candidate.enrichment?.socials || {}),
        },
      },
    });
    for (const lead of base) {
      seen.set(keyFor(lead), lead);
    }
    for (const lead of incoming) {
      const key = keyFor(lead);
      if (!seen.has(key)) {
        seen.set(key, lead);
      } else {
        const merged = mergeLead(seen.get(key) as SearchResult, lead);
        seen.set(key, merged);
      }
    }
    return Array.from(seen.values());
  };

  const handleSelectGroup = (groupKey: string, leads: LeadAnalysis[]) => {
    // Select all leads in this group
    const leadIds = leads.map(l => l.id);
    setSelectedLeads(leadIds);
    setShowAiGrouping(false);
    toast.success(`Selected ${leads.length} leads from "${aiGroups?.[groupKey]?.label}"`);
  };

  const handleSelectLeadFromGroup = (lead: LeadAnalysis) => {
    // Select single lead and proceed
    setSelectedLeads([lead.id]);
    setShowAiGrouping(false);
    toast.success(`Selected: ${lead.name}`);
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === searchResults.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(searchResults.map(r => r.id));
    }
  };

  const proceedToVerification = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead to verify');
      return;
    }
    // Store selected leads for verification and open widget
    const leadsToVerify = searchResults.filter(r => selectedLeads.includes(r.id));
    sessionStorage.setItem('leadsToVerify', JSON.stringify(leadsToVerify));
    setWidgetLeads(leadsToVerify);
    setShowVerifierWidget(true);
  };

  // Handle verified leads from widget
  const handleVerificationComplete = (verified: any[]) => {
    setVerifiedWidgetLeads(verified);
  };

  // Open email widget with verified leads
  const handleOpenEmailWidget = (leads: any[]) => {
    setVerifiedWidgetLeads(leads);
    setShowVerifierWidget(false);
    setShowEmailWidget(true);
  };

  // Handle leads from results panel or report modal
  const handleResultsPanelProceed = (leads: SearchResult[]) => {
    setShowResultsPanel(false);
    setShowReportModal(false);
    setWidgetLeads(leads);
    sessionStorage.setItem('leadsToVerify', JSON.stringify(leads));
    setShowVerifierWidget(true);
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Address', 'Phone', 'Email', 'Website', 'Rating'];
    const csvContent = [
      headers.join(','),
      ...searchResults.map(r => [
        `"${r.name || ''}"`,
        `"${r.address || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.email || ''}"`,
        `"${r.website || ''}"`,
        r.rating || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bamlead-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load demo leads for demonstration purposes
  const handleLoadDemoLeads = () => {
    const demoLeads = generateMechanicLeads(200);
    
    // Map test leads to SearchResult format
    const mappedLeads: SearchResult[] = demoLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      email: lead.email,
      rating: lead.rating,
      source: lead.source,
      platform: lead.platform,
      websiteAnalysis: lead.websiteAnalysis,
    }));
    
    // Apply AI scoring
    const scoredLeads = quickScoreLeads(mappedLeads) as SearchResult[];
    
    // Update state
    setSearchResults(scoredLeads);
    setSearchType('gmb');
    setQuery('Auto Mechanics');
    setLocation('Los Angeles, CA');
    setIsLiveDataMode(false);
    
    // Cache in sessionStorage
    sessionStorage.setItem('bamlead_search_results', JSON.stringify(scoredLeads));
    sessionStorage.setItem('bamlead_query', 'Auto Mechanics');
    sessionStorage.setItem('bamlead_location', 'Los Angeles, CA');
    sessionStorage.setItem('bamlead_search_type', 'gmb');
    
    // Also populate email leads for Step 3
    const emailLeadsForDemo = scoredLeads.map(lead => ({
      email: lead.email || '',
      business_name: lead.name,
      contact_name: '',
      website: lead.website,
      phone: lead.phone,
    })).filter(l => l.email);
    sessionStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeadsForDemo));
    
    // Move to Step 2
    setCurrentStep(2);
    sessionStorage.setItem('bamlead_current_step', '2');
    
    toast.success('🎉 Loaded 200 demo leads! Explore the full workflow.');
    celebrate('subscription-activated');
  };

  const resetWorkflow = async () => {
    setCurrentStep(1);
    setIsSearching(false);
    setSearchProgress(0);
    setSearchType(null);
    setQuery('');
    setLocation('');
    setSearchResults([]);
    setSelectedLeads([]);
    setEmailLeads([]);
    setAiGroups(null);
    setAiSummary(null);
    setAiStrategies(null);
    setShowAiGrouping(false);
    setSearchError(null);
    setPartialResultsNotice(null);
    setNetworkStatus('idle');
    setNetworkRetryAttempt(0);
    setLastRequestedLimit(null);
    
    // Reset filters to default (off)
    setNoWebsiteOnly(false);
    setNotMobileOnly(false);
    setOutdatedOnly(false);
    setPhoneLeadsOnly(false);
    
    // Clear restored indicator
    setRestoredFromSession(null);
    
    // Clear ALL stored lead data (only happens when user explicitly clicks "Clear All Data")
    localStorage.removeItem('bamlead_current_step');
    localStorage.removeItem('bamlead_search_type');
    localStorage.removeItem('bamlead_query');
    localStorage.removeItem('bamlead_location');
    localStorage.removeItem('bamlead_search_results');
    localStorage.removeItem('bamlead_search_results_by_type');
    localStorage.removeItem('bamlead_email_leads');
    localStorage.removeItem('bamlead_scheduled_manual_emails');
    localStorage.removeItem('bamlead_inbox_replies');
    localStorage.removeItem('emails_sent');
    localStorage.removeItem('bamlead_selected_leads');
    localStorage.removeItem('bamlead_last_visited_search');
    localStorage.removeItem('bamlead_search_timestamp');
    localStorage.removeItem('bamlead_lead_versions');
    // Clear filter settings
    localStorage.removeItem('bamlead_filter_no_website');
    localStorage.removeItem('bamlead_filter_not_mobile');
    localStorage.removeItem('bamlead_filter_outdated');
    localStorage.removeItem('bamlead_filter_phone_only');
    // Reset state
    setLastSavedAt(null);
    // Also clear any legacy sessionStorage entries
    sessionStorage.removeItem('bamlead_current_step');
    sessionStorage.removeItem('bamlead_search_type');
    sessionStorage.removeItem('bamlead_query');
    sessionStorage.removeItem('bamlead_location');
    sessionStorage.removeItem('bamlead_search_results');
    sessionStorage.removeItem('bamlead_email_leads');
    sessionStorage.removeItem('bamlead_scheduled_manual_emails');
    sessionStorage.removeItem('emails_sent');
    sessionStorage.removeItem('leadsToVerify');
    sessionStorage.removeItem('savedLeads');
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const [leadsResponse, queueResponse] = await Promise.all([
          deleteSearchLeads({ clearAll: true }),
          clearQueuedEmails(),
        ]);

        if (!leadsResponse.success) {
          throw new Error(leadsResponse.error || 'Failed to clear server leads');
        }
        if (!queueResponse.success) {
          throw new Error(queueResponse.error || 'Failed to clear queued drip emails');
        }
      }
      toast.success('All data cleared! Start fresh.');
    } catch (error) {
      console.error('[BamLead] Failed to clear stored leads:', error);
      toast.error('Cleared locally, but failed to remove saved leads. They may return after refresh.');
    }
  };

  // Only show brief loading on first paint if no cached user
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show email verification required screen for unverified users
  // Skip check for owners, admins, and preview bypass users
  const isPrivilegedUser = user?.is_owner || user?.role === 'admin' || user?.subscription_plan === 'preview_bypass';
  const needsEmailVerification = user && !user.email_verified && !isPrivilegedUser;
  
  if (needsEmailVerification) {
    return <EmailVerificationRequired />;
  }

  const renderWorkflowContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Step 1: Choose Search Type */}
            {!searchType ? (
              <div className="space-y-8 max-w-5xl mx-auto">
                
                {/* Welcome & Instructions Section */}
                <div className="text-center py-8 px-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-3xl border border-primary/20 shadow-lg">
                  <div className="text-5xl mb-4">👋</div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    Welcome! Let's Find You Some Leads
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                    Follow these simple steps to find businesses that need your services. 
                    It's easy - just pick an option below and we'll guide you through!
                  </p>
                  
                  {/* Mini Steps Preview */}
                  <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-full border border-primary/30">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-foreground font-medium">Pick Search Type</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-full">
                      <span className="w-6 h-6 bg-muted-foreground/30 text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-muted-foreground">Enter Details</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-full">
                      <span className="w-6 h-6 bg-muted-foreground/30 text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-muted-foreground">Get Leads!</span>
                    </div>
                  </div>
                </div>

                {/* Section Label */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/30 mb-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">1</div>
                    <span className="font-semibold text-primary">STEP 1: Pick Your Search Type</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                    How do you want to find leads today?
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    👇 Click one of the two options below to get started 👇
                  </p>
                </div>

                {/* Two Search Options - Centered Grid */}
                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                  
                  {/* OPTION A: GMB Search Card */}
                  <div className="relative">
                    {/* Option Label */}
                    <div className="absolute -top-4 left-6 z-10">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm font-bold shadow-lg">
                        OPTION A
                      </Badge>
                    </div>
                    
                    {user?.has_active_subscription && (
                      <div className="absolute -top-3 right-6 z-10">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 text-xs font-semibold">
                          <Star className="w-3 h-3 mr-1" />
                          ACTIVE
                        </Badge>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleSearchTypeClick('gmb')}
                      disabled={isCheckingPayment}
                      className="group text-left p-6 pt-8 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 w-full h-full disabled:opacity-50 disabled:cursor-wait"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          🤖 Super AI Business Search
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">Searching 3 major platforms + AI Analysis:</p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs max-w-md">
                          {[
                            { name: "Google Maps", icon: "🗺️" },
                            { name: "Yelp", icon: "⭐" },
                            { name: "Bing Places", icon: "🔍" },
                            { name: "AI Analysis", icon: "🤖" }
                          ].map((source) => (
                            <span key={source.name} className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-medium whitespace-nowrap flex items-center gap-1.5">
                              <span>{source.icon}</span>
                              {source.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* What You Get - 8 Key Features */}
                      <div className="space-y-2.5 mb-6">
                        <p className="text-base font-semibold text-primary mb-3">✨ What you'll get:</p>
                        {[
                          "11-category deep business intelligence",
                          "Competitor research & market positioning",
                          "Website health, SEO & tech stack analysis",
                          "Buyer intent signals & opportunity scoring",
                          "Reviews, reputation & sentiment analysis",
                          "Social media & online presence mapping",
                          "AI-generated outreach scripts & talking points",
                          "Hot/Warm/Cold lead prioritization"
                        ].map((feature, index) => (
                          <div key={index} className={`flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1`} style={{ transitionDelay: `${index * 30}ms` }}>
                            <div className="relative w-5 h-5 shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                              <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                            </div>
                            <span className="text-foreground text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Perfect For */}
                      <div className="bg-primary/10 rounded-xl p-4 text-center">
                        <p className="text-primary font-bold text-sm mb-1">👍 Best for:</p>
                        <p className="text-muted-foreground text-sm">
                          Sales teams, agencies, SaaS companies & investors
                        </p>
                      </div>
                      
                      {/* CTA */}
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                          Click to Start <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* OPTION B: Platform Scanner Card */}
                  <div className="relative">
                    {/* Option Label */}
                    <div className="absolute -top-4 left-6 z-10">
                      <Badge className="bg-violet-500 text-white px-4 py-1.5 text-sm font-bold shadow-lg">
                        OPTION B
                      </Badge>
                    </div>
                    
                    {user?.has_active_subscription && (
                      <div className="absolute -top-3 right-6 z-10">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 text-xs font-semibold">
                          <Star className="w-3 h-3 mr-1" />
                          ACTIVE
                        </Badge>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleSearchTypeClick('platform')}
                      disabled={isCheckingPayment}
                      className="group text-left p-6 pt-8 rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-transparent hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 w-full h-full disabled:opacity-50 disabled:cursor-wait"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
                          <Globe className="w-8 h-8 text-violet-500" />
                        </div>
                      </div>
                      
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          🎯 Agency Lead Finder
                        </h3>
                        <p className="text-muted-foreground">
                          For Web Dev Pros & SMMA Agencies
                        </p>
                      </div>

                      {/* What You Get - 6 Points */}
                      <div className="space-y-3 mb-6">
                        <p className="text-base font-semibold text-violet-500 mb-3">✨ Find clients who need:</p>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-violet-500/10 group-hover:translate-x-1">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Star className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Website design & rebuilds</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-violet-500/10 group-hover:translate-x-1 delay-[50ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Star className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Social media management</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-violet-500/10 group-hover:translate-x-1 delay-[100ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Star className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Digital marketing & ads setup</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-violet-500/10 group-hover:translate-x-1 delay-[150ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Star className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">GMB & reputation management</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-violet-500/10 group-hover:translate-x-1 delay-[200ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Star className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">SEO & local search optimization</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-violet-500/10 group-hover:translate-x-1 delay-[250ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Star className="w-5 h-5 text-violet-500 absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Tracking & analytics setup</span>
                        </div>
                      </div>

                      {/* Perfect For */}
                      <div className="bg-violet-500/10 rounded-xl p-4 text-center">
                        <p className="text-violet-500 font-bold text-sm mb-1">🔥 Built for:</p>
                        <p className="text-muted-foreground text-sm">
                          Web developers, freelance designers & SMMA agencies
                        </p>
                      </div>
                      
                      {/* CTA */}
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-2 text-violet-500 font-semibold group-hover:gap-3 transition-all">
                          Click to Start <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Help Text */}
                <div className="text-center py-4 px-6 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Not sure which to pick?</strong> Start with <span className="text-primary font-medium">Super AI Search</span> for comprehensive business intelligence, 
                    or <span className="text-violet-500 font-medium">Agency Lead Finder</span> if you're looking for clients with digital gaps.
                  </p>
                </div>
                
                {/* Demo Mode Button */}
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadDemoLeads}
                    className="gap-2 text-muted-foreground hover:text-foreground border-dashed"
                  >
                    <Zap className="w-4 h-4" />
                    Try Demo with Sample Leads
                    <Badge variant="secondary" className="ml-2 text-xs">200 leads</Badge>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    See how the full workflow works with realistic demo data
                  </p>
                </div>
              </div>
            ) : (
              /* Search Form */
              <div className="max-w-2xl mx-auto space-y-6">
                <button
                  onClick={() => setSearchType(null)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to search options
                </button>

                <div className={`p-6 rounded-2xl border-2 ${
                  searchType === 'gmb' 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-violet-500/30 bg-violet-500/5'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      searchType === 'gmb' ? 'bg-primary/20' : 'bg-violet-500/20'
                    }`}>
                      {searchType === 'gmb' ? (
                        <Building2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Globe className="w-6 h-6 text-violet-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {searchType === 'gmb' ? '🤖 Super AI Business Search' : '🔍 Agency Lead Finder'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchType === 'gmb' ? 'Google Maps + AI Intelligence • 100+ data points' : 'For website designers, marketers & agencies'}
                      </p>
                    </div>
                  </div>

                  {/* Research Mode Selector - GMB only */}
                  {searchType === 'gmb' && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" />
                        WHAT'S YOUR RESEARCH GOAL?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Niche Research Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setResearchMode('niche');
                            setMyBusinessInfo(null);
                            sessionStorage.setItem('bamlead_research_mode', 'niche');
                            sessionStorage.removeItem('bamlead_my_business_info');
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            researchMode === 'niche'
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                              : 'border-border bg-card/50 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Search className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">Niche Research</span>
                            {researchMode === 'niche' && (
                              <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Find businesses in a niche to discover prospects or understand the market
                          </p>
                        </button>

                        {/* Competitive Analysis Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setResearchMode('competitive');
                            sessionStorage.setItem('bamlead_research_mode', 'competitive');
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            researchMode === 'competitive'
                              ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                              : 'border-border bg-card/50 hover:border-amber-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <span className="font-semibold text-foreground">Competitive Analysis</span>
                            <Badge className="text-[9px] py-0 px-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30">PRO</Badge>
                            {researchMode === 'competitive' && (
                              <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Compare YOUR business to competitors and find your advantages
                          </p>
                        </button>
                      </div>

                      {/* My Business Info - only show when competitive mode is selected */}
                      {researchMode === 'competitive' && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3">
                          <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5" />
                            Enter YOUR business info for comparison:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                              placeholder="Your Business Name"
                              value={myBusinessInfo?.name || ''}
                              onChange={(e) => {
                                const updated = { name: e.target.value, url: myBusinessInfo?.url || '' };
                                setMyBusinessInfo(updated);
                                sessionStorage.setItem('bamlead_my_business_info', JSON.stringify(updated));
                              }}
                              className="bg-secondary/50 text-sm"
                            />
                            <Input
                              placeholder="Your Website URL (optional)"
                              value={myBusinessInfo?.url || ''}
                              onChange={(e) => {
                                const updated = { name: myBusinessInfo?.name || '', url: e.target.value };
                                setMyBusinessInfo(updated);
                                sessionStorage.setItem('bamlead_my_business_info', JSON.stringify(updated));
                              }}
                              className="bg-secondary/50 text-sm"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            The AI report will show: ✅ Your advantages | ⚠️ Areas to improve | 💡 How to win
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="query" className="text-foreground font-medium">
                        {searchType === 'gmb' 
                          ? (researchMode === 'competitive' 
                              ? 'Search competitors in your market segment' 
                              : 'Enter the niche you want to search')
                          : 'What industry?'}
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="query"
                          placeholder={searchType === 'gmb' 
                            ? (researchMode === 'competitive'
                                ? 'e.g., marketing agencies in Chicago, web design firms, SaaS companies...'
                                : 'e.g., plumbers in Miami, auto repair shops, dental clinics...')
                            : 'e.g., real estate, dental, fitness...'}
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            if (e.target.value.trim()) {
                              setValidationErrors(prev => ({ ...prev, query: false }));
                            }
                          }}
                          className={`flex-1 ${validationErrors.query ? 'border-2 border-red-500 focus-visible:ring-red-500' : ''}`}
                        />
                        <VoiceSearchButton 
                          onResult={(transcript) => {
                            setQuery(transcript);
                            setValidationErrors(prev => ({ ...prev, query: false }));
                          }} 
                        />
                      </div>
                      {validationErrors.query && (
                        <p className="text-sm text-red-500 mt-1">⚠️ Please enter what you're looking for</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="location" className="text-foreground font-medium">
                        Where? (City, State)
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="location"
                          placeholder="e.g., Houston, TX"
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            if (e.target.value.trim()) {
                              setValidationErrors(prev => ({ ...prev, location: false }));
                            }
                          }}
                          className={`flex-1 ${validationErrors.location ? 'border-2 border-red-500 focus-visible:ring-red-500' : ''}`}
                        />
                        <VoiceSearchButton 
                          onResult={(transcript) => {
                            setLocation(transcript);
                            setValidationErrors(prev => ({ ...prev, location: false }));
                          }} 
                        />
                      </div>
                      {validationErrors.location && (
                        <p className="text-sm text-red-500 mt-1">⚠️ Please enter a city and state</p>
                      )}
                    </div>

                    {/* Platform Checkboxes - only show for platform search */}
                    {searchType === 'platform' && (
                      <div>
                        <Label className="text-foreground font-medium mb-3 block">
                          Which platforms to scan?
                        </Label>
                        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border-2 ${
                          validationErrors.platforms ? 'border-red-500 bg-red-500/5' : 'border-transparent'
                        }`}>
                          {[
                            { id: 'gmb', label: 'Google Maps', icon: '📍' },
                            { id: 'wordpress', label: 'WordPress', icon: '📦' },
                            { id: 'wix', label: 'Wix', icon: '🔷' },
                            { id: 'squarespace', label: 'Squarespace', icon: '⬛' },
                            { id: 'joomla', label: 'Joomla', icon: '🟠' },
                            { id: 'drupal', label: 'Drupal', icon: '💧' },
                            { id: 'shopify', label: 'Shopify', icon: '🛒' },
                            { id: 'weebly', label: 'Weebly', icon: '🌐' },
                            { id: 'godaddy', label: 'GoDaddy', icon: '🟢' },
                          ].map((platform) => (
                            <label
                              key={platform.id}
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedPlatforms.includes(platform.id)
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
                              }`}
                            >
                              <Checkbox
                                checked={selectedPlatforms.includes(platform.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPlatforms([...selectedPlatforms, platform.id]);
                                    setValidationErrors(prev => ({ ...prev, platforms: false }));
                                  } else {
                                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium">{platform.icon} {platform.label}</span>
                            </label>
                          ))}
                        </div>
                        {validationErrors.platforms ? (
                          <p className="text-sm text-red-500 mt-2">⚠️ Please select at least one platform to scan</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            Select at least one platform to search for outdated websites
                          </p>
                        )}
                      </div>
                    )}

                    {/* Option B quality filters */}
                    {searchType === 'platform' && (
                      <div className="p-4 rounded-lg border-2 border-violet-500/30 bg-violet-500/5 space-y-3">
                        <div>
                          <span className="font-medium text-violet-300">🎯 Option B Filters</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Focus results on businesses with website opportunities
                          </p>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={noWebsiteOnly}
                            onCheckedChange={(checked) => setNoWebsiteOnly(checked === true)}
                          />
                          <div>
                            <span className="text-sm font-medium text-foreground">🔴 No website</span>
                            <p className="text-xs text-muted-foreground">Businesses with zero web presence (highest value)</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={notMobileOnly}
                            onCheckedChange={(checked) => setNotMobileOnly(checked === true)}
                          />
                          <div>
                            <span className="text-sm font-medium text-foreground">📱 Weak mobile experience</span>
                            <p className="text-xs text-muted-foreground">Sites scoring below 60 on mobile performance</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={outdatedOnly}
                            onCheckedChange={(checked) => setOutdatedOnly(checked === true)}
                          />
                          <div>
                            <span className="text-sm font-medium text-foreground">⚡ Needs website upgrade</span>
                            <p className="text-xs text-muted-foreground">Sites with outdated tech, no SSL, or legacy design</p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Website Quality data is now shown in Step 2 spreadsheet */}

                    {/* Results Limit Selector */}
                    <div>
                      <Label className="text-foreground font-medium mb-3 block">
                        How many leads do you want?
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { value: 100, label: '100', desc: 'Quick' },
                          { value: 250, label: '250', desc: 'Standard' },
                          { value: 500, label: '500', desc: 'Large' },
                          { value: 1000, label: '1,000', desc: 'Bulk' },
                          { value: 2000, label: '2,000', desc: 'Maximum' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSearchLimit(option.value)}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              searchLimit === option.value
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <div className="font-bold text-lg">{option.label}</div>
                            <div className="text-xs opacity-70">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ More results = longer search time. 2,000 leads may take several minutes.
                      </p>
                    </div>

                    {/* Data Field Selector */}
                    <DataFieldSelector
                      selectedFields={selectedDataFields}
                      onFieldsChange={setSelectedDataFields}
                      searchQuery={query}
                      searchLocation={location}
                    />

                    {/* Super AI Business Intelligence Info */}
                    {searchType === 'gmb' && (
                      <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🤖</span>
                          <div>
                            <span className="font-semibold text-primary">Super AI Business Intelligence Search</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              Find businesses to contact with calls or emails. Get comprehensive AI-powered insights on each lead including website health, online presence, reviews, tracking, and growth opportunities.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Calling Mode Filter - applies to both search types */}
                    <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={phoneLeadsOnly}
                          onCheckedChange={(checked) => setPhoneLeadsOnly(checked === true)}
                        />
                        <div>
                          <span className="font-medium text-green-600">📞 AI Calling Mode</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Filter results to only show leads with phone numbers for AI voice outreach
                          </p>
                        </div>
                      </label>
                      {phoneLeadsOnly ? (
                        <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Phone Numbers Only — Results filtered for AI calling campaigns
                          </p>
                          <p className="text-[10px] text-green-500 mt-1">
                            Leads without valid phone numbers will be excluded
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-xs text-primary font-medium">
                            ✓ Full Business Data — {searchType === 'gmb' ? 'Get complete business intelligence including:' : 'Scan for website opportunities including:'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {searchType === 'gmb' ? (
                              <>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">📍 Address</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">📞 Phone</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">🌐 Website</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">⭐ Reviews</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">🔍 Online Presence</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">🔧 Platform Detected</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">📱 Mobile Issues</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">⚠️ Upgrade Opportunities</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">📊 Website Analysis</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expectation-setting message */}
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <span className="text-amber-500 text-lg">💡</span>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200/90 font-medium">
                          Targeting your exact lead count
                        </p>
                        <p className="text-xs text-amber-200/70 mt-0.5">
                          We auto-expand the search area to reach your selected total. If the market is small, we’ll show the closest matches available.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSearch()}
                      disabled={isSearching || (searchType === 'platform' && selectedPlatforms.length === 0)}
                      size="lg"
                      className={`w-full mt-4 ${
                        searchType === 'gmb' 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-violet-500 hover:bg-violet-600'
                      }`}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Searching... {searchProgress > 0 && `(${Math.round(searchProgress)}%)`}
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Find Leads Now
                        </>
                      )}
                    </Button>

                    {/* AI Processing Pipeline - Shows DURING search */}
                    {isSearching && (
                      <div className="mt-6">
                        <AIProcessingPipeline
                          isActive={true}
                          leads={searchResults.length > 0 ? searchResults : [{ id: 'placeholder', name: 'Analyzing...', source: 'gmb' as const }]}
                          forceProcessing={isSearching}
                          onComplete={() => {
                            // Don't auto-complete during search - we control this via search flow
                          }}
                          onProgressUpdate={(progress, agentName) => {
                            setAIPipelineProgress(progress);
                            setCurrentAIAgent(agentName);
                          }}
                        />
                        
                        {/* Streaming Leads Indicator - Shows count below AI Pipeline */}
                        {searchResults.length > 0 && (
                          <div className="mt-4">
                            <StreamingLeadsIndicator
                              currentCount={searchResults.length}
                              isStreaming={isSearching}
                              progress={searchProgress}
                              requestedCount={lastRequestedLimit ?? searchLimit}
                              locationCount={searchCoverageMeta?.locationCount}
                              variantCount={searchCoverageMeta?.variantCount}
                              estimatedQueries={searchCoverageMeta?.estimatedQueries}
                              sourceLabel={searchCoverageMeta?.sourceLabel}
                              statusMessage={searchCoverageMeta?.statusMessage}
                            />
                          </div>
                        )}

                        {/* Enrichment Status Panel - live email/phone discovery progress */}
                        <EnrichmentStatusPanel className="mt-4" />
                      </div>
                    )}

                    {/* AI Processing Pipeline - final processing is rendered globally */}

                    {/* Network Status during search - HIGHLY VISIBLE */}
                    {isSearching && (networkStatus === 'verifying' || networkStatus === 'retrying') && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-5 rounded-xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-500/20 to-orange-500/10 shadow-lg shadow-amber-500/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-amber-500/30 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-amber-400 text-lg">
                              {networkStatus === 'verifying' 
                                ? '🔄 Verifying Network Connection...' 
                                : `🔄 Reconnecting (Attempt ${networkRetryAttempt}/3)...`}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {networkStatus === 'verifying' 
                                ? 'Establishing secure connection to lead generation servers...'
                                : 'Temporary network issue detected. Auto-retrying...'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="h-1.5 flex-1 bg-amber-500/20 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${networkRetryAttempt * 33}%` }} />
                              </div>
                              <span className="text-xs text-amber-400 font-medium">Please wait...</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Error display with retry button */}
                    {partialResultsNotice && !isSearching && (
                      <div className="mt-4 p-4 rounded-lg border border-amber-500/40 bg-amber-500/10">
                        <div className="flex items-start gap-3">
                          <div className="text-amber-400 text-lg">⚠️</div>
                          <div className="flex-1">
                            <p className="font-medium text-amber-400">Partial Results Ready</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Found {partialResultsNotice.found} of {partialResultsNotice.requested} requested leads.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentStep(2);
                                toast.info(
                                  '🤖 AI Lead Intelligence Report is generating in the background. You can preview your leads now!',
                                  { duration: 6000 }
                                );
                                setShowAIPipeline(true);
                              }}
                              className="mt-3 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                            >
                              View Partial Results
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearch({ append: true })}
                              className="mt-3 ml-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                            >
                              Continue Fetching
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {searchError && !isSearching && (
                      <div className="mt-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                        <div className="flex items-start gap-3">
                          <div className="text-destructive text-lg">⚠️</div>
                          <div className="flex-1">
                            <p className="font-medium text-destructive">Search Failed</p>
                            <p className="text-sm text-muted-foreground mt-1">{searchError}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchError(null);
                                setNetworkStatus('idle');
                                handleSearch();
                              }}
                              className="mt-3"
                            >
                              <Loader2 className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        // Step 2: Show leads in SimpleLeadViewer + Intelligence Report is available via header button
        if (searchResults.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="text-6xl">🔍</div>
              <h2 className="text-2xl font-bold">No Leads Found Yet</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Run a search in Step 1 to find leads, then come back here to review them.
              </p>
              <Button onClick={() => setCurrentStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Search
              </Button>
            </div>
          );
        }
        return (
          <SimpleLeadViewer
            leads={searchResults}
            onBack={() => setCurrentStep(1)}
            onProceedToEmail={(selectedLeadsToEmail) => {
              // Set selected leads if any
              if (selectedLeadsToEmail.length > 0) {
                setSelectedLeads(selectedLeadsToEmail.map(l => l.id));
              }
              setCurrentStep(3);
            }}
            onProceedToCall={(selectedLeadsToCall) => {
              if (selectedLeadsToCall.length > 0) {
                setSelectedLeads(selectedLeadsToCall.map(l => l.id));
              }
              setCurrentStep(4);
            }}
            onOpenReport={() => setShowReportModal(true)}
            onOpenCRM={() => setShowCRMModal(true)}
            onOpenSchedule={() => {
              setCurrentStep(4);
            }}
            onOpenAIScoring={() => {
              setAutoSelectAllForAIScoring(true);
              setShowAIScoringDashboard(true);
            }}
            restoredFromSession={restoredFromSession}
            onDismissRestored={() => setRestoredFromSession(null)}
            onManualSave={handleManualSave}
            onRestoreVersion={handleRestoreVersion}
            isSaving={isSaving}
            lastSavedAt={lastSavedAt}
          />
        );

      case 3:
        return (
          <EmailSetupFlow
            leads={(searchResults.filter(r => selectedLeads.includes(r.id)).length > 0
              ? searchResults.filter(r => selectedLeads.includes(r.id))
              : searchResults
            ).map((lead) => ({
              ...lead,
              email: lead.email || lead.enrichment?.emails?.[0] || '',
            }))}
            onBack={() => setCurrentStep(2)}
            onComplete={() => {
              toast.success('Email campaign sent!');
              celebrate('email-sent');
            }}
            onOpenSettings={() => {
              setSettingsInitialTab('email');
              setHideWebhooksInSettings(true);
              setActiveTab('settings');
            }}
            searchType={searchType}
            onStrategySelect={(strategyId) => {
              setSelectedAIStrategy(strategyId);
            }}
            onSequenceSelect={(sequenceNames) => {
              setActiveEmailSequences(sequenceNames);
            }}
          />
        );

      case 4: {
        // New unified Step 4 - Call, Schedule & Save
        const step4Leads = emailLeads.length > 0 
          ? emailLeads.map((l, i) => ({
              id: `email-${i}`,
              email: l.email,
              business_name: l.business_name,
              name: l.contact_name || l.business_name,
              phone: l.phone,
              website: l.website,
            }))
          : searchResults.filter(r => selectedLeads.includes(r.id) || selectedLeads.length === 0).map(r => ({
              id: r.id,
              email: r.email,
              business_name: r.name,
              name: r.name,
              phone: r.phone,
              website: r.website,
            }));

        return (
          <>
            <Step4AICallingHub
              leads={step4Leads}
              onBack={() => setCurrentStep(3)}
              onOpenSettings={() => {
                setSettingsInitialTab('voice');
                setActiveTab('settings');
              }}
              onOpenCRMModal={() => setShowCRMModal(true)}
              searchType={searchType || 'gmb'}
              searchQuery={query}
              searchLocation={location}
              selectedStrategy={selectedAIStrategy || undefined}
              emailSequences={activeEmailSequences}
              proposalType={proposalType || undefined}
            />
            
          </>
        );
      }

      default:
        return null;
    }
  };

  const getActiveToolConfig = () => {
    switch (activeTab) {
      case 'workflow':
        return null; // Workflow handles its own rendering
      case 'sequences':
        return {
          title: 'Multi-Channel Sequences',
          description: 'Build automated Email → LinkedIn → SMS outreach flows',
          icon: Zap,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10',
          component: <SequenceBuilderModule leads={searchResults} />,
        };
      case 'templates':
        return {
          title: researchMode === 'competitive' ? '📧 Competitive Outreach Templates' : '📧 Email Template Gallery',
          description: researchMode === 'competitive' 
            ? 'Templates for partnerships, market research, and product pitching'
            : '60+ high-converting visual templates organized by industry',
          icon: FileText,
          iconColor: 'text-purple-500',
          iconBg: 'bg-purple-500/10',
          component: <HighConvertingTemplateGallery 
            onSelectTemplate={(template) => toast.success(`Template "${template.name}" selected!`)} 
            researchMode={researchMode}
            myBusinessInfo={myBusinessInfo}
          />,
        };
      case 'extension':
        return {
          title: 'Chrome Extension',
          description: 'Prospect leads from any website with our browser extension',
          icon: Chrome,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500/10',
          component: <ChromeExtensionPanel />,
        };
      case 'mentor':
        return {
          title: 'AI Sales Mentor',
          description: 'Practice pitches and improve your sales skills with AI coaching',
          icon: Bot,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          component: <AISalesMentor />,
        };
      case 'leaderboard':
        return {
          title: 'Referral Leaderboard',
          description: 'See top affiliates and earn badges',
          icon: Trophy,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10',
          component: <ReferralLeaderboard />,
        };
      case 'affiliate':
        return {
          title: 'Affiliate Program',
          description: 'Earn up to 35% commission on every referral',
          icon: Gift,
          iconColor: 'text-success',
          iconBg: 'bg-success/10',
          component: <AffiliateProgram />,
        };
      case 'search-guide':
        return {
          title: 'Search Options Guide',
          description: 'Choose the best lead discovery method for your workflow',
          icon: HelpCircle,
          iconColor: 'text-cyan-500',
          iconBg: 'bg-cyan-500/10',
          component: (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Which search mode should you use?</CardTitle>
                  <CardDescription>
                    Pick based on your goal. You can switch any time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <h3 className="font-semibold">Super AI Business Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Best for broad discovery with AI scoring, website insights, and prioritized outreach.
                    </p>
                    <Button
                      className="gap-2"
                      onClick={() => {
                        setActiveTab('workflow');
                        setCurrentStep(1);
                        setSearchType('gmb');
                      }}
                    >
                      Use Super AI Search
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                    <h3 className="font-semibold">Agency Lead Finder</h3>
                    <p className="text-sm text-muted-foreground">
                      Best for agencies targeting leads with website/marketing gaps and service opportunities.
                    </p>
                    <Button
                      variant="outline"
                      className="gap-2 border-violet-500/40 hover:bg-violet-500/10"
                      onClick={() => {
                        setActiveTab('workflow');
                        setCurrentStep(1);
                        setSearchType('platform');
                      }}
                    >
                      Use Agency Finder
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ),
        };
      case 'ai-journey':
        return {
          title: 'AI Features Guide',
          description: 'Understand when and how each AI feature activates',
          icon: Brain,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10',
          component: <AIJourneyExplainer />,
        };
      case 'video-tutorials':
        return {
          title: 'Quick Start Tutorials',
          description: 'Learn SMTP setup and send your first campaign',
          icon: FileText,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500/10',
          component: <VideoTutorialSection />,
        };
      case 'user-manual':
        return {
          title: 'User Manual',
          description: 'Download your comprehensive PDF guide',
          icon: FileText,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          component: (
            <div className="max-w-2xl mx-auto">
              <UserManualDownload 
                isPaidUser={user?.subscription_status === 'active' || user?.email === 'admin@bamlead.com'}
                planName="Pro"
                onUpgrade={() => setActiveTab('subscription')}
              />
            </div>
          ),
        };
      case 'scalability':
        return {
          title: 'System Status & Scalability',
          description: 'Monitor performance and verify system capacity',
          icon: Server,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          component: <ScalabilityDashboard />,
        };
      case 'diagnostics':
        return {
          title: 'Backend Diagnostics',
          description: 'Test all APIs and verify system connectivity',
          icon: Server,
          iconColor: 'text-orange-500',
          iconBg: 'bg-orange-500/10',
          component: <SystemDiagnostics />,
        };
      case 'subscription':
        return {
          title: 'Subscription & Billing',
          description: 'Manage your plan, view payment history, and update billing',
          icon: Target,
          iconColor: 'text-emerald-500',
          iconBg: 'bg-emerald-500/10',
          component: <SubscriptionManagement />,
        };
      case 'auto-followup':
        return {
          title: 'Auto Follow-Up Builder',
          description: 'Smart follow-ups based on lead engagement patterns',
          icon: Brain,
          iconColor: 'text-violet-500',
          iconBg: 'bg-violet-500/10',
          component: <AutoFollowUpBuilder />,
        };
      case 'settings':
        return {
          title: 'Settings',
          description: 'Manage integrations and account preferences',
          icon: Target,
          iconColor: 'text-slate-500',
          iconBg: 'bg-slate-500/10',
          component: <SettingsPanel 
            initialTab={settingsInitialTab} 
            hideWebhooks={hideWebhooksInSettings}
            onBackToSMTPSetup={() => {
              setActiveTab('workflow');
              setCurrentStep(3);
              setHideWebhooksInSettings(false);
            }}
            onBackToStep4={() => {
              setActiveTab('workflow');
              setCurrentStep(4);
              setHideWebhooksInSettings(false);
            }}
          />,
        };
      case 'voice-calling':
        return {
          title: 'AI Voice Calling',
          description: 'Call leads with your AI sales agent',
          icon: Phone,
          iconColor: 'text-violet-500',
          iconBg: 'bg-violet-500/10',
          component: (
            <div className="space-y-6">
              <VoiceCallWidget onOpenSettings={() => setActiveTab('settings')} />
              <Button variant="outline" onClick={() => setActiveTab('voice-guide')} className="gap-2">
                <Brain className="w-4 h-4" />
                View Setup Guide
              </Button>
            </div>
          ),
        };
      case 'voice-guide':
        return {
          title: 'Voice Agent Setup Guide',
          description: 'Learn how to create your AI voice agent',
          icon: Brain,
          iconColor: 'text-violet-500',
          iconBg: 'bg-violet-500/10',
          component: <VoiceAgentSetupGuide />,
        };
      case 'call-history':
        return {
          title: 'Call History',
          description: 'View and manage your voice call logs',
          icon: Phone,
          iconColor: 'text-violet-500',
          iconBg: 'bg-violet-500/10',
          component: <CallLogHistory />,
        };
      default:
        return null;
    }
  };

  const activeTool = getActiveToolConfig();

  return (
    <SidebarProvider defaultOpen={true}>
      <CommandPalette onNavigate={setActiveTab} onLogout={handleLogout} />
      <ConfettiCelebration />
      
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'workflow') {
              // Reset to step 1 when going to workflow
            }
          }}
          onLogout={handleLogout}
        />

        {/* Drag (or click) the rail to resize / collapse the sidebar */}
        <SidebarRail />

        <SidebarInset>
          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            {/* Sidebar Toggle - Always visible on all screens */}
            <SidebarTrigger className="shrink-0 hover:bg-muted transition-colors">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>

            {/* Back/Home navigation */}
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            </div>

            {/* SMTP Status Indicator - Navigate to Step 3 */}
            <button
              onClick={() => {
                setSettingsInitialTab('email');
                setHideWebhooksInSettings(true);
                setActiveTab('settings');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                smtpStatus.isConnected
                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              {smtpStatus.isConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SMTP Connected</span>
                  <span className="sm:hidden">SMTP ✓</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Configure SMTP</span>
                  <span className="sm:hidden">SMTP ⚠️</span>
                </>
              )}
            </button>
            
            {/* Live Data Mode Badge */}
            {searchResults.length > 0 && (
              <div
                className={
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ` +
                  (isLiveDataMode
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-muted/40 text-muted-foreground border-border')
                }
              >
                {isLiveDataMode ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="hidden sm:inline">LIVE DATA</span>
                    <span className="sm:hidden">LIVE</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                    <span className="hidden sm:inline">DEMO MODE</span>
                    <span className="sm:hidden">DEMO</span>
                  </>
                )}
              </div>
            )}

            <div className="flex-1" />

            {/* Workflow Tour Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startWorkflowTour}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Workflow Tour</span>
            </Button>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {/* Intelligence Report Button - only show when we have leads */}
              {searchResults.length > 0 && (
                <div className="relative">
                  {/* Pulsing glow effect behind button - ORANGE */}
                  <div className="absolute inset-0 bg-orange-500/30 rounded-md blur-md animate-pulse" />
                  
                  <Button 
                    size="sm" 
                    onClick={() => setShowReportModal(true)}
                    className="relative gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/30 animate-pulse"
                  >
                    {/* Animated icon */}
                    <FileText className="w-4 h-4" />
                    <span className="hidden md:inline font-semibold">Intelligence Report</span>
                    
                    {/* Lead count badge with pulse */}
                    <Badge className="ml-1 bg-white/20 text-white text-xs">
                      {searchResults.length}
                    </Badge>
                    
                    {/* NEW indicator dot - ORANGE */}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                  </Button>
                </div>
              )}
              <Link to="/pricing">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">Upgrade</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img src={bamMascot} alt="Bam" className="w-5 h-5 object-contain" />
                <span className="hidden sm:inline">Welcome, {user?.name?.split(' ')[0] || 'there'}!</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Unlimited Onboarding Reminder Banner */}
            {tier === 'unlimited' && !localStorage.getItem('bamlead_unlimited_setup_booked') && (
              <div className="mb-6 p-4 rounded-xl border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-900/5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Crown className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Welcome, Unlimited Member! 🎉</p>
                      <p className="text-xs text-muted-foreground">Book your setup call — we'll configure everything for you, or search leads yourself and AI handles the rest.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/unlimited-onboarding">
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Book Setup Call
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        localStorage.setItem('bamlead_unlimited_setup_booked', 'true');
                        toast.success('Got it! AI will auto-configure everything as you search.');
                      }}
                    >
                      I'll do it myself
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflow' ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="hidden lg:block">
                        <Mascot3D size="md" interactive />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          🚀 Lead Generation Made Easy
                        </h1>
                        <p className="text-lg text-muted-foreground">
                          Just follow the 4 simple steps below!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentStep > 1 && (
                        <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="gap-2">
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </Button>
                      )}
                      <Button variant="outline" onClick={resetWorkflow} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        🗑️ Clear All Data
                      </Button>
                    </div>
                  </div>

                  {/* Step Progress Bar - BIGGER */}
                  <div className="grid grid-cols-4 gap-3">
                    {WORKFLOW_STEPS.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          currentStep === step.id
                            ? 'bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/30 scale-105'
                            : currentStep > step.id
                            ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 cursor-pointer border-2 border-emerald-500/50'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer border-2 border-border'
                        }`}
                      >
                        <div className="text-3xl">
                          {currentStep > step.id ? '✅' : step.emoji}
                        </div>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                            currentStep === step.id
                              ? 'bg-primary-foreground/20'
                              : currentStep > step.id
                              ? 'bg-emerald-500/30'
                              : 'bg-muted-foreground/20'
                          }`}
                        >
                          {step.id}
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm">{step.title}</p>
                          <p className="text-xs opacity-80 hidden sm:block">{step.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workflow Content */}
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    {renderWorkflowContent()}
                  </CardContent>
                </Card>
              </>
            ) : activeTool ? (
              <Card className="border-border bg-card shadow-card">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${activeTool.iconBg} rounded-lg flex items-center justify-center`}>
                      <activeTool.icon className={`w-5 h-5 ${activeTool.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{activeTool.title}</CardTitle>
                      <CardDescription>{activeTool.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {activeTool.component}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card shadow-card">
                <CardContent className="p-8 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                  <h3 className="text-lg font-semibold">This section is not available yet</h3>
                  <p className="text-sm text-muted-foreground">
                    The selected page is not mapped correctly. Please open Workflow while we load the correct tool.
                  </p>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setActiveTab('workflow');
                      setCurrentStep(1);
                    }}
                  >
                    Go to Workflow
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Free Trial Banner */}
            {!user?.is_owner &&
              !user?.has_active_subscription &&
              user?.subscription_plan !== 'free_granted' &&
              user?.subscription_status !== 'active' && (
                <section className="mt-8">
                  <FreeTrialBanner
                    variant="compact"
                    ctaTo="/pricing"
                    ctaLabel="View Plans"
                  />
                </section>
              )}
          </main>

          {/* Footer */}
          <footer className="border-t border-border py-6 bg-muted/30">
            <div className="px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <img src={bamMascot} alt="Bam" className="w-5 h-5 object-contain" />
                  <span>© 2025 BamLead. All rights reserved.</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link to="/contact" className="hover:text-foreground transition-colors">Support</Link>
                  <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
                </div>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </div>

      {/* AI Processing Pipeline - final processing always available (even after Step 2 navigation) */}
      {showAIPipeline && searchResults.length > 0 && !isSearching && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[90vw]">
          <AIProcessingPipeline
            isActive={showAIPipeline}
            leads={searchResults}
            onComplete={(enhancedLeads) => {
              setSearchResults(enhancedLeads as SearchResult[]);
              setShowAIPipeline(false);
              setAdvanceToStep2AfterReport(true);
              setShowReportModal(true);
              toast.success('🎉 All 8 AI agents complete! Your leads are supercharged.');
            }}
            onProgressUpdate={(progress, agentName) => {
              setAIPipelineProgress(progress);
              setCurrentAIAgent(agentName);
            }}
          />
        </div>
      )}

      {/* Email Widget */}
      <EmailWidget
        isOpen={showEmailWidget}
        onClose={() => setShowEmailWidget(false)}
        leads={verifiedWidgetLeads.map(l => ({
          id: l.id,
          email: l.email,
          business_name: l.name || l.business_name,
          contact_name: l.contact_name,
          website: l.website,
          phone: l.phone,
        }))}
        preSelectedTemplate={HIGH_CONVERTING_TEMPLATES[0]}
        onSuccess={() => {
          toast.success('🎉 Campaign sent successfully!');
          celebrate('email-sent');
        }}
      />

      {/* AI Verifier Widget */}
      <AIVerifierWidget
        isOpen={showVerifierWidget}
        onClose={() => setShowVerifierWidget(false)}
        leads={widgetLeads}
        onComplete={handleVerificationComplete}
        onSendEmails={handleOpenEmailWidget}
      />

      {/* Lead Results Panel (legacy) */}
      <LeadResultsPanel
        isOpen={showResultsPanel}
        onClose={() => setShowResultsPanel(false)}
        results={searchResults}
        isAnalyzing={isAnalyzing}
        aiGroups={aiGroups}
        aiSummary={aiSummary}
        aiStrategies={aiStrategies}
        onSelectLeads={(leads) => setSelectedLeads(leads.map(l => l.id))}
        onProceedToVerify={handleResultsPanelProceed}
      />

      {/* Full-screen Lead Document Viewer */}
      <LeadDocumentViewer
        open={showReportModal}
        onOpenChange={(open) => {
          setShowReportModal(open);
          if (!open && advanceToStep2AfterReport && searchResults.length > 0) {
            setAdvanceToStep2AfterReport(false);
            setCurrentStep(2);
          }
          if (!open) {
            const key = reportAutoPopKey || localStorage.getItem('bamlead_search_timestamp');
            persistLastReportShownKey(key);
          }
        }}
        leads={searchResults}
        searchQuery={query}
        location={location}
        onProceedToVerify={handleResultsPanelProceed}
        researchMode={researchMode}
        myBusinessInfo={myBusinessInfo}
      />

      {/* AI Lead Scoring Dashboard Modal */}
      <Dialog
        open={showAIScoringDashboard}
        onOpenChange={(open) => {
          setShowAIScoringDashboard(open);
          if (!open) {
            setAutoSelectAllForAIScoring(false);
          }
        }}
      >
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <ScrollArea className="h-[90vh]">
            <div className="p-6">
              <AILeadScoringDashboard
                leads={searchResults.map(r => ({
                  id: r.id,
                  name: r.name,
                  business_name: r.name,
                  email: r.email,
                  phone: r.phone,
                  website: r.website,
                  address: r.address,
                  websiteAnalysis: r.websiteAnalysis,
                }))}
                onEmailLeads={(selectedLeadsToEmail) => {
                  setShowAIScoringDashboard(false);
                  setEmailLeads(selectedLeadsToEmail.map(l => ({
                    email: l.email || '',
                    business_name: l.business_name || l.name || '',
                    contact_name: '',
                    website: l.website,
                    phone: l.phone,
                  })));
                  setCurrentStep(3);
                }}
                onCallLead={(lead) => {
                  setShowAIScoringDashboard(false);
                  setSelectedLeads([lead.id]);
                  setCurrentStep(4);
                }}
                onSchedule={(lead) => {
                  setShowAIScoringDashboard(false);
                  setSelectedLeads([lead.id]);
                  setCurrentStep(4);
                }}
                onExportCRM={() => {
                  setShowAIScoringDashboard(false);
                  setShowCRMModal(true);
                }}
                onViewReport={() => {
                  setShowAIScoringDashboard(false);
                  setShowReportModal(true);
                }}
                onBack={() => setShowAIScoringDashboard(false)}
                autoSelectAll={autoSelectAllForAIScoring}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* CRM Integration Modal */}
      <CRMIntegrationModal
        open={showCRMModal}
        onOpenChange={setShowCRMModal}
        leads={searchResults.map(l => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phone: l.phone,
          website: l.website,
          email: l.email,
          source: l.source,
        }))}
      />

      {/* Payment Method Modal for Trial Setup */}
      <PaymentMethodModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={handlePaymentMethodSuccess}
        plan="pro"
      />

      {/* Workflow Onboarding Tour */}
      <WorkflowOnboardingTour 
        currentStep={currentStep}
        onStepChange={(step) => setCurrentStep(step)}
      />

      {/* Search Type Onboarding Modal - Shows first 2 logins */}
      {showSearchOnboarding && (
        <SearchTypeOnboarding onClose={() => setShowSearchOnboarding(false)} />
      )}

      {/* Autopilot Tier Onboarding Wizard - Shows for new $249/mo subscribers */}
      <AutopilotOnboardingWizard
        open={showAutopilotOnboarding}
        onOpenChange={setShowAutopilotOnboarding}
        onComplete={() => {
          completeOnboarding();
          setShowAutopilotOnboarding(false);
          toast.success('🚀 Welcome to Autopilot! AI is now managing your outreach.');
        }}
      />

    </SidebarProvider>
  );
}
