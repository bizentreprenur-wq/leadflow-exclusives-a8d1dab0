import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Briefcase, Building2 } from "lucide-react";

const GMBSearchModule = () => {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("GMB Search:", { service, location });
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
            <Button type="submit" variant="hero" className="md:w-auto w-full">
              <Search className="w-5 h-5" />
              <span>Search GMB</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GMBSearchModule;
