import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Briefcase, Globe, ChevronDown, ChevronUp } from "lucide-react";

const platforms = [
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["wordpress", "wix", "weebly"]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Platform Search:", { service, location, platforms: selectedPlatforms });
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
              />
            </div>

            <Button type="submit" variant="hero" className="md:w-auto w-full" disabled={selectedPlatforms.length === 0}>
              <Search className="w-5 h-5" />
              <span>Search Platforms</span>
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
    </div>
  );
};

export default PlatformSearchModule;
