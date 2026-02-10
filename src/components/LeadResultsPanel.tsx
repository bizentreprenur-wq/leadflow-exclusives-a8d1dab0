import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, Users, CheckCircle2, XCircle, Globe, Phone, MapPin,
  Star, TrendingUp, Download, Filter, ArrowRight, Sparkles,
  Brain, Target, BarChart3, Mail, Building2, Zap, Clock,
  ChevronLeft, ChevronRight, FileSpreadsheet, AlertTriangle,
  Loader2, Eye, MousePointer, Flame, Snowflake, Smartphone
} from 'lucide-react';
import { LeadGroup, LeadSummary, EmailStrategy, LeadAnalysis } from '@/lib/api/leadAnalysis';
import LeadClassificationPanel from '@/components/LeadClassificationPanel';
import { LeadResultsPanelSkeleton, LeadRowSkeleton } from '@/components/ui/loading-skeletons';
import WebsitePreviewIcon from './WebsitePreviewIcon';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
}

interface LeadResultsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  results: SearchResult[];
  isAnalyzing: boolean;
  aiGroups: Record<string, LeadGroup> | null;
  aiSummary: LeadSummary | null;
  aiStrategies: Record<string, EmailStrategy> | null;
  onSelectLeads: (leads: SearchResult[]) => void;
  onProceedToVerify: (leads: SearchResult[]) => void;
}

const ITEMS_PER_PAGE = 50;

export default function LeadResultsPanel({
  isOpen,
  onClose,
  results,
  isAnalyzing,
  aiGroups,
  aiSummary,
  aiStrategies,
  onSelectLeads,
  onProceedToVerify,
}: LeadResultsPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'ai-grouped' | 'no-website' | 'classified'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'issues'>('rating');
  const [filterHasWebsite, setFilterHasWebsite] = useState<'all' | 'yes' | 'no'>('all');
  const [filterNotMobile, setFilterNotMobile] = useState(false);
  const [filterOutdated, setFilterOutdated] = useState(false);
  const [showClassification, setShowClassification] = useState(false);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIds(new Set());
    setCurrentPage(1);
  }, [results]);

  // Computed filtered and sorted results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.phone?.includes(q)
      );
    }

    // Website filter
    if (filterHasWebsite === 'yes') {
      filtered = filtered.filter(r => r.website && r.websiteAnalysis?.hasWebsite !== false);
    } else if (filterHasWebsite === 'no') {
      filtered = filtered.filter(r => !r.website || r.websiteAnalysis?.hasWebsite === false);
    }

    // Not mobile compliant filter
    if (filterNotMobile) {
      filtered = filtered.filter(r => 
        r.websiteAnalysis?.mobileScore !== null && 
        (r.websiteAnalysis?.mobileScore || 0) < 50
      );
    }

    // Outdated website standards filter
    if (filterOutdated) {
      filtered = filtered.filter(r => 
        r.websiteAnalysis?.needsUpgrade === true ||
        r.websiteAnalysis?.issues?.some((issue: string) => 
          issue.toLowerCase().includes('outdated') ||
          issue.toLowerCase().includes('old') ||
          issue.toLowerCase().includes('slow') ||
          issue.toLowerCase().includes('ssl') ||
          issue.toLowerCase().includes('security')
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'issues') {
        const aIssues = a.websiteAnalysis?.issues?.length || 0;
        const bIssues = b.websiteAnalysis?.issues?.length || 0;
        return bIssues - aIssues;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [results, searchQuery, filterHasWebsite, filterNotMobile, filterOutdated, sortBy]);

  // Leads without websites (high-value for web designers)
  const noWebsiteLeads = useMemo(() => 
    results.filter(r => !r.website || r.websiteAnalysis?.hasWebsite === false),
    [results]
  );

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map(r => r.id)));
    }
  };

  const selectTopLeads = (count: number) => {
    const topIds = filteredResults.slice(0, count).map(r => r.id);
    setSelectedIds(new Set(topIds));
    toast.success(`Selected top ${count} leads`);
  };

  const handleProceed = () => {
    const selected = results.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    onProceedToVerify(selected);
  };

  const handleExportCSV = () => {
    const selected = selectedIds.size > 0 
      ? results.filter(r => selectedIds.has(r.id))
      : results;
    
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Has Website', 'Platform', 'Issues'];
    const rows = selected.map(r => [
      `"${r.name || ''}"`,
      `"${r.address || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.website || ''}"`,
      r.rating || '',
      r.websiteAnalysis?.hasWebsite ? 'Yes' : 'No',
      `"${r.websiteAnalysis?.platform || ''}"`,
      `"${r.websiteAnalysis?.issues?.join('; ') || ''}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} leads`);
  };

  // Stats
  const stats = useMemo(() => ({
    total: results.length,
    withWebsite: results.filter(r => r.website && r.websiteAnalysis?.hasWebsite !== false).length,
    withoutWebsite: noWebsiteLeads.length,
    withPhone: results.filter(r => r.phone).length,
    avgRating: results.reduce((sum, r) => sum + (r.rating || 0), 0) / results.filter(r => r.rating).length || 0,
    needsUpgrade: results.filter(r => r.websiteAnalysis?.needsUpgrade).length,
    notMobileCompliant: results.filter(r => 
      r.websiteAnalysis?.mobileScore !== null && 
      (r.websiteAnalysis?.mobileScore || 0) < 50
    ).length,
    outdatedStandards: results.filter(r => 
      r.websiteAnalysis?.needsUpgrade === true ||
      r.websiteAnalysis?.issues?.some((issue: string) => 
        issue.toLowerCase().includes('outdated') ||
        issue.toLowerCase().includes('old') ||
        issue.toLowerCase().includes('slow') ||
        issue.toLowerCase().includes('ssl') ||
        issue.toLowerCase().includes('security')
      )
    ).length,
  }), [results, noWebsiteLeads]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="p-6 border-b bg-gradient-to-r from-primary/10 to-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl flex items-center gap-2">
                  {results.length.toLocaleString()} Leads Found
                  {isAnalyzing && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      AI Analyzing...
                    </Badge>
                  )}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {stats.withWebsite} with website
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <XCircle className="w-3 h-3" />
                    {stats.withoutWebsite} without website
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {stats.avgRating.toFixed(1)} avg rating
                  </span>
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Stats Cards */}
        <div className="p-4 border-b bg-muted/30">
          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={() => {
                setFilterHasWebsite('all');
                setActiveTab('all');
                setShowClassification(false);
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                filterHasWebsite === 'all' && !showClassification ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">All Leads</p>
            </button>
            <button
              onClick={() => {
                setShowClassification(true);
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                showClassification ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'
              }`}
            >
              <div className="flex justify-center gap-1 text-xl font-bold">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground">Hot/Warm/Cold</p>
            </button>
            <button
              onClick={() => {
                setFilterHasWebsite('no');
                setActiveTab('no-website');
                setShowClassification(false);
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                filterHasWebsite === 'no' && !showClassification ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'
              }`}
            >
              <p className="text-xl font-bold text-emerald-600">{stats.withoutWebsite}</p>
              <p className="text-xs text-muted-foreground">No Website 🔥</p>
            </button>
            <button
              onClick={() => {
                setFilterHasWebsite('yes');
                setShowClassification(false);
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                filterHasWebsite === 'yes' && !showClassification ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50'
              }`}
            >
              <p className="text-xl font-bold text-amber-600">{stats.needsUpgrade}</p>
              <p className="text-xs text-muted-foreground">Needs Upgrade</p>
            </button>
            <button
              onClick={() => {
                setActiveTab('ai-grouped');
                setFilterHasWebsite('all');
                setShowClassification(false);
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                activeTab === 'ai-grouped' && !showClassification ? 'border-violet-500 bg-violet-500/10' : 'border-border hover:border-violet-500/50'
              }`}
            >
              <p className="text-xl font-bold text-violet-600">
                {aiGroups ? Object.keys(aiGroups).length : '—'}
              </p>
              <p className="text-xs text-muted-foreground">AI Groups</p>
            </button>
          </div>
        </div>

        {/* Classification View */}
        {showClassification ? (
          <div className="flex-1 overflow-auto p-4">
            <LeadClassificationPanel
              leads={results}
              onProceedToCall={(leads) => {
                toast.success(`${leads.length} leads ready for calling - phone numbers copied!`);
                const phones = leads.filter(l => l.phone).map(l => l.phone).join('\n');
                navigator.clipboard.writeText(phones);
              }}
              onProceedToEmail={(leads) => {
                onProceedToVerify(leads);
              }}
              onExportToCRM={(leads) => {
                // Export as CSV for CRM import
                const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating'];
                const rows = leads.map(l => [
                  `"${l.name || ''}"`,
                  `"${l.address || ''}"`,
                  `"${l.phone || ''}"`,
                  `"${l.website || ''}"`,
                  l.rating || '',
                ].join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `crm-import-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              onClose={() => setShowClassification(false)}
            />
          </div>
        ) : (
          <>
        {/* AI Recommendations */}
        {aiSummary && !isAnalyzing && (
          <div className="p-4 border-b">
            <Card className="border-2 border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-violet-600 mb-1">AI Recommendation</h4>
                    <p className="text-sm">{aiSummary.recommendation}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-emerald-600 font-medium">
                        🔥 {aiSummary.highPriority} high priority
                      </span>
                      <span className="text-amber-600">
                        ⚡ {aiSummary.mediumPriority} medium
                      </span>
                      <span className="text-muted-foreground">
                        {aiSummary.lowPriority} nurture
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => selectTopLeads(aiSummary.highPriority)}
                  >
                    Select High Priority
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters & Search */}
        <div className="p-4 border-b space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rating</SelectItem>
                <SelectItem value="issues">Most Issues</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
          <div className="px-4 border-b">
            <TabsList className="bg-transparent">
              <TabsTrigger value="all" className="gap-2">
                <Users className="w-4 h-4" />
                All ({filteredResults.length})
              </TabsTrigger>
              <TabsTrigger value="no-website" className="gap-2">
                <XCircle className="w-4 h-4" />
                No Website ({stats.withoutWebsite})
              </TabsTrigger>
              {aiGroups && (
                <TabsTrigger value="ai-grouped" className="gap-2">
                  <Brain className="w-4 h-4" />
                  AI Grouped
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Selection Summary */}
          <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filteredResults.length && filteredResults.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-sm">
                {selectedIds.size > 0 
                  ? `${selectedIds.size} selected`
                  : 'Select all'
                }
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => selectTopLeads(50)}>
                Top 50
              </Button>
              <Button variant="ghost" size="sm" onClick={() => selectTopLeads(100)}>
                Top 100
              </Button>
              <Button variant="ghost" size="sm" onClick={() => selectTopLeads(250)}>
                Top 250
              </Button>
            </div>
          </div>

          {/* Lead List */}
          <ScrollArea className="flex-1">
            <TabsContent value="all" className="m-0 p-4">
              <div className="space-y-2">
                {paginatedResults.map((lead, idx) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    isSelected={selectedIds.has(lead.id)}
                    onToggle={() => toggleSelect(lead.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="no-website" className="m-0 p-4">
              <Card className="border-emerald-500/30 bg-emerald-500/5 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-600">High-Value Prospects</p>
                      <p className="text-sm text-muted-foreground">
                        These {stats.withoutWebsite} businesses have no website - perfect for web design outreach!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {noWebsiteLeads.slice(0, 100).map((lead, idx) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={idx + 1}
                    isSelected={selectedIds.has(lead.id)}
                    onToggle={() => toggleSelect(lead.id)}
                    highlight="no-website"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai-grouped" className="m-0 p-4">
              {aiGroups ? (
                <div className="space-y-4">
                  {Object.entries(aiGroups).map(([key, group]) => (
                    <Card key={key} className="border-2">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              group.urgency === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                              group.urgency === 'high' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              group.urgency === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                              'bg-slate-500/10 text-slate-600 border-slate-500/20'
                            }>
                              {group.urgency.toUpperCase()}
                            </Badge>
                            <CardTitle className="text-base">{group.label}</CardTitle>
                            <span className="text-sm text-muted-foreground">({group.leads.length})</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const ids = new Set(group.leads.map(l => l.id));
                              setSelectedIds(ids);
                              toast.success(`Selected ${group.leads.length} leads`);
                            }}
                          >
                            Select Group
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        <p className="text-xs text-primary mt-1">📧 {group.emailAngle}</p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">AI is analyzing leads...</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>

          {/* Pagination */}
          {activeTab === 'all' && totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredResults.length} leads)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </Tabs>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-muted/30">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={handleProceed}
              disabled={selectedIds.size === 0}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-emerald-600"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify {selectedIds.size} Leads with AI
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Lead Card Component
function LeadCard({ 
  lead, 
  index, 
  isSelected, 
  onToggle,
  highlight 
}: { 
  lead: SearchResult; 
  index: number; 
  isSelected: boolean; 
  onToggle: () => void;
  highlight?: 'no-website';
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
          : highlight === 'no-website'
            ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500'
            : 'border-border hover:border-primary/50'
      }`}
    >
      <Checkbox checked={isSelected} className="shrink-0" />
      
      <div className="w-8 text-center shrink-0">
        <span className="text-xs text-muted-foreground">#{index}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium truncate">{lead.name}</h4>
          {/* Website Preview Icon */}
          <WebsitePreviewIcon 
            website={lead.website} 
            businessName={lead.name}
            size="sm"
          />
          {lead.rating && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {lead.rating}
            </Badge>
          )}
          {!lead.website && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
              No Website 🔥
            </Badge>
          )}
          {lead.websiteAnalysis?.needsUpgrade && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
              Needs Upgrade
            </Badge>
          )}
          {lead.websiteAnalysis?.platform && (
            <Badge variant="outline" className="shrink-0">
              {lead.websiteAnalysis.platform}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          {lead.address && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {lead.address}
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1 shrink-0">
              <Phone className="w-3 h-3" />
              {lead.phone}
            </span>
          )}
        </div>

        {lead.websiteAnalysis?.issues && lead.websiteAnalysis.issues.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-600 truncate">
              {lead.websiteAnalysis.issues.slice(0, 2).join(', ')}
            </span>
          </div>
        )}
      </div>

      {isSelected && (
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
      )}
    </div>
  );
}
