import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Download, ChevronDown,
  Globe, Phone, MapPin,
  Flame, Thermometer, Snowflake, 
  PhoneCall, Users, Mail, Search, X, Printer,
  FileSpreadsheet
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

  const handlePrint = () => {
    window.print();
    toast.success('Printing lead list...');
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
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1"><Flame className="w-3 h-3" />Hot</Badge>;
      case 'warm':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 gap-1"><Thermometer className="w-3 h-3" />Warm</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 gap-1"><Snowflake className="w-3 h-3" />Cold</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-primary/10 to-blue-500/10 border-b">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                📋 STEP 2: Your Leads
                <Badge variant="secondary" className="ml-2">{leads.length}</Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                View, select, and decide what to do with your leads
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-500 font-semibold">🔥 {groupedCounts.hot} Hot</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-orange-500 font-semibold">⚡ {groupedCounts.warm} Warm</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-blue-500 font-semibold">❄️ {groupedCounts.cold} Cold</span>
          </div>
        </div>
      </div>

      {/* Loading Bar */}
      {isLoading && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-primary">{Math.round(loadingProgress)}%</span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 py-3 bg-muted/30 border-b flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Filters */}
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All ({groupedCounts.all})
          </Button>
          <Button
            variant={activeFilter === 'hot' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('hot')}
            className={activeFilter === 'hot' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            🔥 Hot ({groupedCounts.hot})
          </Button>
          <Button
            variant={activeFilter === 'warm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('warm')}
            className={activeFilter === 'warm' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            ⚡ Warm ({groupedCounts.warm})
          </Button>
          <Button
            variant={activeFilter === 'cold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('cold')}
            className={activeFilter === 'cold' ? 'bg-blue-500 hover:bg-blue-600' : ''}
          >
            ❄️ Cold ({groupedCounts.cold})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 h-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
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
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selection Banner */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-semibold">
              ✅ {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleProceedToEmail} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4" />
                Email Selected →
              </Button>
              <Button onClick={handleProceedToCall} variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-500/10">
                <Phone className="w-4 h-4" />
                Call Selected →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={selectAll}
                />
              </TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && leads.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="w-4 h-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}
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
                      <p className="font-semibold">{lead.name}</p>
                      {lead.website && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {new URL(lead.website).hostname}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.phone && (
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-green-500" />
                          {lead.phone}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-500" />
                          {lead.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.address.length > 30 ? lead.address.substring(0, 30) + '...' : lead.address}
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
      </div>

      {/* Bottom Action Bar */}
      {!selectedIds.size && leads.length > 0 && (
        <div className="px-4 py-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-muted-foreground">Select leads above, or take action on all {leads.length} leads:</p>
            <div className="flex items-center gap-3">
              <Button onClick={handleProceedToEmail} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Mail className="w-5 h-5" />
                Email All Leads
              </Button>
              <Button onClick={handleProceedToCall} size="lg" variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-500/10">
                <Phone className="w-5 h-5" />
                Call All Leads
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
