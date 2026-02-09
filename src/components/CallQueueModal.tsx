import { useState, useCallback, useEffect, useRef } from 'react';
import { useCallingConversation } from '@/hooks/useCallingConversation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Phone, 
  PhoneOff, 
  Mic, 
  Volume2,
  Loader2,
  Settings,
  Building2,
  Flame,
  Thermometer,
  Snowflake,
  SkipForward,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  ListOrdered,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveCallLog, type CallOutcome, type TranscriptMessage } from '@/lib/api/callLogs';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  bestTimeToCall?: string;
  painPoints?: string[];
}

interface CallQueueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onCallComplete?: (leadId: string, outcome: CallOutcome, duration: number) => void;
  onOpenSettings?: () => void;
  onQueueComplete?: () => void;
}

type LeadCallStatus = 'pending' | 'calling' | 'completed' | 'skipped';

interface QueuedLead extends Lead {
  status: LeadCallStatus;
  outcome?: CallOutcome;
  duration?: number;
}

export default function CallQueueModal({
  open,
  onOpenChange,
  leads,
  onCallComplete,
  onOpenSettings,
  onQueueComplete,
}: CallQueueModalProps) {
  const [queue, setQueue] = useState<QueuedLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [showOutcomeSelector, setShowOutcomeSelector] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('completed');
  const [isPaused, setIsPaused] = useState(false);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const callStartTimeRef = useRef<number>(0);

  // Initialize queue when modal opens
  useEffect(() => {
    if (open && leads.length > 0) {
      setQueue(leads.map(lead => ({ ...lead, status: 'pending' })));
      setCurrentIndex(0);
      setIsPaused(false);
      setShowOutcomeSelector(false);
    }
  }, [open, leads]);

  useEffect(() => {
    const saved = localStorage.getItem('bamlead_voice_agent_id');
    setAgentId(saved);
  }, []);


  const currentLead = queue[currentIndex];
  const completedCount = queue.filter(l => l.status === 'completed' || l.status === 'skipped').length;
  const progress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

  const conversation = useCallingConversation({
    onConnect: () => {
      setIsConnecting(false);
      callStartTimeRef.current = Date.now();
      transcriptRef.current = [];
      setQueue(prev => prev.map((l, i) => 
        i === currentIndex ? { ...l, status: 'calling' } : l
      ));
      toast.success(`Connected - calling ${currentLead?.name}`);
    },
    onDisconnect: () => {
      if (callDuration > 0) {
        setShowOutcomeSelector(true);
      }
    },
    onTranscript: (entry) => {
      transcriptRef.current.push({
        role: entry.role,
        text: entry.text,
        timestamp: entry.timestamp,
      });
    },
    onError: (error) => {
      console.error('Call error:', error);
      setIsConnecting(false);
      toast.error('Failed to connect call');
    },
  });

  useEffect(() => {
    if (conversation.status !== 'connected') return;

    const interval = window.setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [conversation.status]);

  const handleSaveAndNext = useCallback(async (outcome: CallOutcome) => {
    if (!agentId || !currentLead) return;
    
    // Save call log
    if (callDuration > 0) {
      await saveCallLog({
        agent_id: agentId,
        duration_seconds: callDuration,
        outcome,
        transcript: transcriptRef.current.length > 0 ? transcriptRef.current : undefined,
        lead_name: currentLead.name,
        lead_phone: currentLead.phone,
      });
      onCallComplete?.(currentLead.id, outcome, callDuration);
    }
    
    // Update queue status
    setQueue(prev => prev.map((l, i) => 
      i === currentIndex ? { ...l, status: 'completed', outcome, duration: callDuration } : l
    ));
    
    // Reset and move to next
    transcriptRef.current = [];
    setShowOutcomeSelector(false);
    setSelectedOutcome('completed');
    setCallDuration(0);
    
    // Move to next lead
    moveToNext();
  }, [agentId, callDuration, currentLead, currentIndex, onCallComplete]);

  const moveToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      toast.success('🎉 Call queue completed!');
      onQueueComplete?.();
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, queue.length, onQueueComplete]);

  const skipCurrentLead = useCallback(() => {
    setQueue(prev => prev.map((l, i) => 
      i === currentIndex ? { ...l, status: 'skipped' } : l
    ));
    moveToNext();
    toast.info(`Skipped ${currentLead?.name}`);
  }, [currentIndex, currentLead, moveToNext]);

  const startCall = useCallback(async () => {
    if (!agentId) {
      toast.error('Please configure your Voice Agent in Settings first');
      onOpenSettings?.();
      return;
    }

    setIsConnecting(true);
    setCallDuration(0);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: agentId,
        lead: currentLead ? {
          id: parseInt(currentLead.id, 10) || undefined,
          name: currentLead.name,
          phone: currentLead.phone
        } : undefined
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Microphone access required');
      } else {
        toast.error('Failed to start call');
      }
    }
  }, [conversation, agentId, onOpenSettings]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    toast.info(`Call ended - ${formatDuration(callDuration)}`);
  }, [conversation, callDuration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  const getClassificationIcon = (classification?: string) => {
    switch (classification) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: LeadCallStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'skipped': return <XCircle className="w-4 h-4 text-muted-foreground" />;
      case 'calling': return <Phone className="w-4 h-4 text-primary animate-pulse" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  if (queue.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5" />
            Call Queue
            <Badge variant="outline" className="ml-2">
              {completedCount} / {queue.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {completedCount} completed • {queue.filter(l => l.status === 'skipped').length} skipped • {queue.length - completedCount} remaining
          </p>
        </div>

        {/* No Agent Warning */}
        {!agentId && (
          <div className="text-center py-6 bg-muted/50 rounded-lg">
            <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Voice Agent Not Configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Set up your AI Voice Agent to start calling
            </p>
            <Button onClick={onOpenSettings} className="gap-2">
              <Settings className="w-4 h-4" />
              Configure Voice Agent
            </Button>
          </div>
        )}

        {/* Current Call Section */}
        {agentId && currentLead && currentIndex < queue.length && !showOutcomeSelector && (
          <div className="flex-1 space-y-4">
            {/* Current Lead Card */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{currentLead.name}</p>
                    {currentLead.phone && (
                      <p className="text-muted-foreground">{currentLead.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getClassificationIcon(currentLead.aiClassification)}
                  {currentLead.leadScore && (
                    <Badge variant="outline">{currentLead.leadScore}/100</Badge>
                  )}
                </div>
              </div>
              
              {currentLead.bestTimeToCall && (
                <p className="text-xs text-muted-foreground mb-2">
                  🕐 Best time: {currentLead.bestTimeToCall}
                </p>
              )}
              
              {currentLead.painPoints && currentLead.painPoints.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Key talking points: </span>
                  <span className="text-foreground">{currentLead.painPoints.slice(0, 2).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Call Animation */}
            <div className="flex justify-center py-4">
              <AnimatePresence mode="wait">
                {isConnected ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                  >
                    {isSpeaking && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-emerald-500/20"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-emerald-500/30"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        />
                      </>
                    )}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isSpeaking 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {isSpeaking ? (
                        <Volume2 className="w-7 h-7 text-white" />
                      ) : (
                        <Mic className="w-7 h-7 text-white" />
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
                    ) : (
                      <Phone className="w-7 h-7 text-muted-foreground" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isConnected && (
              <div className="text-center">
                <p className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</p>
                <p className="text-sm text-muted-foreground">
                  {isSpeaking ? 'AI is speaking...' : 'Listening...'}
                </p>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex justify-center gap-3">
              {!isConnected ? (
                <>
                  <Button
                    size="lg"
                    onClick={startCall}
                    disabled={isConnecting}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="w-5 h-5" />
                        Start Call
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={skipCurrentLead}
                    className="gap-2"
                  >
                    <SkipForward className="w-5 h-5" />
                    Skip
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={endCall}
                  className="gap-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Outcome Selector */}
        {showOutcomeSelector && currentLead && (
          <div className="space-y-4 py-4">
            <p className="font-medium text-center">How did the call with {currentLead.name} go?</p>
            <Select value={selectedOutcome} onValueChange={(v) => setSelectedOutcome(v as CallOutcome)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interested">✅ Interested</SelectItem>
                <SelectItem value="callback_requested">📞 Callback Requested</SelectItem>
                <SelectItem value="not_interested">❌ Not Interested</SelectItem>
                <SelectItem value="no_answer">📵 No Answer</SelectItem>
                <SelectItem value="wrong_number">🚫 Wrong Number</SelectItem>
                <SelectItem value="completed">✓ Completed</SelectItem>
                <SelectItem value="other">📝 Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={() => handleSaveAndNext(selectedOutcome)} className="flex-1 gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Save & Next
              </Button>
              <Button variant="ghost" onClick={() => {
                setShowOutcomeSelector(false);
                setCallDuration(0);
                skipCurrentLead();
              }}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Queue Complete State */}
        {currentIndex >= queue.length && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Queue Completed!</h3>
            <p className="text-muted-foreground mb-4">
              {queue.filter(l => l.status === 'completed').length} calls completed, 
              {queue.filter(l => l.status === 'skipped').length} skipped
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}

        {/* Queue List */}
        {currentIndex < queue.length && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              Queue ({queue.length - completedCount} remaining)
            </p>
            <ScrollArea className="h-[150px]">
              <div className="space-y-1">
                {queue.map((lead, index) => (
                  <div
                    key={lead.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      index === currentIndex 
                        ? 'bg-primary/10 border border-primary/30' 
                        : lead.status === 'completed' 
                        ? 'bg-emerald-500/5 text-muted-foreground' 
                        : lead.status === 'skipped'
                        ? 'bg-muted/50 text-muted-foreground line-through'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(lead.status)}
                      <span className={index === currentIndex ? 'font-medium' : ''}>
                        {lead.name}
                      </span>
                      {index === currentIndex && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.duration && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(lead.duration)}
                        </span>
                      )}
                      {getClassificationIcon(lead.aiClassification)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
