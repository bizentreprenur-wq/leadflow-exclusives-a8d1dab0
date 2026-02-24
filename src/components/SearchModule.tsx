import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Globe, Briefcase, MapPin, Search, Loader2, 
  ChevronDown, ChevronUp, Brain, Zap, Wifi, WifiOff
} from "lucide-react";
import { searchGMB, NetworkStatusCallback } from "@/lib/api/gmb";
import { searchPlatforms } from "@/lib/api/platforms";
import { enrichLeadsWithIntelligence } from "@/lib/api/businessIntelligence";
import { toast } from "sonner";
import LeadActionModal from "./LeadActionModal";

// Platform options for Agency Lead Finder - includes Google Maps and website platforms
const platforms = [
  { id: "gmb", label: "Google Maps", category: "Directory" },
  { id: "wordpress", label: "WordPress", category: "CMS" },
  { id: "wix", label: "Wix", category: "Builder" },
  { id: "weebly", label: "Weebly", category: "Builder" },
  { id: "godaddy", label: "GoDaddy", category: "Builder" },
  { id: "squarespace", label: "Squarespace", category: "Builder" },
  { id: "joomla", label: "Joomla", category: "CMS" },
  { id: "drupal", label: "Drupal", category: "CMS" },
  { id: "shopify", label: "Shopify", category: "E-commerce" },
  { id: "webcom", label: "Web.com", category: "Builder" },
  { id: "jimdo", label: "Jimdo", category: "Builder" },
  { id: "opencart", label: "OpenCart", category: "E-commerce" },
  { id: "prestashop", label: "PrestaShop", category: "E-commerce" },
  { id: "magento", label: "Magento", category: "E-commerce" },
  { id: "customhtml", label: "Custom HTML", category: "Custom" },
  { id: "customphp", label: "Custom PHP", category: "Custom" },
  { id: "linkedin", label: "LinkedIn", category: "Social" },
];

const SearchModule = () => {
  // Search type selection
  const [selectedSearch, setSelectedSearch] = useState<"gmb" | "platform" | null>(null);
  
  // Shared form state
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Platform-specific state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["gmb", "wordpress", "wix", "weebly", "squarespace"]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  
  
  // Results
  const [results, setResults] = useState<any[]>([]);
  const [showLeadActionModal, setShowLeadActionModal] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'idle' | 'verifying' | 'retrying' | 'connected' | 'failed'>('idle');
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  // Network status toast ID for updating
  const [networkToastId, setNetworkToastId] = useState<string | number | undefined>(undefined);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(platforms.map((p) => p.id));
  };

  const clearAllPlatforms = () => {
    setSelectedPlatforms([]);
  };

  const displayedPlatforms = showAllPlatforms ? platforms : platforms.slice(0, 8);

  const handleSearch = async (searchType: "gmb" | "platform") => {
    if (!service.trim() || !location.trim()) {
      toast.error("Please enter both service type and location");
      return;
    }

    if (searchType === "platform" && selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform to search for");
      return;
    }

    setIsLoading(true);
    setSelectedSearch(searchType);
    setNetworkStatus('idle');
    setRetryAttempt(0);

    // Network status callback for retry handling
    const handleNetworkStatus: NetworkStatusCallback = (status, attempt) => {
      setNetworkStatus(status);
      setRetryAttempt(attempt || 0);
      
      if (status === 'verifying') {
        const toastId = toast.loading(
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 animate-pulse text-amber-400" />
            <span>Verifying network connection...</span>
          </div>,
          { duration: Infinity }
        );
        setNetworkToastId(toastId);
      } else if (status === 'retrying' && attempt) {
        toast.loading(
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 animate-pulse text-amber-400" />
            <span>Reconnecting... Attempt {attempt}/3</span>
          </div>,
          { id: networkToastId, duration: Infinity }
        );
      } else if (status === 'connected' && networkToastId) {
        toast.success(
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Network connected!</span>
          </div>,
          { id: networkToastId }
        );
        setNetworkToastId(undefined);
      } else if (status === 'failed' && networkToastId) {
        // Don't show failure toast - let the search continue or show a gentler message
        toast.dismiss(networkToastId);
        setNetworkToastId(undefined);
      }
    };

    try {
      if (searchType === "gmb") {
        // Step 1: Get basic lead data
        toast.info("🔍 Finding businesses...");
        const response = await searchGMB(service.trim(), location.trim(), 100, undefined, undefined, handleNetworkStatus);
        
        if (response.success && response.data && response.data.length > 0) {
          // Step 2: Enrich with comprehensive business intelligence
          toast.info("🧠 Running AI intelligence analysis on " + response.data.length + " leads...");
          
          try {
            const enrichedResponse = await enrichLeadsWithIntelligence(
              response.data,
              { usePageSpeed: false, enrichContacts: true },
              (progress, message) => {
                console.log(`[BI] ${progress}% - ${message}`);
              }
            );
            
            if (enrichedResponse.success && enrichedResponse.data) {
              setResults(enrichedResponse.data);
              const hotLeads = enrichedResponse.data.filter((r: any) => r.aiSummary?.classificationLabel === 'hot').length;
              const warmLeads = enrichedResponse.data.filter((r: any) => r.aiSummary?.classificationLabel === 'warm').length;
              toast.success(`Found ${enrichedResponse.data.length} businesses with full intelligence! 🔥 ${hotLeads} hot, ⚡ ${warmLeads} warm`);
              setShowLeadActionModal(true);
            } else {
              // Fall back to basic data if enrichment fails
              setResults(response.data);
              toast.success(`Found ${response.data.length} businesses (basic data)`);
              setShowLeadActionModal(true);
            }
          } catch (enrichError) {
            console.error('[BI] Enrichment error:', enrichError);
            // Fall back to basic data
            setResults(response.data);
            const upgradeCount = response.data.filter((r: any) => r.websiteAnalysis?.needsUpgrade).length;
            toast.success(`Found ${response.data.length} businesses, ${upgradeCount} need upgrades`);
            setShowLeadActionModal(true);
          }
        } else {
          toast.error(response.error || "Search failed");
          setResults([]);
        }
      } else {
        const response = await searchPlatforms(service.trim(), location.trim(), selectedPlatforms);
        if (response.success && response.data) {
          setResults(response.data);
          toast.success(`Found ${response.data.length} results`);
          if (response.data.length > 0) {
            setShowLeadActionModal(true);
          }
        } else {
          toast.error(response.error || "Search failed");
          setResults([]);
        }
      }
    } catch (error) {
      console.error('[Search] Error:', error);
      // Don't show error toast for network errors - just show a gentle retry message
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const isNetworkError = ['network', 'timeout', 'connection', 'offline', 'failed to fetch'].some(
        pattern => errorMessage.includes(pattern)
      );
      
      if (isNetworkError) {
        toast.info(
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <div>
              <p className="font-medium">Connection interrupted</p>
              <p className="text-xs text-muted-foreground">Please check your network and try again</p>
            </div>
          </div>
        );
      } else {
        toast.error("Failed to perform search");
      }
    } finally {
      setIsLoading(false);
      setNetworkStatus('idle');
      if (networkToastId) {
        toast.dismiss(networkToastId);
        setNetworkToastId(undefined);
      }
    }
  };

  const handleVerifyWithAI = () => {
    sessionStorage.setItem('leadsToVerify', JSON.stringify(results));
    toast.success('Leads ready for AI verification! Go to "AI Lead Verification" tab.');
  };

  const handleSendToGoogleDrive = () => {
    sessionStorage.setItem('googleSheetsLeads', JSON.stringify(results));
    toast.info('Google Drive integration coming soon! For now, download as CSV.');
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Choose Your Search Method
        </h2>
        <p className="text-muted-foreground">
          <strong>Option A:</strong> Understand the market &amp; build strategy · <strong>Option B:</strong> Find businesses needing your services
        </p>
      </div>

      {/* Shared Search Form */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-card mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. plumber, roofer, dentist"
              className="pl-12 h-12 bg-secondary/50 border-border text-base placeholder:text-muted-foreground/60"
              disabled={isLoading}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State or ZIP code"
              className="pl-12 h-12 bg-secondary/50 border-border text-base placeholder:text-muted-foreground/60"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Two Search Options Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Super AI Business Intelligence Search Card - RESEARCH FOCUSED */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent p-6 hover:border-primary/40 transition-all relative overflow-hidden">
          {/* Premium badge */}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-primary to-emerald-500 text-white rounded-full">
              🧠 RESEARCH AI
            </span>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 border border-primary/20">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Super AI Business Search
              </h3>
              <p className="text-sm font-semibold text-primary">
                Market Intelligence &amp; Competitive Strategy
              </p>
              <p className="text-xs text-muted-foreground">
                Understand the market, identify gaps, and build your competitive strategy
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            <span className="font-semibold text-primary">Market Intelligence Engine.</span> Aggregate niche data, discover digital maturity gaps, competitive patterns, and strategic opportunities — not just a list of businesses.
          </p>

          {/* Basic Data Included */}
          <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/20 mb-3">
            <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              📋 BASIC BUSINESS DATA INCLUDED
            </p>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
              <span>✓ Business Name</span>
              <span>✓ Full Address</span>
              <span>✓ Phone Number</span>
              <span>✓ Email Address</span>
              <span>✓ Website URL</span>
              <span>✓ Google Rating</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-primary mb-2">🧠 AI Research Categories (populated in report):</p>
          
          {/* Research Categories - Scrollable */}
          <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 mb-4 scrollbar-thin">
            {/* Website & Digital Health */}
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-1">
                🌐 WEBSITE & DIGITAL HEALTH
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                CMS detection, SSL status, mobile responsiveness, page speed, Core Web Vitals, broken links, UX issues, accessibility, conversion elements, tracking pixels
              </p>
            </div>

            {/* Online Presence & Visibility */}
            <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mb-1">
                📈 ONLINE PRESENCE & VISIBILITY
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Google Business Profile status, search ranking, local SEO strength, directory listings, brand mentions, backlink profile, indexed pages
              </p>
            </div>

            {/* Reviews & Reputation */}
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5 mb-1">
                ⭐ REVIEWS & REPUTATION INTELLIGENCE
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Total reviews by platform, rating trends, review velocity, sentiment analysis, complaint themes, response rate, competitor comparison
              </p>
            </div>

            {/* AI Opportunity Analysis */}
            <div className="p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
              <p className="text-xs font-bold text-violet-500 flex items-center gap-1.5 mb-1">
                🧠 AI OPPORTUNITY & GAP ANALYSIS
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Missed conversion opportunities, SEO gaps, paid ads readiness, automation potential, AI-recommended services, revenue lift potential
              </p>
            </div>

            {/* Technology Stack */}
            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-xs font-bold text-blue-500 flex items-center gap-1.5 mb-1">
                🛠 TECHNOLOGY & TRACKING STACK
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Analytics tools (GA4, GTM), ad platforms, CRM detection, email marketing, chatbots, booking software, payment gateways, hosting
              </p>
            </div>

            {/* Lead Intent & Buying Signals */}
            <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mb-1">
                🎯 LEAD INTENT & BUYING SIGNALS
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Hiring activity, funding events, website changes, ad spend signals, marketing spikes, traffic growth, AI intent score
              </p>
            </div>

            {/* Competitor Intelligence */}
            <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
              <p className="text-xs font-bold text-orange-500 flex items-center gap-1.5 mb-1">
                🥊 COMPETITOR & MARKET INTELLIGENCE
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Direct competitors identified, market share, competitive gaps, pricing signals, ranking comparison, differentiation opportunities
              </p>
            </div>

            {/* Sales Readiness */}
            <div className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <p className="text-xs font-bold text-cyan-500 flex items-center gap-1.5 mb-1">
                📊 SALES & OUTREACH READINESS
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Decision-maker data, response likelihood, preferred outreach channel, personalization hooks, pitch angle, closing probability
              </p>
            </div>

            {/* Compliance & Trust */}
            <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10">
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                🧩 COMPLIANCE, RISK & TRUST SIGNALS
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Privacy policy, cookie compliance, ADA risk, security headers, domain trust score, spam risk indicators
              </p>
            </div>

            {/* AI Smart Actions */}
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-1">
                🧪 AI INSIGHTS & SMART ACTIONS
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                AI summary, talking points, recommended first message, follow-up cadence, proposal ideas, "why now" insight
              </p>
            </div>
          </div>

          {/* Perfect For Section */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/10 mb-3">
            <p className="text-xs font-semibold text-primary mb-1">🎯 Perfect For:</p>
            <p className="text-[11px] text-muted-foreground">
              SaaS companies, B2B sales teams, investors, market researchers, competitive intelligence, agencies doing client research
            </p>
          </div>


          <Button
            onClick={() => handleSearch("gmb")}
            disabled={isLoading || !service.trim() || !location.trim()}
            className="w-full h-12 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90"
            variant="default"
          >
            {isLoading && selectedSearch === "gmb" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                AI Researching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                🧠 Run Deep AI Research
              </>
            )}
          </Button>
        </div>

        {/* Agency Lead Finder Card */}
        <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-6 hover:border-violet-500/40 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Globe className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                🎯 Agency Lead Finder
              </h3>
              <p className="text-sm text-muted-foreground">
                For Web Dev Pros & SMMA Agencies
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            Find clients who need <span className="font-semibold text-violet-400">website redesigns</span>, <span className="font-semibold text-violet-400">social media management</span>, and <span className="font-semibold text-violet-400">digital marketing help</span>.
          </p>

          {/* What You Get Section */}
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 mb-3">
            <p className="text-xs font-semibold text-violet-400 mb-2">🎯 Perfect For Finding:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>🔧 Outdated websites</span>
              <span>📵 Non-mobile sites</span>
              <span>🎨 Old CMS platforms</span>
              <span>📉 Missing analytics</span>
              <span>📱 Weak social presence</span>
              <span>⚡ Slow page speed</span>
              <span>🔐 No SSL security</span>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Select platforms:</span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllPlatforms}
                  className="text-violet-500 hover:text-violet-400 transition-colors"
                >
                  All
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={clearAllPlatforms}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {displayedPlatforms.map((platform) => (
                <label
                  key={platform.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm ${
                    selectedPlatforms.includes(platform.id)
                      ? "bg-violet-500/10 border border-violet-500/30"
                      : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                    className="border-muted-foreground data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500 h-4 w-4"
                  />
                  <span className="text-foreground truncate">{platform.label}</span>
                </label>
              ))}
            </div>

            {platforms.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                className="flex items-center gap-1 mt-2 text-xs text-violet-500 hover:text-violet-400 transition-colors"
              >
                {showAllPlatforms ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show All ({platforms.length})
                  </>
                )}
              </button>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""} selected
            </p>
          </div>


          <Button
            onClick={() => handleSearch("platform")}
            disabled={isLoading || !service.trim() || !location.trim() || selectedPlatforms.length === 0}
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isLoading && selectedSearch === "platform" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Scan Platforms
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lead Action Modal */}
      <LeadActionModal
        open={showLeadActionModal}
        onOpenChange={setShowLeadActionModal}
        leadCount={results.length}
        onVerifyWithAI={handleVerifyWithAI}
        onDownload={() => {
          toast.success("Download started");
        }}
        onSendToGoogleDrive={handleSendToGoogleDrive}
        leads={results}
      />
    </div>
  );
};

export default SearchModule;
