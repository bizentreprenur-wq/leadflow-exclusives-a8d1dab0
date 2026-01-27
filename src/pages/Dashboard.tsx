import { useState, useEffect } from 'react';
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
  CheckCircle2, Send, FileText, Chrome, Download,
  Trophy, Bot, Gift, Brain, Server, Building2,
  MapPin, Phone, ExternalLink, Star, Loader2,
  ArrowLeft, Users, ChevronRight, HelpCircle,
  Smartphone, AlertTriangle, XCircle,
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
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
import { LeadForEmail } from '@/lib/api/email';
import { searchGMB, GMBResult } from '@/lib/api/gmb';
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
import Step4OutreachHub from '@/components/Step4OutreachHub';
import AILeadScoringDashboard from '@/components/AILeadScoringDashboard';
import UserManualDownload from '@/components/UserManualDownload';
import { VideoTutorialSection } from '@/components/VideoTutorialSection';
import AIProcessingPipeline from '@/components/AIProcessingPipeline';
import StreamingLeadsIndicator from '@/components/StreamingLeadsIndicator';
import WorkflowOnboardingTour, { startWorkflowTour } from '@/components/WorkflowOnboardingTour';

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
}

// Step configuration - 4 simple steps
const WORKFLOW_STEPS = [
  { id: 1, title: 'STEP 1: Search', description: 'Find businesses', icon: Search, emoji: '🔍' },
  { id: 2, title: 'STEP 2: Leads', description: 'View & decide action', icon: Users, emoji: '📋' },
  { id: 3, title: 'STEP 3: Email', description: 'SMTP → Template → Send', icon: Send, emoji: '📧' },
  { id: 4, title: 'STEP 4: Call', description: 'AI voice calls', icon: Phone, emoji: '📞' },
];

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('workflow');
  // Initialize emailLeads from sessionStorage for persistence across steps
  const [emailLeads, setEmailLeads] = useState<LeadForEmail[]>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_email_leads');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { celebrate } = useCelebration();

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
  const [query, setQuery] = useState(() => sessionStorage.getItem('bamlead_query') || '');
  const [location, setLocation] = useState(() => sessionStorage.getItem('bamlead_location') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    try {
      const saved = sessionStorage.getItem('bamlead_search_results');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // Platform selection for scanner
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['gmb', 'wordpress', 'wix', 'squarespace', 'joomla']);
  const [searchLimit, setSearchLimit] = useState<number>(100); // Default 100 results
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

  // Widget states
  const [showEmailWidget, setShowEmailWidget] = useState(false);
  const [showVerifierWidget, setShowVerifierWidget] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [widgetLeads, setWidgetLeads] = useState<SearchResult[]>([]);
  const [verifiedWidgetLeads, setVerifiedWidgetLeads] = useState<any[]>([]);
  
  // Outreach mode toggle (email or verify)
  const [outreachMode, setOutreachMode] = useState<'email' | 'verify'>('email');
  
  // Search filter options - persist in localStorage
  const [filterNoWebsite, setFilterNoWebsite] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_no_website') === 'true'; } catch { return false; }
  });
  const [filterNotMobile, setFilterNotMobile] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_not_mobile') === 'true'; } catch { return false; }
  });
  const [filterOutdated, setFilterOutdated] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_outdated') === 'true'; } catch { return false; }
  });
  const [phoneLeadsOnly, setPhoneLeadsOnly] = useState(() => {
    try { return localStorage.getItem('bamlead_filter_phone_only') === 'true'; } catch { return false; }
  });

  // Persist filter settings to localStorage
  useEffect(() => {
    localStorage.setItem('bamlead_filter_no_website', filterNoWebsite.toString());
  }, [filterNoWebsite]);
  useEffect(() => {
    localStorage.setItem('bamlead_filter_not_mobile', filterNotMobile.toString());
  }, [filterNotMobile]);
  useEffect(() => {
    localStorage.setItem('bamlead_filter_outdated', filterOutdated.toString());
  }, [filterOutdated]);
  useEffect(() => {
    localStorage.setItem('bamlead_filter_phone_only', phoneLeadsOnly.toString());
  }, [phoneLeadsOnly]);
  
  // Settings tab to open (for deep-linking)
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('integrations');
  
  // CRM Modal state
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showAIScoringDashboard, setShowAIScoringDashboard] = useState(false);

  // AI Processing Pipeline state
  const [showAIPipeline, setShowAIPipeline] = useState(false);
  const [aiPipelineProgress, setAIPipelineProgress] = useState(0);
  const [currentAIAgent, setCurrentAIAgent] = useState<string>('');
  
  // Live data mode indicator (true when real SerpAPI data is being used)
  const [isLiveDataMode, setIsLiveDataMode] = useState(false);


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

  // Persist workflow state to localStorage (not sessionStorage) so leads survive logout/login cycles
  // Users must explicitly click "Clear All Data" to remove their leads
  useEffect(() => {
    localStorage.setItem('bamlead_current_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (searchType) {
      localStorage.setItem('bamlead_search_type', searchType);
    }
  }, [searchType]);

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
  }, [searchResults]);

  useEffect(() => {
    if (emailLeads.length > 0) {
      localStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
    }
  }, [emailLeads]);

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your subscription is now active.');
      celebrate('subscription-activated');
      refreshUser();
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
            const savedStep = localStorage.getItem('bamlead_current_step');
            const savedQuery = localStorage.getItem('bamlead_query');
            const savedLocation = localStorage.getItem('bamlead_location');
            const savedType = localStorage.getItem('bamlead_search_type');
            
            if (savedQuery) setQuery(savedQuery);
            if (savedLocation) setLocation(savedLocation);
            if (savedType) setSearchType(savedType as 'gmb' | 'platform');
            if (savedStep) setCurrentStep(parseInt(savedStep, 10) || 2);
            
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
              setQuery(savedQuery);
              localStorage.setItem('bamlead_query', savedQuery);
            }
            if (savedLocation) {
              setLocation(savedLocation);
              localStorage.setItem('bamlead_location', savedLocation);
            }
            if (sourceType) {
              setSearchType(sourceType);
              localStorage.setItem('bamlead_search_type', sourceType);
            }
            // Move to step 2 if user has existing leads (returning user)
            setCurrentStep(2);
            localStorage.setItem('bamlead_current_step', '2');
          }
          
          toast.info(`Restored ${mappedLeads.length} leads from your last search`);
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
    localStorage.removeItem('bamlead_step2_visited');
    
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

  const handleSearch = async () => {
    // Clear previous error
    setSearchError(null);
    
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
    setSearchResults([]); // Clear previous results
    setSelectedLeads([]); // Clear previous selections
    setEmailLeads([]); // Clear email leads from previous search
    setAiGroups(null);
    setAiSummary(null);
    setAiStrategies(null);
    setShowAiGrouping(false);
    setShowAIPipeline(false); // Reset AI pipeline for new search
    setAIPipelineProgress(0);
    setCurrentAIAgent('');

    // Ensure the Intelligence Report is closed while running a new search
    setShowReportModal(false);
    
    // Clear localStorage for previous search data (new search replaces old)
    localStorage.removeItem('bamlead_search_results');
    localStorage.removeItem('bamlead_email_leads');
    localStorage.removeItem('bamlead_selected_leads');

    const requestedLimit = searchLimit;
    // Check if any filters are active - if so, over-fetch to compensate for filtering
    const needsFilteredLeads = phoneLeadsOnly || filterNoWebsite || filterNotMobile || filterOutdated;
    // Over-fetch by 3x when filters are active (max 5000 for performance)
    const effectiveLimit = Math.min(5000, needsFilteredLeads ? requestedLimit * 3 : requestedLimit);

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
      const handleProgress = (partialResults: any[], progress: number) => {
        console.log('[BamLead] Search progress:', progress, 'results:', partialResults.length);
        setSearchProgress(progress);
        const mapped = partialResults.map((r: any, index: number) => ({
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
        }));
        setSearchResults(mapped);
      };
      
      if (searchType === 'gmb') {
        console.log('[BamLead] Calling searchGMB API...');
        const response = await searchGMB(query, location, effectiveLimit, handleProgress);
        console.log('[BamLead] GMB response:', response);
        if (response.success && response.data) {
          finalResults = response.data.map((r: GMBResult, index: number) => ({
            id: r.id || `gmb-${index}`,
            name: r.name || 'Unknown Business',
            address: r.address,
            phone: r.phone,
            website: r.url,
            rating: r.rating,
            source: 'gmb' as const,
            websiteAnalysis: r.websiteAnalysis,
          }));
        } else if (response.error) {
          throw new Error(response.error);
        }
      } else if (searchType === 'platform') {
        // Agency Lead Finder now uses GMB search as primary (Google Maps + Yelp + Bing)
        // then filters for platform-specific opportunities
        console.log('[BamLead] Agency Lead Finder: Using GMB search with platform filtering, limit:', effectiveLimit);
        const response = await searchGMB(query, location, effectiveLimit, handleProgress);
        console.log('[BamLead] Agency Lead Finder GMB response:', response);
        if (response.success && response.data) {
          // Filter results to show businesses with platform issues or no website
          const platformFiltered = response.data.filter((r: GMBResult) => {
            const analysis = r.websiteAnalysis;
            // Include if: no website, needs upgrade, has issues, or matches selected platforms
            if (!analysis?.hasWebsite) return true;
            if (analysis?.needsUpgrade) return true;
            if (analysis?.issues && analysis.issues.length > 0) return true;
            if (analysis?.platform && selectedPlatforms.includes(analysis.platform.toLowerCase())) return true;
            // Also include businesses without a proper website
            if (!r.url || r.url.trim() === '') return true;
            return false;
          });
          
          console.log(`[BamLead] Agency Lead Finder filtered: ${response.data.length} → ${platformFiltered.length} leads with platform opportunities`);
          
          finalResults = platformFiltered.map((r: GMBResult, index: number) => ({
            id: r.id || `agency-${index}`,
            name: r.name || 'Unknown Business',
            address: r.address,
            phone: r.phone,
            website: r.url,
            rating: r.rating,
            source: 'platform' as const,
            platform: r.websiteAnalysis?.platform || undefined,
            websiteAnalysis: r.websiteAnalysis,
          }));
          
          if (platformFiltered.length === 0 && response.data.length > 0) {
            toast.info(`Found ${response.data.length} businesses but none match platform criteria. Showing all results.`);
            finalResults = response.data.map((r: GMBResult, index: number) => ({
              id: r.id || `agency-${index}`,
              name: r.name || 'Unknown Business',
              address: r.address,
              phone: r.phone,
              website: r.url,
              rating: r.rating,
              source: 'platform' as const,
              platform: r.websiteAnalysis?.platform || undefined,
              websiteAnalysis: r.websiteAnalysis,
            }));
          }
        } else if (response.error) {
          throw new Error(response.error);
        }
      }
      
      console.log('[BamLead] Search complete, finalResults:', finalResults.length);
      
      // Apply Phone Leads Only filter if enabled
      if (phoneLeadsOnly) {
        const beforeCount = finalResults.length;
        finalResults = finalResults.filter(r => r.phone && r.phone.trim() !== '');
        console.log(`[BamLead] Phone filter applied: ${beforeCount} → ${finalResults.length} leads with phone numbers`);
        if (finalResults.length === 0) {
          toast.warning('No leads with phone numbers found. Try a broader search.');
        } else {
          toast.info(`Filtered to ${finalResults.length} leads with phone numbers for AI calling`);
        }
      }

      // Apply "No Website" filter if enabled
      if (filterNoWebsite) {
        const beforeCount = finalResults.length;
        finalResults = finalResults.filter(r => {
          const website = r.website?.trim();
          return !website || r.websiteAnalysis?.hasWebsite === false;
        });
        console.log(`[BamLead] No-website filter applied: ${beforeCount} → ${finalResults.length}`);
      }

      // Apply "Not Mobile Compliant" filter if enabled
      if (filterNotMobile) {
        const beforeCount = finalResults.length;
        finalResults = finalResults.filter(r => {
          const mobileScore = r.websiteAnalysis?.mobileScore;
          // Include if no mobile score (unknown) or score < 50
          return mobileScore === null || mobileScore === undefined || mobileScore < 50;
        });
        console.log(`[BamLead] Not-mobile filter applied: ${beforeCount} → ${finalResults.length}`);
      }

      // Apply "Outdated Standards" filter if enabled
      if (filterOutdated) {
        const beforeCount = finalResults.length;
        finalResults = finalResults.filter(r => {
          // Check for outdated indicators
          const issues = r.websiteAnalysis?.issues || [];
          const needsUpgrade = r.websiteAnalysis?.needsUpgrade === true;
          const hasIssues = issues.length > 0;
          return needsUpgrade || hasIssues;
        });
        console.log(`[BamLead] Outdated filter applied: ${beforeCount} → ${finalResults.length}`);
      }

      // If we over-fetched to satisfy filters, cap to the user-requested limit
      if (finalResults.length > requestedLimit) {
        finalResults = finalResults.slice(0, requestedLimit);
      }

      // Calculate filter summary for user feedback
      const activeFilters: string[] = [];
      if (filterNoWebsite) activeFilters.push('No Website');
      if (filterNotMobile) activeFilters.push('Mobile Issues');
      if (filterOutdated) activeFilters.push('Outdated');
      if (phoneLeadsOnly) activeFilters.push('Phone Required');

      // Show result summary with context about what was found vs requested
      if (finalResults.length < requestedLimit) {
        const filterInfo = activeFilters.length > 0 ? ` matching [${activeFilters.join(', ')}]` : '';
        toast.info(
          `Found ${finalResults.length} leads${filterInfo}. ` +
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
      
      // Save the search timestamp for restoration tracking
      localStorage.setItem('bamlead_search_timestamp', new Date().toISOString());
      
      // Detect if we got real data (live SerpAPI) or mock data
      // Mock results have IDs starting with "mock_"
      const hasRealData = scoredResults.some(r => !r.id.startsWith('mock_'));
      setIsLiveDataMode(hasRealData);

      if (scoredResults.length > 0) {
        // Show AI Pipeline processing the leads
        setShowAIPipeline(true);
        
        const hotCount = scoredResults.filter(r => r.aiClassification === 'hot').length;
        toast.success(`Found ${scoredResults.length} ${hasRealData ? 'LIVE' : 'demo'} businesses! Now running 8 AI agents...`);
        
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
            }
          })
          .catch((analysisError) => {
            console.error('[BamLead] AI analysis error:', analysisError);
          })
          .finally(() => {
            setIsAnalyzing(false);
          });
      }
    } catch (error) {
      console.error('[BamLead] Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      setSearchError(errorMessage);
      setShowReportModal(false);
      setShowAIPipeline(false);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
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
    
    // Reset filters to default (off)
    setFilterNoWebsite(false);
    setFilterNotMobile(false);
    setFilterOutdated(false);
    setPhoneLeadsOnly(false);
    
    // Clear restored indicator
    setRestoredFromSession(null);
    
    // Clear ALL stored lead data (only happens when user explicitly clicks "Clear All Data")
    localStorage.removeItem('bamlead_current_step');
    localStorage.removeItem('bamlead_search_type');
    localStorage.removeItem('bamlead_query');
    localStorage.removeItem('bamlead_location');
    localStorage.removeItem('bamlead_search_results');
    localStorage.removeItem('bamlead_email_leads');
    localStorage.removeItem('bamlead_selected_leads');
    localStorage.removeItem('bamlead_step2_visited');
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
    sessionStorage.removeItem('leadsToVerify');
    sessionStorage.removeItem('savedLeads');

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await deleteSearchLeads({ clearAll: true });
        if (!response.success) {
          throw new Error(response.error || 'Failed to clear server leads');
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

                      {/* What You Get - 6 Points */}
                      <div className="space-y-3 mb-6">
                        <p className="text-base font-semibold text-primary mb-3">✨ What you'll get:</p>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">100+ data points per business</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1 delay-[50ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">AI-powered outreach scripts</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1 delay-[100ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Website & SEO health analysis</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1 delay-[150ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Google reviews & rating insights</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1 delay-[200ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Social media presence check</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 group-hover:bg-primary/10 group-hover:translate-x-1 delay-[250ms]">
                          <div className="relative w-5 h-5 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-0 group-hover:rotate-180" />
                            <Sparkles className="w-5 h-5 text-primary absolute inset-0 transition-all duration-300 opacity-0 scale-0 rotate-180 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0" />
                          </div>
                          <span className="text-foreground text-base">Lead scoring & priority ranking</span>
                        </div>
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
                  <div className="flex items-center gap-3 mb-6">
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

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="query" className="text-foreground font-medium">
                        {searchType === 'gmb' ? 'What business type?' : 'What industry?'}
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="query"
                          placeholder={searchType === 'gmb' ? 'e.g., mechanics, restaurants, lawyers...' : 'e.g., real estate, dental, fitness...'}
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

                    {/* Website Quality Filters - for both search types */}
                    <div className="p-4 rounded-lg border-2 border-violet-500/30 bg-violet-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-violet-400" />
                        <span className="font-medium text-violet-400">Website Quality Filters</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Checkbox
                            checked={filterNoWebsite}
                            onCheckedChange={(checked) => setFilterNoWebsite(checked === true)}
                            className="border-emerald-500 data-[state=checked]:bg-emerald-500"
                          />
                          <XCircle className="w-4 h-4 text-emerald-500" />
                          <div>
                            <span className="text-sm text-foreground group-hover:text-primary">No Website</span>
                            <p className="text-xs text-muted-foreground">High opportunity — businesses without any website</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Checkbox
                            checked={filterNotMobile}
                            onCheckedChange={(checked) => setFilterNotMobile(checked === true)}
                            className="border-orange-500 data-[state=checked]:bg-orange-500"
                          />
                          <Smartphone className="w-4 h-4 text-orange-500" />
                          <div>
                            <span className="text-sm text-foreground group-hover:text-primary">Not Mobile Compliant</span>
                            <p className="text-xs text-muted-foreground">Websites with mobile score below 50%</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Checkbox
                            checked={filterOutdated}
                            onCheckedChange={(checked) => setFilterOutdated(checked === true)}
                            className="border-red-500 data-[state=checked]:bg-red-500"
                          />
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div>
                            <span className="text-sm text-foreground group-hover:text-primary">Outdated Standards</span>
                            <p className="text-xs text-muted-foreground">Slow load times, missing SSL, or UX issues</p>
                          </div>
                        </label>
                      </div>
                      {(filterNoWebsite || filterNotMobile || filterOutdated) && (
                        <div className="mt-3 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                          <p className="text-xs text-violet-400">
                            ✓ {[filterNoWebsite && 'No Website', filterNotMobile && 'Mobile Issues', filterOutdated && 'Outdated'].filter(Boolean).join(' + ')} filter active
                          </p>
                        </div>
                      )}
                    </div>

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
                          Results may vary slightly from your selection
                        </p>
                        <p className="text-xs text-amber-200/70 mt-0.5">
                          We scan multiple sources to bring you the best leads — sometimes fewer, sometimes more. Quality over quantity, always!
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleSearch}
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
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Processing Pipeline - Shows after search completes for final processing */}
                    {showAIPipeline && searchResults.length > 0 && !isSearching && (
                      <div className="mt-6">
                        <AIProcessingPipeline
                          isActive={showAIPipeline}
                          leads={searchResults}
                          onComplete={(enhancedLeads) => {
                            // Update leads with AI enhancements
                            setSearchResults(enhancedLeads as SearchResult[]);
                            setShowAIPipeline(false);
                            // Now show the Intelligence Report
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

                    {/* Error display with retry button */}
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
            onOpenAIScoring={() => setShowAIScoringDashboard(true)}
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
            leads={searchResults.filter(r => selectedLeads.includes(r.id)).length > 0 
              ? searchResults.filter(r => selectedLeads.includes(r.id))
              : searchResults
            }
            onBack={() => setCurrentStep(2)}
            onComplete={() => {
              toast.success('Email campaign sent!');
              celebrate('email-sent');
            }}
            onOpenSettings={() => {
              setSettingsInitialTab('email');
              setActiveTab('settings');
            }}
            searchType={searchType}
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
            <Step4OutreachHub
              leads={step4Leads}
              onBack={() => setCurrentStep(3)}
              onOpenSettings={() => {
                setSettingsInitialTab('voice');
                setActiveTab('settings');
              }}
              onOpenCRMModal={() => setShowCRMModal(true)}
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
          title: '📧 Email Template Gallery',
          description: '60+ high-converting visual templates organized by industry',
          icon: FileText,
          iconColor: 'text-purple-500',
          iconBg: 'bg-purple-500/10',
          component: <HighConvertingTemplateGallery onSelectTemplate={(template) => toast.success(`Template "${template.name}" selected!`)} />,
        };
      case 'extension':
        return {
          title: 'Chrome Extension',
          description: 'Prospect leads from any website with our browser extension',
          icon: Chrome,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500/10',
          component: (
            <div className="text-center py-12">
              <Chrome className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">BamLead Chrome Extension</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Extract contact info, analyze websites, and save leads directly from any webpage.
              </p>
              <Button className="gap-2" onClick={() => toast.info('Download the extension from the chrome-extension folder in your project')}>
                <Download className="w-4 h-4" />
                Download Extension
              </Button>
            </div>
          ),
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
            onBackToStep4={() => {
              setActiveTab('workflow');
              setCurrentStep(4);
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

        <SidebarInset>
          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden">
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
            {(() => {
              const smtpConfig = JSON.parse(localStorage.getItem('smtp_config') || '{}');
              const isSmtpConfigured = smtpConfig.username && smtpConfig.password;
              return (
                <button
                  onClick={() => setCurrentStep(3)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSmtpConfigured
                      ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  {isSmtpConfigured ? (
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
              );
            })()}
            
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
            ) : null}

            {/* Free Trial Banner */}
            <section className="mt-8">
              <FreeTrialBanner variant="compact" />
            </section>
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
        onOpenChange={setShowReportModal}
        leads={searchResults}
        searchQuery={query}
        location={location}
        onProceedToVerify={handleResultsPanelProceed}
      />

      {/* AI Lead Scoring Dashboard Modal */}
      <Dialog open={showAIScoringDashboard} onOpenChange={setShowAIScoringDashboard}>
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

    </SidebarProvider>
  );
}
