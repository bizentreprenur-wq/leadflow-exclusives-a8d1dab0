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
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft, Download, ChevronDown,
  Globe, Phone, MapPin, ExternalLink,
  FileSpreadsheet, FileDown, Flame, Thermometer, Snowflake, Clock, 
  PhoneCall, Users, Mail,
  Target, Zap, Brain, Rocket, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, FileText, Printer
} from 'lucide-react';
import CRMIntegrationModal from './CRMIntegrationModal';
import EmailScheduleModal from './EmailScheduleModal';
import LeadCallModal from './LeadCallModal';
import CallQueueModal from './CallQueueModal';
import CreditsUpsellModal from './CreditsUpsellModal';
import LeadActionChoiceModal from './LeadActionChoiceModal';
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
}

// Generate 1000 fake website design leads with AI intelligence
const generateFakeLeads = (): SearchResult[] => {
  const businessTypes = [
    'Plumbing', 'Dental', 'Law Firm', 'Restaurant', 'Auto Repair', 'Salon', 'Gym', 
    'Real Estate', 'Landscaping', 'HVAC', 'Roofing', 'Electrician', 'Accounting',
    'Veterinary', 'Chiropractic', 'Photography', 'Catering', 'Cleaning', 'Moving',
    'Insurance', 'Florist', 'Bakery', 'Pet Store', 'Daycare', 'Tutoring'
  ];
  
  const cities = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Austin, TX',
    'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC', 'Indianapolis, IN',
    'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Nashville, TN', 'Portland, OR',
    'Las Vegas, NV', 'Detroit, MI', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD'
  ];

  const firstNames = ['John', 'Mike', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Sarah', 'Jennifer', 'Lisa', 'Karen', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'];
  
  const platforms = ['WordPress 3.x', 'Wix (Old)', 'Squarespace', 'Joomla 2.5', 'Drupal 6', 'GoDaddy Builder', 'Weebly', 'Custom HTML', null];
  
  const painPoints = [
    'Website not mobile-friendly',
    'Slow page load times',
    'Outdated design from 2010s',
    'No online booking system',
    'Missing contact forms',
    'No SSL certificate',
    'Poor SEO rankings',
    'No Google reviews integration',
    'Broken links throughout site',
    'Missing social media integration',
    'No email capture forms',
    'Competitors ranking higher',
    'Losing customers to competitors',
    'No online payment options'
  ];

  const approaches = [
    'Emphasize mobile-first redesign',
    'Lead with competitor analysis',
    'Focus on SEO improvements',
    'Highlight revenue impact',
    'Show before/after examples',
    'Offer free website audit',
    'Discuss local search visibility',
    'Present case study from same industry'
  ];

  const callTimes = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM'
  ];

  const issues = [
    'No mobile responsiveness',
    'Outdated CMS version',
    'Security vulnerabilities',
    'Slow load time (>5s)',
    'Missing meta tags',
    'No HTTPS',
    'Broken contact form',
    'Flash content detected',
    'Missing alt tags',
    'Duplicate content issues'
  ];

  const leads: SearchResult[] = [];
  
  for (let i = 0; i < 1000; i++) {
    const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const hasWebsite = Math.random() > 0.25;
    const platform = hasWebsite ? platforms[Math.floor(Math.random() * platforms.length)] : null;
    
    const leadScore = Math.floor(Math.random() * 100) + 1;
    let aiClassification: 'hot' | 'warm' | 'cold';
    let urgencyLevel: 'high' | 'medium' | 'low';
    let readyToCall: boolean;
    let conversionProbability: number;
    
    if (leadScore >= 80) {
      aiClassification = 'hot';
      urgencyLevel = 'high';
      readyToCall = true;
      conversionProbability = Math.floor(Math.random() * 20) + 75;
    } else if (leadScore >= 50) {
      aiClassification = 'warm';
      urgencyLevel = 'medium';
      readyToCall = Math.random() > 0.5;
      conversionProbability = Math.floor(Math.random() * 30) + 35;
    } else {
      aiClassification = 'cold';
      urgencyLevel = 'low';
      readyToCall = Math.random() > 0.8;
      conversionProbability = Math.floor(Math.random() * 25) + 5;
    }

    const numPainPoints = Math.floor(Math.random() * 4) + 1;
    const selectedPainPoints: string[] = [];
    for (let j = 0; j < numPainPoints; j++) {
      const point = painPoints[Math.floor(Math.random() * painPoints.length)];
      if (!selectedPainPoints.includes(point)) {
        selectedPainPoints.push(point);
      }
    }

    const numIssues = Math.floor(Math.random() * 6);
    const selectedIssues: string[] = [];
    for (let j = 0; j < numIssues; j++) {
      const issue = issues[Math.floor(Math.random() * issues.length)];
      if (!selectedIssues.includes(issue)) {
        selectedIssues.push(issue);
      }
    }

    const streetNum = Math.floor(Math.random() * 9999) + 1;
    const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Park Ave', 'Broadway', 'Market St', 'Center Ave'];
    const street = streets[Math.floor(Math.random() * streets.length)];

    leads.push({
      id: `lead-${i + 1}`,
      name: `${firstName}'s ${businessType} Services`,
      address: `${streetNum} ${street}, ${city}`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      website: hasWebsite ? `www.${firstName.toLowerCase()}${businessType.toLowerCase().replace(/\s/g, '')}.com` : undefined,
      email: `contact@${firstName.toLowerCase()}${businessType.toLowerCase().replace(/\s/g, '')}.com`,
      rating: Math.floor(Math.random() * 20 + 30) / 10,
      source: Math.random() > 0.5 ? 'gmb' : 'platform',
      platform: platform || undefined,
      websiteAnalysis: hasWebsite ? {
        hasWebsite: true,
        platform: platform,
        needsUpgrade: Math.random() > 0.3,
        issues: selectedIssues,
        mobileScore: Math.floor(Math.random() * 60) + 20,
        loadTime: Math.random() * 8 + 1,
      } : {
        hasWebsite: false,
        platform: null,
        needsUpgrade: false,
        issues: [],
        mobileScore: null,
        loadTime: null,
      },
      aiClassification,
      leadScore,
      bestTimeToCall: callTimes[Math.floor(Math.random() * callTimes.length)],
      readyToCall,
      painPoints: selectedPainPoints,
      urgencyLevel,
      recommendedApproach: approaches[Math.floor(Math.random() * approaches.length)],
      conversionProbability,
      industry: businessType,
      employeeCount: ['1-5', '5-10', '10-25', '25-50', '50+'][Math.floor(Math.random() * 5)],
      annualRevenue: ['$50K-100K', '$100K-250K', '$250K-500K', '$500K-1M', '$1M+'][Math.floor(Math.random() * 5)],
    });
  }
  
  return leads;
};

export default function EmbeddedSpreadsheetView({
  leads: externalLeads,
  savedLeads = [],
  onProceedToVerify,
  onSaveToDatabase,
  onSendToEmail,
  onBack,
}: EmbeddedSpreadsheetViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  
  // Use fake leads if external leads are 100 or less
  const [fakeLeads] = useState<SearchResult[]>(() => generateFakeLeads());
  const leads = externalLeads.length > 100 ? externalLeads : fakeLeads;

  // State for auto-open PDF
  const [hasAutoOpenedPDF, setHasAutoOpenedPDF] = useState(false);


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

  // Auto-open PDF preview when component mounts (after functions are defined)
  useEffect(() => {
    if (!hasAutoOpenedPDF && leads.length > 0) {
      const timer = setTimeout(() => {
        handleExportPDF(true);
        setHasAutoOpenedPDF(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [leads, hasAutoOpenedPDF]);

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
    <div className="flex flex-col h-full min-h-[600px] bg-background rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            New Search
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold">STEP 2: Review Leads</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 px-3 py-1">
            <Users className="w-4 h-4" />
            {leads.length.toLocaleString()} Total Leads
          </Badge>
        </div>
      </div>

      {/* AI Intelligence Summary Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-red-600">{groupedLeads.hot.length}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Hot</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-600">{groupedLeads.warm.length}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Warm</span>
            </div>
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-blue-600">{groupedLeads.cold.length}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Cold</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-emerald-600">{groupedLeads.readyToCall.length}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-purple-600">{groupedLeads.noWebsite.length}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">No Site</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-primary" />
            AI scored
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeGroup === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupChange('all')}
            className="gap-1"
          >
            <Users className="w-3 h-3" />
            All ({leads.length})
          </Button>
          <Button
            variant={activeGroup === 'hot' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupChange('hot')}
            className="gap-1 border-red-500/30 hover:bg-red-500/10"
          >
            <Flame className="w-3 h-3 text-red-500" />
            Hot ({groupedLeads.hot.length})
          </Button>
          <Button
            variant={activeGroup === 'warm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupChange('warm')}
            className="gap-1 border-orange-500/30 hover:bg-orange-500/10"
          >
            <Thermometer className="w-3 h-3 text-orange-500" />
            Warm ({groupedLeads.warm.length})
          </Button>
          <Button
            variant={activeGroup === 'cold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupChange('cold')}
            className="gap-1 border-blue-500/30 hover:bg-blue-500/10"
          >
            <Snowflake className="w-3 h-3 text-blue-500" />
            Cold ({groupedLeads.cold.length})
          </Button>
          <Button
            variant={activeGroup === 'ready' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupChange('ready')}
            className="gap-1 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <PhoneCall className="w-3 h-3 text-emerald-500" />
            Ready ({groupedLeads.readyToCall.length})
          </Button>
          <Button
            variant={activeGroup === 'nowebsite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupChange('nowebsite')}
            className="gap-1 border-purple-500/30 hover:bg-purple-500/10"
          >
            <Target className="w-3 h-3 text-purple-500" />
            No Website ({groupedLeads.noWebsite.length})
          </Button>
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

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{selectedIds.size} selected</span>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selectedIds.size === currentLeads.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Clear Action Buttons - Each with specific purpose */}
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
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call Selected ({selectedIds.size})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a voice call with selected leads using AI-powered calling</p>
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
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                >
                  <Mail className="w-4 h-4" />
                  Email Selected ({selectedIds.size})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send personalized email campaigns to selected leads</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleAIVerifyClick}
                  disabled={selectedIds.size === 0}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                >
                  <Brain className="w-4 h-4" />
                  AI Verify ({selectedIds.size})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use AI to verify lead contact info and enrich data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-red-500/50 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove selected leads from your current list</p>
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

      {/* Table */}
      <div className="flex-1 overflow-auto">
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
            {currentLeads.map((lead) => (
              <TableRow 
                key={lead.id}
                className={getRowClassName(lead)}
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
          </TableBody>
        </Table>
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
    </div>
  );
}
