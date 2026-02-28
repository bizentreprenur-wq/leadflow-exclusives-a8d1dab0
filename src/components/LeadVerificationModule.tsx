import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Building2,
  Globe,
  Phone,
  Star,
  Sparkles,
  Send,
  Download,
  RefreshCw,
  AlertTriangle,
  Save,
  Database,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  ChevronDown,
  Table,
  Link2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchVerifiedLeads, saveVerifiedLeads, deleteVerifiedLeads, type SavedLead } from '@/lib/api/verifiedLeads';

export interface VerifiedLead {
  id: string;
  email: string;
  business_name: string;
  contact_name?: string;
  website?: string;
  phone?: string;
  platform?: string;
  verified: boolean;
  emailValid: boolean;
  leadScore: number;
  aiDraftedMessage?: string;
  verificationStatus: 'pending' | 'verifying' | 'verified' | 'failed';
  issues?: string[];
}

interface LeadVerificationModuleProps {
  onSendToEmail: (leads: VerifiedLead[]) => void;
}

// Mock leads for demonstration - in production these would come from search results
const mockLeads: VerifiedLead[] = [
  {
    id: '1',
    business_name: 'Sunrise Plumbing Co',
    email: 'contact@sunriseplumbing.com',
    phone: '(555) 123-4567',
    website: 'https://sunriseplumbing.com',
    verified: false,
    emailValid: false,
    leadScore: 0,
    verificationStatus: 'pending',
  },
  {
    id: '2',
    business_name: 'Elite Roofing Services',
    email: 'info@eliteroofing.net',
    phone: '(555) 234-5678',
    website: 'https://eliteroofing.net',
    verified: false,
    emailValid: false,
    leadScore: 0,
    verificationStatus: 'pending',
  },
  {
    id: '3',
    business_name: 'Green Garden Landscaping',
    email: 'hello@greengardenlandscape.com',
    phone: '(555) 345-6789',
    website: 'https://greengardenlandscape.com',
    verified: false,
    emailValid: false,
    leadScore: 0,
    verificationStatus: 'pending',
  },
];

export default function LeadVerificationModule({ onSendToEmail }: LeadVerificationModuleProps) {
  const [leads, setLeads] = useState<VerifiedLead[]>(mockLeads);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [showSavedLeads, setShowSavedLeads] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetsDialogOpen, setGoogleSheetsDialogOpen] = useState(false);

  // Load saved leads on mount
  useEffect(() => {
    loadSavedLeads();
  }, []);

  const loadSavedLeads = async () => {
    setIsLoadingSaved(true);
    try {
      const response = await fetchVerifiedLeads(1, 100);
      if (response.success && response.data) {
        setSavedLeads(response.data.leads);
      }
    } catch (error) {
      console.error('Failed to load saved leads:', error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads((prev) => [...prev, leadId]);
    } else {
      setSelectedLeads((prev) => prev.filter((id) => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map((l) => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const simulateAIVerification = async (lead: VerifiedLead): Promise<VerifiedLead> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Simulate verification results
    const emailValid = Math.random() > 0.2; // 80% valid
    const leadScore = Math.floor(60 + Math.random() * 40); // 60-100 score

    const issues: string[] = [];
    if (!emailValid) issues.push('Email domain MX records not found');
    if (leadScore < 70) issues.push('Low engagement potential');
    if (Math.random() > 0.7) issues.push('Website uses outdated technology');

    // Generate AI drafted message
    const firstName = lead.business_name.split(' ')[0];
    const aiDraftedMessage = `Hi ${firstName} Team,

I noticed your business could benefit from a modern web presence upgrade. Our team specializes in helping local businesses like yours attract more customers with professional websites optimized for mobile and search engines.

Would you be open to a quick 10-minute call this week to discuss how we could help ${lead.business_name} stand out online?

Best regards`;

    return {
      ...lead,
      verified: true,
      emailValid,
      leadScore,
      aiDraftedMessage,
      verificationStatus: emailValid ? 'verified' : 'failed',
      issues: issues.length > 0 ? issues : undefined,
    };
  };

  const handleVerifySelected = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to verify');
      return;
    }

    setIsVerifying(true);
    setVerificationProgress(0);

    const leadsToVerify = leads.filter((l) => selectedLeads.includes(l.id));
    let completed = 0;

    for (const lead of leadsToVerify) {
      // Update status to verifying
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, verificationStatus: 'verifying' as const } : l
        )
      );

      try {
        const verifiedLead = await simulateAIVerification(lead);
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? verifiedLead : l))
        );
      } catch (error) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, verificationStatus: 'failed' as const, issues: ['Verification failed'] }
              : l
          )
        );
      }

      completed++;
      setVerificationProgress((completed / leadsToVerify.length) * 100);
    }

    setIsVerifying(false);
    toast.success(`Verified ${completed} leads with AI`);
  };

  const handleSaveToDatabase = async () => {
    const verifiedLeadsToSave = leads.filter(
      (l) => selectedLeads.includes(l.id) && l.verificationStatus === 'verified'
    );

    if (verifiedLeadsToSave.length === 0) {
      toast.error('Please select verified leads to save');
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveVerifiedLeads(verifiedLeadsToSave);
      if (response.success && response.data) {
        toast.success(`Saved ${response.data.saved} leads to database`);
        if (response.data.errors.length > 0) {
          console.warn('Save errors:', response.data.errors);
        }
        // Reload saved leads
        await loadSavedLeads();
      } else {
        toast.error(response.error || 'Failed to save leads');
      }
    } catch (error) {
      toast.error('Failed to save leads to database');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedLeads = async () => {
    const selectedDbIds = savedLeads
      .filter((l) => selectedLeads.includes(l.id))
      .map((l) => l.dbId)
      .filter((id): id is number => id !== undefined);

    if (selectedDbIds.length === 0) {
      toast.error('Please select saved leads to delete');
      return;
    }

    try {
      const response = await deleteVerifiedLeads(selectedDbIds);
      if (response.success) {
        toast.success(`Deleted ${response.data?.deleted || selectedDbIds.length} leads`);
        setSelectedLeads([]);
        await loadSavedLeads();
      } else {
        toast.error(response.error || 'Failed to delete leads');
      }
    } catch (error) {
      toast.error('Failed to delete leads');
    }
  };

  const handleSendToEmail = () => {
    const verifiedLeads = leads.filter(
      (l) => selectedLeads.includes(l.id) && l.verificationStatus === 'verified'
    );

    if (verifiedLeads.length === 0) {
      toast.error('Please select verified leads to send to email');
      return;
    }

    onSendToEmail(verifiedLeads);
    toast.success(`${verifiedLeads.length} leads ready for email outreach`);
  };

  const getExportableLeads = () => {
    const sourceLeads = showSavedLeads ? savedLeads : leads;
    return sourceLeads.filter(
      (l) => selectedLeads.includes(l.id) && (l.verified || l.verificationStatus === 'verified')
    );
  };

  const handleExportCSV = () => {
    const verifiedLeads = getExportableLeads();
    if (verifiedLeads.length === 0) {
      toast.error('No verified leads to export');
      return;
    }

    const headers = ['Business Name', 'Email', 'Phone', 'Website', 'Lead Score', 'Email Valid', 'AI Draft'];
    const rows = verifiedLeads.map((l) => [
      l.business_name,
      l.email,
      l.phone || '',
      l.website || '',
      l.leadScore.toString(),
      l.emailValid ? 'Yes' : 'No',
      l.aiDraftedMessage?.replace(/\n/g, ' ') || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bamlead-Verified-Leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${verifiedLeads.length} leads as CSV`);
  };

  const handleExportPDF = () => {
    const verifiedLeads = getExportableLeads();
    if (verifiedLeads.length === 0) {
      toast.error('No verified leads to export');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Verified Leads Report', 14, 22);
    
    // Summary
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Total Leads: ${verifiedLeads.length}`, 14, 38);
    doc.text(`Valid Emails: ${verifiedLeads.filter(l => l.emailValid).length}`, 14, 44);
    doc.text(`Avg Lead Score: ${Math.round(verifiedLeads.reduce((sum, l) => sum + l.leadScore, 0) / verifiedLeads.length)}`, 14, 50);

    // Table
    autoTable(doc, {
      startY: 58,
      head: [['Business Name', 'Email', 'Phone', 'Score', 'Valid']],
      body: verifiedLeads.map(l => [
        l.business_name,
        l.email,
        l.phone || '-',
        l.leadScore.toString(),
        l.emailValid ? '✓' : '✗'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`verified-leads-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(`Exported ${verifiedLeads.length} leads as PDF`);
  };

  const handleViewOnBamlead = () => {
    const verifiedLeads = getExportableLeads();
    if (verifiedLeads.length === 0) {
      toast.error('No verified leads to view');
      return;
    }

    // Encode leads data for URL
    const leadsData = verifiedLeads.map(l => ({
      name: l.business_name,
      email: l.email,
      phone: l.phone || '',
      website: l.website || '',
      score: l.leadScore,
      valid: l.emailValid
    }));
    
    // Store in sessionStorage and open viewer
    sessionStorage.setItem('bamlead_spreadsheet_data', JSON.stringify(leadsData));
    window.open('/dashboard?view=spreadsheet', '_blank');
    toast.success('Opening spreadsheet viewer...');
  };

  const handleCopyToClipboard = async () => {
    const verifiedLeads = getExportableLeads();
    if (verifiedLeads.length === 0) {
      toast.error('No verified leads to copy');
      return;
    }

    const headers = ['Business Name', 'Email', 'Phone', 'Website', 'Lead Score', 'Email Valid'];
    const rows = verifiedLeads.map(l => [
      l.business_name,
      l.email,
      l.phone || '',
      l.website || '',
      l.leadScore.toString(),
      l.emailValid ? 'Yes' : 'No'
    ]);

    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    
    try {
      await navigator.clipboard.writeText(tsv);
      toast.success('Copied to clipboard - paste into Google Sheets or Excel');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleConnectGoogleSheets = () => {
    const verifiedLeads = getExportableLeads();
    if (verifiedLeads.length === 0) {
      toast.error('No verified leads to connect');
      return;
    }
    setGoogleSheetsDialogOpen(true);
  };

  const handleGoogleSheetsConnect = () => {
    if (!googleSheetUrl) {
      toast.error('Please enter a Google Sheets URL');
      return;
    }
    
    // Copy data to clipboard for pasting
    handleCopyToClipboard();
    
    // Open the Google Sheet
    window.open(googleSheetUrl, '_blank');
    setGoogleSheetsDialogOpen(false);
    setGoogleSheetUrl('');
    toast.success('Data copied! Paste it into your Google Sheet (Ctrl+V)');
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const currentLeads = showSavedLeads ? savedLeads : leads;
  const verifiedCount = leads.filter((l) => l.verificationStatus === 'verified').length;
  const selectedVerifiedCount = currentLeads.filter(
    (l) => selectedLeads.includes(l.id) && l.verificationStatus === 'verified'
  ).length;

  return (
    <div className="space-y-6">
      {/* Toggle between current and saved leads */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <Button
          variant={showSavedLeads ? 'outline' : 'default'}
          size="sm"
          onClick={() => {
            setShowSavedLeads(false);
            setSelectedLeads([]);
          }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          New Leads ({leads.length})
        </Button>
        <Button
          variant={showSavedLeads ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setShowSavedLeads(true);
            setSelectedLeads([]);
          }}
        >
          <Database className="w-4 h-4 mr-2" />
          Saved Leads ({savedLeads.length})
          {isLoadingSaved && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
        </Button>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {selectedLeads.length} selected • {showSavedLeads ? `${savedLeads.length} saved` : `${verifiedCount} verified`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!showSavedLeads && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifySelected}
                disabled={isVerifying || selectedLeads.length === 0}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Verify Selected
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToDatabase}
                disabled={isSaving || selectedVerifiedCount === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save to DB ({selectedVerifiedCount})
                  </>
                )}
              </Button>
            </>
          )}
          {showSavedLeads && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSavedLeads}
              disabled={selectedLeads.length === 0}
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedVerifiedCount === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download as Spreadsheet (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Download as PDF Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyToClipboard}>
                <Table className="w-4 h-4 mr-2" />
                Copy to Clipboard (for Sheets)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewOnBamlead}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Bamlead.com
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleConnectGoogleSheets}>
                <Link2 className="w-4 h-4 mr-2" />
                Connect to Google Sheets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            onClick={handleSendToEmail}
            disabled={selectedVerifiedCount === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4 mr-2" />
            Send to Email ({selectedVerifiedCount})
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isVerifying && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verifying leads with AI...</span>
            <span className="font-medium">{Math.round(verificationProgress)}%</span>
          </div>
          <Progress value={verificationProgress} className="h-2" />
        </div>
      )}

      {/* Leads List */}
      <div className="space-y-3">
        {/* Select All */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="select-all"
            checked={selectedLeads.length === currentLeads.length && currentLeads.length > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedLeads(currentLeads.map((l) => l.id));
              } else {
                setSelectedLeads([]);
              }
            }}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({currentLeads.length})
          </label>
        </div>

        {currentLeads.map((lead) => (
          <Card
            key={lead.id}
            className={`border transition-all ${
              selectedLeads.includes(lead.id)
                ? 'border-primary/50 bg-primary/5'
                : 'border-border/50'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedLeads.includes(lead.id)}
                  onCheckedChange={(checked) =>
                    handleSelectLead(lead.id, checked as boolean)
                  }
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {lead.business_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {new URL(lead.website).hostname}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.verificationStatus === 'pending' && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Pending
                        </Badge>
                      )}
                      {lead.verificationStatus === 'verifying' && (
                        <Badge variant="outline" className="text-primary border-primary/50">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Verifying
                        </Badge>
                      )}
                      {lead.verificationStatus === 'verified' && (
                        <>
                          <Badge className={getScoreBadgeColor(lead.leadScore)}>
                            <Star className="w-3 h-3 mr-1" />
                            {lead.leadScore}
                          </Badge>
                          {lead.emailValid ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid Email
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              Invalid Email
                            </Badge>
                          )}
                        </>
                      )}
                      {lead.verificationStatus === 'failed' && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Issues */}
                  {lead.issues && lead.issues.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lead.issues.map((issue, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Drafted Message Preview */}
                  {lead.aiDraftedMessage && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Drafted Message
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">
                        {lead.aiDraftedMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentLeads.length === 0 && (
        <div className="text-center py-12">
          {showSavedLeads ? (
            <>
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No saved leads</h3>
              <p className="text-sm text-muted-foreground">
                Verify leads and save them to see them here.
              </p>
            </>
          ) : (
            <>
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No leads to verify</h3>
              <p className="text-sm text-muted-foreground">
                Search for leads first, then they'll appear here for AI verification.
              </p>
            </>
          )}
        </div>
      )}

      {/* Google Sheets Connection Dialog */}
      <Dialog open={googleSheetsDialogOpen} onOpenChange={setGoogleSheetsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Connect to Google Sheets
            </DialogTitle>
            <DialogDescription>
              Paste your Google Sheet URL and we'll copy your verified leads data for easy pasting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-url">Google Sheet URL</Label>
              <Input
                id="sheet-url"
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">How it works:</p>
                  <ol className="text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                    <li>Your lead data will be copied to clipboard</li>
                    <li>Your Google Sheet will open in a new tab</li>
                    <li>Click a cell and press Ctrl+V (or Cmd+V) to paste</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGoogleSheetsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGoogleSheetsConnect}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Sheet & Copy Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
