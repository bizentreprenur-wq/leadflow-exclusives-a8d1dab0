import { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  User,
  Building2,
  MapPin,
  Globe,
  Flame,
  Thermometer,
  Snowflake,
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

interface LeadCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onCallComplete?: (leadId: string, outcome: CallOutcome, duration: number) => void;
  onOpenSettings?: () => void;
}

export default function LeadCallModal({
  open,
  onOpenChange,
  lead,
  onCallComplete,
  onOpenSettings,
}: LeadCallModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [showOutcomeSelector, setShowOutcomeSelector] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('completed');
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const callStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('elevenlabs_agent_id');
    setAgentId(saved);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (conversation.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowOutcomeSelector(false);
      setCallDuration(0);
      transcriptRef.current = [];
    }
  }, [open]);

  const handleSaveLog = useCallback(async (outcome: CallOutcome) => {
    if (!agentId || !lead || callDuration === 0) return;
    
    const result = await saveCallLog({
      agent_id: agentId,
      duration_seconds: callDuration,
      outcome,
      transcript: transcriptRef.current.length > 0 ? transcriptRef.current : undefined,
      lead_name: lead.name,
      lead_phone: lead.phone,
    });
    
    if (result.success) {
      toast.success('Call logged successfully');
      onCallComplete?.(lead.id, outcome, callDuration);
    } else {
      toast.error('Failed to save call log');
    }
    
    transcriptRef.current = [];
    setShowOutcomeSelector(false);
    setSelectedOutcome('completed');
    setCallDuration(0);
    onOpenChange(false);
  }, [agentId, callDuration, lead, onCallComplete, onOpenChange]);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnecting(false);
      callStartTimeRef.current = Date.now();
      transcriptRef.current = [];
      toast.success(`Connected - calling ${lead?.name}`);
    },
    onDisconnect: () => {
      if (callDuration > 0) {
        setShowOutcomeSelector(true);
      }
    },
    onMessage: (message: any) => {
      if (message.type === 'user_transcript' && message.user_transcription_event?.user_transcript) {
        transcriptRef.current.push({
          role: 'user',
          text: message.user_transcription_event.user_transcript,
          timestamp: Date.now() - callStartTimeRef.current,
        });
      } else if (message.type === 'agent_response' && message.agent_response_event?.agent_response) {
        transcriptRef.current.push({
          role: 'agent',
          text: message.agent_response_event.agent_response,
          timestamp: Date.now() - callStartTimeRef.current,
        });
      }
    },
    onError: (error) => {
      console.error('Call error:', error);
      setIsConnecting(false);
      toast.error('Failed to connect call');
    },
  });

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
        connectionType: 'webrtc',
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

  const getClassificationIcon = () => {
    switch (lead?.aiClassification) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            AI Voice Call
          </DialogTitle>
        </DialogHeader>

        {/* Lead Info Card */}
        <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{lead.name}</p>
                {lead.phone && (
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getClassificationIcon()}
              {lead.leadScore && (
                <Badge variant="outline">{lead.leadScore}/100</Badge>
              )}
            </div>
          </div>
          
          {lead.bestTimeToCall && (
            <p className="text-xs text-muted-foreground">
              🕐 Best time: {lead.bestTimeToCall}
            </p>
          )}
          
          {lead.painPoints && lead.painPoints.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Key talking points: </span>
              <span className="text-foreground">{lead.painPoints.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>

        {/* No Agent Configured */}
        {!agentId && (
          <div className="text-center py-6">
            <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Voice Agent Not Configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Set up your ElevenLabs agent to start calling
            </p>
            <Button onClick={onOpenSettings} className="gap-2">
              <Settings className="w-4 h-4" />
              Configure Voice Agent
            </Button>
          </div>
        )}

        {/* Call Interface */}
        {agentId && !showOutcomeSelector && (
          <>
            <div className="flex justify-center py-6">
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
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      isSpeaking 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {isSpeaking ? (
                        <Volume2 className="w-8 h-8 text-white" />
                      ) : (
                        <Mic className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-muted flex items-center justify-center"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    ) : (
                      <Phone className="w-8 h-8 text-muted-foreground" />
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

            <div className="flex justify-center">
              {!isConnected ? (
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
          </>
        )}

        {/* Outcome Selector */}
        {showOutcomeSelector && (
          <div className="space-y-4">
            <p className="font-medium text-center">How did the call go?</p>
            <Select value={selectedOutcome} onValueChange={(v) => setSelectedOutcome(v as CallOutcome)}>
              <SelectTrigger>
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
              <Button onClick={() => handleSaveLog(selectedOutcome)} className="flex-1">
                Save & Close
              </Button>
              <Button variant="ghost" onClick={() => {
                setShowOutcomeSelector(false);
                setCallDuration(0);
                onOpenChange(false);
              }}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
