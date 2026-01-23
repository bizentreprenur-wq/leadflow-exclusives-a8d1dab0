import { Star, Globe, Gauge, Phone, Mail, AlertCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WebsitePreviewIcon from "./WebsitePreviewIcon";

const mockResults = [
  {
    name: "Johnson's Plumbing & Heating",
    rating: 4.2,
    reviews: 47,
    category: "Plumber",
    website: "johnsonsplumbing.com",
    platform: "WordPress",
    qualityScore: 32,
    status: "Needs Website Upgrade",
    statusColor: "destructive" as const,
    email: "info@johnsonsplumbing.com",
    phone: "(555) 123-4567",
  },
  {
    name: "Elite Roofing Solutions",
    rating: 4.8,
    reviews: 124,
    category: "Roofing Contractor",
    website: "eliteroofingsolutions.net",
    platform: "Outdated HTML",
    qualityScore: 28,
    status: "High Opportunity Lead",
    statusColor: "default" as const,
    email: "contact@eliteroofing.net",
    phone: "(555) 987-6543",
  },
  {
    name: "Sparkle Clean Services",
    rating: 3.9,
    reviews: 23,
    category: "Cleaning Service",
    website: "sparkleclean-services.com",
    platform: "WordPress",
    qualityScore: 41,
    status: "Outdated WordPress Site",
    statusColor: "secondary" as const,
    email: "hello@sparkleclean.com",
    phone: "(555) 456-7890",
  },
];

const ResultsPreviewSection = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Search Results Preview
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Every lead includes actionable data
            </h2>
          </div>

          {/* Results preview */}
          <div className="space-y-4">
            {mockResults.map((result, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Business info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{result.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                          {result.name}
                          <WebsitePreviewIcon 
                            website={result.website} 
                            businessName={result.name}
                            size="md"
                          />
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            {result.rating} ({result.reviews})
                          </span>
                          <span>•</span>
                          <span>{result.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Website info */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{result.website}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{result.platform}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10">
                      <Gauge className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-destructive font-medium">Score: {result.qualityScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* Status and contact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-border gap-4">
                  <Badge variant={result.statusColor} className="w-fit">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {result.status}
                  </Badge>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {result.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {result.phone}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lead status legend */}
          <div className="mt-8 p-6 rounded-xl border border-border bg-card/50">
            <p className="text-sm font-semibold text-foreground mb-4">Lead Status Tags:</p>
            <div className="flex flex-wrap gap-3">
              <Badge variant="destructive">Needs Website Upgrade</Badge>
              <Badge variant="secondary">Outdated WordPress Site</Badge>
              <Badge variant="outline">Low Conversion Potential</Badge>
              <Badge variant="default">High Opportunity Lead</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsPreviewSection;
