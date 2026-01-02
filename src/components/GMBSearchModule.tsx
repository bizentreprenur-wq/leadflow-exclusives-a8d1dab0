import { useState, forwardRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, MapPin, Briefcase, Building2, Loader2, AlertCircle, 
  Globe, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter 
} from "lucide-react";
import { searchGMB, GMBResult } from "@/lib/api/gmb";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = "all" | "needs-upgrade" | "good";
type PlatformFilter = "all" | string;

const RESULTS_PER_PAGE = 5;

const GMBSearchModule = forwardRef<HTMLDivElement>((_, ref) => {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GMBResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  // Get unique platforms from results
  const platforms = useMemo(() => {
    const platformSet = new Set<string>();
    results.forEach(r => {
      if (r.websiteAnalysis.platform) {
        platformSet.add(r.websiteAnalysis.platform);
      }
    });
    return Array.from(platformSet).sort();
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      // Status filter
      if (statusFilter === "needs-upgrade" && !r.websiteAnalysis.needsUpgrade) return false;
      if (statusFilter === "good" && r.websiteAnalysis.needsUpgrade) return false;
      
      // Platform filter
      if (platformFilter !== "all" && r.websiteAnalysis.platform !== platformFilter) return false;
      
      return true;
    });
  }, [results, statusFilter, platformFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(start, start + RESULTS_PER_PAGE);
  }, [filteredResults, currentPage]);

  // Reset pagination when filters change
  const handleFilterChange = (type: "status" | "platform", value: string) => {
    setCurrentPage(1);
    if (type === "status") {
      setStatusFilter(value as FilterType);
    } else {
      setPlatformFilter(value);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service.trim() || !location.trim()) {
      toast.error("Please enter both service type and location");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
    setStatusFilter("all");
    setPlatformFilter("all");

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

  const needsUpgradeCount = results.filter(r => r.websiteAnalysis.needsUpgrade).length;
  const goodCount = results.length - needsUpgradeCount;

  return (
    <div className="w-full" ref={ref}>
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
          ) : results.length > 0 && (
            <>
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>Filters:</span>
                </div>
                
                <div className="flex flex-wrap gap-2 flex-1">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={(v) => handleFilterChange("status", v)}>
                    <SelectTrigger className="w-[160px] h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({results.length})</SelectItem>
                      <SelectItem value="needs-upgrade">Needs Upgrade ({needsUpgradeCount})</SelectItem>
                      <SelectItem value="good">Good Website ({goodCount})</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Platform Filter */}
                  {platforms.length > 0 && (
                    <Select value={platformFilter} onValueChange={(v) => handleFilterChange("platform", v)}>
                      <SelectTrigger className="w-[160px] h-9 text-sm">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        {platforms.map(platform => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Results count */}
                <div className="text-sm text-muted-foreground self-center">
                  {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Results List */}
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No results match your filters.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedResults.map((result) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

GMBSearchModule.displayName = "GMBSearchModule";

export default GMBSearchModule;
