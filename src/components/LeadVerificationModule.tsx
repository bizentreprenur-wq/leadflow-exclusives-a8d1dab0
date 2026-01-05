import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';

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
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);

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

  const handleExport = () => {
    const verifiedLeads = leads.filter(
      (l) => selectedLeads.includes(l.id) && l.verified
    );

    if (verifiedLeads.length === 0) {
      toast.error('No verified leads to export');
      return;
    }

    // Create CSV
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

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verified-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${verifiedLeads.length} leads`);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const verifiedCount = leads.filter((l) => l.verificationStatus === 'verified').length;
  const selectedVerifiedCount = leads.filter(
    (l) => selectedLeads.includes(l.id) && l.verificationStatus === 'verified'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {selectedLeads.length} selected • {verifiedCount} verified
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            onClick={handleExport}
            disabled={selectedVerifiedCount === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
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
            checked={selectedLeads.length === leads.length && leads.length > 0}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({leads.length})
          </label>
        </div>

        {leads.map((lead) => (
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

      {leads.length === 0 && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No leads to verify</h3>
          <p className="text-sm text-muted-foreground">
            Search for leads first, then they'll appear here for AI verification.
          </p>
        </div>
      )}
    </div>
  );
}
