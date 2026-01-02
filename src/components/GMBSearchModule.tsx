import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Briefcase, Building2, Loader2, AlertCircle, Globe, Smartphone, CheckCircle, XCircle } from "lucide-react";
import { searchGMB, GMBResult } from "@/lib/api/gmb";
import { toast } from "sonner";

const GMBSearchModule = () => {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GMBResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service.trim() || !location.trim()) {
      toast.error("Please enter both service type and location");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const response = await searchGMB(service.trim(), location.trim());

    if (response.success && response.data) {
      setResults(response.data);
      const upgradeCount = response.data.filter(r => r.websiteAnalysis.needsUpgrade).length;
      toast.success(`Found ${response.data.length} businesses, ${upgradeCount} need upgrades`);
    } else {
      toast.error(response.error || "Search failed");
      setResults([]);
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Google My Business Search</h3>
          <p className="text-sm text-muted-foreground">Find businesses with GMB listings that need website upgrades</p>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        <div className="p-2 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-2">
            {/* Service input */}
            <div className="flex-1 relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. plumber, roofer, dentist"
                className="pl-12 h-12 bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
              />
            </div>

            {/* Location input */}
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or ZIP code"
                className="pl-12 h-12 bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
              />
            </div>

            {/* Search button */}
            <Button type="submit" variant="hero" className="md:w-auto w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{isLoading ? "Searching..." : "Search GMB"}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Results Section */}
      {hasSearched && (
        <div className="mt-6">
          {results.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No results found. Try a different search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border transition-all ${
                    result.websiteAnalysis.needsUpgrade
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-card/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{result.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{result.snippet}</p>
                      
                      {result.displayLink && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                          <Globe className="w-3 h-3" />
                          <span className="truncate">{result.displayLink}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {result.websiteAnalysis.platform && (
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                          {result.websiteAnalysis.platform}
                        </span>
                      )}
                      
                      {result.websiteAnalysis.needsUpgrade ? (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <XCircle className="w-3 h-3" />
                          Needs Upgrade
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Good Website
                        </span>
                      )}
                    </div>
                  </div>

                  {result.websiteAnalysis.issues.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Issues detected:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.websiteAnalysis.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GMBSearchModule;
