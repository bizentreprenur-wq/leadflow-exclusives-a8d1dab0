import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Search,
  Building2,
  Globe,
  Loader2,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  TrendingUp,
  Megaphone,
  Settings,
  Rocket,
  Users,
  Heart,
  Code,
  DollarSign,
  ShoppingBag,
  Factory,
  Building,
  Briefcase,
  GraduationCap,
  Castle,
  Filter,
  X,
} from 'lucide-react';
import {
  ROLE_FILTERS,
  INDUSTRY_FILTERS,
  COMPANY_TYPE_FILTERS,
  type RoleFilter,
  type IndustryFilter,
  type CompanyTypeFilter,
} from '@/lib/industryFilters';
import LeadActionModal from './LeadActionModal';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  industry?: string;
  companyType?: string;
  source: 'gmb' | 'google' | 'bing';
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    TrendingUp: <TrendingUp className="w-4 h-4" />,
    Megaphone: <Megaphone className="w-4 h-4" />,
    Settings: <Settings className="w-4 h-4" />,
    Rocket: <Rocket className="w-4 h-4" />,
    Users: <Users className="w-4 h-4" />,
    Heart: <Heart className="w-4 h-4" />,
    Code: <Code className="w-4 h-4" />,
    DollarSign: <DollarSign className="w-4 h-4" />,
    ShoppingBag: <ShoppingBag className="w-4 h-4" />,
    Factory: <Factory className="w-4 h-4" />,
    Building: <Building className="w-4 h-4" />,
    Building2: <Building2 className="w-4 h-4" />,
    Briefcase: <Briefcase className="w-4 h-4" />,
    GraduationCap: <GraduationCap className="w-4 h-4" />,
    Castle: <Castle className="w-4 h-4" />,
  };
  return icons[iconName] || <Building2 className="w-4 h-4" />;
};

export default function UnifiedSearchModule() {
  const [activeSource, setActiveSource] = useState<'gmb' | 'google' | 'bing'>('gmb');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCompanyType, setSelectedCompanyType] = useState<string | null>(null);
  
  // Lead action modal state
  const [showLeadActionModal, setShowLeadActionModal] = useState(false);

  const activeFiltersCount = [selectedRole, selectedIndustry, selectedCompanyType].filter(Boolean).length;

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    // Simulate search - in production this would call the actual APIs
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get industry context for mock data
    const industryFilter = INDUSTRY_FILTERS.find(i => i.id === selectedIndustry);
    
    // Mock results with industry/company type data
    const mockResults: SearchResult[] = [
      {
        id: '1',
        name: 'Sunrise Plumbing Co',
        address: '123 Main St, Austin, TX 78701',
        phone: '(555) 123-4567',
        website: 'https://sunriseplumbing.com',
        email: 'contact@sunriseplumbing.com',
        rating: 4.8,
        industry: industryFilter?.name || 'Professional Services',
        companyType: selectedCompanyType || 'mid-market',
        source: activeSource,
      },
      {
        id: '2',
        name: 'Elite Roofing Services',
        address: '456 Oak Ave, Austin, TX 78702',
        phone: '(555) 234-5678',
        website: 'https://eliteroofing.net',
        email: 'info@eliteroofing.net',
        rating: 4.5,
        industry: industryFilter?.name || 'Professional Services',
        companyType: selectedCompanyType || 'startup',
        source: activeSource,
      },
      {
        id: '3',
        name: 'Green Garden Landscaping',
        address: '789 Pine Rd, Austin, TX 78703',
        phone: '(555) 345-6789',
        website: 'https://greengardenlandscape.com',
        email: 'hello@greengardenlandscape.com',
        rating: 4.9,
        industry: industryFilter?.name || 'Retail & Goods',
        companyType: selectedCompanyType || 'startup',
        source: activeSource,
      },
      {
        id: '4',
        name: 'Quick Fix HVAC',
        address: '321 Elm St, Austin, TX 78704',
        phone: '(555) 456-7890',
        website: 'https://quickfixhvac.com',
        rating: 4.2,
        industry: industryFilter?.name || 'Professional Services',
        companyType: selectedCompanyType || 'mid-market',
        source: activeSource,
      },
      {
        id: '5',
        name: 'Premier Electrical Solutions',
        address: '654 Cedar Blvd, Austin, TX 78705',
        phone: '(555) 567-8901',
        website: 'https://premierelectrical.com',
        email: 'service@premierelectrical.com',
        rating: 4.7,
        industry: industryFilter?.name || 'Technology Services',
        companyType: selectedCompanyType || 'enterprise',
        source: activeSource,
      },
    ];

    setResults(mockResults);
    setIsSearching(false);
    toast.success(`Found ${mockResults.length} results from ${activeSource.toUpperCase()}`);
    
    // Show lead action modal after search completes
    if (mockResults.length > 0) {
      setShowLeadActionModal(true);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedResults((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSaveToVerification = () => {
    if (selectedResults.length === 0) {
      toast.error('Please select results to save');
      return;
    }
    toast.success(`${selectedResults.length} leads saved for verification`);
    setSelectedResults([]);
  };

  const handleVerifyWithAI = () => {
    // Store leads in sessionStorage for verification module
    sessionStorage.setItem('leadsToVerify', JSON.stringify(results));
    toast.success('Leads ready for AI verification! Go to "AI Lead Verification" tab.');
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    
    const headers = ['Name', 'Address', 'Phone', 'Email', 'Website', 'Rating', 'Industry', 'Source'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => [
        `"${r.name || ''}"`,
        `"${r.address || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.email || ''}"`,
        `"${r.website || ''}"`,
        r.rating || '',
        `"${r.industry || ''}"`,
        r.source || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully!');
  };

  const handleSendToGoogleDrive = () => {
    // Store leads for Google Sheets view
    sessionStorage.setItem('googleSheetsLeads', JSON.stringify(results));
    toast.info('Google Drive integration coming soon! For now, download as CSV.');
  };

  const clearFilters = () => {
    setSelectedRole(null);
    setSelectedIndustry(null);
    setSelectedCompanyType(null);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gmb':
        return <Building2 className="w-4 h-4" />;
      case 'google':
        return <Search className="w-4 h-4" />;
      case 'bing':
        return <Globe className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'gmb':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'google':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'bing':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Source Tabs */}
      <Tabs value={activeSource} onValueChange={(v) => setActiveSource(v as any)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="gmb" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">GMB</span>
            </TabsTrigger>
            <TabsTrigger value="google" className="gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Google</span>
            </TabsTrigger>
            <TabsTrigger value="bing" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Bing</span>
            </TabsTrigger>
          </TabsList>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mt-4 border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Filter Leads</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                    <X className="w-3 h-3" />
                    Clear all
                  </Button>
                )}
              </div>

              {/* By Role */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  By Role
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_FILTERS.map((role) => (
                    <Button
                      key={role.id}
                      variant={selectedRole === role.id ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5 h-8"
                      onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                    >
                      {getIconComponent(role.icon)}
                      {role.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* By Industry */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  By Industry
                </Label>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {INDUSTRY_FILTERS.map((industry) => (
                      <Button
                        key={industry.id}
                        variant={selectedIndustry === industry.id ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5 h-8 shrink-0"
                        onClick={() => setSelectedIndustry(selectedIndustry === industry.id ? null : industry.id)}
                      >
                        {getIconComponent(industry.icon)}
                        {industry.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* By Company Type */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  By Company Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_TYPE_FILTERS.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedCompanyType === type.id ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5 h-8"
                      onClick={() => setSelectedCompanyType(selectedCompanyType === type.id ? null : type.id)}
                    >
                      {getIconComponent(type.icon)}
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value={activeSource} className="mt-6">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="query">Business Type / Keywords</Label>
              <Input
                id="query"
                placeholder={
                  activeSource === 'gmb'
                    ? 'e.g., plumbers, restaurants, dentists...'
                    : 'e.g., web design agency, marketing company...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Austin, TX"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="mt-4 w-full sm:w-auto"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching {activeSource.toUpperCase()}...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search {activeSource.toUpperCase()}
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedRole && (
            <Badge variant="secondary" className="gap-1">
              {ROLE_FILTERS.find(r => r.id === selectedRole)?.name}
              <button onClick={() => setSelectedRole(null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedIndustry && (
            <Badge variant="secondary" className="gap-1">
              {INDUSTRY_FILTERS.find(i => i.id === selectedIndustry)?.name}
              <button onClick={() => setSelectedIndustry(null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedCompanyType && (
            <Badge variant="secondary" className="gap-1">
              {COMPANY_TYPE_FILTERS.find(c => c.id === selectedCompanyType)?.name}
              <button onClick={() => setSelectedCompanyType(null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">
                {results.length} Results Found
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedResults.length} selected
              </p>
            </div>
            <Button
              onClick={handleSaveToVerification}
              disabled={selectedResults.length === 0}
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save to Verify ({selectedResults.length})
            </Button>
          </div>

          <div className="grid gap-3">
            {results.map((result) => (
              <Card
                key={result.id}
                className={`cursor-pointer transition-all hover:shadow-card ${
                  selectedResults.includes(result.id)
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50'
                }`}
                onClick={() => toggleSelect(result.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-foreground truncate">
                          {result.name}
                        </h4>
                        <Badge className={getSourceColor(result.source)}>
                          {getSourceIcon(result.source)}
                          <span className="ml-1 uppercase text-[10px]">{result.source}</span>
                        </Badge>
                        {result.rating && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {result.rating}
                          </Badge>
                        )}
                        {result.industry && (
                          <Badge variant="outline" className="text-[10px]">
                            {result.industry}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {result.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{result.address}</span>
                          </span>
                        )}
                        {result.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            {result.phone}
                          </span>
                        )}
                        {result.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {result.email}
                          </span>
                        )}
                        {result.website && (
                          <a
                            href={result.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        selectedResults.includes(result.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {selectedResults.includes(result.id) && (
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !isSearching && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter a search query to find leads</p>
          <p className="text-sm mt-1">Use filters to narrow down by role, industry, or company type</p>
        </div>
      )}

      {/* Lead Action Modal */}
      <LeadActionModal
        open={showLeadActionModal}
        onOpenChange={setShowLeadActionModal}
        leadCount={results.length}
        onVerifyWithAI={handleVerifyWithAI}
        onDownload={handleDownloadCSV}
        onSendToGoogleDrive={handleSendToGoogleDrive}
      />
    </div>
  );
}
