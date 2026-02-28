import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, Download, Printer, X, BarChart3, PieChart, TrendingUp,
  Users, Globe, Phone, MapPin, Star, AlertTriangle, CheckCircle2,
  Flame, Snowflake, Brain, Target, Zap, Building2, Mail, Clock,
  ChevronLeft, ChevronRight, Search, Filter, ArrowRight, Sparkles,
  FileSpreadsheet, Share2, Copy
} from 'lucide-react';
import { LeadGroup, LeadSummary, EmailStrategy, LeadAnalysis } from '@/lib/api/leadAnalysis';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  contactName?: string;
  contact_name?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  enrichment?: {
    emails?: string[];
    phones?: string[];
    contactName?: string;
    [key: string]: any;
  };
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
}

interface LeadReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
  searchQuery: string;
  location: string;
  aiGroups: Record<string, LeadGroup> | null;
  aiSummary: LeadSummary | null;
  onProceedToVerify: (leads: SearchResult[]) => void;
}

type Classification = 'hot' | 'warm' | 'cold';

function classifyLead(lead: SearchResult): { classification: Classification; score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    score += 40;
    reasons.push('No website');
  }
  if (lead.websiteAnalysis?.needsUpgrade) {
    score += 30;
    reasons.push('Needs upgrade');
  }
  const issueCount = lead.websiteAnalysis?.issues?.length || 0;
  if (issueCount >= 3) {
    score += 25;
    reasons.push(`${issueCount} issues`);
  } else if (issueCount > 0) {
    score += 10;
  }
  const mobileScore = lead.websiteAnalysis?.mobileScore;
  if (mobileScore !== null && mobileScore !== undefined && mobileScore < 50) {
    score += 20;
    reasons.push('Poor mobile');
  }
  if (lead.phone || lead.enrichment?.phones?.length) score += 5;
  if (lead.rating && lead.rating >= 4.5) score += 10;

  const legacyPlatforms = ['joomla', 'drupal', 'weebly', 'godaddy'];
  if (lead.websiteAnalysis?.platform && legacyPlatforms.some(p => 
    lead.websiteAnalysis!.platform!.toLowerCase().includes(p)
  )) {
    score += 20;
    reasons.push('Legacy platform');
  }

  let classification: Classification;
  if (score >= 80) classification = 'hot';
  else if (score >= 55) classification = 'warm';
  else classification = 'cold';

  return { classification, score, reasons };
}

export default function LeadReportModal({
  open,
  onOpenChange,
  leads,
  searchQuery,
  location,
  aiGroups,
  aiSummary,
  onProceedToVerify,
}: LeadReportModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'insights'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const reportRef = useRef<HTMLDivElement>(null);

  const LEADS_PER_PAGE = 25;

  // Classify all leads
  const classifiedLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      ...classifyLead(lead)
    }));
  }, [leads]);

  const hotLeads = classifiedLeads.filter(l => l.classification === 'hot');
  const warmLeads = classifiedLeads.filter(l => l.classification === 'warm');
  const coldLeads = classifiedLeads.filter(l => l.classification === 'cold');
  const noWebsiteLeads = leads.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false);
  const needsUpgradeLeads = leads.filter(l => l.websiteAnalysis?.needsUpgrade);
  const leadsWithEmail = leads.filter(l => l.email || l.enrichment?.emails?.length);

  // Helper to get email for a lead
  const getLeadEmail = (lead: SearchResult): string => {
    return lead.email || lead.enrichment?.emails?.[0] || '';
  };

  // Helper to get phone for a lead (check enrichment too)
  const getLeadPhone = (lead: SearchResult): string => {
    return lead.phone || lead.enrichment?.phones?.[0] || '';
  };

  // Helper to get contact/owner name for a lead
  const getLeadContact = (lead: SearchResult): string => {
    return lead.contactName || lead.contact_name || lead.enrichment?.contactName || '';
  };

  // Platform distribution
  const platformStats = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
      const platform = l.websiteAnalysis?.platform || (l.website ? 'Unknown' : 'No Website');
      stats[platform] = (stats[platform] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Rating distribution
  const ratingStats = useMemo(() => {
    const stats = { excellent: 0, good: 0, average: 0, poor: 0, none: 0 };
    leads.forEach(l => {
      if (!l.rating) stats.none++;
      else if (l.rating >= 4.5) stats.excellent++;
      else if (l.rating >= 4.0) stats.good++;
      else if (l.rating >= 3.0) stats.average++;
      else stats.poor++;
    });
    return stats;
  }, [leads]);

  // Issue breakdown
  const issueStats = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
      l.websiteAnalysis?.issues?.forEach(issue => {
        stats[issue] = (stats[issue] || 0) + 1;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [leads]);

  // Filtered leads for list view
  const filteredLeads = useMemo(() => {
    if (!searchFilter) return classifiedLeads;
    const q = searchFilter.toLowerCase();
    return classifiedLeads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.address?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      getLeadEmail(l)?.toLowerCase().includes(q) ||
      getLeadContact(l)?.toLowerCase().includes(q)
    );
  }, [classifiedLeads, searchFilter]);

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleProceed = () => {
    const selected = selectedIds.size > 0
      ? leads.filter(l => selectedIds.has(l.id))
      : hotLeads.length > 0 ? hotLeads : leads.slice(0, 50);
    onProceedToVerify(selected);
    onOpenChange(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('BamLead Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${searchQuery} in ${location}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

    // Summary stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, 48);
    
    doc.setFontSize(10);
    doc.text(`Total Leads: ${leads.length}`, 14, 56);
    doc.text(`Hot Leads: ${hotLeads.length}`, 14, 62);
    doc.text(`Warm Leads: ${warmLeads.length}`, 14, 68);
    doc.text(`Cold Leads: ${coldLeads.length}`, 14, 74);
    doc.text(`No Website: ${noWebsiteLeads.length}`, 14, 80);
    doc.text(`Needs Upgrade: ${needsUpgradeLeads.length}`, 14, 86);

    // Leads table
    const tableData = leads.slice(0, 100).map(l => [
      l.name?.substring(0, 25) || '',
      getLeadContact(l) || 'N/A',
      getLeadEmail(l) || 'N/A',
      l.phone || 'N/A',
      l.website ? 'Yes' : 'No',
      l.rating?.toString() || 'N/A',
      classifyLead(l).classification.toUpperCase()
    ]);

    autoTable(doc, {
      head: [['Business Name', 'Contact', 'Email', 'Phone', 'Website', 'Rating', 'Priority']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const nicheSlug = searchQuery.trim().replace(/\s+/g, '-') || 'Leads';
    doc.save(`Bamlead-${nicheSlug}-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report downloaded!');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Contact', 'Email', 'Address', 'Phone', 'Website', 'Rating', 'Platform', 'Priority', 'Score', 'Issues'];
    const rows = classifiedLeads.map(l => [
      `"${l.name || ''}"`,
      `"${getLeadContact(l)}"`,
      `"${getLeadEmail(l)}"`,
      `"${l.address || ''}"`,
      `"${getLeadPhone(l)}"`,
      `"${l.website || ''}"`,
      l.rating || '',
      `"${l.websiteAnalysis?.platform || ''}"`,
      l.classification.toUpperCase(),
      l.score,
      `"${l.reasons.join('; ')}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bamlead-full-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads to CSV!`);
  };

  const copyAllPhones = () => {
    const phones = leads.map(l => getLeadPhone(l)).filter(p => p);
    navigator.clipboard.writeText(phones.join('\n'));
    toast.success(`Copied ${phones.length} phone numbers!`);
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[97vw] w-[1600px] h-[92vh] p-0 overflow-hidden flex flex-col duration-100" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Lead Intelligence Report</DialogTitle>
        </VisuallyHidden>
        {/* PDF-style header */}
        <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Lead Intelligence Report</h1>
                  <p className="text-white/80 text-sm">{reportDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <Badge className="bg-white/20 text-white border-0">
                  <Search className="w-3 h-3 mr-1" />
                  {searchQuery}
                </Badge>
                <Badge className="bg-white/20 text-white border-0">
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                </Badge>
                <Badge className="bg-white/20 text-white border-0">
                  <Users className="w-3 h-3 mr-1" />
                  {leads.length} Leads Found
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={exportToPDF} className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={exportToCSV} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={copyAllPhones} className="gap-2">
                <Copy className="w-4 h-4" />
                Phones
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20 transition-none">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="border-b bg-muted/30">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full justify-start h-12 bg-transparent px-6 gap-2">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
                <BarChart3 className="w-4 h-4" />
                Executive Summary
              </TabsTrigger>
              <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-background">
                <Users className="w-4 h-4" />
                All Leads ({leads.length})
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2 data-[state=active]:bg-background">
                <Brain className="w-4 h-4" />
                AI Insights
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content area */}
        <ScrollArea className="flex-1" ref={reportRef}>
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key metrics cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Card className="border-2 border-red-500/30 bg-red-500/5">
                    <CardContent className="p-4 text-center">
                      <Flame className="w-8 h-8 mx-auto text-red-500 mb-2" />
                      <div className="text-3xl font-bold text-red-600">{hotLeads.length}</div>
                      <div className="text-sm text-muted-foreground">Hot Leads</div>
                      <div className="text-xs text-red-600 mt-1">{((hotLeads.length / leads.length) * 100).toFixed(0)}%</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                      <div className="text-3xl font-bold text-amber-600">{warmLeads.length}</div>
                      <div className="text-sm text-muted-foreground">Warm Leads</div>
                      <div className="text-xs text-amber-600 mt-1">{((warmLeads.length / leads.length) * 100).toFixed(0)}%</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4 text-center">
                      <Snowflake className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <div className="text-3xl font-bold text-blue-600">{coldLeads.length}</div>
                      <div className="text-sm text-muted-foreground">Cold Leads</div>
                      <div className="text-xs text-blue-600 mt-1">{((coldLeads.length / leads.length) * 100).toFixed(0)}%</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-500/30 bg-purple-500/5">
                    <CardContent className="p-4 text-center">
                      <Globe className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                      <div className="text-3xl font-bold text-purple-600">{noWebsiteLeads.length}</div>
                      <div className="text-sm text-muted-foreground">No Website</div>
                      <div className="text-xs text-purple-600 mt-1">High-value prospects</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-orange-500/30 bg-orange-500/5">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                      <div className="text-3xl font-bold text-orange-600">{needsUpgradeLeads.length}</div>
                      <div className="text-sm text-muted-foreground">Needs Upgrade</div>
                      <div className="text-xs text-orange-600 mt-1">Website issues</div>
                    </CardContent>
                  </Card>

                   <Card className="border-2 border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4 text-center">
                      <Mail className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      <div className="text-3xl font-bold text-green-600">{leadsWithEmail.length}</div>
                      <div className="text-sm text-muted-foreground">With Email</div>
                      <div className="text-xs text-green-600 mt-1">Ready to email</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4 text-center">
                      <Phone className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      <div className="text-3xl font-bold text-green-600">{leads.filter(l => getLeadPhone(l)).length}</div>
                      <div className="text-sm text-muted-foreground">With Phone</div>
                      <div className="text-xs text-green-600 mt-1">Ready to call</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Two column layout */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Platform breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PieChart className="w-5 h-5 text-primary" />
                        Platform Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {platformStats.map(([platform, count]) => (
                          <div key={platform} className="flex items-center gap-3">
                            <div className="w-24 text-sm truncate">{platform}</div>
                            <div className="flex-1">
                              <Progress value={(count / leads.length) * 100} className="h-2" />
                            </div>
                            <div className="w-12 text-right text-sm font-medium">{count}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rating breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="w-5 h-5 text-amber-500" />
                        Rating Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: 'Excellent (4.5+)', value: ratingStats.excellent, color: 'bg-green-500' },
                          { label: 'Good (4.0-4.5)', value: ratingStats.good, color: 'bg-blue-500' },
                          { label: 'Average (3.0-4.0)', value: ratingStats.average, color: 'bg-amber-500' },
                          { label: 'Poor (<3.0)', value: ratingStats.poor, color: 'bg-red-500' },
                          { label: 'No Rating', value: ratingStats.none, color: 'bg-gray-400' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className="w-28 text-sm">{item.label}</div>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${item.color}`} 
                                style={{ width: `${(item.value / leads.length) * 100}%` }}
                              />
                            </div>
                            <div className="w-12 text-right text-sm font-medium">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Common issues */}
                {issueStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Most Common Website Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {issueStats.map(([issue, count]) => (
                          <div key={issue} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <span className="text-sm">{issue}</span>
                            <Badge variant="secondary">{count} leads</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Recommendation */}
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Brain className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">AI Recommendation</h3>
                        <p className="text-muted-foreground mb-4">
                          Based on this analysis, you have <strong className="text-red-600">{hotLeads.length} high-priority leads</strong> that 
                          should be contacted immediately. These businesses have the highest conversion potential due to 
                          missing websites, outdated platforms, or multiple technical issues.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                            {noWebsiteLeads.length} need a website
                          </Badge>
                          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                            {needsUpgradeLeads.length} need an upgrade
                          </Badge>
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            {leads.filter(l => getLeadPhone(l)).length} can be called today
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchFilter}
                      onChange={(e) => { setSearchFilter(e.target.value); setCurrentPage(1); }}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {selectedIds.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Badge variant="secondary">
                    {selectedIds.size} selected
                  </Badge>
                </div>

                {/* Leads table */}
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left w-8">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                              onChange={selectAll}
                              className="rounded"
                            />
                          </th>
                          <th className="p-3 text-left">#</th>
                          <th className="p-3 text-left">Business Name</th>
                          <th className="p-3 text-left">Contact</th>
                          <th className="p-3 text-left">Email</th>
                          <th className="p-3 text-left">Phone</th>
                          <th className="p-3 text-left">Website</th>
                          <th className="p-3 text-left">Rating</th>
                          <th className="p-3 text-left">Priority</th>
                          <th className="p-3 text-left">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLeads.map((lead, idx) => (
                          <tr 
                            key={lead.id}
                            className={`border-t hover:bg-muted/30 cursor-pointer ${
                              selectedIds.has(lead.id) ? 'bg-primary/5' : ''
                            } ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}
                            onClick={() => toggleSelect(lead.id)}
                          >
                            <td className="p-3">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.has(lead.id)}
                                onChange={() => toggleSelect(lead.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded"
                              />
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {(currentPage - 1) * LEADS_PER_PAGE + idx + 1}
                            </td>
                            <td className="p-3 font-medium">{lead.name}</td>
                            <td className="p-3 text-xs">{getLeadContact(lead) || '—'}</td>
                            <td className="p-3 text-xs max-w-[160px] truncate" title={getLeadEmail(lead)}>
                              {getLeadEmail(lead) ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {getLeadEmail(lead)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="p-3">{getLeadPhone(lead) || '—'}</td>
                            <td className="p-3">
                              {lead.website ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="text-red-500 text-xs font-medium">NO SITE</span>
                              )}
                            </td>
                            <td className="p-3">
                              {lead.rating ? (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {lead.rating}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="p-3">
                              <Badge className={
                                lead.classification === 'hot' 
                                  ? 'bg-red-500/10 text-red-600 border-red-500/30'
                                  : lead.classification === 'warm'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              }>
                                {lead.classification === 'hot' && <Flame className="w-3 h-3 mr-1" />}
                                {lead.classification.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono text-xs">{lead.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * LEADS_PER_PAGE + 1} - {Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-3">Page {currentPage} of {totalPages}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                {aiGroups && Object.keys(aiGroups).length > 0 ? (
                  <>
                    <div className="text-center py-4">
                      <h2 className="text-2xl font-bold mb-2">AI-Powered Lead Segmentation</h2>
                      <p className="text-muted-foreground">Leads automatically grouped by opportunity type and conversion potential</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(aiGroups).map(([key, group]) => (
                        <Card key={key} className="hover:border-primary/50 transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{group.label}</CardTitle>
                              <Badge>{group.leads?.length || 0}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                            {group.urgency && (
                              <Badge variant="outline" className={
                                group.urgency === 'critical' ? 'border-red-500 text-red-500' :
                                group.urgency === 'high' ? 'border-orange-500 text-orange-500' :
                                'border-blue-500 text-blue-500'
                              }>
                                {group.urgency} urgency
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-semibold mb-2">AI Analysis in Progress</h3>
                      <p className="text-muted-foreground">
                        AI insights will appear here once the analysis is complete.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Conversion tips */}
                <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Pro Tips for This Lead Set
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <Flame className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Hot Lead Strategy</p>
                          <p className="text-xs text-muted-foreground">Call within 24 hours. Lead with their specific pain point (no website/outdated design).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Warm Lead Strategy</p>
                          <p className="text-xs text-muted-foreground">Send personalized email highlighting their website issues. Follow up in 3 days.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Best Contact Times</p>
                          <p className="text-xs text-muted-foreground">Tuesday-Thursday, 10am-12pm or 2pm-4pm local time for highest response rates.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Expected Conversion</p>
                          <p className="text-xs text-muted-foreground">Hot leads: 15-25% conversion. Warm: 5-10%. Start with your hottest 50 leads.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer action bar */}
        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedIds.size > 0 
                ? `${selectedIds.size} leads selected for verification`
                : `${hotLeads.length} hot leads recommended`
              }
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close Report
              </Button>
              <Button onClick={handleProceed} className="gap-2 bg-gradient-to-r from-primary to-blue-600">
                <Zap className="w-4 h-4" />
                Proceed to Verify {selectedIds.size > 0 ? selectedIds.size : hotLeads.length} Leads
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
