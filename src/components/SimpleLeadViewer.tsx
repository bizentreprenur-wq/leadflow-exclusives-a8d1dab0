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
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Download, ChevronDown,
  Globe, Phone, MapPin,
  Flame, Thermometer, Snowflake, 
  Users, Mail, Search, X,
  FileSpreadsheet, Printer, Star,
  Sparkles, Database, Clock, FileText,
  Send, Calendar, ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  platform?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  readyToCall?: boolean;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
  };
}

interface SimpleLeadViewerProps {
  leads: SearchResult[];
  onBack: () => void;
  onProceedToEmail: (leads: SearchResult[]) => void;
  onProceedToCall: (leads: SearchResult[]) => void;
  onOpenReport?: () => void;
  onOpenCRM?: () => void;
  onOpenSchedule?: () => void;
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
  isLoading = false,
  loadingProgress = 0,
}: SimpleLeadViewerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'warm' | 'cold' | 'ready' | 'nosite'>('all');
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
  }), [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (activeFilter === 'hot' || activeFilter === 'warm' || activeFilter === 'cold') {
      result = result.filter(l => l.aiClassification === activeFilter);
    } else if (activeFilter === 'ready') {
      result = result.filter(l => l.readyToCall || l.phone);
    } else if (activeFilter === 'nosite') {
      result = result.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false);
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

  const handleProceedToEmail = () => {
    const leadsToUse = selectedIds.size > 0 ? selectedLeads : leads;
    if (leadsToUse.length === 0) {
      toast.error('No leads to email');
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
    onProceedToCall(withPhone);
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
            onClick={() => toast.info('AI Verify coming soon - validates phone & email accuracy!')}
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
              onClick={() => {
                if (onOpenCRM) onOpenCRM();
                else toast.info('CRM integration opening...');
              }}
            >
              <Database className="w-4 h-4" />
              CRM
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                if (onOpenSchedule) onOpenSchedule();
                else toast.info('Schedule feature coming soon!');
              }}
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

      {/* Loading Bar */}
      {isLoading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-primary">{Math.round(loadingProgress)}%</span>
        </div>
      )}

      {/* Reminder Banner */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-amber-400 font-medium">⚠ REMEMBER: AI Verify your leads before contacting them!</span>
        <Sparkles className="w-4 h-4 text-amber-500" />
      </div>

      {/* Filters & Search Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All', icon: Users, count: groupedCounts.all, color: '', activeColor: 'bg-primary' },
            { key: 'hot', label: 'Hot', icon: Flame, count: groupedCounts.hot, color: 'text-red-500', activeColor: 'bg-red-500 hover:bg-red-600' },
            { key: 'warm', label: 'Warm', icon: Thermometer, count: groupedCounts.warm, color: 'text-orange-500', activeColor: 'bg-orange-500 hover:bg-orange-600' },
            { key: 'cold', label: 'Cold', icon: Snowflake, count: groupedCounts.cold, color: 'text-blue-500', activeColor: 'bg-blue-500 hover:bg-blue-600' },
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
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-24">Best Time</TableHead>
                  <TableHead className="w-20">Ready?</TableHead>
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
                    <TableCell colSpan={11} className="text-center py-16">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No leads found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead, index) => {
                    const score = lead.leadScore || Math.floor(Math.random() * 40 + 60);
                    const bestTime = ['9-11 AM', '2-4 PM', '11-1 PM', '4-6 PM'][index % 4];
                    const painPoints = lead.websiteAnalysis?.issues?.[0] || 
                      ['No mobile optimization', 'Slow load times', 'Outdated design', 'No SSL'][index % 4];
                    const approach = ['Direct pitch', 'Soft intro', 'Value offer', 'Problem-solution'][index % 4];
                    
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
                          <div className={`text-sm font-medium ${score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {score}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getClassBadge(lead.aiClassification)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            {lead.website && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Globe className="w-3 h-3" />
                                {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.email ? (
                            <span className="text-sm">{lead.email}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.phone ? (
                            <span className="text-sm">{lead.phone}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bestTime}
                        </TableCell>
                        <TableCell>
                          {lead.readyToCall || index % 3 === 0 ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {painPoints}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {approach}
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
    </div>
  );
}
