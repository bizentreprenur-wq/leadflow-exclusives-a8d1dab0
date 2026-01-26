import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  CalendarClock, Edit3, Trash2, Send, RefreshCw, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { getScheduledEmails, cancelScheduledEmail as apiCancelScheduled, ScheduledEmail as ServerScheduledEmail } from '@/lib/api/email';
import { sendEmail } from '@/lib/api/email';

interface LocalScheduledEmail {
  id: string;
  type: 'manual_compose';
  to: string;
  subject: string;
  body: string;
  scheduledFor: string;
  createdAt: string;
}

type ScheduledItem = (LocalScheduledEmail | (ServerScheduledEmail & { source: 'server' })) & { source?: 'local' | 'server' };

export default function ScheduledQueuePanel() {
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null);
  const [editForm, setEditForm] = useState({ to: '', subject: '', body: '' });

  const loadScheduled = useCallback(async () => {
    setIsLoading(true);

    // 1) Load local (manually queued from Compose)
    let localItems: ScheduledItem[] = [];
    try {
      const raw = localStorage.getItem('bamlead_scheduled_manual_emails');
      const parsed = raw ? JSON.parse(raw) : [];
      localItems = (Array.isArray(parsed) ? parsed : []).map((item: LocalScheduledEmail) => ({
        ...item,
        source: 'local' as const,
      }));
    } catch { /* ignore */ }

    // 2) Load server scheduled emails
    let serverItems: ScheduledItem[] = [];
    try {
      const res = await getScheduledEmails();
      if (res.success && res.emails) {
        serverItems = res.emails.map(e => ({
          ...e,
          source: 'server' as const,
          to: e.recipient_email,
          body: '',
          createdAt: e.created_at,
        }));
      }
    } catch { /* ignore */ }

    // Merge and sort by scheduledFor ascending
    const merged = [...localItems, ...serverItems].sort((a, b) => {
      const dateA = new Date('scheduledFor' in a ? a.scheduledFor : (a as any).scheduled_for);
      const dateB = new Date('scheduledFor' in b ? b.scheduledFor : (b as any).scheduled_for);
      return dateA.getTime() - dateB.getTime();
    });

    setScheduled(merged);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadScheduled();
  }, [loadScheduled]);

  const handleCancel = async (item: ScheduledItem) => {
    if (item.source === 'local') {
      try {
        const raw = localStorage.getItem('bamlead_scheduled_manual_emails');
        const list: LocalScheduledEmail[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter(e => e.id !== item.id);
        localStorage.setItem('bamlead_scheduled_manual_emails', JSON.stringify(filtered));
        toast.success('Scheduled email cancelled');
        loadScheduled();
      } catch {
        toast.error('Failed to cancel');
      }
    } else {
      // Server cancel
      try {
        const res = await apiCancelScheduled(Number(item.id));
        if (res.success) {
          toast.success('Scheduled email cancelled');
          loadScheduled();
        } else {
          toast.error(res.error || 'Failed to cancel');
        }
      } catch {
        toast.error('Failed to cancel scheduled email');
      }
    }
  };

  const handleEdit = (item: ScheduledItem) => {
    setEditingItem(item);
    setEditForm({
      to: 'to' in item ? item.to : (item as any).recipient_email || '',
      subject: item.subject,
      body: 'body' in item ? item.body : '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    if (editingItem.source === 'local') {
      try {
        const raw = localStorage.getItem('bamlead_scheduled_manual_emails');
        const list: LocalScheduledEmail[] = raw ? JSON.parse(raw) : [];
        const updated = list.map(e =>
          e.id === editingItem.id
            ? { ...e, to: editForm.to, subject: editForm.subject, body: editForm.body }
            : e
        );
        localStorage.setItem('bamlead_scheduled_manual_emails', JSON.stringify(updated));
        toast.success('Scheduled email updated');
        setEditingItem(null);
        loadScheduled();
      } catch {
        toast.error('Failed to save');
      }
    } else {
      toast.info('Server-side scheduled emails cannot be edited after creation.');
      setEditingItem(null);
    }
  };

  const handleSendNow = async (item: ScheduledItem) => {
    const to = 'to' in item ? item.to : (item as any).recipient_email;
    const body = 'body' in item ? item.body : '';

    toast.loading('Sending email now...');

    try {
      const res = await sendEmail({
        to,
        subject: item.subject,
        body_html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
      });

      if (res.success) {
        toast.dismiss();
        toast.success('Email sent successfully!');
        // Remove from queue
        await handleCancel(item);
      } else {
        toast.dismiss();
        toast.error(res.error || 'Failed to send');
      }
    } catch {
      toast.dismiss();
      toast.error('Failed to send email');
    }
  };

  const getScheduledDate = (item: ScheduledItem) => {
    const dateStr = 'scheduledFor' in item ? item.scheduledFor : (item as any).scheduled_for;
    return new Date(dateStr);
  };

  const isPast = (item: ScheduledItem) => getScheduledDate(item) < new Date();

  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Scheduled Queue</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {scheduled.length} {scheduled.length === 1 ? 'email' : 'emails'}
          </Badge>
          <Button size="sm" variant="ghost" onClick={loadScheduled} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {scheduled.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No scheduled emails</p>
          <p className="text-xs mt-1">Use the Compose modal to schedule sends</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {scheduled.map(item => {
              const schedDate = getScheduledDate(item);
              const past = isPast(item);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    past
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-muted/30 border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.subject || '(No subject)'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        To: {'to' in item ? item.to : (item as any).recipient_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {format(schedDate, 'MMM d, yyyy h:mm a')}
                        </span>
                        {past && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                            Overdue
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5",
                            item.source === 'local'
                              ? "border-purple-500/30 text-purple-400"
                              : "border-emerald-500/30 text-emerald-400"
                          )}
                        >
                          {item.source === 'local' ? 'Local' : 'Server'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.source === 'local' && (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-7 w-7 p-0">
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendNow(item)}
                        className="h-7 w-7 p-0 hover:text-emerald-400"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(item)}
                        className="h-7 w-7 p-0 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Email</DialogTitle>
            <DialogDescription>Update the details before it sends</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">To</label>
              <Input
                value={editForm.to}
                onChange={e => setEditForm(prev => ({ ...prev, to: e.target.value }))}
                className="bg-muted/30 border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Subject</label>
              <Input
                value={editForm.subject}
                onChange={e => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                className="bg-muted/30 border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Body</label>
              <Textarea
                value={editForm.body}
                onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                rows={4}
                className="bg-muted/30 border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
