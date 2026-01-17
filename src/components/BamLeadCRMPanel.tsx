import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Database, Users, Mail, Phone, Globe, Building2, 
  Search, Filter, Plus, Download, Upload, Trash2,
  CheckCircle2, Clock, AlertCircle, Star, StarOff,
  MoreVertical, Edit, Eye, Tag, Calendar, TrendingUp,
  Zap, RefreshCw
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  starred: boolean;
  tags: string[];
  lastContact?: Date;
  score: number;
  source: string;
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

const STATUS_COLORS = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  qualified: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS = {
  new: 'New Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
};

export default function BamLeadCRMPanel({ leads: initialLeads, onSync }: BamLeadCRMPanelProps) {
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize CRM leads from localStorage or props
  useEffect(() => {
    const savedLeads = localStorage.getItem('bamlead_crm_data');
    if (savedLeads) {
      try {
        const parsed = JSON.parse(savedLeads);
        setCrmLeads(parsed.map((l: any) => ({
          ...l,
          lastContact: l.lastContact ? new Date(l.lastContact) : undefined,
        })));
      } catch (e) {
        initializeFromProps();
      }
    } else {
      initializeFromProps();
    }
  }, []);

  const initializeFromProps = () => {
    const converted: Lead[] = initialLeads.map((lead, idx) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      address: lead.address,
      status: 'new' as const,
      starred: false,
      tags: [],
      score: Math.floor(Math.random() * 40) + 60,
      source: 'BamLead Search',
    }));
    setCrmLeads(converted);
    saveCrmData(converted);
  };

  const saveCrmData = (data: Lead[]) => {
    localStorage.setItem('bamlead_crm_data', JSON.stringify(data));
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add any new leads from props that aren't already in CRM
    const existingIds = new Set(crmLeads.map(l => l.id));
    const newLeads: Lead[] = initialLeads
      .filter(l => !existingIds.has(l.id))
      .map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        address: lead.address,
        status: 'new' as const,
        starred: false,
        tags: [],
        score: Math.floor(Math.random() * 40) + 60,
        source: 'BamLead Search',
      }));

    if (newLeads.length > 0) {
      const updated = [...crmLeads, ...newLeads];
      setCrmLeads(updated);
      saveCrmData(updated);
      toast.success(`Synced ${newLeads.length} new leads to BamLead CRM!`);
    } else {
      toast.info('All leads are already synced');
    }

    setLastSyncTime(new Date());
    setIsSyncing(false);
    onSync?.();
  };

  const toggleStar = (id: string) => {
    const updated = crmLeads.map(l => 
      l.id === id ? { ...l, starred: !l.starred } : l
    );
    setCrmLeads(updated);
    saveCrmData(updated);
  };

  const updateStatus = (id: string, status: Lead['status']) => {
    const updated = crmLeads.map(l => 
      l.id === id ? { ...l, status, lastContact: new Date() } : l
    );
    setCrmLeads(updated);
    saveCrmData(updated);
    toast.success(`Lead status updated to ${STATUS_LABELS[status]}`);
  };

  const deleteLead = (id: string) => {
    const updated = crmLeads.filter(l => l.id !== id);
    setCrmLeads(updated);
    saveCrmData(updated);
    toast.success('Lead removed from CRM');
  };

  const filteredLeads = crmLeads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterStatus || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    new: crmLeads.filter(l => l.status === 'new').length,
    contacted: crmLeads.filter(l => l.status === 'contacted').length,
    qualified: crmLeads.filter(l => l.status === 'qualified').length,
    converted: crmLeads.filter(l => l.status === 'converted').length,
    lost: crmLeads.filter(l => l.status === 'lost').length,
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">BamLead CRM</CardTitle>
              <CardDescription>
                {crmLeads.length} leads • {lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleTimeString()}` : 'Not synced yet'}
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Leads'}
          </Button>
        </div>

        {/* Status Pipeline */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={`p-3 rounded-xl text-center transition-all border ${
                filterStatus === status 
                  ? STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs opacity-80">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</div>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4">
            <AnimatePresence>
              {filteredLeads.map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border transition-all group"
                >
                  {/* Star */}
                  <button onClick={() => toggleStar(lead.id)} className="shrink-0">
                    {lead.starred ? (
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ) : (
                      <StarOff className="w-5 h-5 text-muted-foreground opacity-40 group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Lead Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{lead.name}</span>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-sm font-bold text-primary">{lead.score}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as Lead['status'])}
                      className="h-8 px-2 text-xs rounded-lg bg-muted border border-border"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => deleteLead(lead.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No leads found</p>
                <Button onClick={handleSync} variant="link" className="mt-2">
                  Sync leads from search
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              {crmLeads.length} total
            </span>
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {statusCounts.converted} converted
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4" />
              {crmLeads.filter(l => l.starred).length} starred
            </span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3 text-primary" />
            BamLead CRM
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
