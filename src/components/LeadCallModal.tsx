import { useState, useCallback, useEffect, useRef } from 'react';
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
  Building2,
  Flame,
  Thermometer,
  Snowflake,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveCallLog, type CallOutcome, type TranscriptMessage } from '@/lib/api/callLogs';
import { useAICalling } from '@/hooks/useAICalling';

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
  const { capabilities, phoneSetup, isReady } = useAICalling();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showOutcomeSelector, setShowOutcomeSelector] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('completed');
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const callStartTimeRef = useRef<number>(0);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for call duration
  useEffect(() => {
    if (isConnected) {
      callIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    };
  }, [isConnected]);

  // Simulate speaking patterns during call
  useEffect(() => {
    if (!isConnected) return;
    
    const speakingInterval = setInterval(() => {
      setIsSpeaking(prev => !prev);
    }, 2000 + Math.random() * 3000);
    
    return () => clearInterval(speakingInterval);
  }, [isConnected]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowOutcomeSelector(false);
      setCallDuration(0);
      setIsConnected(false);
      setIsConnecting(false);
      setIsSpeaking(false);
      transcriptRef.current = [];
    }
  }, [open]);

  const handleSaveLog = useCallback(async (outcome: CallOutcome) => {
    if (!lead || callDuration === 0) return;
    
    const result = await saveCallLog({
      agent_id: 'callingio-agent',
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
  }, [callDuration, lead, onCallComplete, onOpenChange]);

  const startCall = useCallback(async () => {
    if (!capabilities.canMakeCalls) {
      toast.error('AI Calling is not available on your plan');
      return;
    }

    if (!phoneSetup.hasPhone) {
      toast.error('Please set up a phone number first');
      onOpenSettings?.();
      return;
    }

    setIsConnecting(true);
    setCallDuration(0);
    callStartTimeRef.current = Date.now();
    transcriptRef.current = [];

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Simulate connection delay (calling.io backend would handle this)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsConnecting(false);
      setIsConnected(true);
      toast.success(`Connected - calling ${lead?.name}`);
      
      // Simulate initial transcript
      transcriptRef.current.push({
        role: 'agent',
        text: `Hello, is this ${lead?.name}? I'm calling from BamLead regarding your business listing.`,
        timestamp: 0,
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
  }, [capabilities.canMakeCalls, phoneSetup.hasPhone, lead, onOpenSettings]);

  const endCall = useCallback(async () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }
    setIsConnected(false);
    setIsSpeaking(false);
    toast.info(`Call ended - ${formatDuration(callDuration)}`);
    
    if (callDuration > 0) {
      setShowOutcomeSelector(true);
    }
  }, [callDuration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getClassificationIcon = () => {
    switch (lead?.aiClassification) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  if (!lead) return null;

  const canCall = capabilities.canMakeCalls && phoneSetup.hasPhone;

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

        {/* No Phone/Not Ready */}
        {!canCall && (
          <div className="text-center py-6">
            <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">
              {!capabilities.canMakeCalls 
                ? 'AI Calling Not Available' 
                : 'Phone Number Required'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {!capabilities.canMakeCalls 
                ? 'Upgrade to Pro to enable AI calling' 
                : 'Set up a phone number to start calling'}
            </p>
            <Button onClick={onOpenSettings} className="gap-2">
              <Settings className="w-4 h-4" />
              {!capabilities.canMakeCalls ? 'View Plans' : 'Setup Phone'}
            </Button>
          </div>
        )}

        {/* Call Interface */}
        {canCall && !showOutcomeSelector && (
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
