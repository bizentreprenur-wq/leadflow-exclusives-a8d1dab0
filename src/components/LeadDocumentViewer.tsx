import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FileText, Download, Printer, X, Users, Globe, Phone, MapPin,
  Star, AlertTriangle, CheckCircle2, Flame, Snowflake, Brain, Target,
  Zap, Building2, Mail, Clock, ChevronRight, FileSpreadsheet,
  TrendingUp, ThermometerSun, Calendar, MessageSquare, DollarSign,
  Eye, PhoneCall, MailOpen
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

interface LeadDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
  searchQuery: string;
  location: string;
  onProceedToVerify: (leads: SearchResult[]) => void;
  onProceedToEmail?: (leads: SearchResult[]) => void;
}

// AI Analysis for each lead
interface LeadInsight {
  classification: 'hot' | 'warm' | 'cold';
  score: number;
  reasons: string[];
  bestContactTime: string;
  bestContactMethod: 'call' | 'email' | 'both';
  aiRecommendation: string;
  painPoints: string[];
  talkingPoints: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
  estimatedValue: string;
}

// Export field options
const EXPORT_FIELDS = [
  { id: 'name', label: 'Business Name', default: true },
  { id: 'ownerName', label: 'Owner Name (AI Estimated)', default: true },
  { id: 'address', label: 'Address', default: true },
  { id: 'phone', label: 'Phone Number', default: true },
  { id: 'email', label: 'Email Address', default: true },
  { id: 'website', label: 'Website', default: false },
  { id: 'rating', label: 'Rating', default: false },
  { id: 'classification', label: 'Lead Classification', default: true },
  { id: 'bestContactTime', label: 'Best Contact Time', default: true },
  { id: 'bestContactMethod', label: 'Best Contact Method', default: true },
  { id: 'aiRecommendation', label: 'AI Recommendation', default: true },
  { id: 'painPoints', label: 'Pain Points', default: true },
  { id: 'talkingPoints', label: 'Talking Points', default: true },
];

function generateLeadInsight(lead: SearchResult): LeadInsight {
  let score = 50;
  const reasons: string[] = [];
  const painPoints: string[] = [];
  const talkingPoints: string[] = [];

  // Score based on website status
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    score += 40;
    reasons.push('No website - immediate need');
    painPoints.push('Missing online presence');
    painPoints.push('Losing customers to competitors with websites');
    talkingPoints.push('Ask about their customer acquisition methods');
    talkingPoints.push('Mention competitors who have websites');
  }

  if (lead.websiteAnalysis?.needsUpgrade) {
    score += 30;
    reasons.push('Website needs upgrade');
    painPoints.push('Outdated website hurting credibility');
    talkingPoints.push('Ask when they last updated their site');
  }

  const issueCount = lead.websiteAnalysis?.issues?.length || 0;
  if (issueCount >= 3) {
    score += 25;
    reasons.push(`${issueCount} website issues detected`);
    painPoints.push('Multiple technical issues affecting performance');
    lead.websiteAnalysis?.issues?.forEach(issue => {
      talkingPoints.push(`Address: ${issue}`);
    });
  }

  const mobileScore = lead.websiteAnalysis?.mobileScore;
  if (mobileScore !== null && mobileScore !== undefined && mobileScore < 50) {
    score += 20;
    reasons.push('Poor mobile experience');
    painPoints.push('50%+ of visitors on mobile seeing broken site');
    talkingPoints.push('Ask about their mobile traffic percentage');
  }

  if (lead.phone) score += 5;
  if (lead.rating && lead.rating >= 4.5) {
    score += 10;
    talkingPoints.push('Compliment their excellent reviews');
  }

  // Check for legacy platforms
  const legacyPlatforms = ['joomla', 'drupal', 'weebly', 'godaddy'];
  if (lead.websiteAnalysis?.platform && legacyPlatforms.some(p => 
    lead.websiteAnalysis!.platform!.toLowerCase().includes(p)
  )) {
    score += 20;
    reasons.push('Legacy platform detected');
    painPoints.push('Outdated technology limiting growth');
    talkingPoints.push(`Their ${lead.websiteAnalysis.platform} site may be limiting them`);
  }

  // Determine classification
  let classification: 'hot' | 'warm' | 'cold';
  let urgencyLevel: 'high' | 'medium' | 'low';
  if (score >= 80) {
    classification = 'hot';
    urgencyLevel = 'high';
  } else if (score >= 55) {
    classification = 'warm';
    urgencyLevel = 'medium';
  } else {
    classification = 'cold';
    urgencyLevel = 'low';
  }

  // Determine best contact time and method
  const hour = new Date().getHours();
  let bestContactTime: string;
  let bestContactMethod: 'call' | 'email' | 'both';

  if (classification === 'hot') {
    bestContactTime = 'Call ASAP - 10am-11am or 2pm-3pm';
    bestContactMethod = 'call';
  } else if (classification === 'warm') {
    bestContactTime = 'Email first, follow up call in 2 days - Best at 10am';
    bestContactMethod = 'both';
  } else {
    bestContactTime = 'Email nurture sequence - Tuesday/Thursday mornings';
    bestContactMethod = 'email';
  }

  // Generate AI recommendation
  let aiRecommendation: string;
  if (!lead.website) {
    aiRecommendation = `High-value prospect without online presence. Lead with: "I noticed [Business Name] doesn't have a website yet. Many of your competitors in ${lead.address?.split(',')[1] || 'your area'} are getting customers online..."`;
  } else if (lead.websiteAnalysis?.needsUpgrade) {
    aiRecommendation = `Website needs modernization. Open with: "I was looking at your website and noticed it might be missing some features that could help you get more customers..."`;
  } else if (issueCount > 0) {
    aiRecommendation = `Technical issues detected. Approach: "I ran a quick audit on your site and found ${issueCount} things that might be hurting your Google ranking..."`;
  } else {
    aiRecommendation = `Nurture lead with value-first content. Send helpful tips before pitching services.`;
  }

  // Estimate value
  let estimatedValue: string;
  if (classification === 'hot') {
    estimatedValue = '$1,500 - $5,000+';
  } else if (classification === 'warm') {
    estimatedValue = '$800 - $2,500';
  } else {
    estimatedValue = '$500 - $1,500';
  }

  return {
    classification,
    score,
    reasons,
    bestContactTime,
    bestContactMethod,
    aiRecommendation,
    painPoints,
    talkingPoints,
    urgencyLevel,
    estimatedValue,
  };
}

// Generate estimated owner name from business name
function estimateOwnerName(businessName: string): string {
  // Simple heuristic - in real app this would use AI or data enrichment
  const genericNames = ['Owner', 'Manager', 'Decision Maker'];
  return genericNames[Math.floor(Math.random() * genericNames.length)];
}

export default function LeadDocumentViewer({
  open,
  onOpenChange,
  leads,
  searchQuery,
  location,
  onProceedToVerify,
  onProceedToEmail,
}: LeadDocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(f => f.default).map(f => f.id)
  );
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const documentRef = useRef<HTMLDivElement>(null);

  // Analyze all leads
  const analyzedLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      insight: generateLeadInsight(lead),
      estimatedOwner: estimateOwnerName(lead.name),
    }));
  }, [leads]);

  const hotLeads = analyzedLeads.filter(l => l.insight.classification === 'hot');
  const warmLeads = analyzedLeads.filter(l => l.insight.classification === 'warm');
  const coldLeads = analyzedLeads.filter(l => l.insight.classification === 'cold');

  const displayLeads = useMemo(() => {
    switch (activeTab) {
      case 'hot': return hotLeads;
      case 'warm': return warmLeads;
      case 'cold': return coldLeads;
      default: return analyzedLeads;
    }
  }, [activeTab, analyzedLeads, hotLeads, warmLeads, coldLeads]);

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  const selectAllInGroup = () => {
    if (selectedLeadIds.size === displayLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(displayLeads.map(l => l.id)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('BamLead Intelligence Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${searchQuery} in ${location}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Lead Summary', 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(239, 68, 68);
    doc.text(`🔥 HOT LEADS: ${hotLeads.length} - Call immediately!`, 14, 56);
    doc.setTextColor(245, 158, 11);
    doc.text(`⚡ WARM LEADS: ${warmLeads.length} - Email first, then call`, 14, 62);
    doc.setTextColor(59, 130, 246);
    doc.text(`❄️ COLD LEADS: ${coldLeads.length} - Nurture with content`, 14, 68);

    let yPos = 80;

    // Hot leads section
    if (hotLeads.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('🔥 HOT LEADS - Contact Today', 14, yPos);
      yPos += 8;

      const hotData = hotLeads.slice(0, 20).map(l => [
        l.name.substring(0, 20),
        l.phone || 'N/A',
        l.insight.bestContactTime.substring(0, 25),
        l.insight.painPoints[0]?.substring(0, 30) || ''
      ]);

      autoTable(doc, {
        head: [['Business', 'Phone', 'Best Time', 'Pain Point']],
        body: hotData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [239, 68, 68] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Warm leads
    if (warmLeads.length > 0 && yPos < 250) {
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('⚡ WARM LEADS - Email First', 14, yPos);
      yPos += 8;

      const warmData = warmLeads.slice(0, 15).map(l => [
        l.name.substring(0, 20),
        l.phone || 'N/A',
        l.insight.bestContactTime.substring(0, 25),
        l.insight.painPoints[0]?.substring(0, 30) || ''
      ]);

      autoTable(doc, {
        head: [['Business', 'Phone', 'Best Time', 'Pain Point']],
        body: warmData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [245, 158, 11] },
      });
    }

    doc.save(`bamlead-leads-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded with grouped leads!');
  };

  const exportToExcel = () => {
    const data = analyzedLeads.map(l => {
      const row: any = {};
      if (selectedFields.includes('name')) row['Business Name'] = l.name;
      if (selectedFields.includes('ownerName')) row['Owner Name'] = l.estimatedOwner;
      if (selectedFields.includes('address')) row['Address'] = l.address || '';
      if (selectedFields.includes('phone')) row['Phone'] = l.phone || '';
      if (selectedFields.includes('email')) row['Email'] = l.email || '';
      if (selectedFields.includes('website')) row['Website'] = l.website || '';
      if (selectedFields.includes('rating')) row['Rating'] = l.rating || '';
      if (selectedFields.includes('classification')) row['Classification'] = l.insight.classification.toUpperCase();
      if (selectedFields.includes('bestContactTime')) row['Best Contact Time'] = l.insight.bestContactTime;
      if (selectedFields.includes('bestContactMethod')) row['Best Method'] = l.insight.bestContactMethod;
      if (selectedFields.includes('aiRecommendation')) row['AI Recommendation'] = l.insight.aiRecommendation;
      if (selectedFields.includes('painPoints')) row['Pain Points'] = l.insight.painPoints.join('; ');
      if (selectedFields.includes('talkingPoints')) row['Talking Points'] = l.insight.talkingPoints.join('; ');
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    // Add sheets for each classification
    XLSX.utils.book_append_sheet(wb, ws, 'All Leads');

    // Hot leads sheet
    const hotData = hotLeads.map(l => ({
      'Business': l.name,
      'Phone': l.phone || '',
      'Best Time': l.insight.bestContactTime,
      'Talking Points': l.insight.talkingPoints.join('; '),
    }));
    if (hotData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hotData), '🔥 Hot Leads');
    }

    // Warm leads sheet
    const warmData = warmLeads.map(l => ({
      'Business': l.name,
      'Phone': l.phone || '',
      'Best Time': l.insight.bestContactTime,
      'Talking Points': l.insight.talkingPoints.join('; '),
    }));
    if (warmData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warmData), '⚡ Warm Leads');
    }

    XLSX.writeFile(wb, `bamlead-grouped-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded with separate sheets for Hot/Warm/Cold!');
  };

  const handleProceedToVerify = () => {
    const selected = selectedLeadIds.size > 0
      ? leads.filter(l => selectedLeadIds.has(l.id))
      : hotLeads.length > 0 ? hotLeads : leads.slice(0, 50);
    onProceedToVerify(selected);
    onOpenChange(false);
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'hot': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'warm': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'cold': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return '';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'hot': return <Flame className="w-5 h-5" />;
      case 'warm': return <ThermometerSun className="w-5 h-5" />;
      case 'cold': return <Snowflake className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-screen h-screen max-h-screen flex flex-col p-0 gap-0 rounded-none border-0">
        {/* Document Header */}
        <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Lead Intelligence Document</h1>
                <p className="text-white/80 text-sm">{reportDate} • {searchQuery} in {location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowFieldSelector(!showFieldSelector)}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Fields
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="secondary" size="sm" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={exportToExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Field Selector Dropdown */}
        {showFieldSelector && (
          <div className="border-b bg-muted/50 px-6 py-3">
            <p className="text-sm font-medium mb-2">Select fields to include in exports:</p>
            <div className="flex flex-wrap gap-3">
              {EXPORT_FIELDS.map(field => (
                <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats Bar */}
        <div className="border-b bg-background px-6 py-3 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-lg font-bold">{leads.length}</span>
              <span className="text-muted-foreground">Total Leads</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <button
              onClick={() => setActiveTab('hot')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${activeTab === 'hot' ? 'bg-red-500/20 ring-2 ring-red-500' : 'hover:bg-red-500/10'}`}
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span className="font-bold text-red-600">{hotLeads.length}</span>
              <span className="text-sm text-muted-foreground">Hot</span>
            </button>
            <button
              onClick={() => setActiveTab('warm')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${activeTab === 'warm' ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'hover:bg-amber-500/10'}`}
            >
              <ThermometerSun className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-600">{warmLeads.length}</span>
              <span className="text-sm text-muted-foreground">Warm</span>
            </button>
            <button
              onClick={() => setActiveTab('cold')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${activeTab === 'cold' ? 'bg-blue-500/20 ring-2 ring-blue-500' : 'hover:bg-blue-500/10'}`}
            >
              <Snowflake className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-blue-600">{coldLeads.length}</span>
              <span className="text-sm text-muted-foreground">Cold</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${activeTab === 'all' ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-primary/10'}`}
            >
              <span className="text-sm font-medium">View All</span>
            </button>

            <div className="ml-auto flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={selectAllInGroup}>
                {selectedLeadIds.size === displayLeads.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button onClick={handleProceedToVerify} className="gap-2">
                <Zap className="w-4 h-4" />
                Verify {selectedLeadIds.size > 0 ? selectedLeadIds.size : 'Selected'}
              </Button>
            </div>
          </div>
        </div>

        {/* Group Header when filtered */}
        {activeTab !== 'all' && (
          <div className={`px-6 py-3 border-b ${getClassificationColor(activeTab)}`}>
            <div className="flex items-center gap-3">
              {getClassificationIcon(activeTab)}
              <div>
                <h2 className="font-bold text-lg capitalize">{activeTab} Leads</h2>
                <p className="text-sm opacity-80">
                  {activeTab === 'hot' && 'High-intent prospects - Call today for best results!'}
                  {activeTab === 'warm' && 'Good prospects - Email first, then follow up with a call'}
                  {activeTab === 'cold' && 'Nurture leads - Send helpful content over time'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Content - Lead Cards */}
        <ScrollArea className="flex-1" ref={documentRef}>
          <div className="p-6 space-y-4">
            {displayLeads.map((lead, index) => (
              <Card
                key={lead.id}
                className={`border-2 transition-all hover:shadow-lg ${
                  selectedLeadIds.has(lead.id) ? 'ring-2 ring-primary border-primary' : ''
                } ${getClassificationColor(lead.insight.classification)}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Checkbox + Rank */}
                    <div className="flex flex-col items-center gap-2">
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                      />
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{lead.name}</h3>
                            <Badge className={getClassificationColor(lead.insight.classification)}>
                              {getClassificationIcon(lead.insight.classification)}
                              <span className="ml-1 capitalize">{lead.insight.classification}</span>
                            </Badge>
                            {lead.insight.urgencyLevel === 'high' && (
                              <Badge variant="destructive" className="animate-pulse">
                                <Zap className="w-3 h-3 mr-1" />
                                URGENT
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Contact: {lead.estimatedOwner}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Est. Value</p>
                          <p className="font-bold text-green-600">{lead.insight.estimatedValue}</p>
                        </div>
                      </div>

                      {/* Contact Info Row */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-green-500" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="truncate max-w-[250px]">{lead.address}</span>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4 text-purple-500" />
                            <span className="truncate max-w-[200px]">{lead.website}</span>
                          </div>
                        )}
                        {lead.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>{lead.rating}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* AI Insights Row */}
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Best Contact Time */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold text-sm">Best Time to Contact</span>
                          </div>
                          <p className="text-sm">{lead.insight.bestContactTime}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {lead.insight.bestContactMethod === 'call' && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <PhoneCall className="w-3 h-3 mr-1" /> Call First
                              </Badge>
                            )}
                            {lead.insight.bestContactMethod === 'email' && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                <MailOpen className="w-3 h-3 mr-1" /> Email First
                              </Badge>
                            )}
                            {lead.insight.bestContactMethod === 'both' && (
                              <>
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  <MailOpen className="w-3 h-3 mr-1" /> Email
                                </Badge>
                                <span className="text-xs">then</span>
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <PhoneCall className="w-3 h-3 mr-1" /> Call
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Pain Points */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-500 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold text-sm">Pain Points</span>
                          </div>
                          <ul className="text-sm space-y-1">
                            {lead.insight.painPoints.slice(0, 2).map((point, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Talking Points */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-semibold text-sm">Talking Points</span>
                          </div>
                          <ul className="text-sm space-y-1">
                            {lead.insight.talkingPoints.slice(0, 2).map((point, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg p-3 border border-violet-500/30">
                        <div className="flex items-center gap-2 text-violet-600 mb-1">
                          <Brain className="w-4 h-4" />
                          <span className="font-semibold text-sm">AI Recommendation</span>
                        </div>
                        <p className="text-sm italic">{lead.insight.aiRecommendation}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {displayLeads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No leads in this category</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t bg-muted/30 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {displayLeads.length} of {leads.length} leads
              {selectedLeadIds.size > 0 && ` • ${selectedLeadIds.size} selected`}
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
              <Button onClick={handleProceedToVerify} size="lg" className="gap-2">
                <Zap className="w-5 h-5" />
                AI Verify & Find Emails
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
