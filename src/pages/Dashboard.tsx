import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Search, Globe, Mail, Target, TrendingUp,
  Zap, BarChart3, ArrowRight, Sparkles, Menu,
  CheckCircle2, Send, FileText, Chrome, Download,
  Trophy, Bot, Gift, Brain, Server, Building2,
  MapPin, Phone, ExternalLink, Star, Loader2,
  ArrowLeft, Users, ChevronRight,
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
import bamMascot from '@/assets/bamlead-mascot.png';
import { LeadForEmail } from '@/lib/api/email';
import { searchGMB, GMBResult } from '@/lib/api/gmb';
import { searchPlatforms, PlatformResult } from '@/lib/api/platforms';
import { analyzeLeads, LeadGroup, LeadSummary, EmailStrategy, LeadAnalysis } from '@/lib/api/leadAnalysis';
import { HIGH_CONVERTING_TEMPLATES } from '@/lib/highConvertingTemplates';
import AutoFollowUpBuilder from '@/components/AutoFollowUpBuilder';
import LeadResultsPanel from '@/components/LeadResultsPanel';
import LeadDocumentViewer from '@/components/LeadDocumentViewer';
import LeadSpreadsheetViewer from '@/components/LeadSpreadsheetViewer';
import EmbeddedSpreadsheetView from '@/components/EmbeddedSpreadsheetView';
import DataFieldSelector, { DATA_FIELD_OPTIONS } from '@/components/DataFieldSelector';
import SettingsPanel from '@/components/SettingsPanel';
import VoiceCallWidget from '@/components/VoiceCallWidget';
import VoiceAgentSetupGuide from '@/components/VoiceAgentSetupGuide';
import CallLogHistory from '@/components/CallLogHistory';

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
  { id: 1, title: 'STEP 1: Search', description: 'Find businesses that need your services', icon: Search, emoji: '🔍' },
  { id: 2, title: 'STEP 2: Review', description: 'Pick the best leads from your results', icon: Users, emoji: '📋' },
  { id: 3, title: 'STEP 3: Email', description: 'Send email outreach to leads', icon: Send, emoji: '📧' },
  { id: 4, title: 'STEP 4: Call', description: 'Follow up with AI voice calls', icon: Phone, emoji: '📞' },
];

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('workflow');
  const [emailLeads, setEmailLeads] = useState<LeadForEmail[]>([]);
  const { celebrate } = useCelebration();

  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [searchType, setSearchType] = useState<'gmb' | 'platform' | null>(null);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Platform selection for scanner
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['wordpress', 'wix', 'squarespace', 'joomla']);
  const [searchLimit, setSearchLimit] = useState<number>(100); // Default 100 results
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
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
  const [showSpreadsheetViewer, setShowSpreadsheetViewer] = useState(true); // Auto-open with 1000 fake leads
  const [widgetLeads, setWidgetLeads] = useState<SearchResult[]>([]);
  const [verifiedWidgetLeads, setVerifiedWidgetLeads] = useState<any[]>([]);
  
  // Outreach mode toggle (email or verify)
  const [outreachMode, setOutreachMode] = useState<'email' | 'verify'>('email');
  
  // Search filter options
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  
  // Data field preferences - default to fields marked as default
  const [selectedDataFields, setSelectedDataFields] = useState<string[]>(
    DATA_FIELD_OPTIONS.filter(f => f.default).map(f => f.id)
  );

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
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

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter what you\'re looking for');
      return;
    }
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsSearching(true);
    setAiGroups(null);
    setAiSummary(null);
    setAiStrategies(null);
    setShowAiGrouping(false);
    
    try {
      let results: SearchResult[] = [];
      
      if (searchType === 'gmb') {
        const response = await searchGMB(query, location, searchLimit);
        if (response.success && response.data) {
          results = response.data.map((r: GMBResult, index: number) => ({
            id: r.id || `gmb-${index}`,
            name: r.name || 'Unknown Business',
            address: r.address,
            phone: r.phone,
            website: r.url,
            email: undefined,
            rating: r.rating,
            source: 'gmb' as const,
            websiteAnalysis: r.websiteAnalysis,
          }));
        }
      } else if (searchType === 'platform') {
        const response = await searchPlatforms(query, location, selectedPlatforms);
        if (response.success && response.data) {
          results = response.data.map((r: PlatformResult, index: number) => ({
            id: r.id || `platform-${index}`,
            name: r.name || 'Unknown Business',
            address: r.address,
            phone: r.phone,
            website: r.url,
            email: undefined,
            source: 'platform' as const,
            platform: r.websiteAnalysis?.platform || undefined,
            websiteAnalysis: r.websiteAnalysis,
          }));
        }
      }
      
      setSearchResults(results);
      toast.success(`Found ${results.length} businesses!`);
      
      // Open the spreadsheet viewer to display leads
      setShowSpreadsheetViewer(true);
      
      // Start AI analysis in background
      if (results.length > 0) {
        setIsAnalyzing(true);
        try {
          const analysisResponse = await analyzeLeads(results);
          if (analysisResponse.success) {
            setAiGroups(analysisResponse.data);
            setAiSummary(analysisResponse.summary);
            setAiStrategies(analysisResponse.emailStrategies);
            setShowAiGrouping(true);
            toast.success('AI analysis complete! Leads grouped by opportunity.');
          }
        } catch (analysisError) {
          console.error('AI analysis error:', analysisError);
          // Don't show error - user can still use results without AI grouping
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
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
    toast.success('CSV downloaded!');
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setSearchType(null);
    setQuery('');
    setLocation('');
    setSearchResults([]);
    setSelectedLeads([]);
    setAiGroups(null);
    setAiSummary(null);
    setAiStrategies(null);
    setShowAiGrouping(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderWorkflowContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Step 1: Choose Search Type */}
            {!searchType ? (
              <div className="space-y-8">
                {/* BIG Step Header */}
                <div className="text-center py-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border-2 border-primary/30">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                    STEP 1: Choose Your Search Type
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Pick HOW you want to find leads. Both methods find businesses that need your help!
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* GMB Search Card - Matching Landing Page */}
                  <div className="relative">
                    {/* Active Badge */}
                    {user?.has_active_subscription && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-primary/20 text-primary border border-primary/50 px-3 py-1 text-xs font-semibold">
                          <Star className="w-3 h-3 mr-1" />
                          ACTIVE
                        </Badge>
                      </div>
                    )}
                    <button
                      onClick={() => setSearchType('gmb')}
                      className="group text-left p-6 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 w-full h-full"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">
                            Google My Business
                          </h3>
                          <p className="text-muted-foreground">
                            Find local businesses with GMB listings
                          </p>
                        </div>
                      </div>

                      {/* Feature List */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-primary">
                          <MapPin className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Find local businesses with Google My Business listings</span>
                        </div>
                        <div className="flex items-center gap-3 text-primary">
                          <FileText className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Extract contact info, phone numbers, addresses</span>
                        </div>
                        <div className="flex items-center gap-3 text-primary">
                          <Target className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Filter by industry, rating, and website quality</span>
                        </div>
                        <div className="flex items-center gap-3 text-primary">
                          <Zap className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Instant website analysis with mobile scores</span>
                        </div>
                      </div>

                      {/* Perfect For */}
                      <div className="bg-primary/10 rounded-xl p-4">
                        <p className="text-primary font-bold mb-1">Perfect For:</p>
                        <p className="text-muted-foreground text-sm">
                          Web designers, agencies, and marketers targeting local service businesses (plumbers, dentists, lawyers, restaurants, etc.)
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Platform Scanner Card - VIOLET color */}
                  <div className="relative">
                    {/* Active Badge */}
                    {user?.has_active_subscription && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-violet-500/20 text-violet-400 border border-violet-500/50 px-3 py-1 text-xs font-semibold">
                          <Star className="w-3 h-3 mr-1" />
                          ACTIVE
                        </Badge>
                      </div>
                    )}
                    <button
                      onClick={() => setSearchType('platform')}
                      className="group text-left p-6 rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-transparent hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 w-full h-full"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                          <Globe className="w-7 h-7 text-violet-500" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">
                            Platform Scanner
                          </h3>
                          <p className="text-muted-foreground">
                            Find outdated websites via Google & Bing
                          </p>
                        </div>
                      </div>

                      {/* Feature List */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-violet-500">
                          <Server className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Detect 16+ legacy platforms (WordPress, Wix, Joomla, etc.)</span>
                        </div>
                        <div className="flex items-center gap-3 text-violet-500">
                          <Globe className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Search across Google AND Bing simultaneously</span>
                        </div>
                        <div className="flex items-center gap-3 text-violet-500">
                          <TrendingUp className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Find businesses with outdated, slow websites</span>
                        </div>
                        <div className="flex items-center gap-3 text-violet-500">
                          <Users className="w-5 h-5 shrink-0" />
                          <span className="text-foreground">Target businesses ready for modernization</span>
                        </div>
                      </div>

                      {/* Perfect For */}
                      <div className="bg-violet-500/10 rounded-xl p-4">
                        <p className="text-violet-500 font-bold mb-1">Perfect For:</p>
                        <p className="text-muted-foreground text-sm">
                          Developers looking for website redesign projects, finding businesses stuck on legacy platforms that need modern solutions
                        </p>
                      </div>
                    </button>
                  </div>
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
                        {searchType === 'gmb' ? '🏢 Local Business Search' : '🔍 Outdated Website Scanner'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchType === 'gmb' ? 'Google Maps listings' : 'Old WordPress, Wix, Joomla sites'}
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
                          onChange={(e) => setQuery(e.target.value)}
                          className="flex-1"
                        />
                        <VoiceSearchButton 
                          onResult={(transcript) => setQuery(transcript)} 
                        />
                      </div>
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
                          onChange={(e) => setLocation(e.target.value)}
                          className="flex-1"
                        />
                        <VoiceSearchButton 
                          onResult={(transcript) => setLocation(transcript)} 
                        />
                      </div>
                    </div>

                    {/* Platform Checkboxes - only show for platform search */}
                    {searchType === 'platform' && (
                      <div>
                        <Label className="text-foreground font-medium mb-3 block">
                          Which platforms to scan?
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
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
                                  } else {
                                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium">{platform.icon} {platform.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Select at least one platform to search for outdated websites
                        </p>
                      </div>
                    )}

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
                    />

                    {/* No Website Filter (GMB only) */}
                    {searchType === 'gmb' && (
                      <div className="p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={filterNoWebsite}
                            onCheckedChange={(checked) => setFilterNoWebsite(checked === true)}
                          />
                          <div>
                            <span className="font-medium text-emerald-600">🔥 Only businesses WITHOUT a website</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              High-value leads for web design outreach - these businesses need your services most!
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

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
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Find Leads Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <EmbeddedSpreadsheetView
            leads={searchResults}
            onBack={() => setCurrentStep(1)}
            onProceedToVerify={(leads) => {
              setWidgetLeads(leads);
              sessionStorage.setItem('leadsToVerify', JSON.stringify(leads));
              setShowVerifierWidget(true);
            }}
            onSendToEmail={(leads) => {
              const convertedLeads: LeadForEmail[] = leads.map((l) => ({
                email: l.email || '',
                business_name: l.name,
                contact_name: '',
                website: l.website || '',
                phone: l.phone || '',
              }));
              setEmailLeads(convertedLeads);
              setCurrentStep(3);
            }}
          />
        );

      case 3: {
        // Sample leads for demo if none selected
        const sampleLeads: LeadForEmail[] = [
          { email: 'contact@acmeplumbing.com', business_name: 'Acme Plumbing Co', contact_name: 'John Smith', website: 'www.acmeplumbing.com', phone: '(555) 123-4567' },
          { email: 'info@sunsetdental.com', business_name: 'Sunset Dental Clinic', contact_name: 'Dr. Sarah Johnson', website: 'www.sunsetdental.com', phone: '(555) 234-5678' },
          { email: 'hello@greenthumb.com', business_name: 'Green Thumb Landscaping', contact_name: 'Mike Davis', website: 'www.greenthumb.com', phone: '(555) 345-6789' },
          { email: 'service@quickfix.com', business_name: 'QuickFix Auto Repair', contact_name: 'Carlos Martinez', website: 'www.quickfixauto.com', phone: '(555) 456-7890' },
          { email: 'info@elegantcuts.com', business_name: 'Elegant Cuts Salon', contact_name: 'Lisa Chen', website: 'www.elegantcuts.com', phone: '(555) 567-8901' },
          { email: 'office@smithlaw.com', business_name: 'Smith & Associates Law', contact_name: 'Robert Smith', website: 'www.smithlaw.com', phone: '(555) 678-9012' },
          { email: 'contact@homeclean.com', business_name: 'Home Clean Services', contact_name: 'Jennifer Brown', website: 'www.homeclean.com', phone: '(555) 789-0123' },
          { email: 'info@fitzone.com', business_name: 'FitZone Gym', contact_name: 'David Wilson', website: 'www.fitzone.com', phone: '(555) 890-1234' },
          { email: 'hello@tastybites.com', business_name: 'Tasty Bites Restaurant', contact_name: 'Maria Garcia', website: 'www.tastybites.com', phone: '(555) 901-2345' },
          { email: 'info@techpros.com', business_name: 'TechPros IT Solutions', contact_name: 'Alex Thompson', website: 'www.techpros.com', phone: '(555) 012-3456' },
        ];

        // Convert selected search results to email leads format
        const selectedSearchLeads: LeadForEmail[] = searchResults
          .filter(r => selectedLeads.includes(r.id))
          .map(r => ({
            email: r.email || '',
            business_name: r.name,
            contact_name: '',
            website: r.website || '',
            phone: r.phone || '',
          }));

        const leadsToUse = emailLeads.length > 0 
          ? emailLeads 
          : selectedSearchLeads.length > 0 
            ? selectedSearchLeads 
            : sampleLeads;
        
        // Store leads for Step 4 (Voice Calling)
        const leadsForCalling = leadsToUse.filter(l => l.phone);


        // Check SMTP configuration
        const smtpConfig = JSON.parse(localStorage.getItem('smtp_config') || '{}');
        const isSmtpConfigured = smtpConfig.username && smtpConfig.password;

        return (
          <div className="space-y-6">
            {/* BIG Step 3 Header */}
            <div className="text-center py-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border-2 border-blue-500/30">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                STEP 3: Send Your Outreach!
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {leadsToUse.length} leads ready! Send emails now or use AI to verify first.
              </p>
            </div>

            {/* Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to leads
              </button>
            </div>

            {/* SMTP Configuration Check */}
            <Card className={`border-2 ${isSmtpConfigured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${isSmtpConfigured ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      {isSmtpConfigured ? '✅' : '⚠️'}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {isSmtpConfigured ? 'SMTP Configured!' : 'Configure SMTP First'}
                      </p>
                      <p className="text-muted-foreground">
                        {isSmtpConfigured 
                          ? `Sending via ${smtpConfig.host || 'your SMTP server'}` 
                          : 'You need to set up your email server before sending outreach'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setActiveTab('settings')}
                    variant={isSmtpConfigured ? 'outline' : 'default'}
                    className={`gap-2 ${!isSmtpConfigured ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                  >
                    <Server className="w-4 h-4" />
                    {isSmtpConfigured ? 'View Settings' : 'Configure SMTP →'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Send Emails Card */}
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  outreachMode === 'email' 
                    ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20' 
                    : 'border-border hover:border-blue-500/50'
                }`}
                onClick={() => setOutreachMode('email')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                    📧
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Send Emails Now</h3>
                  <p className="text-muted-foreground mb-4">
                    Pick a template and send outreach immediately to your {leadsToUse.length} leads
                  </p>
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                    Quick & Direct
                  </Badge>
                </CardContent>
              </Card>

              {/* AI Verify First Card */}
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  outreachMode === 'verify' 
                    ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20' 
                    : 'border-border hover:border-amber-500/50'
                }`}
                onClick={() => setOutreachMode('verify')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                    ✅
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">AI Verify First</h3>
                  <p className="text-muted-foreground mb-4">
                    Find missing emails, score leads, and analyze websites before sending
                  </p>
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Uses Credits
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Content based on mode */}
            {outreachMode === 'email' ? (
              <EmailOutreachModule 
                selectedLeads={leadsToUse} 
                onClearSelection={() => setEmailLeads([])} 
              />
            ) : (
              <LeadVerificationModule onSendToEmail={handleSendToEmail} />
            )}

            {/* Continue to Voice Calls Button - Always Visible */}
            <Card className="mt-6 border-2 border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">
                      📞
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        Ready to follow up with calls?
                      </p>
                      <p className="text-muted-foreground">
                        {leadsForCalling.length > 0 
                          ? `${leadsForCalling.length} leads have phone numbers ready for AI voice calls`
                          : 'Set up your AI voice agent to call leads after sending emails'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setEmailLeads(leadsToUse);
                      setCurrentStep(4);
                    }}
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Phone className="w-5 h-5" />
                    {leadsForCalling.length > 0 ? 'Call Leads' : 'Set Up Calling'} →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      case 4: {
        // Voice Calling Step
        const callableLeads = emailLeads.length > 0 
          ? emailLeads.filter(l => l.phone) 
          : searchResults.filter(r => selectedLeads.includes(r.id) && r.phone);

        return (
          <div className="space-y-6">
            {/* BIG Step 4 Header */}
            <div className="text-center py-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border-2 border-green-500/30">
              <div className="text-6xl mb-4">📞</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                STEP 4: AI Voice Calls
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Follow up with {callableLeads.length} leads using AI-powered voice calls
              </p>
            </div>

            {/* Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to emails
              </button>
            </div>

            {/* Lead Call Queue */}
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-500" />
                  Leads Ready to Call ({callableLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {callableLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No leads with phone numbers selected</p>
                    <Button onClick={() => setCurrentStep(2)} variant="outline">
                      Go back and select leads
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callableLeads.slice(0, 5).map((lead: any, index: number) => (
                      <div 
                        key={lead.id || index}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-green-500/50 transition-all"
                      >
                        <div>
                          <p className="font-semibold">{lead.business_name || lead.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 gap-2"
                          onClick={() => {
                            setWidgetLeads([lead]);
                            toast.success(`Starting call to ${lead.business_name || lead.name}`);
                          }}
                        >
                          <Phone className="w-4 h-4" />
                          Call Now
                        </Button>
                      </div>
                    ))}
                    {callableLeads.length > 5 && (
                      <p className="text-center text-sm text-muted-foreground">
                        +{callableLeads.length - 5} more leads
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Agent Widget */}
            <VoiceCallWidget 
              leadName={(widgetLeads[0] as any)?.business_name || widgetLeads[0]?.name}
              leadPhone={widgetLeads[0]?.phone}
              onOpenSettings={() => setActiveTab('settings')}
            />

            {/* Setup Guide Link */}
            <Card className="border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Need to set up your AI voice agent?</p>
                  <p className="text-sm text-muted-foreground">Configure your ElevenLabs agent ID in settings</p>
                </div>
                <Button variant="outline" onClick={() => setActiveTab('settings')}>
                  Open Settings
                </Button>
              </CardContent>
            </Card>
          </div>
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
          component: <SettingsPanel />,
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

            {/* SMTP Status Indicator */}
            {(() => {
              const smtpConfig = JSON.parse(localStorage.getItem('smtp_config') || '{}');
              const isSmtpConfigured = smtpConfig.username && smtpConfig.password;
              return (
                <button
                  onClick={() => setActiveTab('settings')}
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

            <div className="flex-1" />

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                {/* Workflow Step Progress */}
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
                    {currentStep > 1 && (
                      <Button variant="outline" size="lg" onClick={resetWorkflow} className="gap-2">
                        🔄 Start Over
                      </Button>
                    )}
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

      {/* Lead Spreadsheet Viewer */}
      <LeadSpreadsheetViewer
        open={showSpreadsheetViewer}
        onOpenChange={setShowSpreadsheetViewer}
        leads={searchResults}
        onProceedToVerify={(leads) => {
          setShowSpreadsheetViewer(false);
          setWidgetLeads(leads);
          sessionStorage.setItem('leadsToVerify', JSON.stringify(leads));
          setShowVerifierWidget(true);
        }}
        onSaveToDatabase={(leads) => {
          // Save to session storage for now
          sessionStorage.setItem('savedLeads', JSON.stringify(leads));
          toast.success(`${leads.length} leads saved to database`);
        }}
        onSendToEmail={(leads) => {
          setShowSpreadsheetViewer(false);
          setVerifiedWidgetLeads(leads);
          setShowEmailWidget(true);
        }}
      />
    </SidebarProvider>
  );
}
