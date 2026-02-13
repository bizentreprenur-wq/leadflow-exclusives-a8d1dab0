/**
 * AI Agent Management Dashboard
 * Configure and monitor Qualifier, Closer, and Scheduler agents
 * with status indicators and settings.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Bot, Shield, Target, CalendarCheck, Zap, Settings2, 
  Activity, TrendingUp, Phone, MessageSquare, Brain,
  ChevronDown, ChevronRight, Users, Clock, CheckCircle2,
  AlertTriangle, Sparkles, Volume2, FileText, Send
} from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  enabled: boolean;
  status: 'active' | 'standby' | 'disabled';
  systemPrompt: string;
  triggerKeywords: string[];
  stats: {
    callsHandled: number;
    successRate: number;
    avgDuration: number;
    leadsConverted: number;
  };
  capabilities: string[];
}

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'qualifier',
    name: 'Qualifier Agent',
    description: 'Engages new leads, asks qualification questions about budget, needs, and timeline to determine fit.',
    icon: Shield,
    color: 'text-cyan-400',
    gradientFrom: 'from-cyan-500/15',
    gradientTo: 'to-blue-500/15',
    enabled: true,
    status: 'active',
    systemPrompt: 'You are a professional lead qualifier. Ask about budget range, decision timeline, current solutions, and pain points. Be friendly and conversational.',
    triggerKeywords: ['budget', 'interested', 'looking for', 'need help', 'how much'],
    stats: { callsHandled: 47, successRate: 72, avgDuration: 185, leadsConverted: 34 },
    capabilities: [
      'Budget qualification',
      'Timeline assessment',
      'Pain point discovery',
      'Decision-maker identification',
      'Lead scoring integration'
    ]
  },
  {
    id: 'closer',
    name: 'Closer Agent',
    description: 'Handles objections, presents value propositions, and guides qualified leads toward commitment.',
    icon: Target,
    color: 'text-amber-400',
    gradientFrom: 'from-amber-500/15',
    gradientTo: 'to-orange-500/15',
    enabled: true,
    status: 'active',
    systemPrompt: 'You are an expert sales closer. Address objections with empathy, highlight ROI and case studies, and guide the conversation toward a concrete next step.',
    triggerKeywords: ['too expensive', 'not sure', 'competitor', 'think about it', 'pricing'],
    stats: { callsHandled: 31, successRate: 58, avgDuration: 320, leadsConverted: 18 },
    capabilities: [
      'Objection handling',
      'Value proposition delivery',
      'Competitive positioning',
      'Urgency creation',
      'Commitment securing'
    ]
  },
  {
    id: 'scheduler',
    name: 'Scheduler Agent',
    description: 'Books meetings, sends proposals/contracts automatically, and syncs with calendar and CRM systems.',
    icon: CalendarCheck,
    color: 'text-emerald-400',
    gradientFrom: 'from-emerald-500/15',
    gradientTo: 'to-teal-500/15',
    enabled: true,
    status: 'standby',
    systemPrompt: 'You are a scheduling assistant. Help leads book meetings, confirm availability, and send follow-up materials like proposals or contracts automatically.',
    triggerKeywords: ['proposal', 'contract', 'meeting', 'schedule', 'appointment', 'book'],
    stats: { callsHandled: 23, successRate: 91, avgDuration: 95, leadsConverted: 21 },
    capabilities: [
      'Calendar booking',
      'Proposal auto-send',
      'Contract generation',
      'CRM data sync',
      'Follow-up scheduling'
    ]
  }
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AIAgentManagement() {
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [expandedAgent, setExpandedAgent] = useState<string | null>('qualifier');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      const newEnabled = !a.enabled;
      return { ...a, enabled: newEnabled, status: newEnabled ? 'active' : 'disabled' };
    }));
    const agent = agents.find(a => a.id === agentId);
    toast.success(`${agent?.name} ${agent?.enabled ? 'disabled' : 'enabled'}`);
  };

  const updatePrompt = (agentId: string, prompt: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, systemPrompt: prompt } : a));
  };

  const savePrompt = (agentId: string) => {
    setEditingPrompt(null);
    toast.success('Agent prompt updated');
  };

  const totalCalls = agents.reduce((sum, a) => sum + a.stats.callsHandled, 0);
  const totalConverted = agents.reduce((sum, a) => sum + a.stats.leadsConverted, 0);
  const activeAgents = agents.filter(a => a.enabled).length;

  return (
    <div className="space-y-5">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-3 text-center">
            <Bot className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
            <div className="text-xl font-extrabold text-foreground">{activeAgents}/3</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Agents</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <Phone className="w-4 h-4 mx-auto mb-1 text-amber-400" />
            <div className="text-xl font-extrabold text-foreground">{totalCalls}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Calls</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
            <div className="text-xl font-extrabold text-foreground">{totalConverted}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Leads Converted</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-3 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-violet-400" />
            <div className="text-xl font-extrabold text-foreground">
              {totalCalls > 0 ? Math.round((totalConverted / totalCalls) * 100) : 0}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Router Flow */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-sm font-extrabold">Agent Routing Pipeline</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Incoming calls are routed through agents based on detected intent and conversation stage
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
            {/* Incoming Call */}
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium uppercase">Incoming</span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />

            {/* Intent Detection */}
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <div className="w-10 h-10 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium uppercase">Intent AI</span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />

            {/* Agent Cards */}
            {agents.map((agent, idx) => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                  <div className={`w-10 h-10 rounded-full ${agent.gradientFrom} border ${
                    agent.enabled ? 'border-' + agent.color.replace('text-', '') + '/30' : 'border-muted/30 opacity-40'
                  } flex items-center justify-center relative`}>
                    <agent.icon className={`w-5 h-5 ${agent.enabled ? agent.color : 'text-muted-foreground'}`} />
                    {agent.enabled && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase">{agent.name.split(' ')[0]}</span>
                </div>
                {idx < agents.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Cards */}
      <div className="space-y-3">
        {agents.map(agent => {
          const isExpanded = expandedAgent === agent.id;
          const isEditing = editingPrompt === agent.id;
          const AgentIcon = agent.icon;

          return (
            <motion.div key={agent.id} layout>
              <Card className={`border-border/50 transition-all ${
                agent.enabled ? 'bg-card/80' : 'bg-card/40 opacity-70'
              }`}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.gradientFrom} ${agent.gradientTo} border border-border/50 flex items-center justify-center`}>
                        <AgentIcon className={`w-5 h-5 ${agent.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-extrabold">{agent.name}</CardTitle>
                          <Badge variant="outline" className={`text-[9px] ${
                            agent.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                            agent.status === 'standby' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            'bg-muted text-muted-foreground border-muted'
                          }`}>
                            {agent.status === 'active' && <Activity className="w-2.5 h-2.5 mr-1 animate-pulse" />}
                            {agent.status.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-0.5">{agent.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={() => toggleAgent(agent.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 space-y-4">
                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="rounded-lg bg-muted/30 p-2 text-center">
                            <div className="text-lg font-extrabold text-foreground">{agent.stats.callsHandled}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">Calls</div>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2 text-center">
                            <div className="text-lg font-extrabold text-emerald-400">{agent.stats.successRate}%</div>
                            <div className="text-[9px] text-muted-foreground uppercase">Success</div>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2 text-center">
                            <div className="text-lg font-extrabold text-foreground">{formatDuration(agent.stats.avgDuration)}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">Avg Duration</div>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2 text-center">
                            <div className="text-lg font-extrabold text-amber-400">{agent.stats.leadsConverted}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">Converted</div>
                          </div>
                        </div>

                        <Separator className="opacity-30" />

                        {/* Capabilities */}
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Capabilities</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {agent.capabilities.map(cap => (
                              <Badge key={cap} variant="outline" className="text-[10px] bg-muted/20">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Trigger Keywords */}
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Trigger Keywords</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {agent.triggerKeywords.map(kw => (
                              <Badge key={kw} variant="secondary" className="text-[10px]">
                                "{kw}"
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator className="opacity-30" />

                        {/* System Prompt */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">System Prompt</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => isEditing ? savePrompt(agent.id) : setEditingPrompt(agent.id)}
                            >
                              {isEditing ? 'Save' : 'Edit'}
                            </Button>
                          </div>
                          {isEditing ? (
                            <Textarea
                              value={agent.systemPrompt}
                              onChange={(e) => updatePrompt(agent.id, e.target.value)}
                              className="text-xs min-h-[80px] bg-muted/20"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 leading-relaxed">
                              {agent.systemPrompt}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
