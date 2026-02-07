import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CallingConversationStatus = "disconnected" | "connecting" | "connected";

export type CallingConnectionType = "webrtc" | "websocket";

export interface StartCallingSessionOptions {
  agentId?: string;
  conversationToken?: string;
  connectionType?: CallingConnectionType;
}

export interface UseCallingConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: unknown) => void;
}

/**
 * Calling.io conversation hook for AI voice calls.
 * 
 * This manages the WebRTC/WebSocket connection to the calling.io backend
 * for real-time AI voice conversations with leads.
 */
export function useCallingConversation(options: UseCallingConversationOptions = {}) {
  const { onConnect, onDisconnect, onMessage, onError } = options;

  const [status, setStatus] = useState<CallingConversationStatus>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakingIntervalRef = useRef<number | null>(null);
  const connectionRef = useRef<WebSocket | null>(null);

  const stopSpeakingSimulation = useCallback(() => {
    if (speakingIntervalRef.current != null) {
      window.clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const startSession = useCallback(
    async (opts: StartCallingSessionOptions) => {
      try {
        setStatus("connecting");

        // TODO: Replace with real calling.io WebRTC/WebSocket connection
        // Example calling.io connection flow:
        // 1. Get connection token from backend: POST /api/calling/start-session
        // 2. Open WebSocket to calling.io: wss://api.calling.io/v1/realtime
        // 3. Send auth message with token
        // 4. Handle incoming audio/transcription messages
        
        // For now, simulate connection latency for UI testing
        await new Promise((r) => window.setTimeout(r, 600));

        setStatus("connected");
        onConnect?.();

        // Simulate agent speaking/listening for UI visualization
        stopSpeakingSimulation();
        speakingIntervalRef.current = window.setInterval(() => {
          setIsSpeaking((prev) => !prev);
        }, 1400);

        // Simulated transcript message for testing
        // In production, these would come from WebSocket
        // onMessage?.({ 
        //   type: "agent_response", 
        //   agent_response_event: { agent_response: "Hello, this is your AI assistant." } 
        // });
      } catch (e) {
        stopSpeakingSimulation();
        setStatus("disconnected");
        onError?.(e);
        throw e;
      }
    },
    [onConnect, onError, onMessage, stopSpeakingSimulation]
  );

  const endSession = useCallback(async () => {
    if (status === "disconnected") return;

    // Close WebSocket connection if open
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    stopSpeakingSimulation();
    setStatus("disconnected");
    onDisconnect?.();
  }, [onDisconnect, status, stopSpeakingSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeakingSimulation();
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
    };
  }, [stopSpeakingSimulation]);

  return useMemo(
    () => ({
      status,
      isSpeaking,
      startSession,
      endSession,
    }),
    [endSession, isSpeaking, startSession, status]
  );
}
