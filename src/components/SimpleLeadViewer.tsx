import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DualScrollbar } from '@/components/ui/dual-scrollbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft, Download, ChevronDown,
  Globe, Phone, PhoneCall, MapPin,
  Flame, Thermometer, Snowflake, 
  Users, Mail, Search, X,
  FileSpreadsheet, Printer, Star,
  Sparkles, Database, Clock, FileText,
  Send, Calendar, ChevronRight, History,
  Save, RotateCcw, Loader2, Check, FolderOpen
} from 'lucide-react';
import WebsitePreviewIcon from './WebsitePreviewIcon';
import SocialMediaLookup from './SocialMediaLookup';
import { Skeleton } from '@/components/ui/skeleton';
import StreamingLeadsIndicator from '@/components/StreamingLeadsIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SearchHistoryFolder, { SearchFolderItem } from './SearchHistoryFolder';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  enrichmentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
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

interface RestoredSessionInfo {
  source: 'localStorage' | 'database';
  timestamp: string;
  leadCount: number;
}

interface LeadVersionSnapshot {
  id: string;
  timestamp: string;
  leadCount: number;
  leads: SearchResult[];
  query?: string;
  location?: string;
}

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
  onLoadHistorySearch?: (search: SearchHistoryItem) => void;
  restoredFromSession?: RestoredSessionInfo | null;
  onDismissRestored?: () => void;
  onManualSave?: () => Promise<boolean>;
  onRestoreVersion?: (version: LeadVersionSnapshot) => void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  location: string;
  leadsCount: number;
  timestamp: string;
  leads: SearchResult[];
  hotCount?: number;
  warmCount?: number;
  coldCount?: number;
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
  onLoadHistorySearch,
  restoredFromSession,
  onDismissRestored,
  onManualSave,
  onRestoreVersion,
  isSaving = false,
  lastSavedAt,
}: SimpleLeadViewerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'warm' | 'cold' | 'ready' | 'nosite' | 'phoneOnly' | 'withEmail'>('all');
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [versionHistory, setVersionHistory] = useState<LeadVersionSnapshot[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const getPrimaryEmail = (lead: SearchResult): string => {
    const direct = (lead.email || '').trim();
    if (direct) return direct;
    return '';
  };

  const getPrimaryPhone = (lead: SearchResult): string => {
    const direct = (lead.phone || '').trim();
    if (direct) return direct;
    return '';
  };

  // Load version history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bamlead_lead_versions');
      if (saved) {
        setVersionHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load version history:', e);
    }
  }, []);

  // Load search history from localStorage (separate from Clear All Data)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bamlead_search_history_permanent');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  // Save current search to history when leads change (and there are leads)
  // OPTIMIZED: Store lean lead data to prevent localStorage overflow
  useEffect(() => {
    if (leads.length > 0 && !isLoading) {
      const query = sessionStorage.getItem('bamlead_query') || 'Unknown';
      const location = sessionStorage.getItem('bamlead_location') || '';
      
      // Count by classification
      const hotCount = leads.filter(l => l.aiClassification === 'hot').length;
      const warmCount = leads.filter(l => l.aiClassification === 'warm').length;
      const coldCount = leads.filter(l => l.aiClassification === 'cold').length;
      
      // Check if this search already exists (same query AND location)
      const existingIndex = searchHistory.findIndex(
        s => s.query === query && s.location === location
      );
      
      // OPTIMIZATION: Store lean lead objects (only essential fields)
      // This prevents localStorage from exceeding ~5MB limit with large searches
      const leanLeads = leads.map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        email: l.email,
        website: l.website,
        address: l.address,
        rating: l.rating,
        source: l.source,
        aiClassification: l.aiClassification,
        leadScore: l.leadScore,
        successProbability: l.successProbability,
        recommendedAction: l.recommendedAction,
        urgency: l.urgency,
        readyToCall: l.readyToCall,
        // Exclude heavy websiteAnalysis.issues arrays and painPoints to save space
      }));
      
      if (existingIndex === -1) {
        // New search - store lean leads
        const newEntry: SearchHistoryItem = {
          id: `${Date.now()}`,
          query,
          location,
          leadsCount: leads.length,
          timestamp: new Date().toISOString(),
          leads: leanLeads as SearchResult[],
          hotCount,
          warmCount,
          coldCount,
        };
        
        const updated = [newEntry, ...searchHistory].slice(0, 20); // Keep last 20 searches
        setSearchHistory(updated);
        
        // Try to save, handle quota exceeded
        try {
          localStorage.setItem('bamlead_search_history_permanent', JSON.stringify(updated));
        } catch (e) {
          console.warn('localStorage quota exceeded, trimming history');
          // Trim to last 10 if quota exceeded
          const trimmed = updated.slice(0, 10);
          localStorage.setItem('bamlead_search_history_permanent', JSON.stringify(trimmed));
          setSearchHistory(trimmed);
        }
      } else {
        // Update existing search with new leads and counts
        const updated = [...searchHistory];
        updated[existingIndex] = {
          ...updated[existingIndex],
          leadsCount: leads.length,
          leads: leanLeads as SearchResult[],
          hotCount,
          warmCount,
          coldCount,
          timestamp: new Date().toISOString(),
        };
        setSearchHistory(updated);
        
        try {
          localStorage.setItem('bamlead_search_history_permanent', JSON.stringify(updated));
        } catch (e) {
          console.warn('localStorage quota exceeded on update');
        }
      }
    }
  }, [leads, isLoading]);

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

  // Auto-classify leads that are missing aiClassification
  const classifiedLeads = useMemo(() => {
    return leads.map(lead => {
      if (lead.aiClassification) return lead;
      let score = lead.leadScore || 0;
      if (!score) {
        // Score based on actionable contact data
        if (lead.email) score += 30;
        if (lead.phone) score += 20;
        if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) score += 20;
        if (lead.rating && lead.rating >= 4) score += 10;
        if (lead.address) score += 5;
        if (lead.websiteAnalysis?.needsUpgrade) score += 10;
        if (lead.websiteAnalysis?.issues?.length) score += 5;
      }
      const classification: 'hot' | 'warm' | 'cold' = score >= 45 ? 'hot' : score >= 20 ? 'warm' : 'cold';
      return { ...lead, aiClassification: classification, leadScore: score || lead.leadScore };
    });
  }, [leads]);

  const groupedCounts = useMemo(() => ({
    all: classifiedLeads.length,
    hot: classifiedLeads.filter(l => l.aiClassification === 'hot').length,
    warm: classifiedLeads.filter(l => l.aiClassification === 'warm').length,
    cold: classifiedLeads.filter(l => l.aiClassification === 'cold').length,
    ready: classifiedLeads.filter(l => l.readyToCall || getPrimaryPhone(l)).length,
    nosite: classifiedLeads.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false).length,
    phoneOnly: classifiedLeads.filter(l => getPrimaryPhone(l) && !getPrimaryEmail(l)).length,
    withEmail: classifiedLeads.filter(l => !!getPrimaryEmail(l)).length,
  }), [classifiedLeads]);

  // Email source breakdown: count how many leads got emails from each extraction method
  const emailSourceBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    let totalWithEmail = 0;
    leads.forEach(lead => {
      const hasEmail = !!getPrimaryEmail(lead);
      if (!hasEmail) return;
      totalWithEmail++;
      const sources: string[] = [];
      if (sources.length === 0) {
        breakdown['Discovery'] = (breakdown['Discovery'] || 0) + 1;
      }
      sources.forEach(src => {
        const srcLower = src.toLowerCase();
        if (srcLower.includes('js') || srcLower.includes('data-attr')) {
          breakdown['JS/Data-Attr'] = (breakdown['JS/Data-Attr'] || 0) + 1;
        } else if (srcLower.includes('contact page')) {
          breakdown['Contact Page'] = (breakdown['Contact Page'] || 0) + 1;
        } else if (srcLower.includes('schema') || srcLower.includes('structured')) {
          breakdown['Schema.org'] = (breakdown['Schema.org'] || 0) + 1;
        } else if (srcLower.includes('pattern engine') || srcLower.includes('name-based')) {
          breakdown['Pattern Engine'] = (breakdown['Pattern Engine'] || 0) + 1;
        } else if (srcLower.includes('email hunt')) {
          breakdown['Email Hunt'] = (breakdown['Email Hunt'] || 0) + 1;
        } else if (srcLower.includes('obfuscated')) {
          breakdown['Obfuscated'] = (breakdown['Obfuscated'] || 0) + 1;
        } else if (srcLower.includes('homepage')) {
          breakdown['Homepage'] = (breakdown['Homepage'] || 0) + 1;
        } else if (srcLower.includes('footer')) {
          breakdown['Footer Crawl'] = (breakdown['Footer Crawl'] || 0) + 1;
        } else if (srcLower.includes('microformat') || srcLower.includes('vcard')) {
          breakdown['Microformats'] = (breakdown['Microformats'] || 0) + 1;
        } else if (srcLower.includes('meta')) {
          breakdown['Meta Tags'] = (breakdown['Meta Tags'] || 0) + 1;
        } else if (srcLower.includes('facebook') || srcLower.includes('linkedin') || srcLower.includes('instagram') || srcLower.includes('twitter') || srcLower.includes('yelp')) {
          breakdown['Social Profiles'] = (breakdown['Social Profiles'] || 0) + 1;
        } else if (srcLower.includes('directory')) {
          breakdown['Directories'] = (breakdown['Directories'] || 0) + 1;
        } else if (srcLower.includes('cloudflare') || srcLower.includes('cfemail')) {
          breakdown['CF Decoded'] = (breakdown['CF Decoded'] || 0) + 1;
        } else {
          breakdown['Other'] = (breakdown['Other'] || 0) + 1;
        }
      });
    });
    return { breakdown, totalWithEmail };
  }, [leads]);

  // Sort helper: hot first, then warm, then cold, then unclassified
  const classificationOrder: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
  const sortByClassification = (a: SearchResult, b: SearchResult) => {
    const aOrder = classificationOrder[a.aiClassification || ''] ?? 3;
    const bOrder = classificationOrder[b.aiClassification || ''] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.leadScore || 0) - (a.leadScore || 0);
  };

  const filteredLeads = useMemo(() => {
    let result = classifiedLeads;
    
    if (activeFilter === 'hot' || activeFilter === 'warm' || activeFilter === 'cold') {
      result = result.filter(l => l.aiClassification === activeFilter);
    } else if (activeFilter === 'ready') {
      result = result.filter(l => l.readyToCall || getPrimaryPhone(l));
    } else if (activeFilter === 'nosite') {
      result = result.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false);
    } else if (activeFilter === 'phoneOnly') {
      result = result.filter(l => getPrimaryPhone(l) && !getPrimaryEmail(l));
    } else if (activeFilter === 'withEmail') {
      result = result.filter(l => !!getPrimaryEmail(l));
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.name?.toLowerCase().includes(q) ||
        getPrimaryPhone(l)?.includes(q) ||
        getPrimaryEmail(l).toLowerCase().includes(q)
      );
    }
    
    // Always sort by classification: hot → warm → cold
    return [...result].sort(sortByClassification);
  }, [classifiedLeads, activeFilter, searchQuery]);

  const selectedLeads = useMemo(() => 
    classifiedLeads.filter(l => selectedIds.has(l.id)),
    [classifiedLeads, selectedIds]
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

  // Helper to generate download for a specific category
  const downloadLeadsByCategory = (category: 'hot' | 'warm' | 'cold' | 'all', format: 'csv' | 'excel') => {
    let dataToExport: SearchResult[];
    let categoryLabel: string;
    
    if (category === 'all') {
      const base = selectedIds.size > 0 ? selectedLeads : classifiedLeads;
      dataToExport = [...base].sort(sortByClassification);
      categoryLabel = 'all';
    } else {
      dataToExport = classifiedLeads.filter(l => l.aiClassification === category).sort(sortByClassification);
      categoryLabel = category;
    }
    
    if (dataToExport.length === 0) {
      toast.error(`No ${categoryLabel} leads to download`);
      return;
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${categoryLabel}-leads-${dateStr}`;
    
    if (format === 'csv') {
      const headers = ['#', 'Priority', 'Score', 'Business Name', 'Phone', 'Email', 'Address', 'Website', 'Rating', 'Recommended Action', 'Win Probability'];
      const rows = dataToExport.map((r, i) => [
        i + 1,
        `"${(r.aiClassification || 'unclassified').toUpperCase()}"`,
        r.leadScore || '',
        `"${r.name || ''}"`,
        `"${getPrimaryPhone(r) || ''}"`,
        `"${getPrimaryEmail(r) || ''}"`,
        `"${r.address || ''}"`,
        `"${r.website || ''}"`,
        r.rating || '',
        `"${r.recommendedAction === 'call' ? 'Call' : r.recommendedAction === 'both' ? 'Call + Email' : 'Email'}"`,
        r.successProbability ? `${r.successProbability}%` : '',
      ].join(','));
      
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${dataToExport.length} ${categoryLabel} leads as CSV`);
    } else if (format === 'excel') {
      // Professional Excel with BamLead branding and styled rows
      const workbook = XLSX.utils.book_new();
      
      // Title rows
      const titleRows: (string | number)[][] = [
        ['BamLead Intelligence Report'],
        [`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Category: ${categoryLabel.toUpperCase()} | Total: ${dataToExport.length} leads`],
        [],
        ['#', 'PRIORITY', 'SCORE', 'BUSINESS NAME', 'PHONE', 'EMAIL', 'ADDRESS', 'WEBSITE', 'RATING', 'ACTION', 'WIN %'],
      ];
      
      const dataRows = dataToExport.map((r, i) => [
        i + 1,
        (r.aiClassification || 'N/A').toUpperCase(),
        r.leadScore || 0,
        r.name || '',
        getPrimaryPhone(r) || '',
        getPrimaryEmail(r) || '',
        r.address || '',
        r.website || '',
        r.rating || '',
        r.recommendedAction === 'call' ? 'Call' : r.recommendedAction === 'both' ? 'Call + Email' : 'Email',
        r.successProbability ? `${r.successProbability}%` : '',
      ]);
      
      const allRows = [...titleRows, ...dataRows];
      const worksheet = XLSX.utils.aoa_to_sheet(allRows);
      
      // Column widths
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 8 }, { wch: 30 }, { wch: 18 },
        { wch: 28 }, { wch: 35 }, { wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 8 },
      ];
      
      // Merge title row
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      ];
      
      // Style title
      const titleStyle = { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1a1a2e' } }, alignment: { horizontal: 'center' } };
      const subtitleStyle = { font: { sz: 10, color: { rgb: 'AAAAAA' } }, fill: { fgColor: { rgb: '1a1a2e' } }, alignment: { horizontal: 'center' } };
      const headerStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0f4c75' } }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin', color: { rgb: '3282b8' } } } };
      
      if (worksheet['A1']) worksheet['A1'].s = titleStyle;
      if (worksheet['A2']) worksheet['A2'].s = subtitleStyle;
      
      // Style header row (row 4, index 3)
      const cols = 'ABCDEFGHIJK';
      for (const col of cols) {
        const cell = worksheet[`${col}4`];
        if (cell) cell.s = headerStyle;
      }
      
      // Style data rows by classification
      const classColors: Record<string, string> = { HOT: 'FFEBEE', WARM: 'FFF3E0', COLD: 'E3F2FD', 'N/A': 'F5F5F5' };
      const classTextColors: Record<string, string> = { HOT: 'C62828', WARM: 'E65100', COLD: '1565C0', 'N/A': '424242' };
      
      dataRows.forEach((row, rowIdx) => {
        const excelRow = rowIdx + 5; // offset for title rows
        const classification = String(row[1]);
        const bgColor = classColors[classification] || 'FFFFFF';
        const textColor = classTextColors[classification] || '000000';
        
        for (let colIdx = 0; colIdx < cols.length; colIdx++) {
          const cellRef = `${cols[colIdx]}${excelRow}`;
          const cell = worksheet[cellRef];
          if (cell) {
            cell.s = {
              fill: { fgColor: { rgb: bgColor } },
              font: { sz: 10, color: { rgb: colIdx === 1 ? textColor : '333333' } },
              border: { bottom: { style: 'hair', color: { rgb: 'DDDDDD' } } },
            };
            if (colIdx === 1) cell.s.font!.bold = true;
          }
        }
      });
      
      XLSX.utils.book_append_sheet(workbook, worksheet, `${categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1)} Leads`);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success(`Downloaded ${dataToExport.length} ${categoryLabel} leads as Excel`);
    }
  };

  // Professional PDF export using jsPDF
  const downloadLeadsPDF = (category: 'hot' | 'warm' | 'cold' | 'nosite' | 'all') => {
    let dataToExport: SearchResult[];
    let categoryLabel: string;
    
    if (category === 'all') {
      const base = selectedIds.size > 0 ? selectedLeads : classifiedLeads;
      dataToExport = [...base].sort(sortByClassification);
      categoryLabel = 'All Leads';
    } else if (category === 'nosite') {
      dataToExport = classifiedLeads.filter(l => !l.website || l.websiteAnalysis?.hasWebsite === false).sort(sortByClassification);
      categoryLabel = 'Leads Without Website';
    } else {
      dataToExport = classifiedLeads.filter(l => l.aiClassification === category).sort(sortByClassification);
      categoryLabel = `${category.charAt(0).toUpperCase() + category.slice(1)} Leads`;
    }
    
    if (dataToExport.length === 0) {
      toast.error(`No ${categoryLabel.toLowerCase()} to export`);
      return;
    }
    
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Header
    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 0, pageWidth, 28, 'F');
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text('BamLead Intelligence Report', 14, 13);
    pdf.setFontSize(9);
    pdf.setTextColor(180, 180, 200);
    pdf.text(`${categoryLabel} | ${dateStr} | ${dataToExport.length} leads | bamlead.com`, 14, 22);
    
    // Summary bar
    const hotCount = dataToExport.filter(l => l.aiClassification === 'hot').length;
    const warmCount = dataToExport.filter(l => l.aiClassification === 'warm').length;
    const coldCount = dataToExport.filter(l => l.aiClassification === 'cold').length;
    const withEmail = dataToExport.filter(l => !!getPrimaryEmail(l)).length;
    const withPhone = dataToExport.filter(l => !!getPrimaryPhone(l)).length;
    
    pdf.setFillColor(240, 245, 255);
    pdf.rect(0, 28, pageWidth, 10, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 100);
    pdf.text(`Summary:  🔥 Hot: ${hotCount}   ⚡ Warm: ${warmCount}   ❄ Cold: ${coldCount}   ✉ With Email: ${withEmail}   📞 With Phone: ${withPhone}`, 14, 34);
    
    // Table
    const tableData = dataToExport.map((r, i) => [
      String(i + 1),
      (r.aiClassification || 'N/A').toUpperCase(),
      String(r.leadScore || ''),
      r.name || '',
      getPrimaryPhone(r) || '—',
      getPrimaryEmail(r) || '—',
      r.address || '—',
      r.website || '—',
      r.rating ? `${r.rating}★` : '—',
      r.recommendedAction === 'call' ? 'Call' : r.recommendedAction === 'both' ? 'Call + Email' : 'Email',
    ]);
    
    const classRowColors: Record<string, [number, number, number]> = {
      HOT: [255, 235, 238],
      WARM: [255, 243, 224],
      COLD: [227, 242, 253],
    };
    
    autoTable(pdf, {
      startY: 40,
      head: [['#', 'Priority', 'Score', 'Business Name', 'Phone', 'Email', 'Address', 'Website', 'Rating', 'Action']],
      body: tableData,
      headStyles: { fillColor: [15, 76, 117], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 12 },
        3: { cellWidth: 40 },
        4: { cellWidth: 28 },
        5: { cellWidth: 40 },
        6: { cellWidth: 45 },
        7: { cellWidth: 35 },
        8: { halign: 'center', cellWidth: 14 },
        9: { halign: 'center', cellWidth: 22 },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 1) {
          const val = String(data.cell.raw);
          const color = classRowColors[val];
          if (color) {
            data.cell.styles.fillColor = color;
          }
          if (val === 'HOT') data.cell.styles.textColor = [198, 40, 40];
          else if (val === 'WARM') data.cell.styles.textColor = [230, 81, 0];
          else if (val === 'COLD') data.cell.styles.textColor = [21, 101, 192];
        }
      },
      margin: { top: 40 },
      didDrawPage: (data: any) => {
        // Footer on each page
        const pageCount = (pdf as any).internal.getNumberOfPages();
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `BamLead.com — Confidential Business Intelligence — Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2, pdf.internal.pageSize.getHeight() - 6, { align: 'center' }
        );
      },
    });
    
    pdf.save(`bamlead-${category}-leads-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(`Downloaded ${dataToExport.length} ${categoryLabel} as PDF`);
  };

  // Print specific category
  const printLeadsByCategory = (category: 'hot' | 'warm' | 'cold' | 'nosite' | 'all') => {
    // Generate PDF and open in new window for printing
    downloadLeadsPDF(category);
    toast.success('PDF generated — open the file and press Ctrl+P to print');
  };

  const handleDownloadCSV = () => {
    downloadLeadsByCategory('all', 'csv');
  };

  const handleDownloadExcel = () => {
    downloadLeadsByCategory('all', 'excel');
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
    const withPhone = leadsToUse.filter(l => getPrimaryPhone(l));
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
    const withPhone = leadsToUse.filter(l => getPrimaryPhone(l));
    
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

  // Format the restored timestamp for display
  const formatRestoredTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'earlier';
    }
  };

  // Handle manual save with visual feedback
  const handleManualSave = async () => {
    if (!onManualSave) return;
    
    const success = await onManualSave();
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
      // Add to version history
      const newVersion: LeadVersionSnapshot = {
        id: `v_${Date.now()}`,
        timestamp: new Date().toISOString(),
        leadCount: leads.length,
        leads: [...leads],
        query: localStorage.getItem('bamlead_query') || undefined,
        location: localStorage.getItem('bamlead_location') || undefined,
      };
      
      const updated = [newVersion, ...versionHistory].slice(0, 5);
      setVersionHistory(updated);
      localStorage.setItem('bamlead_lead_versions', JSON.stringify(updated));
    }
  };

  // Handle restore from version
  const handleRestoreVersion = (version: LeadVersionSnapshot) => {
    if (onRestoreVersion) {
      onRestoreVersion(version);
      setShowVersionHistory(false);
      toast.success(`Restored ${version.leadCount} leads from ${formatRestoredTime(version.timestamp)}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Data Backup Bar - Always visible when leads exist */}
      {leads.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-500/10 via-slate-500/5 to-transparent border border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Database className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {leads.length} leads in workspace
              </span>
              <span className="text-xs text-muted-foreground">
                {lastSavedAt 
                  ? `Last saved ${formatRestoredTime(lastSavedAt)}`
                  : 'Auto-saves every 60 seconds'
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Manual Save Button */}
            {onManualSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving}
                className={`gap-2 transition-all ${saveSuccess ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : ''}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Now
                  </>
                )}
              </Button>
            )}
            
            {/* Version History Dropdown */}
            {versionHistory.length > 0 && (
              <DropdownMenu open={showVersionHistory} onOpenChange={setShowVersionHistory}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    History
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {versionHistory.length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b mb-1">
                    Lead Snapshots (last 5 saves)
                  </div>
                  {versionHistory.map((version) => (
                    <DropdownMenuItem
                      key={version.id}
                      onClick={() => handleRestoreVersion(version)}
                      className="flex flex-col items-start gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{version.leadCount} leads</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatRestoredTime(version.timestamp)}
                        </span>
                      </div>
                      {version.query && (
                        <span className="text-xs text-muted-foreground pl-5 truncate max-w-full">
                          "{version.query}" in {version.location}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">
                    Click to restore a previous snapshot
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Search History Folders Button */}
            <Sheet open={showHistoryPanel} onOpenChange={setShowHistoryPanel}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Search History
                  {searchHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {searchHistory.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Search History
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <SearchHistoryFolder
                    folders={searchHistory.map(h => ({
                      id: h.id,
                      query: h.query,
                      location: h.location,
                      timestamp: h.timestamp,
                      leads: h.leads,
                      leadsCount: h.leadsCount,
                      hotCount: h.hotCount || 0,
                      warmCount: h.warmCount || 0,
                      coldCount: h.coldCount || 0,
                    }))}
                    onLoadSearch={(folder) => {
                      if (onLoadHistorySearch) {
                        onLoadHistorySearch({
                          id: folder.id,
                          query: folder.query,
                          location: folder.location,
                          leadsCount: folder.leadsCount,
                          timestamp: folder.timestamp,
                          leads: folder.leads,
                        });
                        setShowHistoryPanel(false);
                        toast.success(`Loaded ${folder.leadsCount} leads from "${folder.query}"`);
                      }
                    }}
                    onDeleteFolder={(folderId) => {
                      const updated = searchHistory.filter(h => h.id !== folderId);
                      setSearchHistory(updated);
                      localStorage.setItem('bamlead_search_history_permanent', JSON.stringify(updated));
                    }}
                    onOpenReport={(folder) => {
                      // First load the leads, then open report
                      if (onLoadHistorySearch) {
                        onLoadHistorySearch({
                          id: folder.id,
                          query: folder.query,
                          location: folder.location,
                          leadsCount: folder.leadsCount,
                          timestamp: folder.timestamp,
                          leads: folder.leads,
                        });
                        setShowHistoryPanel(false);
                        // Small delay to let leads load, then open report
                        setTimeout(() => {
                          if (onOpenReport) onOpenReport();
                        }, 100);
                      }
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Database className="w-3 h-3 mr-1" />
              Auto-save ON
            </Badge>
          </div>
        </div>
      )}

      {/* Restored Session Banner */}
      {restoredFromSession && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20">
              <History className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-emerald-400">
                ✅ Leads Restored from {restoredFromSession.source === 'database' ? 'Cloud Backup' : 'Your Session'}
              </span>
              <span className="text-xs text-muted-foreground">
                {restoredFromSession.leadCount} leads from your search {formatRestoredTime(restoredFromSession.timestamp)}
              </span>
            </div>
          </div>
          {onDismissRestored && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={onDismissRestored}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

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

        {/* Center - Tools */}
        <div className="flex items-center gap-6">
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
              <DropdownMenuContent className="w-64 max-h-[500px] overflow-y-auto">
                {/* All Leads */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">All Leads ({groupedCounts.all})</div>
                <DropdownMenuItem onClick={handleDownloadCSV}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  All Leads — CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  All Leads — Excel (Styled)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadLeadsPDF('all')}>
                  <FileText className="w-4 h-4 mr-2" />
                  All Leads — PDF Report
                </DropdownMenuItem>
                
                {/* Hot Leads */}
                {groupedCounts.hot > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-red-500 border-t mt-1 pt-2 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Hot Leads ({groupedCounts.hot})
                    </div>
                    <DropdownMenuItem onClick={() => downloadLeadsByCategory('hot', 'csv')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-red-500" />
                      Hot — CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadLeadsByCategory('hot', 'excel')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-red-500" />
                      Hot — Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadLeadsPDF('hot')}>
                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                      Hot — PDF Report
                    </DropdownMenuItem>
                  </>
                )}
                
                {/* Warm Leads */}
                {groupedCounts.warm > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-orange-500 border-t mt-1 pt-2 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> Warm Leads ({groupedCounts.warm})
                    </div>
                    <DropdownMenuItem onClick={() => downloadLeadsByCategory('warm', 'csv')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-orange-500" />
                      Warm — CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadLeadsByCategory('warm', 'excel')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-orange-500" />
                      Warm — Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadLeadsPDF('warm')}>
                      <FileText className="w-4 h-4 mr-2 text-orange-500" />
                      Warm — PDF Report
                    </DropdownMenuItem>
                  </>
                )}
                
                {/* Cold Leads */}
                {groupedCounts.cold > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-blue-500 border-t mt-1 pt-2 flex items-center gap-1">
                      <Snowflake className="w-3 h-3" /> Cold Leads ({groupedCounts.cold})
                    </div>
                    <DropdownMenuItem onClick={() => downloadLeadsByCategory('cold', 'csv')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-500" />
                      Cold — CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadLeadsByCategory('cold', 'excel')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-500" />
                      Cold — Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadLeadsPDF('cold')}>
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      Cold — PDF Report
                    </DropdownMenuItem>
                  </>
                )}

                {/* No Website Leads */}
                {groupedCounts.nosite > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-purple-500 border-t mt-1 pt-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> No Website ({groupedCounts.nosite})
                    </div>
                    <DropdownMenuItem onClick={() => downloadLeadsPDF('nosite')}>
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      No Website — PDF Report
                    </DropdownMenuItem>
                  </>
                )}
                
                <div className="border-t mt-1 pt-1">
                  <DropdownMenuItem onClick={() => printLeadsByCategory('all')}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print All Leads (PDF)
                  </DropdownMenuItem>
                  {groupedCounts.hot > 0 && (
                    <DropdownMenuItem onClick={() => printLeadsByCategory('hot')}>
                      <Printer className="w-4 h-4 mr-2 text-red-500" />
                      Print Hot Leads
                    </DropdownMenuItem>
                  )}
                  {groupedCounts.warm > 0 && (
                    <DropdownMenuItem onClick={() => printLeadsByCategory('warm')}>
                      <Printer className="w-4 h-4 mr-2 text-orange-500" />
                      Print Warm Leads
                    </DropdownMenuItem>
                  )}
                  {groupedCounts.cold > 0 && (
                    <DropdownMenuItem onClick={() => printLeadsByCategory('cold')}>
                      <Printer className="w-4 h-4 mr-2 text-blue-500" />
                      Print Cold Leads
                    </DropdownMenuItem>
                  )}
                  {groupedCounts.nosite > 0 && (
                    <DropdownMenuItem onClick={() => printLeadsByCategory('nosite')}>
                      <Printer className="w-4 h-4 mr-2 text-purple-500" />
                      Print No-Website Leads
                    </DropdownMenuItem>
                  )}
                </div>
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
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            onClick={handleProceedToCall}
          >
            <Phone className="w-4 h-4" />
            Call Leads
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

      {/* Email Source Breakdown */}
      {emailSourceBreakdown.totalWithEmail > 0 && Object.keys(emailSourceBreakdown.breakdown).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            📧 Email Sources:
          </span>
          {Object.entries(emailSourceBreakdown.breakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([source, count]) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                title={`${count} leads found emails via ${source}`}
              >
                {source}: <span className="font-bold">{count}</span>
              </span>
            ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            ({emailSourceBreakdown.totalWithEmail} total with email)
          </span>
        </div>
      )}


      {/* Filters & Search Row */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'All', icon: Users, count: groupedCounts.all, color: '', activeColor: 'bg-primary' },
          { key: 'hot', label: 'Hot', icon: Flame, count: groupedCounts.hot, color: 'text-red-500', activeColor: 'bg-red-500 hover:bg-red-600' },
          { key: 'warm', label: 'Warm', icon: Thermometer, count: groupedCounts.warm, color: 'text-orange-500', activeColor: 'bg-orange-500 hover:bg-orange-600' },
          { key: 'cold', label: 'Cold', icon: Snowflake, count: groupedCounts.cold, color: 'text-blue-500', activeColor: 'bg-blue-500 hover:bg-blue-600' },
          { key: 'withEmail', label: 'Has Email', icon: Mail, count: groupedCounts.withEmail, color: 'text-cyan-500', activeColor: 'bg-cyan-500 hover:bg-cyan-600' },
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

      {/* Search + History */}
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

        {/* Search History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
              <History className="w-4 h-4" />
              History
              {searchHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-amber-500/20 text-amber-400">
                  {searchHistory.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            {searchHistory.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No search history yet</p>
                <p className="text-xs mt-1">Your previous searches will appear here</p>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground">Previous Searches</p>
                </div>
                {searchHistory.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => {
                      if (onLoadHistorySearch) {
                        onLoadHistorySearch(item);
                        toast.success(`Loaded "${item.query}" search results`, {
                          description: `${item.leadsCount} leads from ${new Date(item.timestamp).toLocaleDateString()}`
                        });
                      } else {
                        toast.info('Search history restore coming soon!');
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Search className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate flex-1">{item.query}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.leadsCount} leads
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                      {item.location && (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{item.location}</span>
                          <span>•</span>
                        </>
                      )}
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <div className="border-t border-border p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-red-500"
                    onClick={() => {
                      setSearchHistory([]);
                      localStorage.removeItem('bamlead_search_history_permanent');
                      toast.success('Search history cleared');
                    }}
                  >
                    Clear History
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Card */}
      <Card className="border-border">
        <CardContent className="p-0">
          {/* Table with dual horizontal scrollbars (top and bottom) */}
          <DualScrollbar className="h-[450px]">
            <Table
              noWrapper
              className="w-max table-fixed [&_th]:px-3 [&_td]:px-3"
              style={{ minWidth: '1300px' }}
            >
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
                    <TableHead className="min-w-[180px]">Business Name</TableHead>
                    <TableHead className="w-[140px]">Socials</TableHead>
                    <TableHead className="w-[120px]">Email</TableHead>
                    <TableHead className="w-[120px]">Phone</TableHead>
                    <TableHead className="w-24 min-w-[80px]">Timing</TableHead>
                    <TableHead className="w-28 min-w-[100px]">Best Action</TableHead>
                    <TableHead className="w-[170px]">Pain Points</TableHead>
                    <TableHead className="w-[220px]">Recommended Approach</TableHead>
                    <TableHead className="w-[100px] text-center">Quick Call</TableHead>
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
                        <TableCell className="min-w-[180px]">
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[160px]" title={lead.name}>{lead.name}</p>
                            {getSourceBadges(lead.sources)}
                          </div>
                        </TableCell>
                        <TableCell className="w-[140px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {lead.website ? (
                              <WebsitePreviewIcon
                                website={lead.website}
                                businessName={lead.name}
                                size="md"
                                tooltipTitle="Preview Website"
                                triggerClassName="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 hover:text-emerald-400 transition-all hover:scale-110"
                              />
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/50 text-muted-foreground/50" title="No website">
                                <Globe className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <SocialMediaLookup
                              businessName={lead.name}
                              location={lead.address}
                              size="md"
                              enrichment={undefined}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPrimaryEmail(lead) ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm truncate max-w-[160px]">{getPrimaryEmail(lead)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {getPrimaryPhone(lead) ? (
                            <a 
                              href={`tel:${getPrimaryPhone(lead).replace(/[^+\d]/g, '')}`}
                              className="text-sm text-green-500 hover:text-green-400 hover:underline flex items-center gap-1 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`Calling ${lead.name}...`, { description: getPrimaryPhone(lead) });
                              }}
                            >
                              <Phone className="w-3 h-3" />
                              {getPrimaryPhone(lead)}
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
                        <TableCell className="text-xs text-muted-foreground w-[170px] truncate" title={painPointsDisplay}>
                          {painPointsDisplay}
                        </TableCell>
                        <TableCell className="text-xs w-[220px]">
                          {lead.recommendedAction === 'call' ? (
                            <span className="text-green-500 font-medium">Direct call - explain value</span>
                          ) : lead.recommendedAction === 'both' ? (
                            <span className="text-purple-500 font-medium">Multi-channel approach</span>
                          ) : (
                            <span className="text-blue-500 font-medium">Send case study email</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {lead.phone ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProceedToCall([lead]);
                                toast.success(`Routing ${lead.name} to AI Calling...`);
                              }}
                              className="gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs px-3 py-1 h-7 font-semibold shadow-md shadow-amber-500/20"
                            >
                              <PhoneCall className="w-3 h-3" /> Quick Call
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No phone</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </DualScrollbar>

          {/* Bottom Action Bar - Next Step */}
          {leads.length > 0 && (
            <div className="px-4 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedIds.size > 0 
                  ? `${selectedIds.size} leads selected` 
                  : `Ready to proceed with ${leads.length} leads`}
              </p>
              <Button 
                onClick={handleProceedToEmail} 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
              >
                Next: Email Outreach
                <ChevronRight className="w-4 h-4" />
              </Button>
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
