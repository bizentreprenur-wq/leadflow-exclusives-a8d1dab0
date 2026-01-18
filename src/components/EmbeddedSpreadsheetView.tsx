import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft, Download, ChevronDown,
  Globe, Phone, MapPin, ExternalLink,
  FileSpreadsheet, FileDown, Flame, Thermometer, Snowflake, Clock, 
  PhoneCall, Users, Mail,
  Target, Zap, Brain, Rocket, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, FileText, Printer, Loader2, RotateCcw, History
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CRMIntegrationModal from './CRMIntegrationModal';
import EmailScheduleModal from './EmailScheduleModal';
import LeadCallModal from './LeadCallModal';
import CallQueueModal from './CallQueueModal';
import CreditsUpsellModal from './CreditsUpsellModal';
import LeadActionChoiceModal from './LeadActionChoiceModal';
import LeadReportDocument from './LeadReportDocument';
import EmailTransitionModal from './EmailTransitionModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  bestTimeToCall?: string;
  readyToCall?: boolean;
  painPoints?: string[];
  urgencyLevel?: 'high' | 'medium' | 'low';
  recommendedApproach?: string;
  conversionProbability?: number;
  industry?: string;
  employeeCount?: string;
  annualRevenue?: string;
}

interface EmbeddedSpreadsheetViewProps {
  leads: SearchResult[];
  savedLeads?: SearchResult[];
  onProceedToVerify: (leads: SearchResult[]) => void;
  onSaveToDatabase?: (leads: SearchResult[]) => void;
  onSendToEmail?: (leads: SearchResult[]) => void;
  onBack: () => void;
  onOpenEmailSettings?: () => void;
  isLoading?: boolean;
  loadingProgress?: number;
}

export default function EmbeddedSpreadsheetView({
  leads: externalLeads,
  savedLeads = [],
  onProceedToVerify,
  onSaveToDatabase,
  onSendToEmail,
  onBack,
  onOpenEmailSettings,
  isLoading = false,
  loadingProgress = 0,
}: EmbeddedSpreadsheetViewProps) {
  // Use external leads directly - no fake data generation
  const leads = externalLeads;
  // Initialize selectedIds from localStorage for session persistence
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bamlead_selected_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load selected leads from localStorage:', e);
    }
    return new Set();
  });
  const [activeGroup, setActiveGroup] = useState<'all' | 'hot' | 'warm' | 'cold' | 'ready' | 'nowebsite'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'score' | 'rating' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCallQueueModal, setShowCallQueueModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [callLead, setCallLead] = useState<SearchResult | null>(null);
  const [callQueueLeads, setCallQueueLeads] = useState<SearchResult[]>([]);
  const [userCredits] = useState(25);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [showEmailShare, setShowEmailShare] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailTransition, setShowEmailTransition] = useState(false);

  // State for auto-open PDF - Check if returning user
  const isReturningUser = localStorage.getItem('bamlead_step2_visited') === 'true';
  const [hasAutoOpenedPDF, setHasAutoOpenedPDF] = useState(isReturningUser);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showPDFReadyBanner, setShowPDFReadyBanner] = useState(false);
  
  // Auto-open Lead Report Document popup - Only for first-time visitors AND if leads exist
  const [showLeadReportDocument, setShowLeadReportDocument] = useState(!isReturningUser && leads.length > 0);
  
  // SMTP Status - Check localStorage for configuration
  const [smtpConfigured, setSmtpConfigured] = useState(() => {
    const smtpSettings = localStorage.getItem('smtp_config');
    if (smtpSettings) {
      const config = JSON.parse(smtpSettings);
      return config.username && config.password;
    }
    return false;
  });

  // Persist selectedIds to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bamlead_selected_leads', JSON.stringify([...selectedIds]));
    } catch (e) {
      console.error('Failed to save selected leads to localStorage:', e);
    }
  }, [selectedIds]);

  // Clear selections when external leads change (new search)
  useEffect(() => {
    if (externalLeads.length > 0) {
      // When new search results come in, validate selections against new lead IDs
      const validLeadIds = new Set(externalLeads.map(l => l.id));
      setSelectedIds(prev => {
        const validSelections = new Set([...prev].filter(id => validLeadIds.has(id)));
        // If no valid selections remain, don't keep stale ones
        if (validSelections.size === 0 && prev.size > 0) {
          localStorage.removeItem('bamlead_selected_leads');
          return new Set();
        }
        return validSelections;
      });
    }
  }, [externalLeads]);

  const groupedLeads = useMemo(() => {
    const hot = leads.filter(l => l.aiClassification === 'hot');
    const warm = leads.filter(l => l.aiClassification === 'warm');
    const cold = leads.filter(l => l.aiClassification === 'cold');
    const readyToCall = leads.filter(l => l.readyToCall);
    const noWebsite = leads.filter(l => !l.websiteAnalysis?.hasWebsite);
    
    return { hot, warm, cold, readyToCall, noWebsite, all: leads };
  }, [leads]);

  const currentLeads = useMemo(() => {
    let filtered: SearchResult[];
    switch (activeGroup) {
      case 'hot': filtered = leads.filter(l => l.aiClassification === 'hot'); break;
      case 'warm': filtered = leads.filter(l => l.aiClassification === 'warm'); break;
      case 'cold': filtered = leads.filter(l => l.aiClassification === 'cold'); break;
      case 'ready': filtered = leads.filter(l => l.readyToCall); break;
      case 'nowebsite': filtered = leads.filter(l => !l.websiteAnalysis?.hasWebsite); break;
      default: filtered = leads;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(l => 
        l.name?.toLowerCase().includes(query) ||
        l.phone?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let valA: string | number = 0;
        let valB: string | number = 0;
        
        switch (sortColumn) {
          case 'name':
            valA = a.name?.toLowerCase() || '';
            valB = b.name?.toLowerCase() || '';
            break;
          case 'score':
            valA = a.leadScore || 0;
            valB = b.leadScore || 0;
            break;
          case 'rating':
            valA = a.rating || 0;
            valB = b.rating || 0;
            break;
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [activeGroup, leads, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: 'name' | 'score' | 'rating') => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: 'name' | 'score' | 'rating') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const handleGroupChange = (group: typeof activeGroup) => {
    setActiveGroup(group);
    // Auto-select ALL leads in the selected group (except 'all')
    let filteredLeads: SearchResult[] = [];
    
    switch (group) {
      case 'hot': filteredLeads = leads.filter(l => l.aiClassification === 'hot'); break;
      case 'warm': filteredLeads = leads.filter(l => l.aiClassification === 'warm'); break;
      case 'cold': filteredLeads = leads.filter(l => l.aiClassification === 'cold'); break;
      case 'ready': filteredLeads = leads.filter(l => l.readyToCall); break;
      case 'nowebsite': filteredLeads = leads.filter(l => !l.websiteAnalysis?.hasWebsite); break;
      default: filteredLeads = [];
    }
    
    if (group !== 'all') {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
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

  const handleAIVerifyClick = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead to verify');
      return;
    }
    setShowVerifyConfirm(true);
  };

  const handleConfirmVerify = () => {
    if (userCredits < selectedLeads.length) {
      setShowVerifyConfirm(false);
      setShowCreditsModal(true);
      return;
    }
    setShowVerifyConfirm(false);
    onProceedToVerify(selectedLeads);
    toast.success(`Sending ${selectedLeads.length} leads to AI verification`);
  };

  const handleCallLead = (lead: SearchResult) => {
    setCallLead(lead);
    setShowCallModal(true);
  };

  const handleOpenActionChoice = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    setShowActionChoice(true);
  };

  const handleCallFromChoice = () => {
    if (selectedLeads.length === 1) {
      setCallLead(selectedLeads[0]);
      setShowCallModal(true);
    } else {
      setCallQueueLeads(selectedLeads);
      setShowCallQueueModal(true);
    }
  };

  const handleEmailFromChoice = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead to email');
      return;
    }
    // Show transition modal instead of directly proceeding
    setShowEmailTransition(true);
  };

  const handleConfirmEmailTransition = () => {
    setShowEmailTransition(false);
    if (onSendToEmail) {
      onSendToEmail(selectedLeads);
    }
  };

  const handleAIVerifyFromChoice = () => {
    setShowVerifyConfirm(true);
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead to delete');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    // Remove selected leads from the view
    const remainingLeads = leads.filter(l => !selectedIds.has(l.id));
    // Clear selection
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
    toast.success(`Removed ${selectedLeads.length} leads from the list`);
    // Note: In a real app, you'd call a parent callback to update the leads state
  };

  const handleExportCSV = () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : currentLeads;
    
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Website', 'Rating', 'AI Score', 'Classification', 'Best Time to Call', 'Ready to Call', 'Pain Points', 'Recommended Approach', 'Conversion %', 'Industry'];
    const rows = dataToExport.map(r => [
      `"${r.name || ''}"`,
      `"${r.email || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.address || ''}"`,
      `"${r.website || 'No Website'}"`,
      r.rating || '',
      r.leadScore || '',
      r.aiClassification?.toUpperCase() || '',
      `"${r.bestTimeToCall || ''}"`,
      r.readyToCall ? 'Yes' : 'No',
      `"${r.painPoints?.join('; ') || ''}"`,
      `"${r.recommendedApproach || ''}"`,
      `${r.conversionProbability || 0}%`,
      `"${r.industry || ''}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-design-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} leads as CSV`);
  };

  const handleExportExcel = () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : currentLeads;
    
    const worksheetData = dataToExport.map(r => ({
      'Business Name': r.name || '',
      'Email': r.email || '',
      'Phone': r.phone || '',
      'Address': r.address || '',
      'Website': r.website || 'No Website',
      'Rating': r.rating || '',
      'AI Score': r.leadScore || '',
      'Classification': r.aiClassification?.toUpperCase() || '',
      'Best Time to Call': r.bestTimeToCall || '',
      'Ready to Call': r.readyToCall ? 'Yes' : 'No',
      'Conversion Probability': `${r.conversionProbability || 0}%`,
      'Pain Points': r.painPoints?.join('; ') || '',
      'Recommended Approach': r.recommendedApproach || '',
      'Urgency': r.urgencyLevel?.toUpperCase() || '',
      'Industry': r.industry || '',
      'Platform': r.websiteAnalysis?.platform || '',
      'Mobile Score': r.websiteAnalysis?.mobileScore || '',
      'Issues': r.websiteAnalysis?.issues?.join('; ') || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `website-design-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${dataToExport.length} leads as Excel`);
  };

  const handleExportPDF = (preview: boolean = false) => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : currentLeads;
    
    if (dataToExport.length === 0) {
      toast.error('No leads to export');
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('BamLead Intelligence Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Total Leads: ${dataToExport.length}`, pageWidth / 2, 34, { align: 'center' });
    
    // Summary stats
    const hotCount = dataToExport.filter(l => l.aiClassification === 'hot').length;
    const warmCount = dataToExport.filter(l => l.aiClassification === 'warm').length;
    const coldCount = dataToExport.filter(l => l.aiClassification === 'cold').length;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Lead Summary', 14, 48);
    
    doc.setFontSize(10);
    doc.setTextColor(239, 68, 68);
    doc.text(`🔥 HOT LEADS: ${hotCount} - Call immediately!`, 14, 56);
    doc.setTextColor(245, 158, 11);
    doc.text(`⚡ WARM LEADS: ${warmCount} - Email first, then call`, 14, 62);
    doc.setTextColor(59, 130, 246);
    doc.text(`❄️ COLD LEADS: ${coldCount} - Nurture with content`, 14, 68);
    
    let yPos = 80;
    
    // Hot leads section
    const hotLeads = dataToExport.filter(l => l.aiClassification === 'hot');
    if (hotLeads.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('🔥 HOT LEADS - Contact Today', 14, yPos);
      yPos += 8;
      
      const hotData = hotLeads.slice(0, 20).map(l => [
        l.name.substring(0, 25),
        l.phone || 'N/A',
        l.email?.substring(0, 25) || 'N/A',
        `${l.leadScore || 0}%`
      ]);
      
      autoTable(doc, {
        head: [['Business', 'Phone', 'Email', 'Score']],
        body: hotData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Warm leads
    const warmLeads = dataToExport.filter(l => l.aiClassification === 'warm');
    if (warmLeads.length > 0 && yPos < 240) {
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('⚡ WARM LEADS - Email First', 14, yPos);
      yPos += 8;
      
      const warmData = warmLeads.slice(0, 15).map(l => [
        l.name.substring(0, 25),
        l.phone || 'N/A',
        l.email?.substring(0, 25) || 'N/A',
        `${l.leadScore || 0}%`
      ]);
      
      autoTable(doc, {
        head: [['Business', 'Phone', 'Email', 'Score']],
        body: warmData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 11] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Cold leads on new page if needed
    const coldLeads = dataToExport.filter(l => l.aiClassification === 'cold');
    if (coldLeads.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text('❄️ COLD LEADS - Nurture', 14, yPos);
      yPos += 8;
      
      const coldData = coldLeads.slice(0, 15).map(l => [
        l.name.substring(0, 25),
        l.phone || 'N/A',
        l.email?.substring(0, 25) || 'N/A',
        `${l.leadScore || 0}%`
      ]);
      
      autoTable(doc, {
        head: [['Business', 'Phone', 'Email', 'Score']],
        body: coldData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }
    
    if (preview) {
      // Generate data URL for preview
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfDataUrl(url);
      setShowPDFPreview(true);
    } else {
      doc.save(`bamlead-leads-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`Exported ${dataToExport.length} leads as PDF`);
    }
  };

  const handleDownloadPDFFromPreview = () => {
    handleExportPDF(false);
    setShowPDFPreview(false);
    if (pdfDataUrl) {
      URL.revokeObjectURL(pdfDataUrl);
      setPdfDataUrl(null);
    }
  };

  const closePDFPreview = () => {
    setShowPDFPreview(false);
    if (pdfDataUrl) {
      URL.revokeObjectURL(pdfDataUrl);
      setPdfDataUrl(null);
    }
  };

  const handleEmailShare = async () => {
    if (!emailRecipient.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRecipient)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSendingEmail(true);
    
    // Simulate email sending (in production, this would call a backend API)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`PDF report sent to ${emailRecipient}!`);
      setEmailRecipient('');
      setShowEmailShare(false);
    } catch (error) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handler for View PDF button - asks to regenerate if already opened
  const handleViewPDFClick = () => {
    if (hasAutoOpenedPDF && pdfDataUrl) {
      // PDF was already generated, ask if they want to regenerate
      setShowRegenerateConfirm(true);
    } else {
      // First time, just generate
      handleExportPDF(true);
      setHasAutoOpenedPDF(true);
    }
  };

  const handleRegeneratePDF = () => {
    setShowRegenerateConfirm(false);
    handleExportPDF(true);
  };

  const handleViewExistingPDF = () => {
    setShowRegenerateConfirm(false);
    setShowPDFPreview(true);
  };

  // Show PDF ready banner when component mounts - only for first-time visitors
  useEffect(() => {
    if (!isReturningUser && !hasAutoOpenedPDF && leads.length > 0) {
      const timer = setTimeout(() => {
        setShowPDFReadyBanner(true);
        setHasAutoOpenedPDF(true);
        // Mark as visited so returning users skip the popup
        localStorage.setItem('bamlead_step2_visited', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [leads, hasAutoOpenedPDF, isReturningUser]);

  const handleOpenPDFFromBanner = () => {
    setShowPDFReadyBanner(false);
    handleExportPDF(true);
  };

  const getClassificationBadge = (classification?: string) => {
    switch (classification) {
      case 'hot':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1"><Flame className="w-3 h-3" /> HOT</Badge>;
      case 'warm':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 gap-1"><Thermometer className="w-3 h-3" /> WARM</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 gap-1"><Snowflake className="w-3 h-3" /> COLD</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRowClassName = (lead: SearchResult) => {
    const isSelected = selectedIds.has(lead.id);
    let baseClass = 'transition-colors cursor-pointer ';
    
    if (isSelected) {
      baseClass += 'bg-primary/10 ';
    }
    
    switch (lead.aiClassification) {
      case 'hot':
        return baseClass + (isSelected ? 'bg-red-500/20' : 'hover:bg-red-500/10');
      case 'warm':
        return baseClass + (isSelected ? 'bg-orange-500/20' : 'hover:bg-orange-500/10');
      case 'cold':
        return baseClass + (isSelected ? 'bg-blue-500/20' : 'hover:bg-blue-500/10');
      default:
        return baseClass + 'hover:bg-muted/50';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-background rounded-xl border overflow-hidden relative">
      
      {/* BIG PDF Ready Banner */}
      {showPDFReadyBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🎉 Your Leads PDF is Ready!
            </h2>
            <p className="text-white/80 mb-6">
              We found <span className="font-bold text-white">{leads.length.toLocaleString()} leads</span> for you!
              <br />Click below to view your PDF report.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleOpenPDFFromBanner}
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6"
              >
                <FileText className="w-5 h-5 mr-2" />
                👉 View My PDF Report
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowPDFReadyBanner(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                View spreadsheet instead
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Report Document Auto-Popup */}
      <LeadReportDocument
        open={showLeadReportDocument}
        onClose={() => setShowLeadReportDocument(false)}
        leads={leads}
        searchQuery="Business Leads"
        location="Your Area"
      />

      {/* VIEW PREVIOUS REPORTS BUTTON - Before the main spreadsheet */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">📂 Have a previous search?</p>
              <p className="text-sm text-muted-foreground">
                View your saved reports and lead lists from earlier sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLeadReportDocument(true)}
              className="gap-2 border-indigo-500/50 text-indigo-600 hover:bg-indigo-500/10"
            >
              <FileText className="w-4 h-4" />
              View Current Report
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                // Check if there are saved leads from previous sessions
                const savedSelections = localStorage.getItem('bamlead_selected_leads');
                const savedLeadsCount = savedSelections ? JSON.parse(savedSelections).length : 0;
                
                if (savedLeadsCount > 0) {
                  toast.success(`Found ${savedLeadsCount} leads from your last session!`, {
                    description: 'These leads are automatically selected for you.',
                    duration: 5000,
                  });
                } else {
                  toast.info('No previous selections found. Start by selecting leads from the list below!');
                }
              }}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <RotateCcw className="w-4 h-4" />
              Load Previous Selection ({
                (() => {
                  try {
                    const saved = localStorage.getItem('bamlead_selected_leads');
                    return saved ? JSON.parse(saved).length : 0;
                  } catch { return 0; }
                })()
              })
            </Button>
          </div>
        </div>
      </div>

      {/* STEP 2 Header with Instructions */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border-b">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="px-4 py-3 bg-primary/5 border-b border-primary/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-medium text-primary text-sm">Loading leads...</span>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-primary min-w-[60px] text-right">
                {Math.round(loadingProgress)}%
              </span>
            </div>
            {externalLeads.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                ✨ Showing {externalLeads.length.toLocaleString()} leads so far — more arriving!
              </p>
            )}
          </div>
        )}
        
        {/* Welcome & Instructions - Compact */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2 shrink-0">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {/* Step Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full border border-blue-500/30">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <span className="font-semibold text-blue-600 text-sm">STEP 2: Review Your Leads</span>
              </div>
            </div>
            
            {/* Lead Count Badge */}
            <Badge variant="outline" className="gap-2 px-3 py-1.5 text-sm shrink-0">
              <Users className="w-4 h-4" />
              <span className="font-bold">{leads.length.toLocaleString()}</span> Leads
              {isLoading && <span className="text-xs text-muted-foreground">(loading...)</span>}
            </Badge>
          </div>
        </div>
        
        {/* AI Intelligence Summary - Section Labeled */}
        <div className="px-4 py-2 border-t border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Summary:</span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 rounded-md">
                  <Flame className="w-3 h-3 text-red-500" />
                  <span className="font-bold text-red-600 text-sm">{groupedLeads.hot.length}</span>
                  <span className="text-xs text-red-500">Hot</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 rounded-md">
                  <Thermometer className="w-3 h-3 text-orange-500" />
                  <span className="font-bold text-orange-600 text-sm">{groupedLeads.warm.length}</span>
                  <span className="text-xs text-orange-500">Warm</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 rounded-md">
                  <Snowflake className="w-3 h-3 text-blue-500" />
                  <span className="font-bold text-blue-600 text-sm">{groupedLeads.cold.length}</span>
                  <span className="text-xs text-blue-500">Cold</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-md">
                  <PhoneCall className="w-3 h-3 text-emerald-500" />
                  <span className="font-bold text-emerald-600 text-sm">{groupedLeads.readyToCall.length}</span>
                  <span className="text-xs text-emerald-500">Ready</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 rounded-md">
                  <Globe className="w-3 h-3 text-purple-500" />
                  <span className="font-bold text-purple-600 text-sm">{groupedLeads.noWebsite.length}</span>
                  <span className="text-xs text-purple-500">No Site</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLeadReportDocument(true)}
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
            >
              <FileText className="w-4 h-4" />
              View Report
            </Button>
          </div>
        </div>
        
        {/* HOW TO USE THIS PAGE - Instructions */}
        <div className="px-4 py-3 border-t border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-700 text-sm mb-1">📋 How to Use This Page:</h3>
              <ol className="text-xs text-amber-600/90 space-y-0.5 list-decimal list-inside">
                <li><strong>Filter leads</strong> by clicking Hot 🔥, Warm ⚡, Cold ❄️, Ready 📞, or No Website 🌐 below</li>
                <li><strong>Select leads</strong> by clicking on rows or using the checkboxes</li>
                <li><strong>AI Verify your leads</strong> (uses credits) to confirm contact info is accurate ✨</li>
                <li><strong>Take action</strong> - Call 📞, Email 📧, or Export your selected leads</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* AI VERIFY REMINDER - Flashing */}
        <div className="px-4 py-2 border-t border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-5 h-5 text-amber-600 animate-bounce" />
            <span className="font-bold text-amber-700">⚠️ REMEMBER: AI Verify your leads before contacting them! This ensures accurate contact info.</span>
            <Brain className="w-5 h-5 text-amber-600 animate-bounce" />
          </div>
        </div>
        
        {/* SMTP STATUS BANNER */}
        <div className={`px-4 py-2 border-t ${smtpConfigured ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-blue-500/30 bg-blue-500/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${smtpConfigured ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                <Mail className={`w-4 h-4 ${smtpConfigured ? 'text-emerald-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${smtpConfigured ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {smtpConfigured ? '✅ Email Sending Ready' : '📧 Email Setup Required'}
                  </span>
                  {smtpConfigured ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : null}
                </div>
                <p className={`text-xs ${smtpConfigured ? 'text-emerald-600/80' : 'text-blue-600/80'}`}>
                  {smtpConfigured 
                    ? 'Your SMTP is configured. You can send emails to leads!' 
                    : 'Configure your SMTP settings to send emails to leads'
                  }
                </p>
              </div>
            </div>
            <Button
              variant={smtpConfigured ? 'outline' : 'default'}
              size="sm"
              onClick={() => onOpenEmailSettings?.()}
              className={smtpConfigured 
                ? 'gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10' 
                : 'gap-2 bg-blue-500 hover:bg-blue-600 text-white'
              }
            >
              <Mail className="w-4 h-4" />
              {smtpConfigured ? 'Email Settings' : 'Set Up Email →'}
            </Button>
          </div>
        </div>
      </div>

      {/* PROMINENT CTA BANNER - Encourage proceeding to Step 3 */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-3 border-t border-b-2 border-blue-500/50 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl animate-bounce">
                📧
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  Ready to reach out to {selectedIds.size} leads?
                </p>
                <p className="text-sm text-muted-foreground">
                  Continue to Step 3 to choose templates and send email campaigns
                </p>
              </div>
            </div>
            <Button 
              onClick={handleEmailFromChoice}
              size="lg"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg animate-pulse"
            >
              <Mail className="w-5 h-5" />
              Continue to Email Outreach →
            </Button>
          </div>
        </div>
      )}

      {/* SECTION: Filter by Lead Type - Compact */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Filter:</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={activeGroup === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGroupChange('all')}
                className="gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                All ({leads.length})
              </Button>
              <Button
                variant={activeGroup === 'hot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGroupChange('hot')}
                className={`gap-1.5 ${activeGroup === 'hot' ? 'bg-red-500 hover:bg-red-600' : 'border-red-500/30 hover:bg-red-500/10'}`}
              >
                <Flame className={`w-3.5 h-3.5 ${activeGroup === 'hot' ? 'text-white' : 'text-red-500'}`} />
                🔥 Hot ({groupedLeads.hot.length})
              </Button>
              <Button
                variant={activeGroup === 'warm' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGroupChange('warm')}
                className={`gap-1.5 ${activeGroup === 'warm' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-500/30 hover:bg-orange-500/10'}`}
              >
                <Thermometer className={`w-3.5 h-3.5 ${activeGroup === 'warm' ? 'text-white' : 'text-orange-500'}`} />
                ⚡ Warm ({groupedLeads.warm.length})
              </Button>
              <Button
                variant={activeGroup === 'cold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGroupChange('cold')}
                className={`gap-1.5 ${activeGroup === 'cold' ? 'bg-blue-500 hover:bg-blue-600' : 'border-blue-500/30 hover:bg-blue-500/10'}`}
              >
                <Snowflake className={`w-3.5 h-3.5 ${activeGroup === 'cold' ? 'text-white' : 'text-blue-500'}`} />
                ❄️ Cold ({groupedLeads.cold.length})
              </Button>
              <div className="h-6 w-px bg-border hidden md:block" />
              <Button
                variant={activeGroup === 'ready' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGroupChange('ready')}
                className={`gap-1.5 ${activeGroup === 'ready' ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-emerald-500/30 hover:bg-emerald-500/10'}`}
              >
                <PhoneCall className={`w-3.5 h-3.5 ${activeGroup === 'ready' ? 'text-white' : 'text-emerald-500'}`} />
                📞 Ready ({groupedLeads.readyToCall.length})
              </Button>
              <Button
                variant={activeGroup === 'nowebsite' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGroupChange('nowebsite')}
                className={`gap-1.5 ${activeGroup === 'nowebsite' ? 'bg-purple-500 hover:bg-purple-600' : 'border-purple-500/30 hover:bg-purple-500/10'}`}
              >
                <Target className={`w-3.5 h-3.5 ${activeGroup === 'nowebsite' ? 'text-white' : 'text-purple-500'}`} />
                🌐 No Website ({groupedLeads.noWebsite.length})
              </Button>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 w-64 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: AI VERIFY - Prominent Separate Section */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-500/50 rounded-lg blur animate-pulse" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleAIVerifyClick}
                      disabled={selectedIds.size === 0}
                      size="lg"
                      className="relative gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-500/30 animate-pulse"
                    >
                      <Brain className="w-5 h-5" />
                      ✨ AI VERIFY LEADS ✨
                      {selectedIds.size > 0 && (
                        <Badge className="ml-2 bg-white/20 text-white">{selectedIds.size}</Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verify & enrich selected leads with AI - Uses credits</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm text-amber-700">
              <span className="font-semibold">💡 Pro Tip:</span> AI Verify confirms phone & email accuracy before you reach out!
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600">
            Uses {selectedIds.size || 0} credits
          </Badge>
        </div>
      </div>

      {/* SECTION: Actions - Take action on selected leads - Compact */}
      <div className="px-4 py-2 border-b bg-card/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Selection Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-lg">
              <Checkbox
                checked={selectedIds.size === currentLeads.length && currentLeads.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="font-medium text-sm">{selectedIds.size} selected</span>
              <span className="text-muted-foreground text-xs">of {currentLeads.length}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-primary text-xs">
              {selectedIds.size === currentLeads.length ? 'Clear' : 'Select All'}
            </Button>
          </div>

          {/* Right: Action Buttons - Organized into groups */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary Actions Group */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => {
                        if (selectedIds.size === 0) {
                          toast.error('Select leads first to call them');
                          return;
                        }
                        handleCallFromChoice();
                      }}
                      disabled={selectedIds.size === 0}
                      size="sm"
                      className="gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <PhoneCall className="w-3 h-3" />
                      Call
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start a voice call with selected leads</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => {
                        if (selectedIds.size === 0) {
                          toast.error('Select leads first to email them');
                          return;
                        }
                        handleEmailFromChoice();
                      }}
                      disabled={selectedIds.size === 0}
                      size="sm"
                      className="gap-1 bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send email campaigns to selected leads</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Tools Group */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tools:</span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleBulkDelete}
                      disabled={selectedIds.size === 0}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-red-500/50 text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove selected leads from your list</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExportPDF(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Preview as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(false)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === currentLeads.length && currentLeads.length > 0}
                  onCheckedChange={selectAll}
                />
              </TableHead>
              <TableHead 
                className="min-w-[200px] cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Business
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Contact</TableHead>
              <TableHead 
                className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center">
                  Score
                  {getSortIcon('score')}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center">
                  Rating
                  {getSortIcon('rating')}
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Best Time</TableHead>
              <TableHead className="min-w-[150px]">Website</TableHead>
              <TableHead className="min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLeads.map((lead, index) => (
              <TableRow 
                key={lead.id}
                className={`${getRowClassName(lead)} animate-fade-in`}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
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
                    <p className="font-medium truncate max-w-[200px]">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{lead.address}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{lead.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{lead.leadScore}</span>
                    {getClassificationBadge(lead.aiClassification)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {lead.readyToCall && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 text-xs gap-1">
                        <PhoneCall className="w-3 h-3" /> Ready
                      </Badge>
                    )}
                    {!lead.websiteAnalysis?.hasWebsite && (
                      <Badge className="bg-purple-500/20 text-purple-600 text-xs gap-1">
                        <Globe className="w-3 h-3" /> No Site
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {lead.bestTimeToCall}
                  </div>
                </TableCell>
                <TableCell>
                  {lead.website ? (
                    <a
                      href={`https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{lead.website}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">No website</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCallLead(lead)}
                    className="gap-1"
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Skeleton loading rows while streaming */}
            {isLoading && (
              <>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="animate-pulse">
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[160px]" />
                        <Skeleton className="h-3 w-[120px]" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-3 w-[80px]" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-3 w-[90px]" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-8" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded" />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading more leads...</span>
                    </div>
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Modals */}
      <AlertDialog open={showVerifyConfirm} onOpenChange={setShowVerifyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify {selectedLeads.length} Leads with AI?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use {selectedLeads.length} credits to verify contact information for the selected leads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmVerify}>
              Verify Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete {selectedLeads.length} Leads?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected leads from your current view. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Leads
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showActionChoice && (
        <LeadActionChoiceModal
          open={showActionChoice}
          onOpenChange={setShowActionChoice}
          selectedLeads={selectedLeads}
          onCallSelected={handleCallFromChoice}
          onEmailSelected={handleEmailFromChoice}
          onAIVerifySelected={handleAIVerifyFromChoice}
        />
      )}

      {showCallModal && callLead && (
        <LeadCallModal
          open={showCallModal}
          onOpenChange={setShowCallModal}
          lead={callLead}
        />
      )}

      {showCallQueueModal && (
        <CallQueueModal
          open={showCallQueueModal}
          onOpenChange={setShowCallQueueModal}
          leads={callQueueLeads}
        />
      )}

      {showCreditsModal && (
        <CreditsUpsellModal
          open={showCreditsModal}
          onOpenChange={setShowCreditsModal}
          requiredCredits={selectedLeads.length}
          currentCredits={userCredits}
        />
      )}

      {showCRMModal && (
        <CRMIntegrationModal
          open={showCRMModal}
          onOpenChange={setShowCRMModal}
          leads={selectedLeads}
        />
      )}

      {showScheduleModal && (
        <EmailScheduleModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          leads={selectedLeads}
          onSchedule={(leads, scheduledTime, mode) => {
            toast.success(`Scheduled ${leads.length} emails for ${format(scheduledTime, 'PPp')}`);
            setShowScheduleModal(false);
          }}
        />
      )}

      {/* Email Transition Modal */}
      <EmailTransitionModal
        open={showEmailTransition}
        onOpenChange={setShowEmailTransition}
        selectedLeads={selectedLeads}
        onContinueToEmail={handleConfirmEmailTransition}
        onConfigureSmtp={() => {
          setShowEmailTransition(false);
          onOpenEmailSettings?.();
        }}
      />

      {/* PDF Preview Modal */}
      {showPDFPreview && pdfDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-5xl h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Lead Intelligence Report</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedLeads.length > 0 ? selectedLeads.length : currentLeads.length} leads • Generated {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Email Share Section */}
                {showEmailShare ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="recipient@email.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      className="w-56 h-9"
                      disabled={isSendingEmail}
                    />
                    <Button 
                      onClick={handleEmailShare} 
                      size="sm"
                      disabled={isSendingEmail}
                      className="gap-2"
                    >
                      {isSendingEmail ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowEmailShare(false);
                        setEmailRecipient('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEmailShare(true)} 
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Report
                  </Button>
                )}
                <Button onClick={handleDownloadPDFFromPreview} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="PDF Preview"]') as HTMLIFrameElement;
                    if (iframe?.contentWindow) {
                      iframe.contentWindow.print();
                    }
                  }} 
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button variant="secondary" onClick={closePDFPreview} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Spreadsheet
                </Button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfDataUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Regenerate PDF Confirmation Dialog */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              PDF Report Already Generated
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've already generated a PDF report for these leads. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleViewExistingPDF}>
              View Existing PDF
            </Button>
            <AlertDialogAction onClick={handleRegeneratePDF}>
              Regenerate New PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
