import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, Globe, Briefcase, MapPin, Search, Loader2, 
  ChevronDown, ChevronUp 
} from "lucide-react";
import { searchGMB } from "@/lib/api/gmb";
import { searchPlatforms } from "@/lib/api/platforms";
import { toast } from "sonner";
import LeadActionModal from "./LeadActionModal";

const platforms = [
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
];

const SearchModule = () => {
  // Search type selection
  const [selectedSearch, setSelectedSearch] = useState<"gmb" | "platform" | null>(null);
  
  // Shared form state
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Platform-specific state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["wordpress", "wix", "weebly", "squarespace"]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  
  // Results
  const [results, setResults] = useState<any[]>([]);
  const [showLeadActionModal, setShowLeadActionModal] = useState(false);

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

    try {
      if (searchType === "gmb") {
        const response = await searchGMB(service.trim(), location.trim());
        if (response.success && response.data) {
          setResults(response.data);
          const upgradeCount = response.data.filter((r: any) => r.websiteAnalysis?.needsUpgrade).length;
          toast.success(`Found ${response.data.length} businesses, ${upgradeCount} need upgrades`);
          if (response.data.length > 0) {
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
      toast.error("Failed to perform search");
    } finally {
      setIsLoading(false);
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
          Enter your search criteria, then click the search type you want to use
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
        {/* Super AI Business Intelligence Search Card */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent p-6 hover:border-primary/40 transition-all relative overflow-hidden">
          {/* Premium badge */}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-primary to-emerald-500 text-white rounded-full">
              🤖 SUPER AI
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
              <p className="text-sm text-muted-foreground">
                Advanced Business Intelligence
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-semibold text-primary">Find businesses to call or email.</span> Get comprehensive AI-powered insights on every lead — perfect for sales teams, agencies & digital professionals.
          </p>

          <ul className="text-sm text-muted-foreground space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Complete business profile & validation
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Website health & conversion readiness
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Reviews, social presence & reputation
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              AI scoring & sales intelligence
            </li>
          </ul>

          <Button
            onClick={() => handleSearch("gmb")}
            disabled={isLoading || !service.trim() || !location.trim()}
            className="w-full h-12 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90"
            variant="default"
          >
            {isLoading && selectedSearch === "gmb" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                AI Analyzing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                🚀 Run Super AI Search
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

          <p className="text-sm text-muted-foreground mb-4">
            Find clients who need <span className="font-semibold text-violet-400">website redesigns</span>, <span className="font-semibold text-violet-400">social media management</span>, and <span className="font-semibold text-violet-400">digital marketing help</span>.
          </p>

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
