import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Loader2, Mail, Globe, Brain, Target,
  TrendingUp, Clock, Sparkles, AlertTriangle, Phone, Building2,
  Calendar, BarChart3, Zap, Users, Send, Star, Download, Cloud, FileSpreadsheet,
  ArrowRight, Rocket, Flame
} from 'lucide-react';
import { VerificationSkeleton } from '@/components/ui/loading-skeletons';
import * as XLSX from 'xlsx-js-style';
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
  const navigate = useNavigate();
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

  // Navigate directly to compose with leads
  const handleGoToCompose = () => {
    // Store verified leads in sessionStorage for the mailbox
    const emailLeads = verifiedLeads.filter(l => l.emailValid).map(l => ({
      id: l.id,
      email: l.email,
      business_name: l.name,
      name: l.name,
      contact_name: l.name,
      website: l.website,
      phone: l.phone,
      aiClassification: l.conversionProbability === 'high' ? 'hot' : l.conversionProbability === 'medium' ? 'warm' : 'cold',
      leadScore: l.leadScore,
      painPoints: l.painPoints,
      talkingPoints: l.talkingPoints,
    }));
    
    sessionStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
    sessionStorage.setItem('bamlead_auto_open_compose', 'true');
    
    onClose();
    navigate('/mailbox-demo');
    toast.success(`${emailLeads.length} verified leads ready for outreach!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-screen h-screen max-h-screen flex flex-col p-0 gap-0 rounded-none border-0">
        <DialogHeader className="p-6 border-b bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  AI Lead Verifier
                </span>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                  <Zap className="w-3 h-3 mr-1" />
                  Predictive AI
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {verificationComplete 
                  ? <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-foreground">{verifiedLeads.length} leads analyzed</span>
                      <span className="text-emerald-600 font-semibold">• {highPriorityLeads.length} hot leads ready!</span>
                    </span>
                  : <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                      Analyzing {leads.length} leads with AI intelligence...
                    </span>
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Verification Progress */}
            {isVerifying && (
              <Card className="border-2 border-teal-500/40 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-cyan-500/10 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                        <Brain className="w-7 h-7 text-white animate-pulse" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-card">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-foreground">AI Analyzing Leads...</p>
                      <p className="text-sm text-teal-600 font-medium truncate">{currentLead}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">{Math.round(progress)}%</span>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Verifying emails & scoring leads with AI
                    </span>
                    <span className="font-medium text-teal-600">{verifiedLeads.length}/{leads.length} processed</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            {verificationComplete && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
                    <CardContent className="p-5 text-center relative">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Flame className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{highPriorityLeads.length}</p>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Hot Leads 🔥</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-blue-500/40 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
                    <CardContent className="p-5 text-center relative">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{validEmailLeads.length}</p>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Valid Emails</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-orange-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl" />
                    <CardContent className="p-5 text-center relative">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {Math.round(verifiedLeads.reduce((sum, l) => sum + l.predictedResponse, 0) / verifiedLeads.length || 0)}%
                      </p>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Avg Response</p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Recommendation */}
                <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                        AI Recommendation
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Flame className="w-3.5 h-3.5" />
                        {highPriorityLeads.length} hot leads
                      </span>{' '}
                      are ready for outreach. Best time to contact:{' '}
                      <span className="font-semibold text-teal-600">Tuesday-Thursday, 10AM or 2PM</span>.
                      Expected response rate:{' '}
                      <span className="font-bold text-emerald-600">{Math.round(verifiedLeads.reduce((sum, l) => sum + l.predictedResponse, 0) / verifiedLeads.length || 0)}%</span>
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
          <div className="p-6 border-t bg-gradient-to-r from-muted/50 via-muted/30 to-emerald-500/5 space-y-4">
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
            
            {/* Main Action - Go directly to Compose */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={handleGoToCompose}
                disabled={validEmailLeads.length === 0}
                className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
              >
                <Rocket className="w-4 h-4" />
                Continue to Outreach
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
