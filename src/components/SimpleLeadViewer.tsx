import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import * as XLSX from 'xlsx-js-style';
import {
  ArrowLeft, Download, ChevronDown,
  Globe, Phone, MapPin,
  Flame, Thermometer, Snowflake, 
  Users, Mail, Search, X,
  FileSpreadsheet, Printer, Star,
  Sparkles, Database, Clock, FileText,
  Send, Calendar, ChevronRight
} from 'lucide-react';
import WebsitePreviewIcon from './WebsitePreviewIcon';
import { Skeleton } from '@/components/ui/skeleton';
import StreamingLeadsIndicator from '@/components/StreamingLeadsIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  sources?: string[]; // Platforms that found this lead (Google Maps, Yelp, Bing Places)
  platform?: string;
  // AI Scoring fields
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  successProbability?: number;
  recommendedAction?: 'call' | 'email' | 'both';
  callScore?: number;
  emailScore?: number;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  painPoints?: string[];
  readyToCall?: boolean;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
  };
}

// Source badge helper - shows which platforms found each lead
const getSourceBadges = (sources?: string[]) => {
  if (!sources || sources.length === 0) return null;
  
  const sourceConfig: Record<string, { icon: string; color: string; short: string }> = {
    'Google Maps': { icon: '🗺️', color: 'bg-blue-500/20 text-blue-400', short: 'G' },
    'Yelp': { icon: '⭐', color: 'bg-red-500/20 text-red-400', short: 'Y' },
    'Bing Places': { icon: '🔍', color: 'bg-cyan-500/20 text-cyan-400', short: 'B' },
  };
  
  return (
    <div className="flex items-center gap-0.5 ml-1">
      {sources.map((source) => {
        const config = sourceConfig[source];
        if (!config) return null;
        return (
          <span
            key={source}
            className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${config.color}`}
            title={`Found on ${source}`}
          >
            {config.short}
          </span>
        );
      })}
      {sources.length > 1 && (
        <span className="text-[9px] text-emerald-500 font-medium ml-0.5" title={`Verified on ${sources.length} platforms`}>
          ✓{sources.length}
        </span>
      )}
    </div>
  );
};

interface SimpleLeadViewerProps {
  leads: SearchResult[];
  onBack: () => void;
  onProceedToEmail: (leads: SearchResult[]) => void;
  onProceedToCall: (leads: SearchResult[]) => void;
  onOpenReport?: () => void;
  onOpenCRM?: () => void;
  onOpenSchedule?: () => void;
  onOpenAIScoring?: () => void;
  isLoading?: boolean;
  loadingProgress?: number;
}

export default function SimpleLeadViewer({
  leads,
  onBack,
  onProceedToEmail,
  onProceedToCall,
  onOpenReport,
  onOpenCRM,
  onOpenSchedule,
  onOpenAIScoring,
  isLoading = false,
  loadingProgress = 0,
}: SimpleLeadViewerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'warm' | 'cold' | 'ready' | 'nosite' | 'phoneOnly' | 'withEmail'>('all');
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load selections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bamlead_selected_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedIds(new Set(parsed));
        }
      }
    } catch (e) {
      console.error('Failed to load selections:', e);
    }
  }, []);

  // Save selections to localStorage
  useEffect(() => {
    localStorage.setItem('bamlead_selected_leads', JSON.stringify([...selectedIds]));
  }, [selectedIds]);

  const groupedCounts = useMemo(() => ({
    all: leads.length,
    hot: leads.filter(l => l.aiClassification === 'hot').length,
    warm: leads.filter(l => l.aiClassification === 'warm').length,
    cold: leads.filter(l => l.aiClassification === 'cold').length,
    ready: leads.filter(l => l.readyToCall || l.phone).length,
    nosite: leads.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false).length,
    phoneOnly: leads.filter(l => l.phone && !l.email).length,
    withEmail: leads.filter(l => l.email).length,
  }), [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (activeFilter === 'hot' || activeFilter === 'warm' || activeFilter === 'cold') {
      result = result.filter(l => l.aiClassification === activeFilter);
    } else if (activeFilter === 'ready') {
      result = result.filter(l => l.readyToCall || l.phone);
    } else if (activeFilter === 'nosite') {
      result = result.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false);
    } else if (activeFilter === 'phoneOnly') {
      result = result.filter(l => l.phone && !l.email);
    } else if (activeFilter === 'withEmail') {
      result = result.filter(l => l.email);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [leads, activeFilter, searchQuery]);

  const selectedLeads = useMemo(() => 
    leads.filter(l => selectedIds.has(l.id)),
    [leads, selectedIds]
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
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleDownloadCSV = () => {
    const dataToExport = selectedIds.size > 0 ? selectedLeads : leads;
    const headers = ['Name', 'Phone', 'Email', 'Address', 'Website', 'Rating', 'Classification'];
    const rows = dataToExport.map(r => [
      `"${r.name || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.email || ''}"`,
      `"${r.address || ''}"`,
      `"${r.website || ''}"`,
      r.rating || '',
      r.aiClassification || '',
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${dataToExport.length} leads`);
  };

  const handleDownloadExcel = () => {
    const dataToExport = selectedIds.size > 0 ? selectedLeads : leads;
    const worksheetData = dataToExport.map(r => ({
      'Business Name': r.name || '',
      'Phone': r.phone || '',
      'Email': r.email || '',
      'Address': r.address || '',
      'Website': r.website || '',
      'Rating': r.rating || '',
      'Classification': r.aiClassification?.toUpperCase() || '',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Downloaded ${dataToExport.length} leads as Excel`);
  };

  const [showVerifyPrompt, setShowVerifyPrompt] = useState<'email' | 'call' | 'crm' | 'schedule' | null>(null);

  const handleProceedToEmail = () => {
    const leadsToUse = selectedIds.size > 0 ? selectedLeads : leads;
    if (leadsToUse.length === 0) {
      toast.error('No leads to email');
      return;
    }
    // Check if leads have been verified
    const hasUnverifiedLeads = leadsToUse.some(l => !l.aiClassification);
    if (hasUnverifiedLeads) {
      setShowVerifyPrompt('email');
      return;
    }
    onProceedToEmail(leadsToUse);
  };

  const handleProceedToCall = () => {
    const leadsToUse = selectedIds.size > 0 ? selectedLeads : leads;
    const withPhone = leadsToUse.filter(l => l.phone);
    if (withPhone.length === 0) {
      toast.error('No leads with phone numbers');
      return;
    }
    // Check if leads have been verified
    const hasUnverifiedLeads = withPhone.some(l => !l.aiClassification);
    if (hasUnverifiedLeads) {
      setShowVerifyPrompt('call');
      return;
    }
    onProceedToCall(withPhone);
  };

  const handleOpenCRM = () => {
    const leadsToUse = selectedIds.size > 0 ? selectedLeads : leads;
    const hasUnverifiedLeads = leadsToUse.some(l => !l.aiClassification);
    if (hasUnverifiedLeads) {
      setShowVerifyPrompt('crm');
      return;
    }
    if (onOpenCRM) onOpenCRM();
    else toast.info('CRM opening...');
  };

  const handleOpenSchedule = () => {
    const leadsToUse = selectedIds.size > 0 ? selectedLeads : leads;
    const hasUnverifiedLeads = leadsToUse.some(l => !l.aiClassification);
    if (hasUnverifiedLeads) {
      setShowVerifyPrompt('schedule');
      return;
    }
    if (onOpenSchedule) onOpenSchedule();
    else toast.info('Schedule feature coming soon!');
  };

  const confirmProceedWithoutVerify = () => {
    const leadsToUse = selectedIds.size > 0 ? selectedLeads : leads;
    const withPhone = leadsToUse.filter(l => l.phone);
    
    if (showVerifyPrompt === 'email') {
      onProceedToEmail(leadsToUse);
    } else if (showVerifyPrompt === 'call') {
      onProceedToCall(withPhone);
    } else if (showVerifyPrompt === 'crm') {
      if (onOpenCRM) onOpenCRM();
    } else if (showVerifyPrompt === 'schedule') {
      if (onOpenSchedule) onOpenSchedule();
    }
    setShowVerifyPrompt(null);
  };

  const getClassBadge = (classification?: string) => {
    switch (classification) {
      case 'hot':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1 text-xs"><Flame className="w-3 h-3" />Hot</Badge>;
      case 'warm':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 gap-1 text-xs"><Thermometer className="w-3 h-3" />Warm</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1 text-xs"><Snowflake className="w-3 h-3" />Cold</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">New</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Verify Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30">
        <div className="flex items-center gap-3">
          <Button 
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold animate-pulse"
            onClick={() => onOpenAIScoring ? onOpenAIScoring() : toast.info('AI Scoring Dashboard opening...')}
          >
            <Sparkles className="w-4 h-4" />
            ✨ AI VERIFY LEADS ✨
          </Button>
          <span className="text-sm text-amber-200">
            <span className="font-semibold text-amber-400">💡 Pro Tip:</span> AI Verify confirms phone & email accuracy!
          </span>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
          Uses 0 credits
        </Badge>
      </div>

      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
        {/* Left side - Selection info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
              {selectedIds.size > 0 && <div className="w-3 h-3 rounded-full bg-primary" />}
            </div>
            <span className="font-medium">{selectedIds.size} selected</span>
            <span className="text-muted-foreground">of {leads.length}</span>
          </div>
        </div>

        {/* Center - Actions */}
        <div className="flex items-center gap-6">
          {/* Primary Actions */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">ACTIONS:</span>
            <Button 
              onClick={handleProceedToCall} 
              size="sm" 
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4" />
              Call
            </Button>
            <Button 
              onClick={handleProceedToEmail} 
              size="sm" 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">TOOLS:</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleOpenCRM}
            >
              <Database className="w-4 h-4" />
              CRM
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleOpenSchedule}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          </div>

          {/* Export */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">EXPORT:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDownloadCSV}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { window.print(); toast.success('Printing...'); }}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right side - View Report & Send Now */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
            onClick={() => {
              if (onOpenReport) onOpenReport();
              else toast.info('Opening lead report...');
            }}
          >
            <FileText className="w-4 h-4" />
            View Report
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            onClick={handleProceedToEmail}
          >
            <Send className="w-4 h-4" />
            Send Now
          </Button>
        </div>
      </div>

      {/* Compact Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">STEP 2: Lead Management</h1>
              <p className="text-xs text-muted-foreground">{leads.length} leads found</p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 font-medium">🔥 {groupedCounts.hot}</span>
            <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-500 font-medium">⚡ {groupedCounts.warm}</span>
            <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-medium">❄️ {groupedCounts.cold}</span>
          </div>
        </div>
      </div>

      {/* Streaming Leads Indicator */}
      {isLoading && (
        <StreamingLeadsIndicator
          currentCount={leads.length}
          isStreaming={isLoading}
          progress={loadingProgress}
        />
      )}

      {/* Reminder Banner */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-amber-400 font-medium">⚠ REMEMBER: AI Verify your leads before contacting them!</span>
        <Sparkles className="w-4 h-4 text-amber-500" />
      </div>

      {/* Phone Only Stats Banner - only show when phone-only leads exist */}
      {groupedCounts.phoneOnly > 0 && (
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-500" />
            <div>
              <span className="text-green-400 font-semibold">{groupedCounts.phoneOnly} leads</span>
              <span className="text-green-300/80 ml-2">have phone numbers but no email — perfect for direct calling!</span>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => {
              setActiveFilter('phoneOnly');
              toast.success(`Showing ${groupedCounts.phoneOnly} phone-only leads`);
            }}
          >
            <Phone className="w-4 h-4" />
            View Phone-Only Leads
          </Button>
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All', icon: Users, count: groupedCounts.all, color: '', activeColor: 'bg-primary' },
            { key: 'hot', label: 'Hot', icon: Flame, count: groupedCounts.hot, color: 'text-red-500', activeColor: 'bg-red-500 hover:bg-red-600' },
            { key: 'warm', label: 'Warm', icon: Thermometer, count: groupedCounts.warm, color: 'text-orange-500', activeColor: 'bg-orange-500 hover:bg-orange-600' },
            { key: 'cold', label: 'Cold', icon: Snowflake, count: groupedCounts.cold, color: 'text-blue-500', activeColor: 'bg-blue-500 hover:bg-blue-600' },
            { key: 'withEmail', label: 'Has Email', icon: Mail, count: groupedCounts.withEmail, color: 'text-cyan-500', activeColor: 'bg-cyan-500 hover:bg-cyan-600' },
            { key: 'phoneOnly', label: 'Phone Only', icon: Phone, count: groupedCounts.phoneOnly, color: 'text-green-500', activeColor: 'bg-green-500 hover:bg-green-600' },
            { key: 'ready', label: 'Ready', icon: Phone, count: groupedCounts.ready, color: 'text-emerald-500', activeColor: 'bg-emerald-500 hover:bg-emerald-600' },
            { key: 'nosite', label: 'No Site', icon: Globe, count: groupedCounts.nosite, color: 'text-purple-500', activeColor: 'bg-purple-500 hover:bg-purple-600' },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.key as any)}
              className={`gap-1.5 ${activeFilter === filter.key ? filter.activeColor : ''}`}
            >
              <filter.icon className={`w-3.5 h-3.5 ${activeFilter !== filter.key ? filter.color : ''}`} />
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showSaved ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setShowSaved(!showSaved);
              toast.info(showSaved ? 'Showing all leads' : 'Showing saved leads only');
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => toast.info('Saved leads feature coming soon!')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Saved ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-border">
        <CardContent className="p-0">
          {/* Table */}
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-20 text-center">Score</TableHead>
                  <TableHead className="w-24">Priority</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead className="w-16 text-center">Website</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-24">Timing</TableHead>
                  <TableHead className="w-24">Best Action</TableHead>
                  <TableHead>Pain Points</TableHead>
                  <TableHead>Recommended Approach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && leads.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-4 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-6 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-12 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-16 h-5" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="w-8 h-8 rounded-full mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="w-16 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-12 h-4" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-16">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No leads found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead, index) => {
                    // Use real AI-scored data
                    const score = lead.leadScore || 50;
                    const successProb = lead.successProbability || score;
                    const painPointsDisplay = lead.painPoints?.length 
                      ? lead.painPoints[0] 
                      : (lead.websiteAnalysis?.issues?.[0] || 'Standard lead');
                    
                    // Recommended action with icons
                    const getActionBadge = () => {
                      const action = lead.recommendedAction || 'email';
                      if (action === 'call') {
                        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs gap-1"><Phone className="w-3 h-3" />Call</Badge>;
                      } else if (action === 'both') {
                        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 text-xs gap-1"><Phone className="w-3 h-3" /><Mail className="w-3 h-3" /></Badge>;
                      }
                      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-xs gap-1"><Mail className="w-3 h-3" />Email</Badge>;
                    };
                    
                    // Best time based on urgency
                    const getBestTime = () => {
                      if (lead.urgency === 'immediate') return '🔥 Now!';
                      if (lead.urgency === 'this_week') return '📅 This week';
                      return '⏳ Nurture';
                    };
                    
                    return (
                      <TableRow 
                        key={lead.id}
                        className={`cursor-pointer transition-colors ${selectedIds.has(lead.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                        onClick={() => toggleSelect(lead.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(lead.id)}
                            onCheckedChange={() => toggleSelect(lead.id)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className={`text-sm font-bold ${score >= 70 ? 'text-emerald-500' : score >= 45 ? 'text-amber-500' : 'text-red-500'}`}>
                              {score}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {successProb}% win
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getClassBadge(lead.aiClassification)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              {getSourceBadges(lead.sources)}
                            </div>
                          </div>
                        </TableCell>
                        {/* Website Column with prominent icon */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          {lead.website ? (
                            <button
                              onClick={() => window.open(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`, '_blank', 'noopener,noreferrer')}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 hover:text-emerald-400 transition-all hover:scale-110"
                              title={`Visit ${lead.website.replace(/^https?:\/\//, '').split('/')[0]}`}
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                              <Globe className="w-3 h-3" />
                              No Site
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.email ? (
                            <span className="text-sm">{lead.email}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {lead.phone ? (
                            <a 
                              href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`}
                              className="text-sm text-green-500 hover:text-green-400 hover:underline flex items-center gap-1 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`Calling ${lead.name}...`, { description: lead.phone });
                              }}
                            >
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {getBestTime()}
                        </TableCell>
                        <TableCell>
                          {getActionBadge()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={painPointsDisplay}>
                          {painPointsDisplay}
                        </TableCell>
                        <TableCell className="text-xs">
                          {lead.recommendedAction === 'call' ? (
                            <span className="text-green-500 font-medium">Direct call - explain value</span>
                          ) : lead.recommendedAction === 'both' ? (
                            <span className="text-purple-500 font-medium">Multi-channel approach</span>
                          ) : (
                            <span className="text-blue-500 font-medium">Send case study email</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Bottom Action Bar */}
          {!selectedIds.size && leads.length > 0 && (
            <div className="px-4 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select leads above or take action on all {leads.length}:
              </p>
              <div className="flex items-center gap-3">
                <Button onClick={handleProceedToEmail} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4" />
                  Email All
                </Button>
                <Button onClick={handleProceedToCall} variant="outline" className="gap-2 border-green-500 text-green-600">
                  <Phone className="w-4 h-4" />
                  Call All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Verification Prompt Dialog */}
      {showVerifyPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wait! Have You Verified These Leads?</h3>
              <p className="text-muted-foreground mb-6">
                AI Verification confirms phone & email accuracy, improving your outreach success rate by up to 40%!
              </p>

              <div className="space-y-3">
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => {
                    setShowVerifyPrompt(null);
                    toast.info('AI Verify your leads first using the button above!');
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Go Back & Verify Leads First
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={confirmProceedWithoutVerify}
                >
                  Continue Without Verifying
                  {showVerifyPrompt === 'email' && ' → Step 3 (Email)'}
                  {showVerifyPrompt === 'call' && ' → Step 4 (Call)'}
                  {showVerifyPrompt === 'crm' && ' → CRM'}
                  {showVerifyPrompt === 'schedule' && ' → Schedule'}
                </Button>

                <Button 
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowVerifyPrompt(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
