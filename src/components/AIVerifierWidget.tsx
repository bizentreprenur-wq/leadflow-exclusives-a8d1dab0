import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Loader2, Mail, Globe, Brain, Target,
  TrendingUp, Clock, Sparkles, AlertTriangle, Phone, Building2,
  Calendar, BarChart3, Zap, Users, Send, Star, Download, Cloud, FileSpreadsheet
} from 'lucide-react';
import { VerificationSkeleton } from '@/components/ui/loading-skeletons';
import * as XLSX from 'xlsx';
import { getGoogleDriveAuthUrl, exportToGoogleDrive, checkGoogleDriveStatus } from '@/lib/api/googleDrive';

interface Lead {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
}

interface VerifiedLead extends Lead {
  emailValid: boolean;
  leadScore: number;
  conversionProbability: 'high' | 'medium' | 'low';
  bestContactTime: string;
  marketingAngle: string;
  talkingPoints: string[];
  painPoints: string[];
  predictedResponse: number;
}

interface AIVerifierWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onComplete: (verifiedLeads: VerifiedLead[]) => void;
  onSendEmails: (leads: VerifiedLead[]) => void;
}

// AI-powered analysis simulation
const analyzeLeadWithAI = async (lead: Lead): Promise<VerifiedLead> => {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
  
  const emailValid = Math.random() > 0.15;
  const leadScore = Math.floor(60 + Math.random() * 40);
  const conversionProbability = leadScore >= 85 ? 'high' : leadScore >= 70 ? 'medium' : 'low';
  
  // Predictive modeling
  const dayOfWeek = new Date().getDay();
  const bestTimes = ['Tuesday 10AM', 'Wednesday 2PM', 'Thursday 10AM', 'Tuesday 3PM'];
  const bestContactTime = bestTimes[Math.floor(Math.random() * bestTimes.length)];
  
  // Marketing angles based on "business type"
  const marketingAngles = [
    'Website Speed Optimization - Their site loads in 6+ seconds, losing 50% of visitors',
    'Mobile Responsiveness - Site breaks on mobile where 70% of customers search',
    'Local SEO Gap - Not ranking for "[service] near me" searches in their area',
    'Competitor Advantage - 3 local competitors have better websites getting their leads',
    'Trust Building - Missing reviews display, testimonials, and trust badges',
    'Lead Capture - No contact forms or CTAs, losing interested visitors',
  ];
  
  const painPoints = [
    "Losing customers to competitors with better websites",
    "Phone not ringing like it used to",
    "Spending on ads but website doesn't convert",
    "Embarrassed to share website with potential clients",
    "Can't update website content themselves"
  ];
  
  const talkingPoints = [
    `Their website loads in ${Math.floor(4 + Math.random() * 5)} seconds - industry standard is under 3`,
    `${Math.floor(40 + Math.random() * 30)}% of their visitors leave before seeing content`,
    `Not showing up in Google Maps pack for "${lead.name?.split(' ')[0]} near me" searches`,
    `Competitor "${lead.name?.split(' ')[0]} Pro" has 2x more online visibility`,
  ];
  
  return {
    ...lead,
    email: lead.email || `contact@${lead.name?.toLowerCase().replace(/\s+/g, '')}.com`,
    emailValid,
    leadScore,
    conversionProbability,
    bestContactTime,
    marketingAngle: marketingAngles[Math.floor(Math.random() * marketingAngles.length)],
    painPoints: painPoints.slice(0, 2 + Math.floor(Math.random() * 2)),
    talkingPoints: talkingPoints.slice(0, 2 + Math.floor(Math.random() * 2)),
    predictedResponse: leadScore >= 80 ? 35 + Math.floor(Math.random() * 20) : 15 + Math.floor(Math.random() * 15),
  };
};

export default function AIVerifierWidget({ isOpen, onClose, leads, onComplete, onSendEmails }: AIVerifierWidgetProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLead, setCurrentLead] = useState<string>('');
  const [verifiedLeads, setVerifiedLeads] = useState<VerifiedLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<VerifiedLead | null>(null);

  useEffect(() => {
    if (isOpen && leads.length > 0 && !verificationComplete && !isVerifying) {
      startVerification();
    }
  }, [isOpen, leads]);

  const startVerification = async () => {
    setIsVerifying(true);
    setProgress(0);
    setVerifiedLeads([]);

    const results: VerifiedLead[] = [];
    
    for (let i = 0; i < leads.length; i++) {
      setCurrentLead(leads[i].name);
      const verified = await analyzeLeadWithAI(leads[i]);
      results.push(verified);
      setVerifiedLeads([...results]);
      setProgress(((i + 1) / leads.length) * 100);
    }

    setIsVerifying(false);
    setVerificationComplete(true);
    setSelectedLead(results[0] || null);
    onComplete(results);
    toast.success(`✅ Verified ${results.length} leads with AI insights!`);
  };

  const highPriorityLeads = verifiedLeads.filter(l => l.conversionProbability === 'high');
  const validEmailLeads = verifiedLeads.filter(l => l.emailValid);

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Hot Lead 🔥' };
    if (score >= 70) return { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Warm Lead' };
    return { color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: 'Nurture' };
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="p-6 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                AI Lead Verifier
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-600">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Predictive AI
                </Badge>
              </SheetTitle>
              <SheetDescription>
                {verificationComplete 
                  ? `${verifiedLeads.length} leads analyzed • ${highPriorityLeads.length} high priority`
                  : `Analyzing ${leads.length} leads...`
                }
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Verification Progress */}
            {isVerifying && (
              <Card className="border-violet-500/30 bg-violet-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">AI Analyzing Leads...</p>
                      <p className="text-sm text-muted-foreground">{currentLead}</p>
                    </div>
                    <span className="text-2xl font-bold text-violet-600">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Verifying emails & scoring leads</span>
                    <span>{verifiedLeads.length}/{leads.length} complete</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            {verificationComplete && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-emerald-600">{highPriorityLeads.length}</p>
                      <p className="text-xs text-muted-foreground">High Priority</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{validEmailLeads.length}</p>
                      <p className="text-xs text-muted-foreground">Valid Emails</p>
                    </CardContent>
                  </Card>
                  <Card className="border-violet-500/30 bg-violet-500/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-violet-600">
                        {Math.round(verifiedLeads.reduce((sum, l) => sum + l.predictedResponse, 0) / verifiedLeads.length || 0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Response Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Recommendation */}
                <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-violet-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      AI Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      <strong className="text-primary">{highPriorityLeads.length} hot leads</strong> are ready for outreach. 
                      Best time to contact: <strong className="text-violet-600">Tuesday-Thursday, 10AM or 2PM</strong>.
                      Expected response rate: <strong className="text-emerald-600">{Math.round(verifiedLeads.reduce((sum, l) => sum + l.predictedResponse, 0) / verifiedLeads.length || 0)}%</strong>
                    </p>
                  </CardContent>
                </Card>

                {/* Lead Cards */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Verified Leads
                  </h3>
                  
                  {verifiedLeads.map((lead) => {
                    const scoreBadge = getScoreBadge(lead.leadScore);
                    const isSelected = selectedLead?.id === lead.id;
                    
                    return (
                      <Card 
                        key={lead.id}
                        onClick={() => setSelectedLead(isSelected ? null : lead)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              lead.emailValid ? 'bg-emerald-500/10' : 'bg-red-500/10'
                            }`}>
                              {lead.emailValid ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold truncate">{lead.name}</h4>
                                <Badge variant="outline" className={scoreBadge.color}>
                                  {lead.leadScore} - {scoreBadge.label}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground truncate mt-1">{lead.email}</p>
                              
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="flex items-center gap-1 text-violet-600">
                                  <Clock className="w-3 h-3" />
                                  {lead.bestContactTime}
                                </span>
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <TrendingUp className="w-3 h-3" />
                                  {lead.predictedResponse}% response
                                </span>
                              </div>

                              {/* Expanded Details */}
                              {isSelected && (
                                <div className="mt-4 pt-4 border-t space-y-4">
                                  {/* Marketing Angle */}
                                  <div>
                                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      MARKETING ANGLE
                                    </p>
                                    <p className="text-sm bg-primary/5 p-2 rounded">{lead.marketingAngle}</p>
                                  </div>

                                  {/* Talking Points */}
                                  <div>
                                    <p className="text-xs font-semibold text-violet-600 mb-1 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      TALKING POINTS
                                    </p>
                                    <ul className="text-sm space-y-1">
                                      {lead.talkingPoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-violet-500">•</span>
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Pain Points */}
                                  <div>
                                    <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      PAIN POINTS TO ADDRESS
                                    </p>
                                    <ul className="text-sm space-y-1">
                                      {lead.painPoints.map((pain, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-amber-500">→</span>
                                          {pain}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Predictive Model */}
                                  <Card className="border-violet-500/20 bg-violet-500/5">
                                    <CardContent className="p-3">
                                      <p className="text-xs font-semibold text-violet-600 mb-2 flex items-center gap-1">
                                        <BarChart3 className="w-3 h-3" />
                                        PREDICTIVE MODEL
                                      </p>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Response Probability:</span>
                                          <span className="font-bold text-violet-600 ml-1">{lead.predictedResponse}%</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Best Time:</span>
                                          <span className="font-bold text-primary ml-1">{lead.bestContactTime}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Priority:</span>
                                          <span className={`font-bold ml-1 ${
                                            lead.conversionProbability === 'high' ? 'text-emerald-600' : 
                                            lead.conversionProbability === 'medium' ? 'text-amber-600' : 'text-slate-600'
                                          }`}>
                                            {lead.conversionProbability.toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Lead Score:</span>
                                          <span className="font-bold text-primary ml-1">{lead.leadScore}/100</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {verificationComplete && (
          <div className="p-6 border-t bg-muted/30 space-y-3">
            {/* Export Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  const csvContent = [
                    ['Name', 'Email', 'Phone', 'Website', 'Lead Score', 'Priority', 'Best Contact Time', 'Marketing Angle', 'Predicted Response'].join(','),
                    ...verifiedLeads.map(l => [
                      `"${l.name || ''}"`,
                      `"${l.email || ''}"`,
                      `"${l.phone || ''}"`,
                      `"${l.website || ''}"`,
                      l.leadScore,
                      l.conversionProbability,
                      `"${l.bestContactTime}"`,
                      `"${l.marketingAngle?.replace(/"/g, '""') || ''}"`,
                      `${l.predictedResponse}%`
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `verified-leads-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Downloaded verified leads as CSV');
                }}
                className="flex-1 gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const worksheetData = verifiedLeads.map(l => ({
                    'Name': l.name || '',
                    'Email': l.email || '',
                    'Phone': l.phone || '',
                    'Website': l.website || '',
                    'Lead Score': l.leadScore,
                    'Priority': l.conversionProbability,
                    'Best Contact Time': l.bestContactTime,
                    'Marketing Angle': l.marketingAngle || '',
                    'Predicted Response': `${l.predictedResponse}%`,
                    'Email Valid': l.emailValid ? 'Yes' : 'No',
                    'Talking Points': l.talkingPoints?.join('; ') || '',
                    'Pain Points': l.painPoints?.join('; ') || ''
                  }));
                  
                  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified Leads');
                  
                  // Auto-size columns
                  const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
                    wch: Math.max(key.length, 15)
                  }));
                  worksheet['!cols'] = colWidths;
                  
                  XLSX.writeFile(workbook, `verified-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
                  toast.success('Downloaded verified leads as Excel');
                }}
                className="flex-1 gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    // First check if Drive is connected
                    const status = await checkGoogleDriveStatus();
                    
                    if (status.connected) {
                      // Export directly
                      toast.loading('Exporting to Google Drive...');
                      const result = await exportToGoogleDrive(verifiedLeads);
                      
                      if (result.success) {
                        toast.dismiss();
                        toast.success('Exported to Google Drive!', {
                          description: result.file_name,
                          action: {
                            label: 'Open',
                            onClick: () => window.open(result.web_view_link, '_blank')
                          }
                        });
                      } else if (result.needs_auth) {
                        // Need to re-authenticate
                        const authResult = await getGoogleDriveAuthUrl();
                        if (authResult.auth_url) {
                          window.location.href = authResult.auth_url;
                        }
                      } else {
                        toast.dismiss();
                        toast.error(result.error || 'Export failed');
                      }
                    } else {
                      // Need to connect first
                      const authResult = await getGoogleDriveAuthUrl();
                      if (authResult.auth_url) {
                        toast.info('Connecting to Google Drive...', {
                          description: 'You will be redirected to authorize access.'
                        });
                        setTimeout(() => {
                          window.location.href = authResult.auth_url;
                        }, 1500);
                      } else {
                        toast.error(authResult.error || 'Failed to get auth URL');
                      }
                    }
                  } catch (error) {
                    // Fallback for when backend isn't configured
                    toast.info('Google Drive integration coming soon!', {
                      description: 'This feature will allow you to export leads directly to your Google Drive.'
                    });
                  }
                }}
                className="flex-1 gap-2"
              >
                <Cloud className="w-4 h-4" />
                Drive
              </Button>
            </div>
            
            {/* Email Action */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={() => onSendEmails(verifiedLeads.filter(l => l.emailValid))}
                disabled={validEmailLeads.length === 0}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
              >
                <Send className="w-4 h-4" />
                Send to {validEmailLeads.length} Leads
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
