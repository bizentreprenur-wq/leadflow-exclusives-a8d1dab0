import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Briefcase, Globe, ChevronDown, ChevronUp, Loader2, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { searchPlatforms, PlatformResult } from "@/lib/api/platforms";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const platforms = [
  { id: "gmb", label: "Google My Business", category: "Directory" },
  { id: "wordpress", label: "WordPress", category: "CMS" },
  { id: "wix", label: "Wix", category: "Builder" },
  { id: "weebly", label: "Weebly", category: "Builder" },
  { id: "godaddy", label: "GoDaddy Website Builder", category: "Builder" },
  { id: "squarespace", label: "Squarespace", category: "Builder" },
  { id: "joomla", label: "Joomla", category: "CMS" },
  { id: "drupal", label: "Drupal", category: "CMS" },
  { id: "webcom", label: "Web.com", category: "Builder" },
  { id: "jimdo", label: "Jimdo", category: "Builder" },
  { id: "opencart", label: "OpenCart", category: "E-commerce" },
  { id: "prestashop", label: "PrestaShop", category: "E-commerce" },
  { id: "magento", label: "Magento (older versions)", category: "E-commerce" },
  { id: "zencart", label: "Zen Cart", category: "E-commerce" },
  { id: "oscommerce", label: "osCommerce", category: "E-commerce" },
  { id: "customhtml", label: "Custom HTML", category: "Custom" },
  { id: "customphp", label: "Custom PHP (outdated)", category: "Custom" },
];

const PlatformSearchModule = () => {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["gmb", "wordpress", "wix", "weebly"]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PlatformResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service.trim() || !location.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both service type and location",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform to search for",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await searchPlatforms(service, location, selectedPlatforms);
      
      if (response.success && response.data) {
        setResults(response.data);
        toast({
          title: "Search complete",
          description: `Found ${response.data.length} results`,
        });
      } else {
        toast({
          title: "Search failed",
          description: response.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform search",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const selectAll = () => {
    setSelectedPlatforms(platforms.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedPlatforms([]);
  };

  const displayedPlatforms = showAllPlatforms ? platforms : platforms.slice(0, 8);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <Globe className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Google & Bing Platform Search</h3>
          <p className="text-sm text-muted-foreground">Detect outdated platforms and poor-quality websites</p>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        {/* Search inputs */}
        <div className="p-2 rounded-xl border border-border bg-card/80 backdrop-blur-sm mb-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. plumber, roofer, dentist"
                className="pl-12 h-12 bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
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
                className="pl-12 h-12 bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              className="md:w-auto w-full" 
              disabled={selectedPlatforms.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search Platforms</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Platform selection */}
        <div className="p-4 rounded-xl border border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Select platforms to detect:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Select All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayedPlatforms.map((platform) => (
              <label
                key={platform.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                }`}
              >
                <Checkbox
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => togglePlatform(platform.id)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-foreground">{platform.label}</span>
              </label>
            ))}
          </div>

          {platforms.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllPlatforms(!showAllPlatforms)}
              className="flex items-center gap-1 mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showAllPlatforms ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show All {platforms.length} Platforms
                </>
              )}
            </button>
          )}

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""} selected
              {selectedPlatforms.length > 0 && (
                <span className="text-primary"> • Searches Google & Bing organic results</span>
              )}
            </p>
          </div>
        </div>
      </form>

      {/* Results */}
      {hasSearched && (
        <div className="mt-6">
          <h4 className="font-display font-semibold text-foreground mb-4">
            {isLoading ? "Searching..." : `Results (${results.length})`}
          </h4>
          
          {!isLoading && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No results found. Try different search terms or platforms.
            </div>
          )}

          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-foreground truncate">{result.name}</h5>
                      {result.websiteAnalysis.needsUpgrade ? (
                        <Badge variant="destructive" className="shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Needs Upgrade
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Good
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {result.snippet}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {result.websiteAnalysis.platform && (
                        <Badge variant="outline">{result.websiteAnalysis.platform}</Badge>
                      )}
                      {result.websiteAnalysis.mobileScore !== null && (
                        <Badge 
                          variant="outline" 
                          className={result.websiteAnalysis.mobileScore < 60 ? "border-destructive text-destructive" : ""}
                        >
                          Mobile: {result.websiteAnalysis.mobileScore}%
                        </Badge>
                      )}
                      {result.websiteAnalysis.loadTime && (
                        <Badge 
                          variant="outline"
                          className={result.websiteAnalysis.loadTime > 3000 ? "border-destructive text-destructive" : ""}
                        >
                          {(result.websiteAnalysis.loadTime / 1000).toFixed(1)}s load
                        </Badge>
                      )}
                    </div>

                    {result.websiteAnalysis.issues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.websiteAnalysis.issues.slice(0, 3).map((issue, i) => (
                          <span key={i} className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                            {issue}
                          </span>
                        ))}
                        {result.websiteAnalysis.issues.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{result.websiteAnalysis.issues.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Site
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSearchModule;
