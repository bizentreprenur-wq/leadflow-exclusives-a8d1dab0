import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'google' | 'bing';
}

export default function UnifiedSearchModule() {
  const [activeSource, setActiveSource] = useState<'gmb' | 'google' | 'bing'>('gmb');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    // Simulate search - in production this would call the actual APIs
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        name: 'Sunrise Plumbing Co',
        address: '123 Main St, Austin, TX 78701',
        phone: '(555) 123-4567',
        website: 'https://sunriseplumbing.com',
        email: 'contact@sunriseplumbing.com',
        rating: 4.8,
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
        source: activeSource,
      },
      {
        id: '4',
        name: 'Quick Fix HVAC',
        address: '321 Elm St, Austin, TX 78704',
        phone: '(555) 456-7890',
        website: 'https://quickfixhvac.com',
        rating: 4.2,
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
        source: activeSource,
      },
    ];

    setResults(mockResults);
    setIsSearching(false);
    toast.success(`Found ${mockResults.length} results from ${activeSource.toUpperCase()}`);
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
        <TabsList className="grid w-full grid-cols-3 max-w-md">
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
                      <div className="flex items-center gap-2 mb-1">
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
        </div>
      )}
    </div>
  );
}
