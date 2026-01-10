import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Phone, 
  Clock, 
  User, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Trash2
} from 'lucide-react';
import { 
  listCallLogs, 
  updateCallLog, 
  deleteCallLog,
  getCallStats,
  type CallLog, 
  type CallOutcome,
  type CallStats 
} from '@/lib/api/callLogs';

const OUTCOME_LABELS: Record<CallOutcome, string> = {
  completed: 'Completed',
  no_answer: 'No Answer',
  callback_requested: 'Callback Requested',
  interested: 'Interested',
  not_interested: 'Not Interested',
  wrong_number: 'Wrong Number',
  other: 'Other',
};

const OUTCOME_COLORS: Record<CallOutcome, string> = {
  completed: 'bg-blue-500',
  no_answer: 'bg-gray-500',
  callback_requested: 'bg-yellow-500',
  interested: 'bg-emerald-500',
  not_interested: 'bg-red-500',
  wrong_number: 'bg-orange-500',
  other: 'bg-purple-500',
};

export default function CallLogHistory() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [outcomeFilter, setOutcomeFilter] = useState<CallOutcome | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  
  const pageSize = 10;

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [page, outcomeFilter]);

  const loadLogs = async () => {
    setLoading(true);
    const result = await listCallLogs({
      limit: pageSize,
      offset: page * pageSize,
      outcome: outcomeFilter === 'all' ? undefined : outcomeFilter,
    });
    
    if (result.success && result.logs) {
      setLogs(result.logs);
      setTotal(result.total || 0);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await getCallStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  const handleUpdateOutcome = async (id: number, outcome: CallOutcome) => {
    const result = await updateCallLog(id, { outcome });
    if (result.success) {
      toast.success('Outcome updated');
      loadLogs();
      loadStats();
    } else {
      toast.error('Failed to update outcome');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLog) return;
    
    const result = await updateCallLog(selectedLog.id, { notes: editingNotes });
    if (result.success) {
      toast.success('Notes saved');
      setSelectedLog(null);
      loadLogs();
    } else {
      toast.error('Failed to save notes');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this call log?')) return;
    
    const result = await deleteCallLog(id);
    if (result.success) {
      toast.success('Call log deleted');
      loadLogs();
      loadStats();
    } else {
      toast.error('Failed to delete');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_calls}</p>
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.interested_rate}%</p>
                  <p className="text-xs text-muted-foreground">Interested Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(stats.average_duration_seconds)}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.calls_this_week}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Call History
            </CardTitle>
            <Select 
              value={outcomeFilter} 
              onValueChange={(v) => {
                setOutcomeFilter(v as CallOutcome | 'all');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No call logs yet</p>
              <p className="text-sm">Start making calls to see your history here</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {log.lead_name || 'Unknown Lead'}
                          </span>
                          {log.lead_phone && (
                            <span className="text-sm text-muted-foreground">
                              {log.lead_phone}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(log.duration_seconds)}
                          </span>
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                        
                        {log.notes && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {log.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={log.outcome}
                          onValueChange={(v) => handleUpdateOutcome(log.id, v as CallOutcome)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <Badge className={`${OUTCOME_COLORS[log.outcome]} text-white`}>
                              {OUTCOME_LABELS[log.outcome]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLog(log);
                            setEditingNotes(log.notes || '');
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Transcript Preview */}
                    {log.transcript && log.transcript.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Transcript Preview:</p>
                        <div className="space-y-1">
                          {log.transcript.slice(0, 3).map((msg, i) => (
                            <p key={i} className="text-sm">
                              <span className={`font-medium ${msg.role === 'agent' ? 'text-primary' : 'text-muted-foreground'}`}>
                                {msg.role === 'agent' ? 'AI: ' : 'Lead: '}
                              </span>
                              <span className="text-muted-foreground">{msg.text}</span>
                            </p>
                          ))}
                          {log.transcript.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{log.transcript.length - 3} more messages
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLog && (
              <div className="text-sm text-muted-foreground">
                <p><strong>Lead:</strong> {selectedLog.lead_name || 'Unknown'}</p>
                <p><strong>Duration:</strong> {formatDuration(selectedLog.duration_seconds)}</p>
                <p><strong>Date:</strong> {formatDate(selectedLog.created_at)}</p>
              </div>
            )}
            <Textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="Add notes about this call..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
