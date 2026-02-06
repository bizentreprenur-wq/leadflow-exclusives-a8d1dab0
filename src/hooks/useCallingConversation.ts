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
 * Replacement for `@elevenlabs/react`'s `useConversation`.
 *
 * This is a lightweight UI stub so the app can build and the calling.io flow
 * can be wired in later without shipping ElevenLabs.
 */
export function useCallingConversation(options: UseCallingConversationOptions = {}) {
  const { onConnect, onDisconnect, onMessage, onError } = options;

  const [status, setStatus] = useState<CallingConversationStatus>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakingIntervalRef = useRef<number | null>(null);

  const stopSpeakingSimulation = useCallback(() => {
    if (speakingIntervalRef.current != null) {
      window.clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const startSession = useCallback(
    async (_opts: StartCallingSessionOptions) => {
      try {
        setStatus("connecting");

        // Simulate connect latency
        await new Promise((r) => window.setTimeout(r, 600));

        setStatus("connected");
        onConnect?.();

        // Simulate agent speaking/listening for UI.
        stopSpeakingSimulation();
        speakingIntervalRef.current = window.setInterval(() => {
          setIsSpeaking((prev) => !prev);
        }, 1400);

        // Optional: leave message simulation off by default.
        // onMessage?.({ type: "agent_response", agent_response_event: { agent_response: "..." } });
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

    stopSpeakingSimulation();
    setStatus("disconnected");
    onDisconnect?.();
  }, [onDisconnect, status, stopSpeakingSimulation]);

  useEffect(() => {
    return () => {
      stopSpeakingSimulation();
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
