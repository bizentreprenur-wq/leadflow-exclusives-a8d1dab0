import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Trash2,
  Download,
  FileSpreadsheet,
  BarChart3,
  History,
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CallAnalyticsDashboard from './CallAnalyticsDashboard';

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

  const formatDateFull = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch all logs for export (not just current page)
  const fetchAllLogsForExport = async (): Promise<CallLog[]> => {
    const result = await listCallLogs({
      limit: 1000,
      offset: 0,
      outcome: outcomeFilter === 'all' ? undefined : outcomeFilter,
    });
    return result.success && result.logs ? result.logs : [];
  };

  const exportToCSV = async () => {
    toast.loading('Preparing CSV export...');
    
    try {
      const allLogs = await fetchAllLogsForExport();
      
      if (allLogs.length === 0) {
        toast.dismiss();
        toast.error('No call logs to export');
        return;
      }

      const exportData = allLogs.map(log => ({
        'Lead Name': log.lead_name || 'Unknown',
        'Phone': log.lead_phone || '',
        'Duration': formatDuration(log.duration_seconds),
        'Outcome': OUTCOME_LABELS[log.outcome],
        'Date': formatDateFull(log.created_at),
        'Notes': log.notes || '',
        'Transcript': log.transcript 
          ? log.transcript.map(m => `${m.role === 'agent' ? 'AI' : 'Lead'}: ${m.text}`).join(' | ')
          : '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        ).toString().length + 2
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Call Logs');
      
      const fileName = `call-logs-${new Date().toISOString().split('T')[0]}.csv`;
      XLSX.writeFile(wb, fileName, { bookType: 'csv' });
      
      toast.dismiss();
      toast.success(`Exported ${allLogs.length} call logs to CSV`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    }
  };

  const exportToPDF = async () => {
    toast.loading('Generating PDF report...');
    
    try {
      const allLogs = await fetchAllLogsForExport();
      
      if (allLogs.length === 0) {
        toast.dismiss();
        toast.error('No call logs to export');
        return;
      }

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Call Log Report', 14, 22);
      
      // Subtitle with date and filter
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const filterText = outcomeFilter === 'all' ? 'All Outcomes' : OUTCOME_LABELS[outcomeFilter];
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Filter: ${filterText} | Total: ${allLogs.length} calls`, 14, 30);
      
      // Stats summary if available
      if (stats) {
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`Summary: ${stats.total_calls} total calls | ${stats.interested_rate}% interested | Avg duration: ${formatDuration(stats.average_duration_seconds)}`, 14, 38);
      }

      // Table data
      const tableData = allLogs.map(log => [
        log.lead_name || 'Unknown',
        log.lead_phone || '-',
        formatDuration(log.duration_seconds),
        OUTCOME_LABELS[log.outcome],
        formatDateFull(log.created_at),
        (log.notes || '').substring(0, 50) + ((log.notes?.length || 0) > 50 ? '...' : ''),
      ]);

      autoTable(doc, {
        startY: stats ? 44 : 36,
        head: [['Lead Name', 'Phone', 'Duration', 'Outcome', 'Date', 'Notes']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [79, 70, 229], // Primary purple
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
          5: { cellWidth: 40 },
        },
      });

      const fileName = `call-logs-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.dismiss();
      toast.success(`PDF report generated with ${allLogs.length} call logs`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error('PDF export error:', error);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const [activeView, setActiveView] = useState<'history' | 'analytics'>('history');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'history' | 'analytics')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Call History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <CallAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-6">
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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Export as PDF Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Call Notes</DialogTitle>
            <DialogDescription>Add or edit notes for this call</DialogDescription>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
