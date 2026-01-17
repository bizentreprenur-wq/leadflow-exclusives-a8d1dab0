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
  FileSpreadsheet, Printer, Star
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
  isLoading?: boolean;
  loadingProgress?: number;
}

export default function SimpleLeadViewer({
  leads,
  onBack,
  onProceedToEmail,
  onProceedToCall,
  isLoading = false,
  loadingProgress = 0,
}: SimpleLeadViewerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
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
  }), [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (activeFilter !== 'all') {
      result = result.filter(l => l.aiClassification === activeFilter);
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
      {/* Compact Header */}
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

      {/* Filters & Search Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All', count: groupedCounts.all, color: '' },
            { key: 'hot', label: '🔥 Hot', count: groupedCounts.hot, color: 'bg-red-500 hover:bg-red-600' },
            { key: 'warm', label: '⚡ Warm', count: groupedCounts.warm, color: 'bg-orange-500 hover:bg-orange-600' },
            { key: 'cold', label: '❄️ Cold', count: groupedCounts.cold, color: 'bg-blue-500 hover:bg-blue-600' },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.key as any)}
              className={activeFilter === filter.key && filter.color ? filter.color : ''}
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-56 h-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
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

      {/* Main Content Card */}
      <Card className="border-border">
        <CardContent className="p-0">
          {/* Action Bar - only show when leads selected */}
          {selectedIds.size > 0 && (
            <div className="px-4 py-3 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
              <span className="font-medium">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <Button onClick={handleProceedToEmail} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button onClick={handleProceedToCall} size="sm" variant="outline" className="gap-2 border-green-500 text-green-600">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
              </div>
            </div>
          )}

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
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && leads.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-4 h-4" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No leads found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
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
                        <div className="space-y-0.5">
                          {lead.phone && (
                            <p className="text-sm flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-green-500" />
                              {lead.phone}
                            </p>
                          )}
                          {lead.email && (
                            <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 text-blue-500" />
                              {lead.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{lead.address}</span>
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {getClassBadge(lead.aiClassification)}
                      </TableCell>
                    </TableRow>
                  ))
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
