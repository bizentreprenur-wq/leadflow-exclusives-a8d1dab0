import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Briefcase, Zap } from "lucide-react";

const SearchModule = () => {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo - would trigger actual search
    console.log("Searching:", { service, location });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        {/* Main search container */}
        <div className="p-2 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-card">
          <div className="flex flex-col md:flex-row gap-2">
            {/* Service input */}
            <div className="flex-1 relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. plumber, roofer, dentist"
                className="pl-12 h-14 bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
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
                className="pl-12 h-14 bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
              />
            </div>

            {/* Search button */}
            <Button type="submit" variant="hero" size="xl" className="md:w-auto w-full group">
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">Find Website Design Leads</span>
              <span className="sm:hidden">Find Leads</span>
            </Button>
          </div>
        </div>

        {/* Micro-trust text */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span>Scans Google My Business + Google & Bing results in real time</span>
        </div>
      </form>
    </div>
  );
};

export default SearchModule;
