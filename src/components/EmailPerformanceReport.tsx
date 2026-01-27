import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Download, FileText, BarChart3, MousePointerClick, Mail, TrendingUp,
  Flame, ThermometerSun, Snowflake, CheckCircle2, XCircle, Clock,
  Eye, ExternalLink, FlaskConical
} from 'lucide-react';

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
}

interface ABTestResult {
  variant: string;
  subject: string;
  sent: number;
  opened: number;
  clicked: number;
  winner?: boolean;
}

interface HeatmapLink {
  url: string;
  clicks: number;
  percentage: number;
}

interface EmailPerformanceReportProps {
  campaignName?: string;
  dateRange?: { start: Date; end: Date };
  stats?: CampaignStats;
  abTestResults?: ABTestResult[];
  heatmapData?: HeatmapLink[];
  leadsByPriority?: { hot: number; warm: number; cold: number };
  onExport?: (format: 'pdf' | 'excel') => void;
}

// Mock data for demo
const MOCK_STATS: CampaignStats = {
  sent: 247,
  delivered: 241,
  opened: 89,
  clicked: 34,
  replied: 12,
  bounced: 6,
  unsubscribed: 2,
};

const MOCK_AB_RESULTS: ABTestResult[] = [
  { variant: 'A', subject: 'Quick question about your business', sent: 124, opened: 52, clicked: 21, winner: true },
  { variant: 'B', subject: '3 ways to grow your revenue this month', sent: 123, opened: 37, clicked: 13 },
];

const MOCK_HEATMAP: HeatmapLink[] = [
  { url: 'https://example.com/schedule-call', clicks: 18, percentage: 53 },
  { url: 'https://example.com/case-study', clicks: 9, percentage: 26 },
  { url: 'https://example.com/pricing', clicks: 5, percentage: 15 },
  { url: 'https://example.com/about', clicks: 2, percentage: 6 },
];

export default function EmailPerformanceReport({
  campaignName = 'Campaign Performance Report',
  dateRange,
  stats = MOCK_STATS,
  abTestResults = MOCK_AB_RESULTS,
  heatmapData = MOCK_HEATMAP,
  leadsByPriority = { hot: 45, warm: 112, cold: 90 },
  onExport,
}: EmailPerformanceReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const openRate = stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : '0';
  const clickRate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : '0';
  const replyRate = stats.delivered > 0 ? ((stats.replied / stats.delivered) * 100).toFixed(1) : '0';
  const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(1) : '0';

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Email Campaign Performance Report', 14, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Campaign Overview
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Campaign Overview', 14, 55);
      
      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value', 'Rate']],
        body: [
          ['Emails Sent', stats.sent.toString(), '-'],
          ['Delivered', stats.delivered.toString(), `${((stats.delivered / stats.sent) * 100).toFixed(1)}%`],
          ['Opened', stats.opened.toString(), `${openRate}%`],
          ['Clicked', stats.clicked.toString(), `${clickRate}%`],
          ['Replied', stats.replied.toString(), `${replyRate}%`],
          ['Bounced', stats.bounced.toString(), `${bounceRate}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [45, 212, 191] }, // primary teal
      });
      
      // Lead Priority Breakdown
      const y1 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Lead Priority Distribution', 14, y1);
      
      autoTable(doc, {
        startY: y1 + 5,
        head: [['Priority', 'Count', 'Percentage']],
        body: [
          ['🔥 Hot', leadsByPriority.hot.toString(), `${((leadsByPriority.hot / stats.sent) * 100).toFixed(1)}%`],
          ['🌡️ Warm', leadsByPriority.warm.toString(), `${((leadsByPriority.warm / stats.sent) * 100).toFixed(1)}%`],
          ['❄️ Cold', leadsByPriority.cold.toString(), `${((leadsByPriority.cold / stats.sent) * 100).toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] }, // amber
      });
      
      // A/B Test Results
      const y2 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('A/B Test Results', 14, y2);
      
      autoTable(doc, {
        startY: y2 + 5,
        head: [['Variant', 'Subject Line', 'Sent', 'Open Rate', 'Click Rate', 'Winner']],
        body: abTestResults.map(r => [
          r.variant,
          r.subject.length > 30 ? r.subject.substring(0, 30) + '...' : r.subject,
          r.sent.toString(),
          `${((r.opened / r.sent) * 100).toFixed(1)}%`,
          `${((r.clicked / r.sent) * 100).toFixed(1)}%`,
          r.winner ? '✓ WINNER' : '',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] }, // violet
        columnStyles: {
          1: { cellWidth: 50 },
        },
      });
      
      // Click Heatmap
      const y3 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Link Click Heatmap', 14, y3);
      
      autoTable(doc, {
        startY: y3 + 5,
        head: [['Link URL', 'Clicks', 'Percentage']],
        body: heatmapData.map(h => [
          h.url.length > 40 ? h.url.substring(0, 40) + '...' : h.url,
          h.clicks.toString(),
          `${h.percentage}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // emerald
      });
      
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by BamLead CRM - AI-Powered Lead Generation', 14, pageHeight - 10);
      doc.text('14-Day Free Trial | $49/month after trial', pageWidth - 14, pageHeight - 10, { align: 'right' });
      
      // Save
      doc.save(`bamlead-campaign-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report exported successfully!');
      
      if (onExport) onExport('pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
    
    setIsExporting(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Campaign Analytics</CardTitle>
              <p className="text-xs text-muted-foreground">
                Performance metrics, A/B tests, and click heatmaps
              </p>
            </div>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export PDF Report'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="bg-muted/50 border border-border mb-4">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="abtest" className="gap-1.5 text-xs">
              <FlaskConical className="w-3.5 h-3.5" />
              A/B Tests
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-1.5 text-xs">
              <MousePointerClick className="w-3.5 h-3.5" />
              Click Heatmap
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
                <Mail className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{stats.sent}</p>
                <p className="text-[10px] text-muted-foreground">Emails Sent</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
                <Eye className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold text-foreground">{openRate}%</p>
                <p className="text-[10px] text-muted-foreground">Open Rate</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
                <MousePointerClick className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                <p className="text-2xl font-bold text-foreground">{clickRate}%</p>
                <p className="text-[10px] text-muted-foreground">Click Rate</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                <p className="text-2xl font-bold text-foreground">{replyRate}%</p>
                <p className="text-[10px] text-muted-foreground">Reply Rate</p>
              </div>
            </div>
            
            {/* Priority Breakdown */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">Lead Priority Distribution</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <Flame className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{leadsByPriority.hot}</p>
                    <p className="text-[10px] text-muted-foreground">Hot Leads</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <ThermometerSun className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{leadsByPriority.warm}</p>
                    <p className="text-[10px] text-muted-foreground">Warm Leads</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Snowflake className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{leadsByPriority.cold}</p>
                    <p className="text-[10px] text-muted-foreground">Cold Leads</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* A/B Test Tab */}
          <TabsContent value="abtest">
            <div className="space-y-4">
              {abTestResults.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    result.winner 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={result.winner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}>
                        Variant {result.variant}
                      </Badge>
                      {result.winner && (
                        <Badge className="bg-emerald-500 text-white text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          WINNER
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-3 truncate">{result.subject}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.sent}</p>
                      <p className="text-[10px] text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{((result.opened / result.sent) * 100).toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">Open Rate</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{((result.clicked / result.sent) * 100).toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Heatmap Tab */}
          <TabsContent value="heatmap">
            <div className="space-y-3">
              {heatmapData.map((link, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{link.url}</span>
                    </div>
                    <Badge className="bg-primary/20 text-primary text-xs ml-2">
                      {link.clicks} clicks
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${link.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{link.percentage}% of total clicks</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* CRM Trial Notice */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">BamLead CRM - 14-Day Free Trial</h4>
              <p className="text-[10px] text-muted-foreground">
                Full analytics, A/B testing, and PDF exports included. Connect your own CRM or continue with BamLead after trial.
              </p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Trial Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
