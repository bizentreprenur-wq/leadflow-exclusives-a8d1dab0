import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, Download, Printer, X, Flame, Thermometer, Snowflake,
  Phone, Mail, Globe, MapPin, Star, Clock, Target, Zap, Users,
  ArrowLeft, CheckCircle2, AlertTriangle
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
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  bestTimeToCall?: string;
  readyToCall?: boolean;
  painPoints?: string[];
  urgencyLevel?: 'high' | 'medium' | 'low';
  recommendedApproach?: string;
  conversionProbability?: number;
  industry?: string;
}

interface LeadReportDocumentProps {
  open: boolean;
  onClose: () => void;
  leads: SearchResult[];
  searchQuery?: string;
  location?: string;
}

export default function LeadReportDocument({
  open,
  onClose,
  leads,
  searchQuery = 'Business',
  location = 'Your Area',
}: LeadReportDocumentProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!open) return null;

  const hotLeads = leads.filter(l => l.aiClassification === 'hot');
  const warmLeads = leads.filter(l => l.aiClassification === 'warm');
  const coldLeads = leads.filter(l => l.aiClassification === 'cold');
  const noWebsiteLeads = leads.filter(l => !l.websiteAnalysis?.hasWebsite);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(20, 184, 166); // teal
    doc.text('BamLead Intelligence Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${searchQuery} in ${location}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated: ${today}`, pageWidth / 2, 34, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Lead Summary', 14, 48);

    doc.setFontSize(10);
    doc.text(`Total Leads: ${leads.length}`, 14, 56);
    doc.setTextColor(239, 68, 68);
    doc.text(`🔥 Hot Leads: ${hotLeads.length}`, 14, 62);
    doc.setTextColor(245, 158, 11);
    doc.text(`⚡ Warm Leads: ${warmLeads.length}`, 14, 68);
    doc.setTextColor(59, 130, 246);
    doc.text(`❄️ Cold Leads: ${coldLeads.length}`, 14, 74);
    doc.setTextColor(168, 85, 247);
    doc.text(`🌐 No Website: ${noWebsiteLeads.length}`, 14, 80);

    let yPos = 95;

    // Hot Leads Section
    if (hotLeads.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('🔥 HOT LEADS - Contact Today!', 14, yPos);
      yPos += 6;

      const hotData = hotLeads.slice(0, 25).map((l, i) => [
        (i + 1).toString(),
        l.name.substring(0, 30),
        l.phone || 'N/A',
        l.email?.substring(0, 25) || 'N/A',
        `${l.leadScore || 0}%`,
        l.bestTimeToCall?.substring(0, 15) || 'N/A'
      ]);

      autoTable(doc, {
        head: [['#', 'Business', 'Phone', 'Email', 'Score', 'Best Time']],
        body: hotData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [239, 68, 68] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Warm Leads Section
    if (warmLeads.length > 0 && yPos < 230) {
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('⚡ WARM LEADS - Email First', 14, yPos);
      yPos += 6;

      const warmData = warmLeads.slice(0, 20).map((l, i) => [
        (i + 1).toString(),
        l.name.substring(0, 30),
        l.phone || 'N/A',
        l.email?.substring(0, 25) || 'N/A',
        `${l.leadScore || 0}%`
      ]);

      autoTable(doc, {
        head: [['#', 'Business', 'Phone', 'Email', 'Score']],
        body: warmData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [245, 158, 11] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Cold Leads on new page
    if (coldLeads.length > 0) {
      doc.addPage();
      yPos = 20;

      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text('❄️ COLD LEADS - Nurture Over Time', 14, yPos);
      yPos += 6;

      const coldData = coldLeads.slice(0, 25).map((l, i) => [
        (i + 1).toString(),
        l.name.substring(0, 30),
        l.phone || 'N/A',
        l.email?.substring(0, 25) || 'N/A',
        `${l.leadScore || 0}%`
      ]);

      autoTable(doc, {
        head: [['#', 'Business', 'Phone', 'Email', 'Score']],
        body: coldData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(`bamlead-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded!');
  };

  const LeadCard = ({ lead, index }: { lead: SearchResult; index: number }) => {
    const getClassColor = () => {
      switch (lead.aiClassification) {
        case 'hot': return 'border-l-red-500 bg-red-50';
        case 'warm': return 'border-l-orange-500 bg-orange-50';
        case 'cold': return 'border-l-blue-500 bg-blue-50';
        default: return 'border-l-gray-300 bg-gray-50';
      }
    };

    const getClassIcon = () => {
      switch (lead.aiClassification) {
        case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
        case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
        case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
        default: return <Target className="w-4 h-4 text-gray-500" />;
      }
    };

    return (
      <div className={`border-l-4 rounded-r-lg p-4 mb-3 ${getClassColor()}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              {getClassIcon()}
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              {lead.leadScore && (
                <Badge className="bg-primary/10 text-primary text-xs">
                  {lead.leadScore}% match
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{lead.address}</span>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{lead.website}</span>
                </div>
              )}
              {lead.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>{lead.rating} stars</span>
                </div>
              )}
              {lead.bestTimeToCall && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{lead.bestTimeToCall}</span>
                </div>
              )}
            </div>

            {lead.painPoints && lead.painPoints.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {lead.painPoints.slice(0, 3).map((point, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-white">
                    {point}
                  </Badge>
                ))}
              </div>
            )}

            {lead.recommendedApproach && (
              <div className="mt-2 text-xs text-gray-500 italic">
                💡 {lead.recommendedApproach}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center print:bg-white print:relative">
      <div className="w-full max-w-4xl h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden print:max-w-none print:h-auto print:shadow-none print:rounded-none">
        
        {/* Header - Hidden in print */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-500 to-cyan-500 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Lead Intelligence Report</h1>
              <p className="text-white/80 text-sm">{leads.length} leads found • {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <ScrollArea className="flex-1 print:overflow-visible">
          <div ref={documentRef} className="p-8 bg-white min-h-full">
            
            {/* Document Title */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎯 Lead Intelligence Report
              </h1>
              <p className="text-lg text-gray-600">
                {searchQuery} in {location}
              </p>
              <p className="text-sm text-gray-400 mt-1">{today}</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{leads.length}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6" />
                  {hotLeads.length}
                </div>
                <div className="text-sm text-red-500">Hot Leads</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 flex items-center justify-center gap-2">
                  <Thermometer className="w-6 h-6" />
                  {warmLeads.length}
                </div>
                <div className="text-sm text-orange-500">Warm Leads</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
                  <Snowflake className="w-6 h-6" />
                  {coldLeads.length}
                </div>
                <div className="text-sm text-blue-500">Cold Leads</div>
              </div>
            </div>

            {/* Hot Leads Section */}
            {hotLeads.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-red-200">
                  <Flame className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-red-600">
                    🔥 Hot Leads - Call Today!
                  </h2>
                  <Badge className="bg-red-500 text-white">{hotLeads.length}</Badge>
                </div>
                {hotLeads.map((lead, i) => (
                  <LeadCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>
            )}

            {/* Warm Leads Section */}
            {warmLeads.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-orange-200">
                  <Thermometer className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold text-orange-600">
                    ⚡ Warm Leads - Email First
                  </h2>
                  <Badge className="bg-orange-500 text-white">{warmLeads.length}</Badge>
                </div>
                {warmLeads.map((lead, i) => (
                  <LeadCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>
            )}

            {/* Cold Leads Section */}
            {coldLeads.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-200">
                  <Snowflake className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-blue-600">
                    ❄️ Cold Leads - Nurture
                  </h2>
                  <Badge className="bg-blue-500 text-white">{coldLeads.length}</Badge>
                </div>
                {coldLeads.map((lead, i) => (
                  <LeadCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-400">
              <p>Generated by BamLead • {today}</p>
              <p className="mt-1">This report contains AI-analyzed lead intelligence</p>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Action Bar - Hidden in print */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 print:hidden">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Document
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2 bg-teal-500 hover:bg-teal-600">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}