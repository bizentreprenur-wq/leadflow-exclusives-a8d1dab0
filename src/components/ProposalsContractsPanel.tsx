import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  FileText, Send, Edit, Eye, Download, Upload, Building2, 
  User, Mail, Phone, MapPin, Sparkles, CheckCircle2, Copy,
  FileSignature, Briefcase, ArrowRight, Save, X, Image, Pen, Shield
} from 'lucide-react';
import { PROPOSAL_TEMPLATES, ProposalTemplate, generateProposalHTML } from '@/lib/proposalTemplates';
import { CONTRACT_TEMPLATES, ContractTemplate, generateContractHTML } from '@/lib/contractTemplates';
import { sendSingleEmail } from '@/lib/emailService';

interface BrandingInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  logoUrl: string;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

interface ProposalsContractsPanelProps {
  leads?: Lead[];
  initialView?: 'proposals' | 'contracts';
}

export default function ProposalsContractsPanel({ leads = [], initialView = 'proposals' }: ProposalsContractsPanelProps) {
  const [activeTab, setActiveTab] = useState<'proposals' | 'contracts'>(initialView);
  const [selectedProposal, setSelectedProposal] = useState<ProposalTemplate | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [enableESignature, setEnableESignature] = useState(true);
  
  // Branding info (saved to localStorage)
  const [branding, setBranding] = useState<BrandingInfo>(() => {
    const saved = localStorage.getItem('bamlead_branding_info');
    return saved ? JSON.parse(saved) : {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      logoUrl: ''
    };
  });
  
  // Recipient info
  const [recipient, setRecipient] = useState({
    businessName: '',
    contactName: '',
    email: '',
    address: ''
  });
  
  // Proposal customization
  const [proposalCustomization, setProposalCustomization] = useState({
    customPrice: '',
    customTimeline: '',
    additionalNotes: ''
  });
  
  // Contract section edits
  const [contractEdits, setContractEdits] = useState<Record<string, string>>({});
  
  // Preview HTML
  const [previewHTML, setPreviewHTML] = useState('');
  
  // Save branding to localStorage
  useEffect(() => {
    localStorage.setItem('bamlead_branding_info', JSON.stringify(branding));
  }, [branding]);
  
  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error('Logo must be under 500KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding(prev => ({ ...prev, logoUrl: reader.result as string }));
        toast.success('Logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Generate proposal preview
  const generateProposalPreview = () => {
    if (!selectedProposal) return;
    
    const html = generateProposalHTML(
      selectedProposal,
      {
        businessName: recipient.businessName || '[Client Business]',
        contactName: recipient.contactName || '[Client Name]',
        email: recipient.email || '[Client Email]',
        customPrice: proposalCustomization.customPrice || undefined,
        customTimeline: proposalCustomization.customTimeline || undefined,
        additionalNotes: proposalCustomization.additionalNotes || undefined
      },
      {
        companyName: branding.companyName || '[Your Company]',
        contactName: branding.contactName || '[Your Name]',
        email: branding.email || '[Your Email]',
        phone: branding.phone || undefined,
        logoUrl: branding.logoUrl || undefined
      }
    );
    setPreviewHTML(html);
    setIsPreviewing(true);
  };
  
  // Generate contract preview
  const generateContractPreview = () => {
    if (!selectedContract) return;
    
    // Generate unique contract ID for e-signature tracking
    const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create signing URL (in production this would be a real hosted URL)
    const signingUrl = `${window.location.origin}/sign-contract?id=${contractId}`;
    
    const html = generateContractHTML(
      selectedContract,
      contractEdits,
      {
        companyName: branding.companyName || '[Your Company]',
        logoUrl: branding.logoUrl || undefined
      },
      enableESignature ? {
        enabled: true,
        signingUrl,
        contractId,
        recipientName: recipient.contactName || recipient.businessName || 'Client',
        recipientEmail: recipient.email
      } : undefined
    );
    
    // Store contract data for signing page
    if (enableESignature) {
      const pendingContracts = JSON.parse(localStorage.getItem('bamlead_pending_contracts') || '{}');
      pendingContracts[contractId] = {
        contractHTML: html,
        contractName: selectedContract.name,
        senderCompany: branding.companyName,
        recipientName: recipient.contactName || recipient.businessName,
        recipientEmail: recipient.email,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      localStorage.setItem('bamlead_pending_contracts', JSON.stringify(pendingContracts));
    }
    
    setPreviewHTML(html);
    setIsPreviewing(true);
  };
  
  // Send document via email
  const handleSendDocument = async () => {
    if (!recipient.email) {
      toast.error('Please enter recipient email');
      return;
    }
    
    if (!branding.email) {
      toast.error('Please configure your email in branding settings');
      return;
    }
    
    setIsSending(true);
    
    try {
      const smtpConfig = JSON.parse(localStorage.getItem('bamlead_smtp_config') || '{}');
      
      if (!smtpConfig.host) {
        toast.error('Please configure SMTP settings first');
        setIsSending(false);
        return;
      }
      
      const documentType = activeTab === 'proposals' ? 'Proposal' : 'Contract';
      const documentName = activeTab === 'proposals' ? selectedProposal?.name : selectedContract?.name;
      
      await sendSingleEmail({
        to: recipient.email,
        subject: `${documentName} from ${branding.companyName}`,
        bodyHtml: previewHTML
      });
      
      toast.success(`${documentType} sent successfully!`);
      setIsPreviewing(false);
      
      // Reset form
      setRecipient({ businessName: '', contactName: '', email: '', address: '' });
      setProposalCustomization({ customPrice: '', customTimeline: '', additionalNotes: '' });
      setContractEdits({});
      setSelectedProposal(null);
      setSelectedContract(null);
      
    } catch (error) {
      toast.error('Failed to send document');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Copy HTML to clipboard
  const handleCopyHTML = () => {
    navigator.clipboard.writeText(previewHTML);
    toast.success('HTML copied to clipboard!');
  };
  
  // Download as HTML file
  const handleDownload = () => {
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab === 'proposals' ? selectedProposal?.name : selectedContract?.name}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded!');
  };
  
  // Select a lead as recipient
  const handleSelectLead = (lead: Lead) => {
    setRecipient({
      businessName: lead.name,
      contactName: '',
      email: lead.email || '',
      address: lead.address || ''
    });
    toast.success(`Selected ${lead.name} as recipient`);
  };

  return (
    <div className="space-y-4">
      {/* Branding Setup Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Your Branding
              </CardTitle>
              <CardDescription>This will appear on all your proposals and contracts</CardDescription>
            </div>
            {branding.logoUrl && (
              <img 
                src={branding.logoUrl} 
                alt="Your logo" 
                className="h-10 max-w-[120px] object-contain"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Company Name</Label>
              <Input 
                value={branding.companyName}
                onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Your Name</Label>
              <Input 
                value={branding.contactName}
                onChange={(e) => setBranding(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Your Name"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input 
                type="email"
                value={branding.email}
                onChange={(e) => setBranding(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@company.com"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input 
                value={branding.phone}
                onChange={(e) => setBranding(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                className="h-8 text-xs"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Logo (max 500KB)</Label>
              <div className="flex gap-2">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="h-8 text-xs"
                />
                {branding.logoUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                    className="h-8 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'proposals' | 'contracts')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proposals" className="gap-2">
            <FileText className="w-4 h-4" />
            Done For You Proposals
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2">
            <FileSignature className="w-4 h-4" />
            Done For You Contracts
          </TabsTrigger>
        </TabsList>
        
        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Proposal Templates */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Select a Proposal Template
                  </CardTitle>
                  <CardDescription>Outcome-based proposals ready to customize and send</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-3">
                      {PROPOSAL_TEMPLATES.map((proposal) => (
                        <Card 
                          key={proposal.id}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            selectedProposal?.id === proposal.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setProposalCustomization({
                              customPrice: proposal.defaultPrice,
                              customTimeline: proposal.timeline,
                              additionalNotes: ''
                            });
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{proposal.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm truncate">{proposal.name}</h4>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {proposal.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {proposal.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="text-[10px] bg-green-500/20 text-green-700">
                                    {proposal.investmentRange}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {proposal.timeline}
                                  </span>
                                </div>
                              </div>
                              {selectedProposal?.id === proposal.id && (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            {/* Customization Panel */}
            <div>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {selectedProposal ? `Customize: ${selectedProposal.name}` : 'Select a Proposal'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProposal ? (
                    <>
                      {/* Recipient Info */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold">Recipient</Label>
                        
                        {leads.length > 0 && (
                          <div className="mb-2">
                            <Label className="text-xs text-muted-foreground">Quick Select Lead:</Label>
                            <ScrollArea className="h-20 mt-1">
                              <div className="flex flex-wrap gap-1">
                                {leads.filter(l => l.email).slice(0, 10).map(lead => (
                                  <Badge 
                                    key={lead.id}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/20 text-[10px]"
                                    onClick={() => handleSelectLead(lead)}
                                  >
                                    {lead.name.substring(0, 15)}
                                  </Badge>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                        
                        <Input 
                          value={recipient.businessName}
                          onChange={(e) => setRecipient(prev => ({ ...prev, businessName: e.target.value }))}
                          placeholder="Client Business Name"
                          className="h-8 text-xs"
                        />
                        <Input 
                          value={recipient.contactName}
                          onChange={(e) => setRecipient(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Contact Person Name"
                          className="h-8 text-xs"
                        />
                        <Input 
                          type="email"
                          value={recipient.email}
                          onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="client@email.com"
                          className="h-8 text-xs"
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Proposal Customization */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold">Customize Proposal</Label>
                        <div>
                          <Label className="text-xs text-muted-foreground">Price</Label>
                          <Input 
                            value={proposalCustomization.customPrice}
                            onChange={(e) => setProposalCustomization(prev => ({ ...prev, customPrice: e.target.value }))}
                            placeholder="$2,500"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Timeline</Label>
                          <Input 
                            value={proposalCustomization.customTimeline}
                            onChange={(e) => setProposalCustomization(prev => ({ ...prev, customTimeline: e.target.value }))}
                            placeholder="2-4 weeks"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Additional Notes</Label>
                          <Textarea 
                            value={proposalCustomization.additionalNotes}
                            onChange={(e) => setProposalCustomization(prev => ({ ...prev, additionalNotes: e.target.value }))}
                            placeholder="Any custom notes for this client..."
                            className="text-xs min-h-[60px]"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={generateProposalPreview}
                          className="flex-1 gap-1"
                          size="sm"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Select a proposal template to customize
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Contract Templates */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    Select a Contract Template
                  </CardTitle>
                  <CardDescription>Business-protecting agreements ready to customize</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-3">
                      {CONTRACT_TEMPLATES.map((contract) => (
                        <Card 
                          key={contract.id}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            selectedContract?.id === contract.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => {
                            setSelectedContract(contract);
                            // Initialize editable sections
                            const edits: Record<string, string> = {};
                            contract.sections.forEach(section => {
                              edits[section.title] = section.content;
                            });
                            setContractEdits(edits);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{contract.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm truncate">{contract.name}</h4>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {contract.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {contract.description}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                                  <FileText className="w-3 h-3" />
                                  {contract.sections.length} sections
                                </div>
                              </div>
                              {selectedContract?.id === contract.id && (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            {/* Contract Editor */}
            <div>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {selectedContract ? `Edit: ${selectedContract.name}` : 'Select a Contract'}
                    </CardTitle>
                    {selectedContract && (
                      <Button variant="outline" size="sm" onClick={generateContractPreview} className="h-7 text-xs gap-1">
                        <Eye className="w-3 h-3" />
                        Preview
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedContract ? (
                    <ScrollArea className="h-[380px] pr-2">
                      <div className="space-y-4">
                        {/* Recipient email for sending */}
                        <div>
                          <Label className="text-xs font-semibold">Recipient Email</Label>
                          <Input 
                            type="email"
                            value={recipient.email}
                            onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="client@email.com"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        
                        <Separator />
                        
                        {/* E-Signature Toggle */}
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2">
                            <Pen className="w-4 h-4 text-primary" />
                            <div>
                              <Label className="text-xs font-medium">E-Signature</Label>
                              <p className="text-[10px] text-muted-foreground">
                                Client can sign digitally
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={enableESignature}
                            onCheckedChange={setEnableESignature}
                          />
                        </div>
                        
                        {enableESignature && (
                          <div className="p-2 bg-muted/50 rounded text-[10px] text-muted-foreground flex items-start gap-2">
                            <Shield className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>A secure signing link will be included. Client can draw or type their signature directly.</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        {/* Editable sections */}
                        {selectedContract.sections.filter(s => s.isEditable).map((section) => (
                          <div key={section.title}>
                            <Label className="text-xs font-medium flex items-center gap-1">
                              <Edit className="w-3 h-3" />
                              {section.title}
                            </Label>
                            <Textarea 
                              value={contractEdits[section.title] || section.content}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [section.title]: e.target.value
                              }))}
                              className="text-xs mt-1 min-h-[80px] font-mono"
                            />
                          </div>
                        ))}
                        
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Tip:</strong> Replace placeholders like [YOUR_NAME], [AMOUNT], [DATE] with actual values.
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Select a contract template to edit
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Preview Dialog */}
      <Dialog open={isPreviewing} onOpenChange={setIsPreviewing}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Document Preview
            </DialogTitle>
            <DialogDescription>
              Review your document before sending
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleCopyHTML} className="gap-1">
              <Copy className="w-3 h-3" />
              Copy HTML
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
              <Download className="w-3 h-3" />
              Download
            </Button>
            <div className="flex-1" />
            <Button 
              onClick={handleSendDocument} 
              disabled={isSending || !recipient.email}
              className="gap-1"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Send to {recipient.email || 'Client'}
                </>
              )}
            </Button>
          </div>
          
          <ScrollArea className="h-[60vh] border rounded-lg">
            <iframe 
              srcDoc={previewHTML}
              className="w-full h-[800px] bg-white"
              title="Document Preview"
            />
          </ScrollArea>
          
          <div className="text-xs text-muted-foreground text-center">
            ⚠️ Not legal advice. Review with your attorney before use.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
