import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Linkedin, 
  Facebook, 
  Twitter, 
  Instagram,
  ExternalLink,
  Building2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: number;
  name: string;
  website?: string;
  category?: string;
}

interface SocialProfileFinderProps {
  lead?: Lead;
  onClose?: () => void;
  isOpen?: boolean;
}

const SOCIAL_PLATFORMS = [
  { 
    id: 'linkedin',
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'bg-[#0A66C2]',
    searchUrl: (name: string) => `https://www.google.com/search?q=${encodeURIComponent(name)}+site:linkedin.com/company`,
    description: 'Company page on LinkedIn'
  },
  { 
    id: 'facebook',
    name: 'Facebook', 
    icon: Facebook, 
    color: 'bg-[#1877F2]',
    searchUrl: (name: string) => `https://www.google.com/search?q=${encodeURIComponent(name)}+site:facebook.com`,
    description: 'Business page on Facebook'
  },
  { 
    id: 'twitter',
    name: 'X (Twitter)', 
    icon: Twitter, 
    color: 'bg-black',
    searchUrl: (name: string) => `https://www.google.com/search?q=${encodeURIComponent(name)}+site:twitter.com OR site:x.com`,
    description: 'Company profile on X'
  },
  { 
    id: 'instagram',
    name: 'Instagram', 
    icon: Instagram, 
    color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    searchUrl: (name: string) => `https://www.google.com/search?q=${encodeURIComponent(name)}+site:instagram.com`,
    description: 'Business profile on Instagram'
  },
];

const ENRICHMENT_SERVICES = [
  {
    name: 'Apollo.io',
    description: 'B2B contact & company database with verified emails',
    url: 'https://www.apollo.io',
    features: ['Email verification', 'Phone numbers', 'Company data'],
    pricing: 'Free tier available'
  },
  {
    name: 'Clearbit',
    description: 'Real-time data enrichment for companies and contacts',
    url: 'https://clearbit.com',
    features: ['Company enrichment', 'Contact finding', 'Tech stack detection'],
    pricing: 'Paid plans'
  },
  {
    name: 'Hunter.io',
    description: 'Find and verify professional email addresses',
    url: 'https://hunter.io',
    features: ['Email finder', 'Email verification', 'Domain search'],
    pricing: 'Free tier available'
  },
  {
    name: 'ZoomInfo',
    description: 'Enterprise B2B intelligence platform',
    url: 'https://www.zoominfo.com',
    features: ['Contact database', 'Intent data', 'Org charts'],
    pricing: 'Enterprise pricing'
  },
];

export default function SocialProfileFinder({ lead, onClose, isOpen = false }: SocialProfileFinderProps) {
  const [searchName, setSearchName] = useState(lead?.name || "");
  const [activeTab, setActiveTab] = useState("search");

  const handleSearch = (platform: typeof SOCIAL_PLATFORMS[0]) => {
    if (!searchName.trim()) {
      toast.error("Please enter a business name to search");
      return;
    }
    window.open(platform.searchUrl(searchName), '_blank');
    toast.success(`Searching ${platform.name} for "${searchName}"`);
  };

  const handleSearchAll = () => {
    if (!searchName.trim()) {
      toast.error("Please enter a business name to search");
      return;
    }
    SOCIAL_PLATFORMS.forEach((platform, index) => {
      setTimeout(() => {
        window.open(platform.searchUrl(searchName), '_blank');
      }, index * 500); // Stagger opens to avoid popup blocking
    });
    toast.success("Opening searches for all platforms");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5 text-primary" />
            Social Profile Finder
          </DialogTitle>
          <DialogDescription>
            Find business social media profiles using Google search (100% legal)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Find Profiles
            </TabsTrigger>
            <TabsTrigger value="enrich" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Data Providers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Joe's Auto Repair Houston"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearchAll} disabled={!searchName.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  Search All
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Include city/location for more accurate results
              </p>
            </div>

            {/* Platform Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <Card 
                  key={platform.id}
                  className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => handleSearch(platform)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                      <platform.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Legal Notice */}
            <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-600">100% Legal Method</p>
                <p className="text-muted-foreground">
                  This uses Google search to find publicly available business pages. 
                  No scraping, no ToS violations.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="enrich" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              For deeper data enrichment (emails, phone numbers, company info), 
              consider these professional data providers:
            </p>

            <div className="space-y-3">
              {ENRICHMENT_SERVICES.map((service) => (
                <Card key={service.name} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {service.pricing}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {service.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {service.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(service.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Integration Coming Soon */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">API Integration Coming Soon</p>
                <p className="text-muted-foreground">
                  We are working on direct integrations with these providers for 
                  one-click enrichment inside BamLead.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Standalone button component for use in lead lists
export function SocialFinderButton({ lead, variant = "outline" }: { lead: Lead; variant?: "outline" | "ghost" | "default" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant} 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Users className="w-3 h-3" />
        Social
      </Button>
      <SocialProfileFinder 
        lead={lead} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
