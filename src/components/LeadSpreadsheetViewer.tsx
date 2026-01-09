import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ArrowLeft, Sparkles, FileText, Download, Send, Database, ChevronDown,
  Globe, Phone, MapPin, Star, AlertTriangle, CheckCircle2, ExternalLink,
  FileSpreadsheet, FileDown
} from 'lucide-react';

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

interface LeadSpreadsheetViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
  savedLeads?: SearchResult[];
  onProceedToVerify: (leads: SearchResult[]) => void;
  onSaveToDatabase?: (leads: SearchResult[]) => void;
  onSendToEmail?: (leads: SearchResult[]) => void;
}

export default function LeadSpreadsheetViewer({
  open,
  onOpenChange,
  leads,
  savedLeads = [],
  onProceedToVerify,
  onSaveToDatabase,
  onSendToEmail,
}: LeadSpreadsheetViewerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [verifiedCount, setVerifiedCount] = useState(0);

  const currentLeads = activeTab === 'new' ? leads : savedLeads;

  // Clear selection when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'new' | 'saved');
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === currentLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentLeads.map(l => l.id)));
    }
  };

  const selectedLeads = useMemo(() => 
    currentLeads.filter(l => selectedIds.has(l.id)),
    [currentLeads, selectedIds]
  );

  const handleAIVerify = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead to verify');
      return;
    }
    onProceedToVerify(selectedLeads);
  };

  const handleSaveToDatabase = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead to save');
      return;
    }
    if (onSaveToDatabase) {
      onSaveToDatabase(selectedLeads);
      toast.success(`${selectedLeads.length} leads saved to database`);
    }
  };

  const handleSendToEmail = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    if (onSendToEmail) {
      onSendToEmail(selectedLeads);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : currentLeads;
    
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Has Website', 'Platform', 'Issues'];
    const rows = dataToExport.map(r => [
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
    toast.success(`Exported ${dataToExport.length} leads as CSV`);
  };

  const handleExportExcel = () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : currentLeads;
    
    const worksheetData = dataToExport.map(r => ({
      'Business Name': r.name || '',
      'Address': r.address || '',
      'Phone': r.phone || '',
      'Website': r.website || '',
      'Rating': r.rating || '',
      'Has Website': r.websiteAnalysis?.hasWebsite ? 'Yes' : 'No',
      'Platform': r.websiteAnalysis?.platform || '',
      'Issues': r.websiteAnalysis?.issues?.join('; ') || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${dataToExport.length} leads as Excel`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to lead list
            </Button>
          </div>
          <Badge variant="outline" className="gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Demo
          </Badge>
        </div>

        {/* Tabs Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-background border">
              <TabsTrigger value="new" className="gap-2 px-4">
                <Sparkles className="w-4 h-4" />
                New Leads ({leads.length})
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2 px-4">
                <FileText className="w-4 h-4" />
                Saved Leads ({savedLeads.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedIds.size} selected</span>
            <span>•</span>
            <span>{verifiedCount} verified</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleAIVerify}
              disabled={selectedIds.size === 0}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI Verify Selected
            </Button>

            <Button 
              variant="outline" 
              onClick={handleSaveToDatabase}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Database className="w-4 h-4" />
              Save to DB ({selectedIds.size})
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                  <FileDown className="w-4 h-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={handleSendToEmail}
              disabled={selectedIds.size === 0}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
              Send to Email ({selectedIds.size})
            </Button>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedIds.size === currentLeads.length && currentLeads.length > 0}
                        onCheckedChange={selectAll}
                      />
                      <span className="text-xs font-normal text-muted-foreground">
                        Select All ({currentLeads.length})
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">Business Name</TableHead>
                  <TableHead className="min-w-[250px]">Address</TableHead>
                  <TableHead className="min-w-[130px]">Phone</TableHead>
                  <TableHead className="min-w-[200px]">Website</TableHead>
                  <TableHead className="w-20">Rating</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLeads.map((lead, index) => (
                  <TableRow 
                    key={lead.id}
                    data-state={selectedIds.has(lead.id) ? 'selected' : undefined}
                    className={selectedIds.has(lead.id) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lead.name}</span>
                        {!lead.website && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                            No Website
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.address ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">{lead.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{lead.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.website ? (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{lead.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Badge variant="outline" className="text-xs">No website</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{lead.rating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.websiteAnalysis?.needsUpgrade ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                          Needs Upgrade
                        </Badge>
                      ) : lead.website ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Prospect
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.websiteAnalysis?.issues && lead.websiteAnalysis.issues.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{lead.websiteAnalysis.issues.length} issues</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {currentLeads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No leads found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'new' 
                    ? 'Run a search to find new leads'
                    : 'Save some leads to see them here'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
