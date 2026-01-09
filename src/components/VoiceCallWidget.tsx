import { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2,
  Loader2,
  Settings,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCallWidgetProps {
  leadName?: string;
  leadPhone?: string;
  onCallEnd?: (duration: number) => void;
  onOpenSettings?: () => void;
}

export default function VoiceCallWidget({ 
  leadName, 
  leadPhone, 
  onCallEnd,
  onOpenSettings 
}: VoiceCallWidgetProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Load agent ID from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('elevenlabs_agent_id');
    setAgentId(saved);
  }, []);

  // Track call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (conversation.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to AI agent');
      setIsConnecting(false);
      toast.success('Connected to AI agent');
    },
    onDisconnect: () => {
      console.log('Disconnected from AI agent');
      if (callDuration > 0) {
        onCallEnd?.(callDuration);
      }
      setCallDuration(0);
    },
    onMessage: (message) => {
      console.log('Message from agent:', message);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setIsConnecting(false);
      toast.error('Failed to connect to AI agent');
    },
  });

  const startCall = useCallback(async () => {
    if (!agentId) {
      toast.error('Please configure your ElevenLabs Agent ID in Settings first');
      onOpenSettings?.();
      return;
    }

    setIsConnecting(true);
    setCallDuration(0);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with the public agent
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'webrtc',
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Microphone access is required for voice calls');
      } else {
        toast.error('Failed to start call. Please check your Agent ID.');
      }
    }
  }, [conversation, agentId, onOpenSettings]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    toast.info(`Call ended - Duration: ${formatDuration(callDuration)}`);
  }, [conversation, callDuration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  // No agent configured state
  if (!agentId) {
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
                Connect your ElevenLabs AI agent to start making voice calls
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
              <p className="text-sm text-muted-foreground">{leadPhone}</p>
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

        {/* Tips */}
        {!isConnected && !isConnecting && (
          <div className="text-center text-xs text-muted-foreground mt-2">
            <p>Your AI agent will handle the conversation automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
