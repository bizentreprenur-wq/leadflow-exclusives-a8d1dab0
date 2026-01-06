import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import bamMascot from '@/assets/bamlead-mascot.png';
import { LeadForEmail } from '@/lib/api/email';
import { searchGMB, GMBResult } from '@/lib/api/gmb';
import { searchPlatforms, PlatformResult } from '@/lib/api/platforms';

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
}

// Step configuration
const WORKFLOW_STEPS = [
  { id: 1, title: 'Search', description: 'Find businesses', icon: Search },
  { id: 2, title: 'Review Leads', description: 'See your results', icon: Users },
  { id: 3, title: 'Verify', description: 'AI verification', icon: CheckCircle2 },
  { id: 4, title: 'Send Emails', description: 'Outreach', icon: Send },
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

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
    setCurrentStep(4);
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
    
    try {
      if (searchType === 'gmb') {
        const response = await searchGMB(query, location);
        if (response.success && response.data) {
          const results: SearchResult[] = response.data.map((r: GMBResult, index: number) => ({
            id: r.id || `gmb-${index}`,
            name: r.name || 'Unknown Business',
            address: r.address,
            phone: r.phone,
            website: r.url,
            email: undefined, // GMB results don't include email
            rating: r.rating,
            source: 'gmb' as const,
          }));
          setSearchResults(results);
          toast.success(`Found ${results.length} local businesses!`);
        }
      } else if (searchType === 'platform') {
        const response = await searchPlatforms(query, location, ['wordpress', 'wix', 'squarespace', 'shopify']);
        if (response.success && response.data) {
          const results: SearchResult[] = response.data.map((r: PlatformResult, index: number) => ({
            id: r.id || `platform-${index}`,
            name: r.name || 'Unknown Business',
            address: r.address,
            phone: r.phone,
            website: r.url,
            email: undefined, // Platform results don't include email
            source: 'platform' as const,
            platform: r.websiteAnalysis?.platform || undefined,
          }));
          setSearchResults(results);
          toast.success(`Found ${results.length} businesses with outdated websites!`);
        }
      }
      
      // Move to step 2 after search
      setCurrentStep(2);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
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
    // Store selected leads for verification
    const leadsToVerify = searchResults.filter(r => selectedLeads.includes(r.id));
    sessionStorage.setItem('leadsToVerify', JSON.stringify(leadsToVerify));
    setCurrentStep(3);
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
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    What kind of leads do you want?
                  </h2>
                  <p className="text-muted-foreground">
                    Choose your search method to find the perfect leads
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* GMB Search Card - Teal/Cyan */}
                  <button
                    onClick={() => setSearchType('gmb')}
                    className="group text-left p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      🏢 Local Business Search
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Find local businesses on Google Maps. Perfect for service-based leads like plumbers, restaurants, dentists, etc.
                    </p>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span>Search Google Maps</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Platform Search Card - Purple/Violet */}
                  <button
                    onClick={() => setSearchType('platform')}
                    className="group text-left p-6 rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-violet-500/5 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Globe className="w-7 h-7 text-violet-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      🔍 Outdated Website Scanner
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Find businesses with old WordPress, Wix, or Joomla sites. Great for web design and migration services.
                    </p>
                    <div className="flex items-center gap-2 text-violet-500 font-medium">
                      <span>Scan for old websites</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
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

                    <Button
                      onClick={handleSearch}
                      disabled={isSearching}
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
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New search
                </button>
                <h2 className="text-2xl font-bold text-foreground">
                  🎉 Found {searchResults.length} Leads!
                </h2>
                <p className="text-muted-foreground">
                  Select the leads you want to verify and contact
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={selectAllLeads}>
                  {selectedLeads.length === searchResults.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="outline" onClick={downloadCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>

            {/* Selection Summary */}
            {selectedLeads.length > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedLeads.length} leads selected</p>
                      <p className="text-sm text-muted-foreground">Ready for AI verification</p>
                    </div>
                  </div>
                  <Button onClick={proceedToVerification} className="gap-2">
                    Verify Selected
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Results Grid */}
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-3">
                {searchResults.map((result, index) => (
                  <Card 
                    key={result.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedLeads.includes(result.id) 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleLeadSelection(result.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Selection indicator */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                          selectedLeads.includes(result.id)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}>
                          {selectedLeads.includes(result.id) && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>

                        {/* Lead info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-foreground truncate">
                                {index + 1}. {result.name}
                              </h3>
                              {result.address && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {result.address}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {result.rating && (
                                <Badge variant="secondary" className="gap-1">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {result.rating}
                                </Badge>
                              )}
                              <Badge className={
                                result.source === 'gmb' 
                                  ? 'bg-primary/10 text-primary border-primary/20' 
                                  : 'bg-violet-500/10 text-violet-500 border-violet-500/20'
                              }>
                                {result.source === 'gmb' ? 'GMB' : result.platform || 'Web'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                            {result.phone && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {result.phone}
                              </span>
                            )}
                            {result.email ? (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <Mail className="w-3 h-3" />
                                Has email ✓
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Mail className="w-3 h-3" />
                                No email (AI will find)
                              </span>
                            )}
                            {result.website && (
                              <a 
                                href={result.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to lead list
            </button>
            <LeadVerificationModule onSendToEmail={handleSendToEmail} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to verification
            </button>
            <EmailOutreachModule
              selectedLeads={emailLeads}
              onClearSelection={() => setEmailLeads([])}
            />
          </div>
        );

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
          component: <SequenceBuilderModule />,
        };
      case 'templates':
        return {
          title: 'Email Templates',
          description: 'Pre-built email templates for every outreach scenario',
          icon: FileText,
          iconColor: 'text-purple-500',
          iconBg: 'bg-purple-500/10',
          component: <EmailTemplateLibrary />,
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

            <div className="flex-1" />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={bamMascot} alt="Bam" className="w-5 h-5 object-contain" />
              <span className="hidden sm:inline">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeTab === 'workflow' ? (
              <>
                {/* Workflow Step Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="hidden lg:block">
                        <Mascot3D size="md" interactive />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">
                          Lead Generation
                        </h1>
                        <p className="text-muted-foreground">
                          Follow the steps to find and contact leads
                        </p>
                      </div>
                    </div>
                    {currentStep > 1 && (
                      <Button variant="outline" onClick={resetWorkflow}>
                        Start Over
                      </Button>
                    )}
                  </div>

                  {/* Step Progress Bar */}
                  <div className="flex items-center gap-2">
                    {WORKFLOW_STEPS.map((step, index) => (
                      <div key={step.id} className="flex items-center flex-1">
                        <button
                          onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                          disabled={currentStep < step.id}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl w-full transition-all ${
                            currentStep === step.id
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : currentStep > step.id
                              ? 'bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            currentStep === step.id
                              ? 'bg-primary-foreground/20'
                              : currentStep > step.id
                              ? 'bg-primary/30'
                              : 'bg-muted-foreground/20'
                          }`}>
                            {currentStep > step.id ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              step.id
                            )}
                          </div>
                          <div className="text-left hidden md:block">
                            <p className="font-semibold text-sm">{step.title}</p>
                            <p className="text-xs opacity-80">{step.description}</p>
                          </div>
                        </button>
                        {index < WORKFLOW_STEPS.length - 1 && (
                          <ChevronRight className="w-5 h-5 text-muted-foreground mx-1 shrink-0" />
                        )}
                      </div>
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
    </SidebarProvider>
  );
}
