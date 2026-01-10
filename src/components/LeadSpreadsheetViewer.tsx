import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import {
  ArrowLeft, Sparkles, FileText, Download, Send, ChevronDown,
  Globe, Phone, MapPin, Star, AlertTriangle, CheckCircle2, ExternalLink,
  FileSpreadsheet, FileDown, Flame, Thermometer, Snowflake, Clock, 
  PhoneCall, Calendar, TrendingUp, Filter, Users, Building2, Mail,
  Target, Zap, Brain, Eye, Briefcase, HardDrive, Rocket
} from 'lucide-react';
import { exportToGoogleDrive } from '@/lib/api/googleDrive';
import CRMIntegrationModal from './CRMIntegrationModal';
import EmailScheduleModal from './EmailScheduleModal';
import LeadCallModal from './LeadCallModal';
import CreditsUpsellModal from './CreditsUpsellModal';
import LeadActionChoiceModal from './LeadActionChoiceModal';

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
  // AI Intelligence fields
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

interface LeadSpreadsheetViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
  savedLeads?: SearchResult[];
  onProceedToVerify: (leads: SearchResult[]) => void;
  onSaveToDatabase?: (leads: SearchResult[]) => void;
  onSendToEmail?: (leads: SearchResult[]) => void;
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
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const hasWebsite = Math.random() > 0.25;
    const platform = hasWebsite ? platforms[Math.floor(Math.random() * platforms.length)] : null;
    
    // AI Classification logic
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

    // Random pain points (1-4)
    const numPainPoints = Math.floor(Math.random() * 4) + 1;
    const selectedPainPoints: string[] = [];
    for (let j = 0; j < numPainPoints; j++) {
      const point = painPoints[Math.floor(Math.random() * painPoints.length)];
      if (!selectedPainPoints.includes(point)) {
        selectedPainPoints.push(point);
      }
    }

    // Random issues (0-5)
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

export default function LeadSpreadsheetViewer({
  open,
  onOpenChange,
  leads: externalLeads,
  savedLeads = [],
  onProceedToVerify,
  onSaveToDatabase,
  onSendToEmail,
}: LeadSpreadsheetViewerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [activeGroup, setActiveGroup] = useState<'all' | 'hot' | 'warm' | 'cold' | 'ready' | 'nowebsite'>('all');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [callLead, setCallLead] = useState<SearchResult | null>(null);
  const [userCredits] = useState(25); // Would come from API in production
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  
  // Use fake leads if external leads are 100 or less
  const [fakeLeads] = useState<SearchResult[]>(() => generateFakeLeads());
  const leads = externalLeads.length > 100 ? externalLeads : fakeLeads;

  // Group leads by AI classification
  const groupedLeads = useMemo(() => {
    const hot = leads.filter(l => l.aiClassification === 'hot');
    const warm = leads.filter(l => l.aiClassification === 'warm');
    const cold = leads.filter(l => l.aiClassification === 'cold');
    const readyToCall = leads.filter(l => l.readyToCall);
    const noWebsite = leads.filter(l => !l.websiteAnalysis?.hasWebsite);
    
    return { hot, warm, cold, readyToCall, noWebsite, all: leads };
  }, [leads]);

  const currentLeads = useMemo(() => {
    const baseLeads = activeTab === 'new' ? leads : savedLeads;
    
    switch (activeGroup) {
      case 'hot': return baseLeads.filter(l => l.aiClassification === 'hot');
      case 'warm': return baseLeads.filter(l => l.aiClassification === 'warm');
      case 'cold': return baseLeads.filter(l => l.aiClassification === 'cold');
      case 'ready': return baseLeads.filter(l => l.readyToCall);
      case 'nowebsite': return baseLeads.filter(l => !l.websiteAnalysis?.hasWebsite);
      default: return baseLeads;
    }
  }, [activeTab, activeGroup, leads, savedLeads]);

  // Clear selection when switching tabs or groups
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'new' | 'saved');
    setSelectedIds(new Set());
  };

  const handleGroupChange = (group: typeof activeGroup) => {
    setActiveGroup(group);
    // Auto-select ALL leads in the selected group (except 'all')
    const baseLeads = activeTab === 'new' ? leads : savedLeads;
    let filteredLeads: SearchResult[] = [];
    
    switch (group) {
      case 'hot': filteredLeads = baseLeads.filter(l => l.aiClassification === 'hot'); break;
      case 'warm': filteredLeads = baseLeads.filter(l => l.aiClassification === 'warm'); break;
      case 'cold': filteredLeads = baseLeads.filter(l => l.aiClassification === 'cold'); break;
      case 'ready': filteredLeads = baseLeads.filter(l => l.readyToCall); break;
      case 'nowebsite': filteredLeads = baseLeads.filter(l => !l.websiteAnalysis?.hasWebsite); break;
      default: filteredLeads = []; // Don't auto-select for 'all'
    }
    
    // Auto-select all leads in the group (except 'all' which clears selection)
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
    // Show confirmation dialog for bulk verification
    setShowVerifyConfirm(true);
  };

  const handleConfirmVerify = () => {
    // Check if user has enough credits
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
    // If only one lead selected, open call modal directly
    if (selectedLeads.length === 1) {
      setCallLead(selectedLeads[0]);
      setShowCallModal(true);
    } else {
      // For multiple leads, start with first one
      setCallLead(selectedLeads[0]);
      setShowCallModal(true);
      toast.info(`Starting with ${selectedLeads[0].name}. Call each lead from the table.`);
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
      'AI Lead Score': r.leadScore || '',
      'Classification': r.aiClassification?.toUpperCase() || '',
      'Urgency Level': r.urgencyLevel?.toUpperCase() || '',
      'Best Time to Call': r.bestTimeToCall || '',
      'Ready to Call': r.readyToCall ? 'Yes' : 'No',
      'Conversion Probability': `${r.conversionProbability || 0}%`,
      'Pain Points': r.painPoints?.join('; ') || '',
      'Recommended Approach': r.recommendedApproach || '',
      'Industry': r.industry || '',
      'Employee Count': r.employeeCount || '',
      'Annual Revenue': r.annualRevenue || '',
      'Platform': r.websiteAnalysis?.platform || 'N/A',
      'Issues': r.websiteAnalysis?.issues?.join('; ') || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Analyzed Leads');
    XLSX.writeFile(workbook, `website-design-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${dataToExport.length} leads as Excel`);
  };

  const handleExportGoogleDrive = async () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : currentLeads;
    
    if (dataToExport.length === 0) {
      toast.error('No leads to export');
      return;
    }

    setIsExportingToDrive(true);
    try {
      const formattedLeads = dataToExport.map(lead => ({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        leadScore: lead.leadScore,
        conversionProbability: `${lead.conversionProbability}%`,
        bestContactTime: lead.bestTimeToCall,
        marketingAngle: lead.recommendedApproach,
        talkingPoints: lead.painPoints,
        painPoints: lead.painPoints,
      }));

      const result = await exportToGoogleDrive(formattedLeads);
      
      if (result.success && result.web_view_link) {
        toast.success('Leads exported to Google Drive!', {
          action: {
            label: 'Open',
            onClick: () => window.open(result.web_view_link, '_blank'),
          },
        });
        window.open(result.web_view_link, '_blank');
      } else if (result.needs_auth) {
        // Show connect option
        toast.info('Please connect your Google Drive to export', {
          description: 'You can use CSV/Excel export in the meantime',
          duration: 5000,
        });
      } else {
        // Google Drive not configured on backend - suggest alternative
        toast.error(result.error || 'Google Drive export unavailable', {
          description: 'Use CSV or Excel export instead',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Google Drive export error:', error);
      toast.error('Export failed - try CSV/Excel instead');
    } finally {
      setIsExportingToDrive(false);
    }
  };

  const handleOpenCRM = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    setShowCRMModal(true);
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

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-500/10 text-red-500 text-xs">HIGH URGENCY</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">MEDIUM</Badge>;
      case 'low':
        return <Badge className="bg-gray-500/10 text-gray-500 text-xs">LOW</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold">AI-Powered Lead Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <Users className="w-4 h-4" />
              {leads.length.toLocaleString()} Total Leads
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Website Design Campaign
            </Badge>
          </div>
        </div>

        {/* AI Intelligence Summary Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-600">{groupedLeads.hot.length}</span>
                <span className="text-sm text-muted-foreground">Hot Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-orange-600">{groupedLeads.warm.length}</span>
                <span className="text-sm text-muted-foreground">Warm Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-blue-600">{groupedLeads.cold.length}</span>
                <span className="text-sm text-muted-foreground">Cold Leads</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-600">{groupedLeads.readyToCall.length}</span>
                <span className="text-sm text-muted-foreground">Ready to Call</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-purple-600">{groupedLeads.noWebsite.length}</span>
                <span className="text-sm text-muted-foreground">No Website</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              AI analyzed & scored
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              variant={activeGroup === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGroupChange('all')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              All ({leads.length})
            </Button>
            <Button
              variant={activeGroup === 'hot' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGroupChange('hot')}
              className="gap-2 border-red-500/30 hover:bg-red-500/10"
            >
              <Flame className="w-4 h-4 text-red-500" />
              Hot ({groupedLeads.hot.length})
            </Button>
            <Button
              variant={activeGroup === 'warm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGroupChange('warm')}
              className="gap-2 border-orange-500/30 hover:bg-orange-500/10"
            >
              <Thermometer className="w-4 h-4 text-orange-500" />
              Warm ({groupedLeads.warm.length})
            </Button>
            <Button
              variant={activeGroup === 'cold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGroupChange('cold')}
              className="gap-2 border-blue-500/30 hover:bg-blue-500/10"
            >
              <Snowflake className="w-4 h-4 text-blue-500" />
              Cold ({groupedLeads.cold.length})
            </Button>
            <Button
              variant={activeGroup === 'ready' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGroupChange('ready')}
              className="gap-2 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              Ready to Call ({groupedLeads.readyToCall.length})
            </Button>
            <Button
              variant={activeGroup === 'nowebsite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGroupChange('nowebsite')}
              className="gap-2 border-purple-500/30 hover:bg-purple-500/10"
            >
              <Target className="w-4 h-4 text-purple-500" />
              No Website ({groupedLeads.noWebsite.length})
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-background border">
              <TabsTrigger value="new" className="gap-2 px-4">
                <Sparkles className="w-4 h-4" />
                New
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2 px-4">
                <FileText className="w-4 h-4" />
                Saved ({savedLeads.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{selectedIds.size} selected</span>
            <span className="text-muted-foreground">of {currentLeads.length} leads</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Action Button */}
            <Button 
              onClick={handleOpenActionChoice}
              disabled={selectedIds.size === 0}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-medium"
            >
              <Target className="w-4 h-4" />
              Take Action ({selectedIds.size})
            </Button>

            <Button 
              onClick={handleAIVerifyClick}
              disabled={selectedIds.size === 0}
              variant="outline"
              className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
            >
              <Sparkles className="w-4 h-4" />
              AI Verify
            </Button>

            <Button 
              variant="outline" 
              onClick={handleOpenCRM}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Briefcase className="w-4 h-4" />
              CRM
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
                  Export as Excel (with AI data)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportGoogleDrive} disabled={isExportingToDrive} className="gap-2">
                  <HardDrive className="w-4 h-4" />
                  {isExportingToDrive ? 'Exporting...' : 'Export to Google Drive'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={() => {
                if (selectedLeads.length === 0) {
                  toast.error('Please select at least one lead');
                  return;
                }
                setShowScheduleModal(true);
              }}
              disabled={selectedIds.size === 0}
              variant="outline"
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Schedule
            </Button>

            <Button 
              onClick={handleSendToEmail}
              disabled={selectedIds.size === 0}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
              Send Now
            </Button>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 sticky left-0 bg-muted/50">
                    <Checkbox 
                      checked={selectedIds.size === currentLeads.length && currentLeads.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[80px]">Score</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[200px]">Business Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[130px]">Phone</TableHead>
                  <TableHead className="min-w-[120px]">Best Time</TableHead>
                  <TableHead className="min-w-[100px]">Ready?</TableHead>
                  <TableHead className="min-w-[200px]">Pain Points</TableHead>
                  <TableHead className="min-w-[180px]">Recommended Approach</TableHead>
                  <TableHead className="min-w-[100px]">Conv. %</TableHead>
                  <TableHead className="min-w-[150px]">Website</TableHead>
                  <TableHead className="w-20">Rating</TableHead>
                  <TableHead className="w-24 text-center">Call</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLeads.map((lead, index) => (
                  <TableRow 
                    key={lead.id}
                    data-state={selectedIds.has(lead.id) ? 'selected' : undefined}
                    className={`${selectedIds.has(lead.id) ? 'bg-primary/5' : ''} ${
                      lead.aiClassification === 'hot' ? 'bg-red-500/5' : 
                      lead.aiClassification === 'warm' ? 'bg-orange-500/5' : 
                      lead.aiClassification === 'cold' ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <TableCell className="sticky left-0 bg-inherit">
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          (lead.leadScore || 0) >= 80 ? 'bg-red-500/20 text-red-600' :
                          (lead.leadScore || 0) >= 50 ? 'bg-orange-500/20 text-orange-600' :
                          'bg-blue-500/20 text-blue-600'
                        }`}>
                          {lead.leadScore}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getClassificationBadge(lead.aiClassification)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{lead.name}</span>
                        <span className="text-xs text-muted-foreground">{lead.industry}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-primary">{lead.email}</span>
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
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs">{lead.bestTimeToCall}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.readyToCall ? (
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
                          <PhoneCall className="w-3 h-3" /> YES
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Not Yet</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {lead.painPoints?.slice(0, 2).map((point, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {point.length > 25 ? point.slice(0, 25) + '...' : point}
                          </Badge>
                        ))}
                        {(lead.painPoints?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">+{(lead.painPoints?.length || 0) - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{lead.recommendedApproach}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className={`w-4 h-4 ${
                          (lead.conversionProbability || 0) >= 70 ? 'text-emerald-500' :
                          (lead.conversionProbability || 0) >= 40 ? 'text-orange-500' :
                          'text-gray-400'
                        }`} />
                        <span className="font-semibold">{lead.conversionProbability}%</span>
                      </div>
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
                          <span className="truncate max-w-[100px]">{lead.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-xs">
                          No website - HOT PROSPECT
                        </Badge>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCallLead(lead)}
                        className="gap-1.5 h-8 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/50"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Call
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {currentLeads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No leads in this category</h3>
                <p className="text-muted-foreground">
                  Try selecting a different filter or run a new search
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {/* AI Verify Confirmation Dialog */}
      <AlertDialog open={showVerifyConfirm} onOpenChange={setShowVerifyConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Rocket className="w-6 h-6 text-amber-500" />
              </div>
              <AlertDialogTitle className="text-xl">
                Supercharge These Leads? 🚀
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base">
                  You're about to unlock <span className="font-bold text-foreground">{selectedLeads.length.toLocaleString()} leads</span> with AI-powered verification!
                </p>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <p className="font-medium text-foreground mb-2">✨ What you'll get for each lead:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Verified contact information</li>
                    <li>• AI-scored lead quality (0-100)</li>
                    <li>• Personalized outreach messages</li>
                    <li>• Best time to contact</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Heads up:</span> This will use{' '}
                    <span className="font-bold text-amber-600">{selectedLeads.length.toLocaleString()} AI credits</span> from your verification balance.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmVerify}
              className="bg-amber-500 hover:bg-amber-600 text-black font-medium gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Verify All {selectedLeads.length.toLocaleString()} Leads
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CRM Integration Modal */}
      <CRMIntegrationModal
        open={showCRMModal}
        onOpenChange={setShowCRMModal}
        leads={selectedLeads}
      />

      {/* Email Schedule Modal */}
      <EmailScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        leads={selectedLeads.map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          aiClassification: lead.aiClassification,
          bestTimeToCall: lead.bestTimeToCall,
          conversionProbability: lead.conversionProbability,
        }))}
        onSchedule={(leads, scheduledTime, mode) => {
          console.log('Scheduled emails:', { leads, scheduledTime, mode });
          toast.success(`${leads.length} emails scheduled for ${scheduledTime.toLocaleString()}`);
          // Here you would integrate with your email outreach backend
        }}
      />

      {/* Call Modal */}
      <LeadCallModal
        open={showCallModal}
        onOpenChange={setShowCallModal}
        lead={callLead}
        onCallComplete={(leadId, outcome, duration) => {
          console.log('Call completed:', { leadId, outcome, duration });
        }}
      />

      {/* Credits Upsell Modal */}
      <CreditsUpsellModal
        open={showCreditsModal}
        onOpenChange={setShowCreditsModal}
        currentCredits={userCredits}
        requiredCredits={selectedLeads.length}
      />

      {/* Action Choice Modal */}
      <LeadActionChoiceModal
        open={showActionChoice}
        onOpenChange={setShowActionChoice}
        selectedLeads={selectedLeads}
        onCallSelected={handleCallFromChoice}
        onEmailSelected={handleEmailFromChoice}
        onAIVerifySelected={handleAIVerifyFromChoice}
      />
    </Dialog>
  );
}
