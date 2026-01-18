import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Brain, Sparkles, TrendingUp, Phone, Mail, Calendar, Database,
  Download, FileText, Send, ChevronRight, Flame, ThermometerSun,
  Snowflake, Target, Zap, BarChart3, Users, Clock, ArrowUpRight,
  CheckCircle2, AlertCircle, Loader2, RefreshCw, Filter, Star, Wand2
} from 'lucide-react';
import { 
  getAILeadScores, 
  getAILeadPrioritization, 
  getAILeadInsights,
  ScoredLead, 
  LeadPrioritization, 
  LeadInsights 
} from '@/lib/api/aiLeadScoring';
import AIEmailWriter from '@/components/AIEmailWriter';

interface Lead {
  id: string;
  name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
  };
}

interface AILeadScoringDashboardProps {
  leads: Lead[];
  onEmailLeads: (leads: Lead[]) => void;
  onCallLead: (lead: Lead) => void;
  onSchedule: (lead: Lead) => void;
  onExportCRM: () => void;
  onViewReport: () => void;
  onBack?: () => void;
}

export default function AILeadScoringDashboard({
  leads,
  onEmailLeads,
  onCallLead,
  onSchedule,
  onExportCRM,
  onViewReport,
  onBack,
}: AILeadScoringDashboardProps) {
  const [scoredLeads, setScoredLeads] = useState<ScoredLead[]>([]);
  const [prioritization, setPrioritization] = useState<LeadPrioritization | null>(null);
  const [insights, setInsights] = useState<LeadInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [aiMethod, setAiMethod] = useState<string>('');
  
  // AI Email Writer modal state
  const [showEmailWriter, setShowEmailWriter] = useState(false);
  const [emailWriterLead, setEmailWriterLead] = useState<Lead | null>(null);
  const [emailWriterScoredLead, setEmailWriterScoredLead] = useState<ScoredLead | null>(null);

  useEffect(() => {
    if (leads.length > 0) {
      loadAIAnalysis();
    }
  }, [leads]);

  const loadAIAnalysis = async () => {
    setIsLoading(true);
    
    try {
      const [scoresResult, priorityResult, insightsResult] = await Promise.all([
        getAILeadScores(leads),
        getAILeadPrioritization(leads),
        getAILeadInsights(leads),
      ]);

      if (scoresResult.success && scoresResult.results) {
        setScoredLeads(scoresResult.results);
        setAiMethod(scoresResult.method || 'ai_powered');
      }

      if (priorityResult.success && priorityResult.results) {
        setPrioritization(priorityResult.results);
      }

      if (insightsResult.success && insightsResult.results) {
        setInsights(insightsResult.results);
      }

      toast.success('AI analysis complete!', {
        description: `Scored ${leads.length} leads with ${scoresResult.method === 'ai_powered' ? 'AI' : 'rule-based'} analysis`
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to analyze leads');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const filtered = getFilteredLeads();
    if (selectedLeads.size === filtered.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filtered.map(l => l.id)));
    }
  };

  const getFilteredLeads = () => {
    if (activeTab === 'all') return scoredLeads;
    if (activeTab === 'hot') return scoredLeads.filter(l => l.priority === 'high');
    if (activeTab === 'warm') return scoredLeads.filter(l => l.priority === 'medium');
    if (activeTab === 'cold') return scoredLeads.filter(l => l.priority === 'low');
    return scoredLeads;
  };

  const getSelectedLeadObjects = () => {
    return leads.filter(l => selectedLeads.has(l.id));
  };

  const openEmailWriter = (lead: Lead, scored?: ScoredLead) => {
    setEmailWriterLead(lead);
    setEmailWriterScoredLead(scored || null);
    setShowEmailWriter(true);
  };

  const handleEmailWriterUseTemplate = (subject: string, body: string) => {
    // Store in localStorage for EmailSetupFlow to pick up
    localStorage.setItem('ai_email_template', JSON.stringify({ subject, body }));
    setShowEmailWriter(false);
    
    // Navigate to email with selected leads
    if (emailWriterLead) {
      onEmailLeads([emailWriterLead]);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flame className="w-4 h-4 text-red-500" />;
      case 'medium': return <ThermometerSun className="w-4 h-4 text-amber-500" />;
      case 'low': return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-500/20 text-red-500 border-red-500/30',
      medium: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
      low: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    };
    return styles[priority as keyof typeof styles] || 'bg-muted text-muted-foreground';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const stats = {
    total: scoredLeads.length,
    hot: scoredLeads.filter(l => l.priority === 'high').length,
    warm: scoredLeads.filter(l => l.priority === 'medium').length,
    cold: scoredLeads.filter(l => l.priority === 'low').length,
    avgScore: scoredLeads.length > 0 
      ? Math.round(scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length)
      : 0,
  };

  const filteredLeads = getFilteredLeads();

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Analyzing Your Leads...</h3>
              <p className="text-muted-foreground">Scoring {leads.length} leads for conversion potential</p>
            </div>
            <div className="max-w-xs mx-auto">
              <Progress value={66} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowUpRight className="w-4 h-4 rotate-180" />
          Back to Leads
        </Button>
      )}

      {/* AI Verify Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/90 to-yellow-500/90 p-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button 
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold gap-2 shadow-lg"
              onClick={loadAIAnalysis}
            >
              <Sparkles className="w-4 h-4" />
              ✨ AI VERIFY LEADS ✨
              <Sparkles className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-amber-900">
              <span className="text-lg">💡</span>
              <span className="font-medium">Pro Tip: AI Verify confirms phone & email accuracy!</span>
            </div>
          </div>
          <Badge className="bg-teal-500 text-white border-0 font-semibold px-3 py-1">
            Uses 0 credits
          </Badge>
        </div>
      </motion.div>

      {/* Action Bar */}
      <Card className="bg-card/80 backdrop-blur">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={selectAll}
                  className="border-teal-500 data-[state=checked]:bg-teal-500"
                />
                <span className="text-lg font-bold text-teal-500">{selectedLeads.size}</span>
                <span className="text-muted-foreground">selected</span>
                <span className="text-muted-foreground">of</span>
                <span className="font-bold">{filteredLeads.length}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">ACTIONS:</span>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 gap-1"
                  onClick={() => {
                    const selected = getSelectedLeadObjects();
                    if (selected.length > 0 && selected[0]) onCallLead(selected[0]);
                  }}
                  disabled={selectedLeads.size === 0}
                >
                  <Phone className="w-3 h-3" /> Call
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 gap-1"
                  onClick={() => onEmailLeads(getSelectedLeadObjects())}
                  disabled={selectedLeads.size === 0}
                >
                  <Mail className="w-3 h-3" /> Email
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-1 border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                  onClick={() => {
                    const selected = getSelectedLeadObjects();
                    const scored = scoredLeads.find(s => s.id === selected[0]?.id);
                    if (selected[0]) openEmailWriter(selected[0], scored);
                  }}
                  disabled={selectedLeads.size === 0}
                >
                  <Wand2 className="w-3 h-3" /> AI Write
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">TOOLS:</span>
                <Button variant="outline" size="sm" className="gap-1" onClick={onExportCRM}>
                  <Database className="w-3 h-3" /> CRM
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    const selected = getSelectedLeadObjects();
                    if (selected.length > 0 && selected[0]) onSchedule(selected[0]);
                  }}
                  disabled={selectedLeads.size === 0}
                >
                  <Calendar className="w-3 h-3" /> Schedule
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">EXPORT:</span>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="w-3 h-3" /> Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 bg-teal-500/10 border-teal-500/30 text-teal-500 hover:bg-teal-500/20"
                onClick={onViewReport}
              >
                <FileText className="w-3 h-3" /> View Report
              </Button>
              <Button 
                size="sm" 
                className="gap-1 bg-teal-500 hover:bg-teal-600"
                onClick={() => onEmailLeads(getSelectedLeadObjects())}
                disabled={selectedLeads.size === 0}
              >
                <Send className="w-3 h-3" /> Send Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/30">
          <CardContent className="pt-4 text-center">
            <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
          <CardContent className="pt-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-3xl font-bold text-red-500">{stats.hot}</p>
            <p className="text-sm text-muted-foreground">Hot Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30">
          <CardContent className="pt-4 text-center">
            <ThermometerSun className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-3xl font-bold text-amber-500">{stats.warm}</p>
            <p className="text-sm text-muted-foreground">Warm Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="pt-4 text-center">
            <Snowflake className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold text-blue-500">{stats.cold}</p>
            <p className="text-sm text-muted-foreground">Nurture</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold text-green-500">{stats.avgScore}%</p>
            <p className="text-sm text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Prioritized Leads
                  </CardTitle>
                  <CardDescription>
                    {aiMethod === 'ai_powered' ? '🤖 AI-Powered Analysis' : '📊 Rule-Based Scoring'}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadAIAnalysis} className="gap-1">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="all" className="gap-1">
                    <Users className="w-3 h-3" /> All ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="hot" className="gap-1 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
                    <Flame className="w-3 h-3" /> Hot ({stats.hot})
                  </TabsTrigger>
                  <TabsTrigger value="warm" className="gap-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
                    <ThermometerSun className="w-3 h-3" /> Warm ({stats.warm})
                  </TabsTrigger>
                  <TabsTrigger value="cold" className="gap-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-500">
                    <Snowflake className="w-3 h-3" /> Nurture ({stats.cold})
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[500px]">
                  <AnimatePresence mode="popLayout">
                    {filteredLeads.map((lead, index) => {
                      const originalLead = leads.find(l => l.id === lead.id);
                      
                      return (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03 }}
                          className={`p-4 rounded-xl border mb-2 transition-all cursor-pointer ${
                            selectedLeads.has(lead.id) 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleSelect(lead.id)}
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox 
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={() => toggleSelect(lead.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getPriorityIcon(lead.priority)}
                                <span className="font-semibold truncate">{lead.name}</span>
                                <Badge className={getPriorityBadge(lead.priority)}>
                                  {lead.priority.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                {originalLead?.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> {originalLead.email}
                                  </span>
                                )}
                                {originalLead?.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {originalLead.phone}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                💡 {lead.reasoning}
                              </p>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                                {lead.score}
                              </div>
                              <div className="text-xs text-muted-foreground">Score</div>
                              <div className="mt-2 flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (originalLead) onCallLead(originalLead);
                                  }}
                                >
                                  <Phone className="w-3 h-3 text-green-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (originalLead) onEmailLeads([originalLead]);
                                  }}
                                >
                                  <Mail className="w-3 h-3 text-blue-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Panel */}
        <div className="space-y-4">
          {/* Recommended Actions */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.hot > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <Flame className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Call {stats.hot} hot leads NOW</p>
                    <p className="text-xs text-muted-foreground">High conversion probability</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
              
              {stats.warm > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                >
                  <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Email {stats.warm} warm leads</p>
                    <p className="text-xs text-muted-foreground">Schedule follow-up in 48h</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
              
              {stats.cold > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
                >
                  <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Add {stats.cold} to drip campaign</p>
                    <p className="text-xs text-muted-foreground">Nurture for long-term</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {insights && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-purple-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.patterns && insights.patterns.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Target className="w-4 h-4 text-primary" /> Patterns
                    </p>
                    <ul className="space-y-1">
                      {insights.patterns.slice(0, 3).map((pattern, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span> {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {insights.painPoints && insights.painPoints.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Pain Points
                    </p>
                    <ul className="space-y-1">
                      {insights.painPoints.slice(0, 3).map((point, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500">•</span> {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Recommendations
                    </p>
                    <ul className="space-y-1">
                      {insights.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500">•</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conversion Prediction */}
          <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Conversion Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-green-500 mb-2">
                  {Math.round(stats.avgScore * 0.7)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Expected conversion rate for hot leads
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">
                    +{Math.round(stats.hot * 0.3)} projected closes this month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Email Writer Modal */}
      <Dialog open={showEmailWriter} onOpenChange={setShowEmailWriter}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              AI Email Writer
            </DialogTitle>
          </DialogHeader>
          {emailWriterLead && (
            <AIEmailWriter
              lead={emailWriterLead}
              scoredLead={emailWriterScoredLead || undefined}
              painPoints={insights?.painPoints || []}
              mode="advanced"
              onUseTemplate={handleEmailWriterUseTemplate}
              onClose={() => setShowEmailWriter(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
