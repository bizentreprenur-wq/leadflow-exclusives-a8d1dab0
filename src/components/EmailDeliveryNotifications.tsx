import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Eye, MousePointer, Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailWebhook } from '@/hooks/useEmailWebhook';
import { formatEventType, WebhookEvent } from '@/lib/api/emailWebhook';

interface EmailDeliveryNotificationsProps {
  enabled?: boolean;
  showPanel?: boolean;
  onTogglePanel?: () => void;
}

export default function EmailDeliveryNotifications({
  enabled = true,
  showPanel = false,
  onTogglePanel,
}: EmailDeliveryNotificationsProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(showPanel);
  
  const { 
    events, 
    isPolling, 
    lastPollTime, 
    stats, 
    refresh,
    clearEvents,
  } = useEmailWebhook({
    enabled,
    pollInterval: 5000,
    showNotifications: true,
  });

  const hasNewEvents = events.length > 0;
  const totalEvents = stats.delivered + stats.opened + stats.clicked + stats.bounced;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'delivered': return <Mail className="w-4 h-4 text-success" />;
      case 'opened': return <Eye className="w-4 h-4 text-primary" />;
      case 'clicked': return <MousePointer className="w-4 h-4 text-info" />;
      case 'bounced':
      case 'dropped': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsPanelOpen(!isPanelOpen);
            onTogglePanel?.();
          }}
          className={`gap-2 relative ${hasNewEvents ? 'border-success/50' : ''}`}
        >
          <Bell className={`w-4 h-4 ${isPolling ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">Notifications</span>
          {totalEvents > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-success text-success-foreground text-xs">
              {totalEvents > 99 ? '99+' : totalEvents}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-12 z-50 w-96 max-w-[90vw]"
          >
            <Card className="border-2 border-border shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Delivery Notifications
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refresh}
                      disabled={isPolling}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPanelOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="text-center p-2 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-lg font-bold text-success">{stats.delivered}</p>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-lg font-bold text-primary">{stats.opened}</p>
                    <p className="text-xs text-muted-foreground">Opened</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-info/10 border border-info/20">
                    <p className="text-lg font-bold text-info">{stats.clicked}</p>
                    <p className="text-xs text-muted-foreground">Clicked</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-lg font-bold text-destructive">{stats.bounced}</p>
                    <p className="text-xs text-muted-foreground">Bounced</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No recent events</p>
                    <p className="text-sm">Delivery notifications will appear here</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-64">
                      <div className="space-y-2 pr-4">
                        {events.slice(0, 20).map((event, idx) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              event.event_type === 'bounced' || event.event_type === 'dropped'
                                ? 'bg-destructive/5 border-destructive/20'
                                : event.event_type === 'opened' || event.event_type === 'clicked'
                                  ? 'bg-success/5 border-success/20'
                                  : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="mt-0.5">
                              {getEventIcon(event.event_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {event.business_name || event.recipient_email}
                                </span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {formatEventType(event.event_type).label}
                                </Badge>
                              </div>
                              {event.subject && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {event.subject}
                                </p>
                              )}
                              {event.bounce_reason && (
                                <p className="text-xs text-destructive truncate mt-0.5">
                                  {event.bounce_reason}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(event.timestamp)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {lastPollTime && `Updated ${formatTime(lastPollTime.toISOString())}`}
                      </p>
                      <Button variant="ghost" size="sm" onClick={clearEvents} className="text-xs">
                        Clear All
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
