import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  startCallingSession, 
  endCallingSession, 
  initiateCall as apiInitiateCall,
  hangupCall as apiHangupCall,
  type CallSession,
  type CallingMessage,
  type TranscriptEntry
} from "@/lib/api/calling";

export type CallingConversationStatus = "disconnected" | "connecting" | "connected";

export type CallingConnectionType = "webrtc" | "websocket";

export interface StartCallingSessionOptions {
  agentId?: string;
  script?: string;
  lead?: {
    id?: number;
    name?: string;
    company?: string;
    phone?: string;
  };
}

export interface UseCallingConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: CallingMessage) => void;
  onTranscript?: (entry: TranscriptEntry) => void;
  onError?: (error: unknown) => void;
}

/**
 * Calling.io conversation hook for AI voice calls.
 * 
 * This manages the WebSocket connection to the calling.io backend
 * for real-time AI voice conversations with leads.
 */
export function useCallingConversation(options: UseCallingConversationOptions = {}) {
  const { onConnect, onDisconnect, onMessage, onTranscript, onError } = options;

  const [status, setStatus] = useState<CallingConversationStatus>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const speakingIntervalRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const stopSpeakingSimulation = useCallback(() => {
    if (speakingIntervalRef.current != null) {
      window.clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: CallingMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'auth_success':
          setStatus("connected");
          onConnect?.();
          break;
          
        case 'auth_error':
          setStatus("disconnected");
          onError?.(new Error(message.data?.message || 'Authentication failed'));
          break;
          
        case 'call_answered':
          // Call has been answered by the lead
          break;
          
        case 'agent_speaking':
          setIsSpeaking(true);
          break;
          
        case 'agent_listening':
          setIsSpeaking(false);
          break;
          
        case 'transcript_update':
          if (message.data?.entry) {
            const entry: TranscriptEntry = {
              role: message.data.entry.role,
              text: message.data.entry.text,
              timestamp: message.data.entry.timestamp || Date.now()
            };
            setTranscript(prev => [...prev, entry]);
            onTranscript?.(entry);
          }
          break;
          
        case 'call_ended':
          stopSpeakingSimulation();
          setStatus("disconnected");
          onDisconnect?.();
          break;
          
        case 'error':
          onError?.(new Error(message.data?.message || 'Unknown error'));
          break;
      }
      
      onMessage?.(message);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }, [onConnect, onDisconnect, onError, onMessage, onTranscript, stopSpeakingSimulation]);

  const connectWebSocket = useCallback((session: CallSession) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(session.websocket_url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Authenticate with the session token
      ws.send(JSON.stringify({
        type: 'auth',
        token: session.token,
        agent_id: session.agent_id
      }));
    };

    ws.onmessage = handleWebSocketMessage;

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    ws.onclose = (event) => {
      if (status === "connected" && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        console.log(`WebSocket closed, attempting reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
        setTimeout(() => connectWebSocket(session), 1000 * reconnectAttempts.current);
      } else {
        stopSpeakingSimulation();
        setStatus("disconnected");
        onDisconnect?.();
      }
    };

    return ws;
  }, [handleWebSocketMessage, onDisconnect, onError, status, stopSpeakingSimulation]);

  const startSession = useCallback(
    async (opts: StartCallingSessionOptions) => {
      try {
        setStatus("connecting");
        setTranscript([]);
        reconnectAttempts.current = 0;

        // Get session credentials from backend
        const result = await startCallingSession(opts.script, opts.lead);
        
        if (!result.success || !result.session) {
          throw new Error(result.error || 'Failed to start session');
        }

        setSessionToken(result.session.token);

        // If this is a simulated session (no real calling.io API key configured)
        if (result.simulated) {
          console.log('Running in simulated mode - no real calling.io connection');
          
          // Simulate connection for UI testing
          await new Promise((r) => window.setTimeout(r, 600));
          setStatus("connected");
          onConnect?.();

          // Simulate speaking/listening animation
          stopSpeakingSimulation();
          speakingIntervalRef.current = window.setInterval(() => {
            setIsSpeaking((prev) => !prev);
          }, 1400);

          return;
        }

        // Connect to real calling.io WebSocket
        connectWebSocket(result.session);
        
      } catch (e) {
        stopSpeakingSimulation();
        setStatus("disconnected");
        onError?.(e);
        throw e;
      }
    },
    [connectWebSocket, onConnect, onError, stopSpeakingSimulation]
  );

  const endSession = useCallback(async () => {
    if (status === "disconnected") return;

    // End session on backend
    if (sessionToken) {
      await endCallingSession(sessionToken);
      setSessionToken(null);
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Hangup any active call
    if (currentCallId) {
      await apiHangupCall(currentCallId);
      setCurrentCallId(null);
    }

    stopSpeakingSimulation();
    setStatus("disconnected");
    setTranscript([]);
    onDisconnect?.();
  }, [currentCallId, onDisconnect, sessionToken, status, stopSpeakingSimulation]);

  const initiateCall = useCallback(async (phoneNumber: string, lead?: StartCallingSessionOptions['lead']) => {
    if (status !== "connected") {
      throw new Error('Not connected to calling service');
    }

    const result = await apiInitiateCall({
      destination_number: phoneNumber,
      lead: lead ? {
        id: lead.id,
        name: lead.name,
        company: lead.company
      } : undefined
    });

    if (!result.success || !result.call) {
      throw new Error(result.error || 'Failed to initiate call');
    }

    setCurrentCallId(result.call.id);

    // If simulated, start speaking animation
    if (result.simulated) {
      stopSpeakingSimulation();
      speakingIntervalRef.current = window.setInterval(() => {
        setIsSpeaking((prev) => !prev);
      }, 1400);
    }

    return result.call;
  }, [status, stopSpeakingSimulation]);

  const hangupCall = useCallback(async () => {
    if (!currentCallId) return;

    await apiHangupCall(currentCallId);
    setCurrentCallId(null);
    stopSpeakingSimulation();
  }, [currentCallId, stopSpeakingSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeakingSimulation();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [stopSpeakingSimulation]);

  return useMemo(
    () => ({
      status,
      isSpeaking,
      transcript,
      currentCallId,
      startSession,
      endSession,
      initiateCall,
      hangupCall,
    }),
    [
      currentCallId,
      endSession,
      hangupCall,
      initiateCall,
      isSpeaking,
      startSession,
      status,
      transcript
    ]
  );
}
