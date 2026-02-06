/**
 * Voice Call Widget
 * AI-powered voice calling interface using calling.io infrastructure
 * 
 * NOTE: ElevenLabs removed - using calling.io as hidden backend infrastructure
 * Customers only see BamLead branding
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveCallLog, type CallOutcome, type TranscriptMessage } from '@/lib/api/callLogs';
import { useAICalling } from '@/hooks/useAICalling';

interface VoiceCallWidgetProps {
  leadId?: number;
  leadName?: string;
  leadPhone?: string;
  onCallEnd?: (duration: number) => void;
  onOpenSettings?: () => void;
}

export default function VoiceCallWidget({ 
  leadId,
  leadName, 
  leadPhone, 
  onCallEnd,
  onOpenSettings 
}: VoiceCallWidgetProps) {
  const { status, phoneSetup, isReady } = useAICalling();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showOutcomeSelector, setShowOutcomeSelector] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('completed');
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track call duration
  useEffect(() => {
    if (isConnected) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  const handleSaveLog = useCallback(async (outcome: CallOutcome) => {
    if (callDuration === 0) return;
    
    const result = await saveCallLog({
      agent_id: 'bamlead-ai-caller',
      duration_seconds: callDuration,
      outcome,
      transcript: transcriptRef.current.length > 0 ? transcriptRef.current : undefined,
      lead_id: leadId,
      lead_name: leadName,
      lead_phone: leadPhone,
    });
    
    if (result.success) {
      toast.success('Call logged successfully');
    } else {
      toast.error('Failed to save call log');
    }
    
    // Reset
    transcriptRef.current = [];
    setShowOutcomeSelector(false);
    setSelectedOutcome('completed');
  }, [callDuration, leadId, leadName, leadPhone]);

  const startCall = useCallback(async () => {
    if (!isReady) {
      toast.error('Please configure your phone number first');
      onOpenSettings?.();
      return;
    }

    if (!leadPhone) {
      toast.error('No phone number available for this lead');
      return;
    }

    setIsConnecting(true);
    setCallDuration(0);
    callStartTimeRef.current = Date.now();
    transcriptRef.current = [];

    try {
      // Simulate connection (in production, this would call the calling.io API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setIsConnecting(false);
      toast.success('Connected - AI is calling the lead');

      // Simulate speaking patterns
      const speakingInterval = setInterval(() => {
        setIsSpeaking(prev => !prev);
      }, 3000);

      // Simulate call ending after random duration (for demo)
      const callLength = Math.random() * 30000 + 15000; // 15-45 seconds
      setTimeout(() => {
        clearInterval(speakingInterval);
        setIsConnected(false);
        setIsSpeaking(false);
        setShowOutcomeSelector(true);
        onCallEnd?.(callDuration);
      }, callLength);

    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      toast.error('Failed to start call');
    }
  }, [isReady, leadPhone, onOpenSettings, onCallEnd, callDuration]);

  const endCall = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsConnected(false);
    setIsSpeaking(false);
    toast.info(`Call ended - Duration: ${formatDuration(callDuration)}`);
    setShowOutcomeSelector(true);
    onCallEnd?.(callDuration);
  }, [callDuration, onCallEnd]);

  const handleOutcomeConfirm = useCallback(() => {
    handleSaveLog(selectedOutcome);
    setCallDuration(0);
  }, [handleSaveLog, selectedOutcome]);

  const handleSkipLogging = useCallback(() => {
    setShowOutcomeSelector(false);
    setCallDuration(0);
    transcriptRef.current = [];
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // No phone configured state
  if (!isReady) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Phone className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Voice Calling Not Configured</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {status === 'phone_needed' 
                  ? 'Add a phone number to start making AI calls'
                  : 'Upgrade your plan to enable AI calling'
                }
              </p>
            </div>
            <Button onClick={onOpenSettings} className="gap-2">
              <Settings className="w-4 h-4" />
              Configure Voice Agent
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-300 ${isConnected ? 'ring-2 ring-emerald-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="w-5 h-5" />
            AI Voice Call
          </CardTitle>
          <Badge 
            variant={isConnected ? 'default' : 'secondary'}
            className={isConnected ? 'bg-emerald-500 animate-pulse' : ''}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Live' : 'Ready'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lead Info */}
        {leadName && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Calling</p>
            <p className="font-medium">{leadName}</p>
            {leadPhone && (
              <p className="text-sm text-muted-foreground font-mono">{leadPhone}</p>
            )}
          </div>
        )}

        {/* Call Status Visualization */}
        <div className="flex justify-center py-4">
          <AnimatePresence mode="wait">
            {isConnected ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative"
              >
                {/* Speaking indicator rings */}
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
                
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isSpeaking 
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                }`}>
                  {isSpeaking ? (
                    <Volume2 className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-24 h-24 rounded-full bg-muted flex items-center justify-center"
              >
                {isConnecting ? (
                  <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                ) : (
                  <Phone className="w-10 h-10 text-muted-foreground" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Call Duration */}
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
            <Button
              size="lg"
              onClick={startCall}
              disabled={isConnecting || !leadPhone}
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

        {/* Tips */}
        {!isConnected && !isConnecting && !showOutcomeSelector && (
          <div className="text-center text-xs text-muted-foreground mt-2">
            <p>Your AI agent will handle the conversation automatically</p>
            {phoneSetup.phoneNumber && (
              <p className="font-mono mt-1">Calling from: {phoneSetup.phoneNumber}</p>
            )}
          </div>
        )}

        {/* Outcome Selector - shown after call ends */}
        {showOutcomeSelector && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border space-y-3">
            <p className="text-sm font-medium">How did the call go?</p>
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
              <Button onClick={handleOutcomeConfirm} className="flex-1">
                Save Call Log
              </Button>
              <Button variant="ghost" onClick={handleSkipLogging}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
