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
  FileSignature, Briefcase, ArrowRight, Save, X, Image, Pen, Shield,
  Plus, Trash2, GripVertical, DollarSign, Clock, ListChecks, Target, Star
} from 'lucide-react';
import { PROPOSAL_TEMPLATES, ProposalTemplate, generateProposalHTML } from '@/lib/proposalTemplates';
import { CONTRACT_TEMPLATES, ContractTemplate, generateContractHTML, ContractSection } from '@/lib/contractTemplates';
import { sendSingleEmail } from '@/lib/emailService';
import { useUserBranding } from '@/hooks/useUserBranding';

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

// Editable proposal state
interface EditableProposal {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  scope: string[];
  timeline: string;
  deliverables: string[];
  investmentRange: string;
  defaultPrice: string;
  callToAction: string;
  colorAccent: string;
}

// Editable contract state
interface EditableContract {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  sections: ContractSection[];
  colorAccent: string;
}

interface ProposalsContractsPanelProps {
  leads?: Lead[];
  initialView?: 'proposals' | 'contracts';
}

// Custom proposals/contracts storage keys
const CUSTOM_PROPOSALS_KEY = 'bamlead_custom_proposals';
const CUSTOM_CONTRACTS_KEY = 'bamlead_custom_contracts';

// Get custom proposals from localStorage
const getCustomProposals = (): EditableProposal[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_PROPOSALS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load custom proposals:', e);
    return [];
  }
};

// Save custom proposal
const saveCustomProposal = (proposal: EditableProposal): EditableProposal => {
  const proposals = getCustomProposals();
  const newProposal = { ...proposal, id: `custom-proposal-${Date.now()}` };
  proposals.unshift(newProposal);
  localStorage.setItem(CUSTOM_PROPOSALS_KEY, JSON.stringify(proposals));
  return newProposal;
};

// Get custom contracts from localStorage
const getCustomContracts = (): EditableContract[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_CONTRACTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load custom contracts:', e);
    return [];
  }
};

// Save custom contract
const saveCustomContract = (contract: EditableContract): EditableContract => {
  const contracts = getCustomContracts();
  const newContract = { ...contract, id: `custom-contract-${Date.now()}` };
  contracts.unshift(newContract);
  localStorage.setItem(CUSTOM_CONTRACTS_KEY, JSON.stringify(contracts));
  return newContract;
};

export default function ProposalsContractsPanel({ leads = [], initialView = 'proposals' }: ProposalsContractsPanelProps) {
  const [activeTab, setActiveTab] = useState<'proposals' | 'contracts'>(initialView);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [enableESignature, setEnableESignature] = useState(true);
  
  // Custom saved templates
  const [customProposals, setCustomProposals] = useState<EditableProposal[]>([]);
  const [customContracts, setCustomContracts] = useState<EditableContract[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // Load custom templates on mount
  useEffect(() => {
    setCustomProposals(getCustomProposals());
    setCustomContracts(getCustomContracts());
  }, []);
  
  // Editable proposal and contract states
  const [editableProposal, setEditableProposal] = useState<EditableProposal | null>(null);
  const [editableContract, setEditableContract] = useState<EditableContract | null>(null);
  
  // Use centralized branding hook for logo
  const { branding: userBranding } = useUserBranding();
  
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
  
  // Sync logo from centralized branding hook
  useEffect(() => {
    if (userBranding?.logo_url && !branding.logoUrl) {
      setBranding(prev => ({ ...prev, logoUrl: userBranding.logo_url }));
    }
  }, [userBranding?.logo_url]);
  
  // Recipient info
  const [recipient, setRecipient] = useState({
    businessName: '',
    contactName: '',
    email: '',
    address: ''
  });
  
  // Preview HTML
  const [previewHTML, setPreviewHTML] = useState('');
  
  // Save branding to localStorage
  useEffect(() => {
    localStorage.setItem('bamlead_branding_info', JSON.stringify(branding));
  }, [branding]);
  
  // Save proposal as custom template
  const handleSaveProposalAsTemplate = () => {
    if (!editableProposal) return;
    const name = newTemplateName.trim() || `My ${editableProposal.name}`;
    const saved = saveCustomProposal({ ...editableProposal, name });
    setCustomProposals(getCustomProposals());
    setNewTemplateName('');
    toast.success(`✅ Proposal "${name}" saved to your library!`);
  };
  
  // Save contract as custom template
  const handleSaveContractAsTemplate = () => {
    if (!editableContract) return;
    const name = newTemplateName.trim() || `My ${editableContract.name}`;
    const saved = saveCustomContract({ ...editableContract, name });
    setCustomContracts(getCustomContracts());
    setNewTemplateName('');
    toast.success(`✅ Contract "${name}" saved to your library!`);
  };
  
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
  
  // Select a proposal and make it editable
  const handleSelectProposal = (proposal: ProposalTemplate) => {
    setSelectedProposalId(proposal.id);
    setEditableProposal({
      ...proposal,
      scope: [...proposal.scope],
      deliverables: [...proposal.deliverables]
    });
    setIsEditing(true);
  };
  
  // Select a contract and make it editable
  const handleSelectContract = (contract: ContractTemplate) => {
    setSelectedContractId(contract.id);
    setEditableContract({
      ...contract,
      sections: contract.sections.map(s => ({ ...s }))
    });
    setIsEditing(true);
  };
  
  // Update proposal field
  const updateProposalField = (field: keyof EditableProposal, value: any) => {
    if (editableProposal) {
      setEditableProposal(prev => prev ? { ...prev, [field]: value } : null);
    }
  };
  
  // Update proposal scope item
  const updateScopeItem = (index: number, value: string) => {
    if (editableProposal) {
      const newScope = [...editableProposal.scope];
      newScope[index] = value;
      setEditableProposal(prev => prev ? { ...prev, scope: newScope } : null);
    }
  };
  
  // Add scope item
  const addScopeItem = () => {
    if (editableProposal) {
      setEditableProposal(prev => prev ? { 
        ...prev, 
        scope: [...prev.scope, 'New scope item'] 
      } : null);
    }
  };
  
  // Remove scope item
  const removeScopeItem = (index: number) => {
    if (editableProposal && editableProposal.scope.length > 1) {
      const newScope = editableProposal.scope.filter((_, i) => i !== index);
      setEditableProposal(prev => prev ? { ...prev, scope: newScope } : null);
    }
  };
  
  // Update deliverable item
  const updateDeliverableItem = (index: number, value: string) => {
    if (editableProposal) {
      const newDeliverables = [...editableProposal.deliverables];
      newDeliverables[index] = value;
      setEditableProposal(prev => prev ? { ...prev, deliverables: newDeliverables } : null);
    }
  };
  
  // Add deliverable item
  const addDeliverableItem = () => {
    if (editableProposal) {
      setEditableProposal(prev => prev ? { 
        ...prev, 
        deliverables: [...prev.deliverables, 'New deliverable'] 
      } : null);
    }
  };
  
  // Remove deliverable item
  const removeDeliverableItem = (index: number) => {
    if (editableProposal && editableProposal.deliverables.length > 1) {
      const newDeliverables = editableProposal.deliverables.filter((_, i) => i !== index);
      setEditableProposal(prev => prev ? { ...prev, deliverables: newDeliverables } : null);
    }
  };
  
  // Update contract section
  const updateContractSection = (index: number, field: 'title' | 'content', value: string) => {
    if (editableContract) {
      const newSections = [...editableContract.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      setEditableContract(prev => prev ? { ...prev, sections: newSections } : null);
    }
  };
  
  // Add contract section
  const addContractSection = () => {
    if (editableContract) {
      setEditableContract(prev => prev ? {
        ...prev,
        sections: [...prev.sections, { title: 'NEW SECTION', content: 'Section content here...', isEditable: true }]
      } : null);
    }
  };
  
  // Remove contract section
  const removeContractSection = (index: number) => {
    if (editableContract && editableContract.sections.length > 1) {
      const newSections = editableContract.sections.filter((_, i) => i !== index);
      setEditableContract(prev => prev ? { ...prev, sections: newSections } : null);
    }
  };
  
  // Generate proposal preview
  const generateProposalPreview = () => {
    if (!editableProposal) return;
    
    const html = generateProposalHTML(
      editableProposal as ProposalTemplate,
      {
        businessName: recipient.businessName || '[Client Business]',
        contactName: recipient.contactName || '[Client Name]',
        email: recipient.email || '[Client Email]',
        customPrice: editableProposal.defaultPrice,
        customTimeline: editableProposal.timeline
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
    if (!editableContract) return;
    
    const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const signingUrl = `${window.location.origin}/sign-contract?id=${contractId}`;
    
    // Build edits object from current sections
    const contractEdits: Record<string, string> = {};
    editableContract.sections.forEach(section => {
      contractEdits[section.title] = section.content;
    });
    
    const html = generateContractHTML(
      editableContract as ContractTemplate,
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
        contractName: editableContract.name,
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
      const documentName = activeTab === 'proposals' ? editableProposal?.name : editableContract?.name;
      
      await sendSingleEmail({
        to: recipient.email,
        subject: `${documentName} from ${branding.companyName}`,
        bodyHtml: previewHTML
      });
      
      toast.success(`${documentType} sent successfully!`);
      setIsPreviewing(false);
      
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
    a.download = `${activeTab === 'proposals' ? editableProposal?.name : editableContract?.name}.html`;
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
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 space-y-6">
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
                className="h-12 max-w-[140px] object-contain rounded border bg-white p-1"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-sm">Company Name</Label>
              <Input 
                value={branding.companyName}
                onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company"
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Your Name</Label>
              <Input 
                value={branding.contactName}
                onChange={(e) => setBranding(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Your Name"
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input 
                type="email"
                value={branding.email}
                onChange={(e) => setBranding(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@company.com"
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Phone</Label>
              <Input 
                value={branding.phone}
                onChange={(e) => setBranding(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                className="h-10 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-sm flex items-center gap-2">
                <Image className="w-4 h-4" />
                Company Logo
              </Label>
              <div className="flex gap-2">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="h-10 text-sm"
                />
                {branding.logoUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                    className="h-10 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recipient Selection */}
      {leads.length > 0 && (
        <Card className="border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5" />
              Select Recipient
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <ScrollArea className="h-16">
              <div className="flex flex-wrap gap-1">
                {leads.filter(l => l.email).slice(0, 20).map(lead => (
                  <Badge 
                    key={lead.id}
                    variant={recipient.email === lead.email ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 text-xs"
                    onClick={() => handleSelectLead(lead)}
                  >
                    {lead.name.substring(0, 20)}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input 
                value={recipient.businessName}
                onChange={(e) => setRecipient(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Client Business"
                className="h-10 text-sm"
              />
              <Input 
                value={recipient.contactName}
                onChange={(e) => setRecipient(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Contact Name"
                className="h-10 text-sm"
              />
              <Input 
                type="email"
                value={recipient.email}
                onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                placeholder="client@email.com"
                className="h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'proposals' | 'contracts')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proposals" className="gap-2 text-sm md:text-base py-3">
            <FileText className="w-5 h-5" />
            Proposals ({PROPOSAL_TEMPLATES.length})
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2 text-sm md:text-base py-3">
            <FileSignature className="w-5 h-5" />
            Contracts ({CONTRACT_TEMPLATES.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Proposal Templates List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Select a Proposal (Click to Edit)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="grid gap-2">
                    {/* Custom Proposals First */}
                    {customProposals.length > 0 && (
                      <>
                        <p className="text-sm font-medium text-primary flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4" /> My Saved Proposals
                        </p>
                        {customProposals.map((proposal) => (
                          <Card 
                            key={proposal.id}
                            className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md border-primary/30 ${
                              selectedProposalId === proposal.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                            }`}
                            onClick={() => handleSelectProposal(proposal as ProposalTemplate)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl leading-none">{proposal.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{proposal.name}</h4>
                                  <Badge variant="secondary" className="text-xs mt-1">Custom</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Separator className="my-2" />
                      </>
                    )}
                    
                    {/* Built-in Proposals */}
                    {PROPOSAL_TEMPLATES.map((proposal) => (
                      <Card 
                        key={proposal.id}
                        className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                          selectedProposalId === proposal.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                        }`}
                        onClick={() => handleSelectProposal(proposal)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl leading-none">{proposal.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">{proposal.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {proposal.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {proposal.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Proposal Editor */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Edit className="w-4 h-4 text-primary" />
                    {editableProposal ? `Edit: ${editableProposal.name}` : 'Select a Proposal to Edit'}
                  </CardTitle>
                  {editableProposal && (
                    <Button onClick={generateProposalPreview} size="sm" className="h-7 gap-1">
                      <Eye className="w-3 h-3" />
                      Preview & Send
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editableProposal ? (
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Proposal Name
                          </Label>
                          <Input 
                            value={editableProposal.name}
                            onChange={(e) => updateProposalField('name', e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Input 
                            value={editableProposal.category}
                            onChange={(e) => updateProposalField('category', e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea 
                          value={editableProposal.description}
                          onChange={(e) => updateProposalField('description', e.target.value)}
                          className="text-xs mt-1 min-h-[120px]"
                        />
                      </div>
                      
                      {/* Price & Timeline */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Price
                          </Label>
                          <Input 
                            value={editableProposal.defaultPrice}
                            onChange={(e) => updateProposalField('defaultPrice', e.target.value)}
                            placeholder="$2,500"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Timeline
                          </Label>
                          <Input 
                            value={editableProposal.timeline}
                            onChange={(e) => updateProposalField('timeline', e.target.value)}
                            placeholder="2-4 weeks"
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>
                      
                      {/* Investment Range */}
                      <div>
                        <Label className="text-xs">Investment Range (for display)</Label>
                        <Input 
                          value={editableProposal.investmentRange}
                          onChange={(e) => updateProposalField('investmentRange', e.target.value)}
                          placeholder="$1,500 - $5,000"
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Scope Items */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs flex items-center gap-1">
                            <ListChecks className="w-3 h-3" />
                            Scope Items ({editableProposal.scope.length})
                          </Label>
                          <Button variant="outline" size="sm" onClick={addScopeItem} className="h-6 text-xs gap-1">
                            <Plus className="w-3 h-3" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editableProposal.scope.map((item, index) => (
                            <div key={index} className="flex gap-1">
                              <Input 
                                value={item}
                                onChange={(e) => updateScopeItem(index, e.target.value)}
                                className="h-7 text-xs flex-1"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeScopeItem(index)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                disabled={editableProposal.scope.length <= 1}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Deliverables */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Deliverables ({editableProposal.deliverables.length})
                          </Label>
                          <Button variant="outline" size="sm" onClick={addDeliverableItem} className="h-6 text-xs gap-1">
                            <Plus className="w-3 h-3" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editableProposal.deliverables.map((item, index) => (
                            <div key={index} className="flex gap-1">
                              <Input 
                                value={item}
                                onChange={(e) => updateDeliverableItem(index, e.target.value)}
                                className="h-7 text-xs flex-1"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeDeliverableItem(index)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                disabled={editableProposal.deliverables.length <= 1}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Call to Action */}
                      <div>
                        <Label className="text-xs">Call to Action</Label>
                        <Textarea 
                          value={editableProposal.callToAction}
                          onChange={(e) => updateProposalField('callToAction', e.target.value)}
                          className="text-xs mt-1 min-h-[30px]"
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Save as New Template */}
                      <div className="p-3 rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-emerald-500" />
                          <Label className="text-xs font-medium">Save as My Template</Label>
                        </div>
                        <Input
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder={`My ${editableProposal.name}`}
                          className="h-7 text-xs bg-background"
                        />
                        <Button 
                          onClick={handleSaveProposalAsTemplate} 
                          size="sm" 
                          className="w-full h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Save className="w-3 h-3" />
                          Save to My Library
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-20">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Click any proposal template to edit it</p>
                    <p className="text-xs mt-1">All fields are fully customizable</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contract Templates List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  Select a Contract (Click to Edit)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="grid gap-2">
                    {/* Custom Contracts First */}
                    {customContracts.length > 0 && (
                      <>
                        <p className="text-sm font-medium text-primary flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4" /> My Saved Contracts
                        </p>
                        {customContracts.map((contract) => (
                          <Card 
                            key={contract.id}
                            className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md border-primary/30 ${
                              selectedContractId === contract.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                            }`}
                            onClick={() => handleSelectContract(contract as ContractTemplate)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl leading-none">{contract.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{contract.name}</h4>
                                  <Badge variant="secondary" className="text-xs mt-1">Custom</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Separator className="my-2" />
                      </>
                    )}
                    
                    {/* Built-in Contracts */}
                    {CONTRACT_TEMPLATES.map((contract) => (
                      <Card 
                        key={contract.id}
                        className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                          selectedContractId === contract.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                        }`}
                        onClick={() => handleSelectContract(contract)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl leading-none">{contract.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">{contract.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {contract.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {contract.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Contract Editor */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Edit className="w-4 h-4 text-primary" />
                    {editableContract ? `Edit: ${editableContract.name}` : 'Select a Contract to Edit'}
                  </CardTitle>
                  {editableContract && (
                    <Button onClick={generateContractPreview} size="sm" className="h-7 gap-1">
                      <Eye className="w-3 h-3" />
                      Preview & Send
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editableContract ? (
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Contract Name</Label>
                          <Input 
                            value={editableContract.name}
                            onChange={(e) => setEditableContract(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Input 
                            value={editableContract.category}
                            onChange={(e) => setEditableContract(prev => prev ? { ...prev, category: e.target.value } : null)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea 
                          value={editableContract.description}
                          onChange={(e) => setEditableContract(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="text-xs mt-1 min-h-[120px]"
                        />
                      </div>
                      
                      {/* E-Signature Toggle */}
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Pen className="w-4 h-4 text-primary" />
                          <div>
                            <Label className="text-xs font-medium">E-Signature</Label>
                            <p className="text-[10px] text-muted-foreground">Client signs digitally</p>
                          </div>
                        </div>
                        <Switch 
                          checked={enableESignature}
                          onCheckedChange={setEnableESignature}
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Contract Sections */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold">
                            Contract Sections ({editableContract.sections.length})
                          </Label>
                          <Button variant="outline" size="sm" onClick={addContractSection} className="h-6 text-xs gap-1">
                            <Plus className="w-3 h-3" />
                            Add Section
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {editableContract.sections.map((section, index) => (
                            <Card key={index} className="p-3 bg-muted/30">
                              <div className="flex items-start gap-2 mb-2">
                                <Input 
                                  value={section.title}
                                  onChange={(e) => updateContractSection(index, 'title', e.target.value)}
                                  className="h-7 text-xs font-semibold flex-1"
                                  placeholder="Section Title"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeContractSection(index)}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  disabled={editableContract.sections.length <= 1}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Textarea 
                                value={section.content}
                                onChange={(e) => updateContractSection(index, 'content', e.target.value)}
                                className="text-xs min-h-[80px] font-mono"
                                placeholder="Section content..."
                              />
                              {!section.isEditable && (
                                <Badge variant="secondary" className="text-[9px] mt-1">
                                  Standard clause
                                </Badge>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Tip:</strong> Replace placeholders like [YOUR_NAME], [AMOUNT], [DATE] with actual values.
                      </div>
                      
                      <Separator />
                      
                      {/* Save as New Template */}
                      <div className="p-3 rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-emerald-500" />
                          <Label className="text-xs font-medium">Save as My Template</Label>
                        </div>
                        <Input
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder={`My ${editableContract.name}`}
                          className="h-7 text-xs bg-background"
                        />
                        <Button 
                          onClick={handleSaveContractAsTemplate} 
                          size="sm" 
                          className="w-full h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Save className="w-3 h-3" />
                          Save to My Library
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-20">
                    <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Click any contract template to edit it</p>
                    <p className="text-xs mt-1">All sections are fully customizable</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
              Review your customized document before sending
            </DialogDescription>
          </DialogHeader>
          
          {/* Recipient (if not already set) */}
          {!recipient.email && (
            <div className="p-3 bg-muted rounded-lg mb-3">
              <Label className="text-xs font-semibold">Enter recipient email to send:</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input 
                  value={recipient.businessName}
                  onChange={(e) => setRecipient(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Client Business"
                  className="h-8 text-xs"
                />
                <Input 
                  value={recipient.contactName}
                  onChange={(e) => setRecipient(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Contact Name"
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
            </div>
          )}
          
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
          
          <ScrollArea className="h-[55vh] border rounded-lg">
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
