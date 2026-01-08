import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Globe, 
  Smartphone, 
  Clock, 
  Search, 
  Wrench,
  Zap,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LeadGroup, LeadAnalysis, LeadSummary, EmailStrategy } from '@/lib/api/leadAnalysis';
import { saveVerifiedLeads } from '@/lib/api/verifiedLeads';
import { toast } from 'sonner';

interface AILeadGroupingProps {
  groups: Record<string, LeadGroup>;
  summary: LeadSummary;
  emailStrategies: Record<string, EmailStrategy>;
  onSelectGroup: (groupKey: string, leads: LeadAnalysis[]) => void;
  onSelectLead: (lead: LeadAnalysis) => void;
  onLeadsSaved?: () => void;
}

const groupIcons: Record<string, React.ReactNode> = {
  no_website: <Globe className="w-5 h-5" />,
  broken_website: <AlertTriangle className="w-5 h-5" />,
  not_mobile_friendly: <Smartphone className="w-5 h-5" />,
  outdated_technology: <Wrench className="w-5 h-5" />,
  poor_seo: <Search className="w-5 h-5" />,
  slow_loading: <Clock className="w-5 h-5" />,
  diy_platform: <Zap className="w-5 h-5" />,
  needs_refresh: <RefreshCw className="w-5 h-5" />,
  good_website: <CheckCircle className="w-5 h-5" />,
};

const urgencyColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  nurture: 'bg-green-500',
};

const urgencyBadgeVariants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
  nurture: 'outline',
};

export function AILeadGrouping({ 
  groups, 
  summary, 
  emailStrategies,
  onSelectGroup, 
  onSelectLead,
  onLeadsSaved
}: AILeadGroupingProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Collect all leads from all groups
  const getAllLeads = (): LeadAnalysis[] => {
    return Object.values(groups).flatMap(group => group.leads);
  };

  // Save all AI-analyzed leads to verified_leads table
  const handleSaveAllLeads = async () => {
    setIsSaving(true);
    try {
      const allLeads = getAllLeads();
      
      // Map LeadAnalysis to VerifiedLead format
      const leadsToSave = allLeads.map(lead => ({
        id: lead.id,
        business_name: lead.name,
        email: '', // Email will be found during verification step
        contact_name: undefined,
        phone: lead.phone,
        website: lead.url,
        platform: lead.websiteAnalysis?.platform || undefined,
        verified: true,
        emailValid: false,
        leadScore: lead.conversionProbability === 'high' ? 85 : lead.conversionProbability === 'medium' ? 65 : 45,
        aiDraftedMessage: lead.talkingPoints?.join(' ') || '',
        verificationStatus: 'verified' as const,
        issues: lead.painPoints || []
      }));

      const result = await saveVerifiedLeads(leadsToSave);
      
      if (result.success) {
        toast.success(`Saved ${result.data?.saved || allLeads.length} leads to your database`);
        onLeadsSaved?.();
      } else {
        toast.error(result.error || 'Failed to save leads');
      }
    } catch (error) {
      console.error('Save leads error:', error);
      toast.error('Failed to save leads');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleLead = (id: string) => {
    setExpandedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const groupEntries = Object.entries(groups);

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              AI Lead Analysis Summary
            </CardTitle>
            <Button 
              onClick={handleSaveAllLeads} 
              disabled={isSaving || summary.total === 0}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save All {summary.total} Leads
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total Leads</div>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.highPriority}</div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summary.mediumPriority}</div>
              <div className="text-xs text-muted-foreground">Medium Priority</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.lowPriority}</div>
              <div className="text-xs text-muted-foreground">Nurture</div>
            </div>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{summary.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Lead Quality Distribution</span>
            <span className="text-xs text-muted-foreground">{summary.groupCount} categories found</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {summary.highPriority > 0 && (
              <div 
                className="bg-red-500 transition-all" 
                style={{ width: `${(summary.highPriority / summary.total) * 100}%` }}
              />
            )}
            {summary.mediumPriority > 0 && (
              <div 
                className="bg-yellow-500 transition-all" 
                style={{ width: `${(summary.mediumPriority / summary.total) * 100}%` }}
              />
            )}
            {summary.lowPriority > 0 && (
              <div 
                className="bg-green-500 transition-all" 
                style={{ width: `${(summary.lowPriority / summary.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" /> High Priority
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Nurture
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lead Groups */}
      <div className="space-y-3">
        {groupEntries.map(([key, group]) => {
          const strategy = emailStrategies[key];
          const isExpanded = expandedGroups.has(key);
          
          return (
            <Card key={key} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(key)}>
                <CollapsibleTrigger asChild>
                  <div className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${urgencyColors[group.urgency]}/20`}>
                            <span className={`text-${group.urgency === 'critical' || group.urgency === 'high' ? 'red' : group.urgency === 'medium' ? 'yellow' : 'green'}-600`}>
                              {groupIcons[key] || <Users className="w-5 h-5" />}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {group.label}
                              <Badge variant={urgencyBadgeVariants[group.urgency]} className="text-xs">
                                {group.urgency}
                              </Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xl font-bold">{group.leads.length}</div>
                            <div className="text-xs text-muted-foreground">leads</div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Email Strategy */}
                    {strategy && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Recommended Email Approach</span>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Subject: </span>
                            <span className="font-medium">{strategy.subject}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hook: </span>
                            <span>{strategy.hook}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CTA: </span>
                            <span className="text-primary">{strategy.cta}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>Follow-up: Day {strategy.followUpDays.join(', ')}</span>
                            <span>Tone: {strategy.toneRecommendation}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGroup(key, group.leads);
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email All {group.leads.length} Leads in This Group
                    </Button>

                    {/* Individual Leads */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {group.leads.map((lead) => {
                        const isLeadExpanded = expandedLeads.has(lead.id);
                        
                        return (
                          <div 
                            key={lead.id} 
                            className="p-3 bg-muted/30 rounded-lg border border-border/50"
                          >
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleLead(lead.id)}
                            >
                              <div>
                                <div className="font-medium text-sm">{lead.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {lead.address || 'No address'} 
                                  {lead.rating && ` • ⭐ ${lead.rating}`}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={
                                    lead.conversionProbability === 'high' ? 'destructive' : 
                                    lead.conversionProbability === 'medium' ? 'default' : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {lead.conversionProbability} conv.
                                </Badge>
                                {isLeadExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            
                            {isLeadExpanded && (
                              <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                                {/* AI Insights */}
                                {lead.aiInsights && lead.aiInsights.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <Lightbulb className="w-3 h-3 text-yellow-500" />
                                      <span className="text-xs font-medium">AI Insights</span>
                                    </div>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                      {lead.aiInsights.map((insight, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <span className="text-yellow-500 mt-0.5">•</span>
                                          {insight}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Pain Points */}
                                {lead.painPoints && lead.painPoints.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <Target className="w-3 h-3 text-red-500" />
                                      <span className="text-xs font-medium">Pain Points to Address</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {lead.painPoints.map((point, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {point}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Talking Points */}
                                {lead.talkingPoints && lead.talkingPoints.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <Mail className="w-3 h-3 text-primary" />
                                      <span className="text-xs font-medium">Talking Points for Email</span>
                                    </div>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                      {lead.talkingPoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <span className="text-primary mt-0.5">→</span>
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Recommended Approach */}
                                {lead.recommendedApproach && (
                                  <div className="p-2 bg-primary/5 rounded text-xs">
                                    <span className="font-medium">Approach: </span>
                                    {lead.recommendedApproach}
                                  </div>
                                )}

                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectLead(lead);
                                  }}
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email This Lead
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
