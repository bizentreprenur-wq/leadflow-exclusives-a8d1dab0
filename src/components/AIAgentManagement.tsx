/**
 * AI Agent Management Dashboard
 * Per-tier agent autonomy: Basic (you dial), Pro (AI calls, you supervise), Autopilot (AI does everything).
 * Every customer gets all 3 agents — the autonomy level changes per plan.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Bot, Shield, Target, CalendarCheck, Zap, 
  Activity, TrendingUp, Phone, Brain,
  ChevronDown, ChevronRight, CheckCircle2,
  Sparkles, Lock, Eye, Edit3, Send, MessageCircle,
  PhoneCall, FileText, Users
} from 'lucide-react';
import { usePlanFeatures, type PlanTier } from '@/hooks/usePlanFeatures';

interface AgentCapability {
  label: string;
  free: string;
  basic: string;
  pro: string;
  autopilot: string;
}

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  description: Record<PlanTier, string>;
  capabilities: AgentCapability[];
  stats: {
    callsHandled: number;
    successRate: number;
    avgDuration: number;
    leadsConverted: number;
  };
  systemPrompt: string;
}

const AGENTS: AgentConfig[] = [
  {
    id: 'qualifier',
    name: 'Qualifier Agent',
    role: 'Lead Qualification & Discovery',
    icon: Shield,
    color: 'text-cyan-400',
    gradientFrom: 'from-cyan-500/15',
    gradientTo: 'to-blue-500/15',
    borderColor: 'border-cyan-500/25',
    description: {
      free: 'Preview AI call scripts to see how the Qualifier would engage your leads.',
      basic: 'AI generates qualification scripts. You dial leads manually and follow the script to qualify them.',
      pro: 'AI calls your leads and qualifies them using intelligent scripts. You supervise and jump in when needed.',
      autopilot: 'AI autonomously calls, qualifies, and scores every lead. Transfers hot prospects to Closer Agent automatically.',
      unlimited: 'AI autonomously calls, qualifies, and scores every lead. Transfers hot prospects to Closer Agent automatically.',
    },
    capabilities: [
      { label: 'Call Scripts', free: 'Preview only', basic: 'AI generates (you dial)', pro: 'AI calls (you supervise)', autopilot: 'Fully autonomous' },
      { label: 'Budget Discovery', free: '—', basic: 'Manual questions', pro: 'AI asks & records', autopilot: 'AI qualifies & scores' },
      { label: 'Lead Scoring', free: '—', basic: 'Manual tagging', pro: 'AI-assisted scoring', autopilot: 'Real-time AI scoring' },
      { label: 'SMS Follow-up', free: '—', basic: 'Manual SMS', pro: 'AI drafts (you send)', autopilot: 'AI sends automatically' },
      { label: 'Agent Handoff', free: '—', basic: '—', pro: 'Manual transfer', autopilot: 'Auto-routes to Closer' },
    ],
    stats: { callsHandled: 47, successRate: 72, avgDuration: 185, leadsConverted: 34 },
    systemPrompt: 'You are a professional lead qualifier for a business outreach campaign. Ask about budget range, decision timeline, current solutions, and pain points. Be friendly, conversational, and concise.',
  },
  {
    id: 'closer',
    name: 'Closer Agent',
    role: 'Objection Handling & Conversion',
    icon: Target,
    color: 'text-amber-400',
    gradientFrom: 'from-amber-500/15',
    gradientTo: 'to-orange-500/15',
    borderColor: 'border-amber-500/25',
    description: {
      free: 'Preview how the Closer would handle objections and guide leads toward a decision.',
      basic: 'AI generates closing scripts with objection rebuttals. You handle the call and follow the playbook.',
      pro: 'AI calls qualified leads, handles objections, and presents your value proposition. You jump in to close.',
      autopilot: 'AI handles the entire closing conversation — objections, pricing, and commitment — then triggers proposals automatically.',
      unlimited: 'AI handles the entire closing conversation — objections, pricing, and commitment — then triggers proposals automatically.',
    },
    capabilities: [
      { label: 'Objection Handling', free: 'Preview only', basic: 'Script playbook', pro: 'AI handles (you close)', autopilot: 'Fully autonomous' },
      { label: 'Value Proposition', free: '—', basic: 'Template-based', pro: 'AI personalizes', autopilot: 'AI adapts in real-time' },
      { label: 'Proposal Trigger', free: '—', basic: 'Manual send', pro: 'AI drafts (you approve)', autopilot: 'Auto-sends proposal' },
      { label: 'Competitive Positioning', free: '—', basic: '—', pro: 'AI-assisted', autopilot: 'AI counters competitors' },
      { label: 'Commitment Securing', free: '—', basic: 'Manual', pro: 'AI guides', autopilot: 'AI closes & books' },
    ],
    stats: { callsHandled: 31, successRate: 58, avgDuration: 320, leadsConverted: 18 },
    systemPrompt: 'You are an expert sales closer. Address objections with empathy, highlight ROI and case studies, and guide the conversation toward a concrete next step like booking a meeting or accepting a proposal.',
  },
  {
    id: 'scheduler',
    name: 'Scheduler Agent',
    role: 'Meetings, Proposals & CRM Sync',
    icon: CalendarCheck,
    color: 'text-emerald-400',
    gradientFrom: 'from-emerald-500/15',
    gradientTo: 'to-teal-500/15',
    borderColor: 'border-emerald-500/25',
    description: {
      free: 'Preview how the Scheduler would book meetings and send follow-ups.',
      basic: 'AI generates meeting request templates. You book meetings manually and send proposals yourself.',
      pro: 'AI calls to book meetings and drafts proposals. You confirm the appointment and approve the proposal before sending.',
      autopilot: 'AI books meetings, sends proposals and contracts, syncs to CRM, and schedules automated follow-ups — zero manual work.',
      unlimited: 'AI books meetings, sends proposals and contracts, syncs to CRM, and schedules automated follow-ups — zero manual work.',
    },
    capabilities: [
      { label: 'Meeting Booking', free: 'Preview only', basic: 'Manual booking', pro: 'AI books (you confirm)', autopilot: 'Fully autonomous' },
      { label: 'Proposal Delivery', free: '—', basic: 'Manual send', pro: 'AI drafts (you approve)', autopilot: 'Auto-sends' },
      { label: 'Contract Generation', free: '—', basic: '—', pro: 'Template-based', autopilot: 'AI generates & sends' },
      { label: 'CRM Sync', free: '—', basic: 'Manual export', pro: 'Auto-sync', autopilot: 'Real-time bi-directional' },
      { label: 'Follow-up Scheduling', free: '—', basic: 'Manual', pro: 'AI suggests times', autopilot: 'AI schedules chain' },
    ],
    stats: { callsHandled: 23, successRate: 91, avgDuration: 95, leadsConverted: 21 },
    systemPrompt: 'You are a scheduling assistant. Help leads book meetings, confirm availability, and send follow-up materials like proposals or contracts automatically.',
  },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const TIER_MODE_LABELS: Record<PlanTier, { label: string; color: string; icon: React.ElementType }> = {
  free: { label: 'Explorer — Preview Only', color: 'text-muted-foreground', icon: Eye },
  basic: { label: 'Manual Mode — You Dial, AI Assists', color: 'text-primary', icon: Phone },
  pro: { label: 'Co-Pilot — AI Calls, You Supervise', color: 'text-cyan-400', icon: PhoneCall },
  autopilot: { label: 'Agentic Mode — AI Does Everything', color: 'text-amber-400', icon: Sparkles },
  unlimited: { label: 'Unlimited — AI Does Everything', color: 'text-red-400', icon: Sparkles },
};

export default function AIAgentManagement() {
  const { tier, tierInfo, isAutopilot, isPro } = usePlanFeatures();
  const [expandedAgent, setExpandedAgent] = useState<string | null>('qualifier');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [agentPrompts, setAgentPrompts] = useState<Record<string, string>>(
    Object.fromEntries(AGENTS.map(a => [a.id, a.systemPrompt]))
  );
  const [agentEnabled, setAgentEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map(a => [a.id, true]))
  );

  const modeInfo = TIER_MODE_LABELS[tier];
  const ModeIcon = modeInfo.icon;

  const toggleAgent = (agentId: string) => {
    if (tier === 'free') {
      toast.error('Upgrade to Basic or higher to enable AI agents');
      return;
    }
    setAgentEnabled(prev => {
      const next = { ...prev, [agentId]: !prev[agentId] };
      const agent = AGENTS.find(a => a.id === agentId);
      toast.success(`${agent?.name} ${next[agentId] ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  const savePrompt = (agentId: string) => {
    setEditingPrompt(null);
    toast.success('Agent prompt saved');
  };

  const totalCalls = AGENTS.reduce((sum, a) => sum + a.stats.callsHandled, 0);
  const totalConverted = AGENTS.reduce((sum, a) => sum + a.stats.leadsConverted, 0);
  const activeCount = Object.values(agentEnabled).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Tier Mode Banner */}
      <Card className={`${AGENTS[0].borderColor} bg-gradient-to-r ${AGENTS[0].gradientFrom} to-transparent`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                <ModeIcon className={`w-5 h-5 ${modeInfo.color}`} />
              </div>
              <div>
                <p className={`text-sm font-extrabold ${modeInfo.color}`}>{modeInfo.label}</p>
                <p className="text-xs text-muted-foreground">
                  {tier === 'free' && 'Preview scripts only — upgrade to start calling'}
                  {tier === 'basic' && 'AI generates scripts & follows up. You dial and respond.'}
                  {tier === 'pro' && 'AI calls your leads and handles conversations. You supervise and close.'}
                  {tier === 'autopilot' && 'AI handles calls, SMS, follow-ups, proposals, and bookings autonomously.'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`${modeInfo.color} border-current/30 whitespace-nowrap`}>
              {tierInfo.name}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-3 text-center">
            <Bot className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
            <div className="text-xl font-extrabold text-foreground">{activeCount}/3</div>
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
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Converted</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-3 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-violet-400" />
            <div className="text-xl font-extrabold text-foreground">
              {totalCalls > 0 ? Math.round((totalConverted / totalCalls) * 100) : 0}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Conversion</div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Routing Pipeline */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-sm font-extrabold">Agent Routing Pipeline</CardTitle>
          </div>
          <CardDescription className="text-xs">
            {tier === 'autopilot' 
              ? 'Calls are routed autonomously — Qualifier → Closer → Scheduler' 
              : tier === 'pro'
              ? 'AI calls leads, routes between agents. You supervise and close.'
              : 'AI generates scripts per agent. You control the calling.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium uppercase">
                {tier === 'autopilot' ? 'Auto Call' : tier === 'pro' ? 'AI Calls' : 'You Dial'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="w-10 h-10 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium uppercase">Intent AI</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            {AGENTS.map((agent, idx) => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1 min-w-[70px]">
                  <div className={`w-10 h-10 rounded-full ${agent.gradientFrom} border ${agent.borderColor} flex items-center justify-center relative ${!agentEnabled[agent.id] ? 'opacity-40' : ''}`}>
                    <agent.icon className={`w-5 h-5 ${agentEnabled[agent.id] ? agent.color : 'text-muted-foreground'}`} />
                    {agentEnabled[agent.id] && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase">{agent.name.split(' ')[0]}</span>
                </div>
                {idx < AGENTS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Cards */}
      <div className="space-y-3">
        {AGENTS.map(agent => {
          const isExpanded = expandedAgent === agent.id;
          const isEditing = editingPrompt === agent.id;
          const enabled = agentEnabled[agent.id];
          const AgentIcon = agent.icon;

          return (
            <motion.div key={agent.id} layout>
              <Card className={`border-border/50 transition-all ${enabled ? 'bg-card/80' : 'bg-card/40 opacity-70'}`}>
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
                            !enabled ? 'bg-muted text-muted-foreground border-muted' :
                            tier === 'autopilot' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            tier === 'pro' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                            'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {!enabled ? 'DISABLED' :
                             tier === 'autopilot' ? <><Sparkles className="w-2.5 h-2.5 mr-1" />AUTONOMOUS</> :
                             tier === 'pro' ? <><Activity className="w-2.5 h-2.5 mr-1 animate-pulse" />CO-PILOT</> :
                             tier === 'basic' ? <><Phone className="w-2.5 h-2.5 mr-1" />MANUAL</> :
                             <><Eye className="w-2.5 h-2.5 mr-1" />PREVIEW</>}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-0.5">{agent.role}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {tier !== 'free' && (
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => toggleAgent(agent.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
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
                        {/* Tier-specific description */}
                        <div className="rounded-xl bg-muted/20 border border-border/30 p-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {agent.description[tier]}
                          </p>
                        </div>

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

                        {/* Capability Matrix — shows what THIS tier gets vs others */}
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                            Capabilities by Plan
                          </h4>
                          <div className="rounded-xl border border-border/30 overflow-hidden">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="border-b border-border/20 bg-muted/10">
                                  <th className="text-left p-2 text-muted-foreground font-medium">Feature</th>
                                  <th className={`text-center p-2 font-medium ${tier === 'basic' ? 'text-primary' : 'text-muted-foreground'}`}>Basic</th>
                                  <th className={`text-center p-2 font-medium ${tier === 'pro' ? 'text-cyan-400' : 'text-muted-foreground'}`}>Pro</th>
                                  <th className={`text-center p-2 font-medium ${tier === 'autopilot' ? 'text-amber-400' : 'text-muted-foreground'}`}>Autopilot</th>
                                </tr>
                              </thead>
                              <tbody>
                                {agent.capabilities.map((cap, idx) => (
                                  <tr key={cap.label} className={idx % 2 === 0 ? 'bg-muted/5' : ''}>
                                    <td className="p-2 text-foreground font-medium">{cap.label}</td>
                                    <td className={`p-2 text-center ${tier === 'basic' ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                      {cap.basic === '—' ? <span className="text-muted-foreground/40">—</span> : cap.basic}
                                    </td>
                                    <td className={`p-2 text-center ${tier === 'pro' ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                      {cap.pro === '—' ? <span className="text-muted-foreground/40">—</span> : cap.pro}
                                    </td>
                                    <td className={`p-2 text-center ${tier === 'autopilot' ? 'text-amber-400 font-bold' : 'text-muted-foreground'}`}>
                                      {cap.autopilot}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <Separator className="opacity-30" />

                        {/* System Prompt (editable for paid users) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">System Prompt</h4>
                            {tier !== 'free' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={() => isEditing ? savePrompt(agent.id) : setEditingPrompt(agent.id)}
                              >
                                {isEditing ? 'Save' : 'Edit'}
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-[9px] gap-1">
                                <Lock className="w-2.5 h-2.5" /> Upgrade to Edit
                              </Badge>
                            )}
                          </div>
                          {isEditing && tier !== 'free' ? (
                            <Textarea
                              value={agentPrompts[agent.id]}
                              onChange={(e) => setAgentPrompts(prev => ({ ...prev, [agent.id]: e.target.value }))}
                              className="text-xs min-h-[80px] bg-muted/20"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 leading-relaxed">
                              {agentPrompts[agent.id]}
                            </p>
                          )}
                        </div>

                        {/* Upgrade nudge for lower tiers */}
                        {tier !== 'autopilot' && (
                          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-foreground">
                                {tier === 'free' ? 'Upgrade to Basic to start calling with AI scripts' :
                                 tier === 'basic' ? 'Upgrade to Pro for AI-powered calls (AI dials for you)' :
                                 'Upgrade to Autopilot for fully autonomous AI agents'}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {tier === 'free' ? '$49/mo — AI generates scripts, you dial' :
                                 tier === 'basic' ? '$99/mo — AI calls your leads, you supervise' :
                                 '$249/mo — AI handles calls → meetings → proposals → contracts'}
                              </p>
                            </div>
                          </div>
                        )}
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
