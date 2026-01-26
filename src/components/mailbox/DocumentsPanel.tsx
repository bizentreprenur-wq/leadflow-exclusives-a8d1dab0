import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FileText, Building2, Globe, MapPin, Megaphone, Star,
  Download, Eye, Send, Copy, CheckCircle2, Sparkles
} from 'lucide-react';

// Lead-type-specific template definitions
interface DocumentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  forLeadType: 'gmb' | 'platform' | 'both';
}

// Templates for Super AI (gmb) - Local businesses from Google Maps/Yelp
const GMB_PROPOSALS: DocumentTemplate[] = [
  {
    id: 'gmb-optimization',
    name: 'Google Business Profile Optimization',
    icon: '📍',
    description: 'Complete GMB setup, optimization, and management for local visibility.',
    category: 'Local SEO',
    forLeadType: 'gmb',
  },
  {
    id: 'reputation-management',
    name: 'Reputation Management Package',
    icon: '⭐',
    description: 'Review generation, monitoring, and response management services.',
    category: 'Reputation',
    forLeadType: 'gmb',
  },
  {
    id: 'local-seo',
    name: 'Local SEO & Citations',
    icon: '🗺️',
    description: 'Local search optimization with directory citations and NAP consistency.',
    category: 'Local SEO',
    forLeadType: 'gmb',
  },
  {
    id: 'local-ads',
    name: 'Local Google Ads Campaign',
    icon: '📢',
    description: 'Targeted local advertising to drive foot traffic and calls.',
    category: 'Advertising',
    forLeadType: 'gmb',
  },
];

const GMB_CONTRACTS: DocumentTemplate[] = [
  {
    id: 'gmb-management-agreement',
    name: 'GMB Management Agreement',
    icon: '📋',
    description: 'Monthly management contract for Google Business Profile services.',
    category: 'Local SEO',
    forLeadType: 'gmb',
  },
  {
    id: 'reputation-services-agreement',
    name: 'Reputation Services Agreement',
    icon: '⭐',
    description: 'Contract for ongoing reputation monitoring and management.',
    category: 'Reputation',
    forLeadType: 'gmb',
  },
  {
    id: 'local-marketing-retainer',
    name: 'Local Marketing Retainer',
    icon: '🤝',
    description: 'Monthly retainer for comprehensive local marketing services.',
    category: 'Marketing',
    forLeadType: 'gmb',
  },
];

// Templates for Agency (platform) - Businesses needing web/marketing services
const AGENCY_PROPOSALS: DocumentTemplate[] = [
  {
    id: 'website-design',
    name: 'Website Design Proposal',
    icon: '🎨',
    description: 'Custom website design and development with modern UX.',
    category: 'Web Development',
    forLeadType: 'platform',
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign / Fix Proposal',
    icon: '🔧',
    description: 'Transform outdated websites into conversion machines.',
    category: 'Web Development',
    forLeadType: 'platform',
  },
  {
    id: 'social-media-management',
    name: 'Social Media Management',
    icon: '📱',
    description: 'Full-service social media strategy and content management.',
    category: 'Social Media',
    forLeadType: 'platform',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing Package',
    icon: '📈',
    description: 'Comprehensive digital marketing with ads, SEO, and analytics.',
    category: 'Marketing',
    forLeadType: 'platform',
  },
  {
    id: 'seo-package',
    name: 'SEO & Content Strategy',
    icon: '🔍',
    description: 'Technical SEO, content optimization, and link building.',
    category: 'SEO',
    forLeadType: 'platform',
  },
];

const AGENCY_CONTRACTS: DocumentTemplate[] = [
  {
    id: 'website-design-agreement',
    name: 'Website Design Agreement',
    icon: '🎨',
    description: 'Comprehensive agreement for website design projects.',
    category: 'Web Development',
    forLeadType: 'platform',
  },
  {
    id: 'marketing-services-agreement',
    name: 'Marketing Services Agreement',
    icon: '📈',
    description: 'Contract for ongoing digital marketing services.',
    category: 'Marketing',
    forLeadType: 'platform',
  },
  {
    id: 'social-media-retainer',
    name: 'Social Media Retainer',
    icon: '📱',
    description: 'Monthly retainer for social media management services.',
    category: 'Social Media',
    forLeadType: 'platform',
  },
  {
    id: 'seo-services-agreement',
    name: 'SEO Services Agreement',
    icon: '🔍',
    description: 'Contract for ongoing SEO and content services.',
    category: 'SEO',
    forLeadType: 'platform',
  },
];

interface DocumentsPanelProps {
  searchType?: 'gmb' | 'platform' | null;
}

export default function DocumentsPanel({ searchType }: DocumentsPanelProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Get the effective search type from session if not provided
  const effectiveSearchType = searchType || 
    (typeof window !== 'undefined' ? sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' | null : null);

  // Select templates based on lead type
  const proposals = effectiveSearchType === 'platform' ? AGENCY_PROPOSALS : GMB_PROPOSALS;
  const contracts = effectiveSearchType === 'platform' ? AGENCY_CONTRACTS : GMB_CONTRACTS;

  const leadTypeLabel = effectiveSearchType === 'platform' 
    ? '🎯 Agency Lead Finder' 
    : '🤖 Super AI Business Search';

  const leadTypeDescription = effectiveSearchType === 'platform'
    ? 'Templates for web development, social media, and digital marketing services.'
    : 'Templates for local businesses – GMB optimization, reputation, and local marketing.';

  const handlePreview = (doc: DocumentTemplate) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const handleCopyTemplate = (doc: DocumentTemplate) => {
    toast.success(`"${doc.name}" copied to clipboard!`);
  };

  const handleSendTemplate = (doc: DocumentTemplate) => {
    toast.success(`Opening "${doc.name}" in compose...`);
    setPreviewOpen(false);
  };

  const TemplateCard = ({ doc }: { doc: DocumentTemplate }) => (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-xl">
          {doc.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm mb-0.5">{doc.name}</h4>
          <p className="text-xs text-slate-400 line-clamp-2">{doc.description}</p>
          <Badge variant="outline" className="mt-2 text-[10px] border-slate-600 text-slate-500">
            {doc.category}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handlePreview(doc)}
          className="flex-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Preview
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCopyTemplate(doc)}
          className="flex-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <Copy className="w-3.5 h-3.5 mr-1" />
          Copy
        </Button>
        <Button
          size="sm"
          onClick={() => handleSendTemplate(doc)}
          className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          Use
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Lead Type Indicator */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Done-For-You Documents</h2>
            <p className="text-sm text-slate-400 mt-1">Proposals & contracts ready to send</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "px-3 py-1.5 text-xs",
              effectiveSearchType === 'platform' 
                ? "border-teal-500 text-teal-400 bg-teal-500/10" 
                : "border-amber-500 text-amber-400 bg-amber-500/10"
            )}
          >
            {leadTypeLabel}
          </Badge>
        </div>

        {/* Lead Type Context Banner */}
        <div className={cn(
          "p-4 rounded-xl border",
          effectiveSearchType === 'platform'
            ? "bg-teal-500/5 border-teal-500/20"
            : "bg-amber-500/5 border-amber-500/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              effectiveSearchType === 'platform'
                ? "bg-teal-500/20"
                : "bg-amber-500/20"
            )}>
              {effectiveSearchType === 'platform' ? (
                <Globe className="w-5 h-5 text-teal-400" />
              ) : (
                <MapPin className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {effectiveSearchType === 'platform' ? 'Agency Templates' : 'Local Business Templates'}
              </p>
              <p className="text-xs text-slate-400">{leadTypeDescription}</p>
            </div>
          </div>
        </div>

        {/* Tabs for Proposals vs Contracts */}
        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
            <TabsTrigger 
              value="proposals" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Proposals ({proposals.length})
            </TabsTrigger>
            <TabsTrigger 
              value="contracts"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            >
              <FileText className="w-4 h-4 mr-2" />
              Contracts ({contracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposals.map(doc => (
                <TemplateCard key={doc.id} doc={doc} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.map(doc => (
                <TemplateCard key={doc.id} doc={doc} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal - Standardized Dark Theme */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent elevated className="max-w-2xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{selectedDoc?.icon}</span>
              {selectedDoc?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDoc?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Preview Content Placeholder */}
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 min-h-[300px]">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {selectedDoc?.category}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    selectedDoc?.forLeadType === 'platform' 
                      ? "border-teal-500 text-teal-400" 
                      : "border-amber-500 text-amber-400"
                  )}
                >
                  {selectedDoc?.forLeadType === 'platform' ? 'Agency' : 'Local Business'}
                </Badge>
              </div>

              <div className="space-y-4 text-slate-300 text-sm">
                <p>This is a preview of the <strong>{selectedDoc?.name}</strong> template.</p>
                <p className="text-slate-400">
                  Full template includes customizable sections for:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>Client and provider information</li>
                  <li>Scope of work and deliverables</li>
                  <li>Timeline and milestones</li>
                  <li>Pricing and payment terms</li>
                  <li>Terms and conditions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPreviewOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedDoc && handleCopyTemplate(selectedDoc)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Template
            </Button>
            <Button
              onClick={() => selectedDoc && handleSendTemplate(selectedDoc)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Use in Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
