import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Flame, TrendingUp, Snowflake, Phone, Mail, Database,
  Download, ExternalLink, Users, Star, MapPin, Globe,
  CheckCircle2, ArrowRight, Zap, Clock, Target, Brain,
  Building2, AlertTriangle, Copy, FileSpreadsheet
} from 'lucide-react';
import CRMIntegrationModal from './CRMIntegrationModal';

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

interface LeadClassificationPanelProps {
  leads: SearchResult[];
  onProceedToCall: (leads: SearchResult[]) => void;
  onProceedToEmail: (leads: SearchResult[]) => void;
  onExportToCRM: (leads: SearchResult[]) => void;
  onClose: () => void;
}

type Classification = 'hot' | 'warm' | 'cold';

interface ClassifiedLead extends SearchResult {
  classification: Classification;
  score: number;
  reasons: string[];
}

// Classification logic
function classifyLead(lead: SearchResult): ClassifiedLead {
  let score = 50; // Base score
  const reasons: string[] = [];

  // No website = HOT (they definitely need services)
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    score += 40;
    reasons.push('No website - needs your services!');
  }

  // Needs upgrade = HOT
  if (lead.websiteAnalysis?.needsUpgrade) {
    score += 30;
    reasons.push('Website needs upgrade');
  }

  // Has issues = WARM/HOT
  const issueCount = lead.websiteAnalysis?.issues?.length || 0;
  if (issueCount >= 3) {
    score += 25;
    reasons.push(`${issueCount} website issues detected`);
  } else if (issueCount > 0) {
    score += 10;
    reasons.push(`${issueCount} minor issues`);
  }

  // Low mobile score = HOT
  const mobileScore = lead.websiteAnalysis?.mobileScore;
  if (mobileScore !== null && mobileScore !== undefined) {
    if (mobileScore < 50) {
      score += 20;
      reasons.push(`Poor mobile score (${mobileScore})`);
    } else if (mobileScore < 70) {
      score += 10;
      reasons.push(`Mediocre mobile score (${mobileScore})`);
    }
  }

  // Has phone = easier to reach
  if (lead.phone) {
    score += 5;
    reasons.push('Phone number available');
  }

  // High rating = established business with budget
  if (lead.rating && lead.rating >= 4.5) {
    score += 10;
    reasons.push(`High rating (${lead.rating}) - established business`);
  }

  // Legacy platform = HOT
  const legacyPlatforms = ['joomla', 'drupal', 'weebly', 'godaddy'];
  if (lead.websiteAnalysis?.platform && legacyPlatforms.some(p => 
    lead.websiteAnalysis!.platform!.toLowerCase().includes(p)
  )) {
    score += 20;
    reasons.push(`Legacy platform (${lead.websiteAnalysis.platform})`);
  }

  // Determine classification
  let classification: Classification;
  if (score >= 80) {
    classification = 'hot';
  } else if (score >= 55) {
    classification = 'warm';
  } else {
    classification = 'cold';
  }

  return {
    ...lead,
    classification,
    score,
    reasons,
  };
}

export default function LeadClassificationPanel({
  leads,
  onProceedToCall,
  onProceedToEmail,
  onExportToCRM,
  onClose,
}: LeadClassificationPanelProps) {
  const [selectedHot, setSelectedHot] = useState<Set<string>>(new Set());
  const [selectedWarm, setSelectedWarm] = useState<Set<string>>(new Set());
  const [selectedCold, setSelectedCold] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Classification>('hot');
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [crmLeads, setCRMLeads] = useState<SearchResult[]>([]);

  // Classify all leads
  const classifiedLeads = useMemo(() => {
    return leads.map(classifyLead).sort((a, b) => b.score - a.score);
  }, [leads]);

  const hotLeads = useMemo(() => classifiedLeads.filter(l => l.classification === 'hot'), [classifiedLeads]);
  const warmLeads = useMemo(() => classifiedLeads.filter(l => l.classification === 'warm'), [classifiedLeads]);
  const coldLeads = useMemo(() => classifiedLeads.filter(l => l.classification === 'cold'), [classifiedLeads]);

  const getSelectedSet = (classification: Classification) => {
    switch (classification) {
      case 'hot': return selectedHot;
      case 'warm': return selectedWarm;
      case 'cold': return selectedCold;
    }
  };

  const setSelectedSet = (classification: Classification, set: Set<string>) => {
    switch (classification) {
      case 'hot': setSelectedHot(set); break;
      case 'warm': setSelectedWarm(set); break;
      case 'cold': setSelectedCold(set); break;
    }
  };

  const toggleSelect = (classification: Classification, id: string) => {
    const set = getSelectedSet(classification);
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSet(classification, next);
  };

  const selectAll = (classification: Classification, leadsGroup: ClassifiedLead[]) => {
    const set = getSelectedSet(classification);
    if (set.size === leadsGroup.length) {
      setSelectedSet(classification, new Set());
    } else {
      setSelectedSet(classification, new Set(leadsGroup.map(l => l.id)));
    }
  };

  const getSelectedLeads = (classification: Classification): SearchResult[] => {
    const set = getSelectedSet(classification);
    return classifiedLeads.filter(l => set.has(l.id));
  };

  const handleAction = (
    classification: Classification,
    action: 'call' | 'email' | 'crm' | 'csv'
  ) => {
    const selected = getSelectedLeads(classification);
    if (selected.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }

    switch (action) {
      case 'call':
        onProceedToCall(selected);
        toast.success(`${selected.length} leads ready for calling`);
        break;
      case 'email':
        onProceedToEmail(selected);
        break;
      case 'crm':
        setCRMLeads(selected);
        setShowCRMModal(true);
        break;
      case 'csv':
        exportToCSV(selected, classification);
        break;
    }
  };

  const exportToCSV = (leadsToExport: SearchResult[], label: string) => {
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Platform', 'Issues'];
    const rows = leadsToExport.map(l => [
      `"${l.name || ''}"`,
      `"${l.address || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      l.rating || '',
      `"${l.websiteAnalysis?.platform || ''}"`,
      `"${l.websiteAnalysis?.issues?.join('; ') || ''}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bamlead-${label}-Leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leadsToExport.length} ${label} leads`);
  };

  const copyPhoneNumbers = (leadsGroup: ClassifiedLead[]) => {
    const phones = leadsGroup.filter(l => l.phone).map(l => l.phone).join('\n');
    navigator.clipboard.writeText(phones);
    toast.success(`Copied ${leadsGroup.filter(l => l.phone).length} phone numbers`);
  };

  const classificationConfig = {
    hot: {
      icon: Flame,
      label: '🔥 Hot Leads',
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      description: 'Ready to buy - contact ASAP!',
      recommendation: 'Call these leads immediately! They have the highest conversion potential.',
      actions: [
        { id: 'call', label: 'Call Now', icon: Phone, primary: true },
        { id: 'email', label: 'Priority Email', icon: Mail, primary: false },
        { id: 'crm', label: 'Add to CRM', icon: Database, primary: false },
      ],
    },
    warm: {
      icon: TrendingUp,
      label: '⚡ Warm Leads',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      description: 'Interested - needs nurturing',
      recommendation: 'Send personalized emails highlighting their specific website issues.',
      actions: [
        { id: 'email', label: 'Send Email', icon: Mail, primary: true },
        { id: 'call', label: 'Schedule Call', icon: Phone, primary: false },
        { id: 'crm', label: 'Add to CRM', icon: Database, primary: false },
      ],
    },
    cold: {
      icon: Snowflake,
      label: '❄️ Cold Leads',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      description: 'Long-term prospects',
      recommendation: 'Add to nurture sequence. These may convert over time with consistent follow-ups.',
      actions: [
        { id: 'crm', label: 'Save to CRM', icon: Database, primary: true },
        { id: 'email', label: 'Nurture Email', icon: Mail, primary: false },
        { id: 'csv', label: 'Export CSV', icon: Download, primary: false },
      ],
    },
  };

  const renderLeadGroup = (
    classification: Classification,
    leadsGroup: ClassifiedLead[],
    selectedSet: Set<string>
  ) => {
    const config = classificationConfig[classification];
    const IconComponent = config.icon;

    return (
      <div className="space-y-4">
        {/* Header Card */}
        <Card className={`${config.borderColor} ${config.bgColor} border-2`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
                <IconComponent className={`w-6 h-6 ${config.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`font-bold text-lg ${config.color}`}>{config.label}</h3>
                  <Badge className={`${config.bgColor} ${config.color} border-0`}>
                    {leadsGroup.length} leads
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                  <Brain className="w-4 h-4 text-violet-600 shrink-0" />
                  <p className="text-xs text-violet-600">{config.recommendation}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Checkbox
              checked={selectedSet.size === leadsGroup.length && leadsGroup.length > 0}
              onCheckedChange={() => selectAll(classification, leadsGroup)}
            />
            <span className="text-sm text-muted-foreground">
              {selectedSet.size > 0 ? `${selectedSet.size} selected` : 'Select all'}
            </span>
          </div>

          {config.actions.map(action => (
            <Button
              key={action.id}
              variant={action.primary ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAction(classification, action.id as any)}
              disabled={selectedSet.size === 0}
              className={action.primary ? `${config.bgColor} ${config.color} border ${config.borderColor} hover:opacity-80` : ''}
            >
              <action.icon className="w-4 h-4 mr-1" />
              {action.label} ({selectedSet.size})
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyPhoneNumbers(leadsGroup)}
            className="ml-auto"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy Phones
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportToCSV(leadsGroup, classification)}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Export All
          </Button>
        </div>

        {/* Lead List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {leadsGroup.map((lead, idx) => (
              <div
                key={lead.id}
                onClick={() => toggleSelect(classification, lead.id)}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSet.has(lead.id)
                    ? `${config.borderColor} ${config.bgColor} ring-2 ring-${config.color.replace('text-', '')}/20`
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <Checkbox checked={selectedSet.has(lead.id)} className="mt-1 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    <h4 className="font-medium">{lead.name}</h4>
                    {lead.rating && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {lead.rating}
                      </Badge>
                    )}
                    <Badge className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                      Score: {lead.score}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    {lead.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.address}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </span>
                    )}
                    {lead.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {lead.websiteAnalysis?.platform || 'Has website'}
                      </span>
                    )}
                  </div>

                  {/* Why this classification */}
                  <div className="flex flex-wrap gap-1">
                    {lead.reasons.slice(0, 3).map((reason, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-[10px] py-0 h-5"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedSet.has(lead.id) && (
                  <CheckCircle2 className={`w-5 h-5 ${config.color} shrink-0`} />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="text-center py-6 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-blue-500/10 rounded-2xl border-2 border-primary/20">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Leads Classified by Priority
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
          AI analyzed your {leads.length} leads and sorted them by conversion potential.
          Choose what action to take for each group!
        </p>

        {/* Quick Stats */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge className="bg-red-500/10 text-red-600 border-red-500/30 px-4 py-2 text-lg">
            <Flame className="w-4 h-4 mr-2" />
            {hotLeads.length} Hot
          </Badge>
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 px-4 py-2 text-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            {warmLeads.length} Warm
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 px-4 py-2 text-lg">
            <Snowflake className="w-4 h-4 mr-2" />
            {coldLeads.length} Cold
          </Badge>
        </div>
      </div>

      {/* Tabs for each classification */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Classification)}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger 
            value="hot" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600"
          >
            <Flame className="w-4 h-4" />
            Hot ({hotLeads.length})
          </TabsTrigger>
          <TabsTrigger 
            value="warm"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600"
          >
            <TrendingUp className="w-4 h-4" />
            Warm ({warmLeads.length})
          </TabsTrigger>
          <TabsTrigger 
            value="cold"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600"
          >
            <Snowflake className="w-4 h-4" />
            Cold ({coldLeads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hot" className="mt-4">
          {hotLeads.length > 0 ? (
            renderLeadGroup('hot', hotLeads, selectedHot)
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Flame className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No hot leads found in this batch. Try expanding your search!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="warm" className="mt-4">
          {warmLeads.length > 0 ? (
            renderLeadGroup('warm', warmLeads, selectedWarm)
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No warm leads found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cold" className="mt-4">
          {coldLeads.length > 0 ? (
            renderLeadGroup('cold', coldLeads, selectedCold)
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Snowflake className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No cold leads found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Back to Results
        </Button>
        <Button 
          onClick={() => {
            const allSelected = [
              ...getSelectedLeads('hot'),
              ...getSelectedLeads('warm'),
              ...getSelectedLeads('cold'),
            ];
            if (allSelected.length === 0) {
              toast.error('Please select leads from at least one category');
              return;
            }
            onProceedToEmail(allSelected);
          }}
          className="flex-1 gap-2 bg-gradient-to-r from-primary to-emerald-600"
        >
          <Mail className="w-4 h-4" />
          Email All Selected ({selectedHot.size + selectedWarm.size + selectedCold.size})
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* CRM Integration Modal */}
      <CRMIntegrationModal
        open={showCRMModal}
        onOpenChange={setShowCRMModal}
        leads={crmLeads}
      />
    </div>
  );
}
