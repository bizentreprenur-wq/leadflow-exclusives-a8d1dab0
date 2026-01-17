import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Users, TrendingUp, Clock, AlertCircle, Search, Filter,
  Plus, FileText, List, Download, Phone, Mail, Globe,
  Star, StarOff, Trash2, MoreVertical, CheckCircle2
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'new' | 'called' | 'call_response' | 'texted' | 'sms_response' | 'emailed' | 'email_response';
  priority: 'high' | 'medium' | 'low';
  starred: boolean;
  score: number;
  followUpDate?: string;
}

interface BamLeadCRMPanelProps {
  leads: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  }>;
  onSync?: () => void;
}

const STATUS_CONFIG = {
  all: { label: 'All Leads', icon: Users, color: 'bg-primary' },
  new: { label: 'New', icon: Plus, color: 'bg-blue-500' },
  called: { label: 'Called', icon: Phone, color: 'bg-amber-500' },
  call_response: { label: 'Call Response', icon: Phone, color: 'bg-green-500' },
  texted: { label: 'Texted', icon: Mail, color: 'bg-violet-500' },
  sms_response: { label: 'SMS Response', icon: Mail, color: 'bg-emerald-500' },
  emailed: { label: 'Emailed', icon: Mail, color: 'bg-cyan-500' },
  email_response: { label: 'Email Response', icon: CheckCircle2, color: 'bg-pink-500' },
};

export default function BamLeadCRMPanel({ leads: initialLeads, onSync }: BamLeadCRMPanelProps) {
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');

  // Initialize CRM leads
  useEffect(() => {
    const saved = localStorage.getItem('bamlead_crm_data');
    if (saved) {
      try {
        setCrmLeads(JSON.parse(saved));
      } catch {
        initializeFromProps();
      }
    } else {
      initializeFromProps();
    }
  }, []);

  const initializeFromProps = () => {
    const converted: Lead[] = initialLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      address: lead.address,
      status: 'new' as const,
      priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
      starred: false,
      score: Math.floor(Math.random() * 40) + 60,
    }));
    setCrmLeads(converted);
    saveCrmData(converted);
  };

  const saveCrmData = (data: Lead[]) => {
    localStorage.setItem('bamlead_crm_data', JSON.stringify(data));
  };

  // Stats calculations
  const stats = {
    total: crmLeads.length,
    highPriority: crmLeads.filter(l => l.priority === 'high').length,
    avgScore: crmLeads.length > 0 
      ? Math.round(crmLeads.reduce((sum, l) => sum + l.score, 0) / crmLeads.length)
      : 0,
    followUps: crmLeads.filter(l => l.followUpDate).length,
  };

  // Status counts
  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = key === 'all' 
      ? crmLeads.length 
      : crmLeads.filter(l => l.status === key).length;
    return acc;
  }, {} as Record<string, number>);

  // Filtered and sorted leads
  const filteredLeads = crmLeads
    .filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery);
      const matchesStatus = activeFilter === 'all' || lead.status === activeFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const toggleStar = (id: string) => {
    const updated = crmLeads.map(l => 
      l.id === id ? { ...l, starred: !l.starred } : l
    );
    setCrmLeads(updated);
    saveCrmData(updated);
  };

  const updateStatus = (id: string, status: Lead['status']) => {
    const updated = crmLeads.map(l => 
      l.id === id ? { ...l, status } : l
    );
    setCrmLeads(updated);
    saveCrmData(updated);
    toast.success('Lead status updated');
  };

  const deleteLead = (id: string) => {
    const updated = crmLeads.filter(l => l.id !== id);
    setCrmLeads(updated);
    saveCrmData(updated);
    toast.success('Lead removed');
  };

  return (
    <div className="space-y-6">
      {/* BamLead CRM Trial Notice */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white">BamLead CRM - Free Trial</p>
            <p className="text-sm text-amber-300/80">
              Your CRM is <span className="font-bold text-amber-400">FREE for 14 days</span>, then $29/month. 
              External CRM integrations below are always free!
            </p>
          </div>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          14 Days Left
        </Badge>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bamlead CRM</h1>
            <p className="text-muted-foreground">Manage all your leads in one place</p>
          </div>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-3xl font-bold mt-1">{stats.highPriority}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-3xl font-bold mt-1">{stats.avgScore}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Follow-ups</p>
                <p className="text-3xl font-bold mt-1">{stats.followUps}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Pipeline */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Lead Pipeline</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Lead Report
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-muted/30"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <config.icon className="w-4 h-4" />
                {config.label}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts[key]}
                </Badge>
              </button>
            ))}
          </div>

          {/* Lead Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
              <div className="w-8" />
              <div>Business Name</div>
              <div>Contact Info</div>
              <div>Status</div>
              <div className="text-center">Score</div>
              <div className="w-20 text-center">Actions</div>
            </div>

            {/* Table Body */}
            <ScrollArea className="h-[320px]">
              {filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No leads found</p>
                  <p className="text-sm text-muted-foreground/70">Try adjusting your filters or add new leads</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredLeads.map((lead, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-4 px-4 py-4 items-center border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Star */}
                      <button onClick={() => toggleStar(lead.id)} className="w-8">
                        {lead.starred ? (
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        ) : (
                          <StarOff className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground" />
                        )}
                      </button>

                      {/* Business Name */}
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        {lead.website && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3" />
                            {lead.website.replace(/^https?:\/\//, '')}
                          </p>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1">
                        {lead.email && (
                          <p className="text-sm flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate">{lead.email}</span>
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-sm flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {lead.phone}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => updateStatus(lead.id, v as Lead['status'])}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'all').map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <config.icon className="w-3 h-3" />
                                  {config.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                          lead.score >= 80 ? 'bg-green-500/20 text-green-500' :
                          lead.score >= 60 ? 'bg-amber-500/20 text-amber-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {lead.score}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-1 w-20">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteLead(lead.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
