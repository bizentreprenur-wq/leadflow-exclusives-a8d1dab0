import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  initiateCall as apiInitiateCall,
  hangupCall as apiHangupCall,
  getCallStatus,
  getCallTranscript,
  type TranscriptEntry
} from "@/lib/api/calling";

export type CallingConversationStatus = "disconnected" | "connecting" | "connected";

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
  onTranscript?: (entry: TranscriptEntry) => void;
  onError?: (error: unknown) => void;
}

/**
 * Telnyx AI Calling conversation hook.
 * 
 * Instead of WebSocket, this polls the backend for call status and transcript
 * since Telnyx handles the AI conversation server-side via gather_using_ai.
 */
export function useCallingConversation(options: UseCallingConversationOptions = {}) {
  const { onConnect, onDisconnect, onTranscript, onError } = options;

  const [status, setStatus] = useState<CallingConversationStatus>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current != null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Poll for call status and transcript updates
  const startPolling = useCallback((callControlId: string) => {
    stopPolling();
    
    pollingRef.current = window.setInterval(async () => {
      try {
        const [statusResult, transcriptResult] = await Promise.all([
          getCallStatus(callControlId),
          getCallTranscript(callControlId)
        ]);

        if (statusResult.success && statusResult.status) {
          if (statusResult.status === 'ended') {
            stopPolling();
            setStatus("disconnected");
            setIsSpeaking(false);
            onDisconnect?.();
            return;
          }
          setIsSpeaking(statusResult.status === 'speaking');
        }

        if (transcriptResult.success && transcriptResult.transcript) {
          const newTranscript = transcriptResult.transcript;
          setTranscript(prev => {
            if (newTranscript.length > prev.length) {
              // Notify about new entries
              for (let i = prev.length; i < newTranscript.length; i++) {
                onTranscript?.(newTranscript[i]);
              }
              return newTranscript;
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2000); // Poll every 2 seconds
  }, [stopPolling, onDisconnect, onTranscript]);

  const startSession = useCallback(
    async (opts: StartCallingSessionOptions) => {
      if (!opts.lead?.phone) {
        throw new Error('Phone number required to start a call');
      }

      try {
        setStatus("connecting");
        setTranscript([]);

        const result = await apiInitiateCall({
          destination_number: opts.lead.phone,
          lead_id: opts.lead.id,
          lead_name: opts.lead.name,
        });

        if (!result.success || !result.call_control_id) {
          throw new Error(result.error || 'Failed to initiate call');
        }

        setCurrentCallId(result.call_control_id);
        setStatus("connected");
        onConnect?.();

        // Start polling for status and transcript
        startPolling(result.call_control_id);

      } catch (e) {
        stopPolling();
        setStatus("disconnected");
        onError?.(e);
        throw e;
      }
    },
    [onConnect, onError, startPolling, stopPolling]
  );

  const endSession = useCallback(async () => {
    if (status === "disconnected") return;

    if (currentCallId) {
      await apiHangupCall(currentCallId);
      setCurrentCallId(null);
    }

    stopPolling();
    setStatus("disconnected");
    setIsSpeaking(false);
    setTranscript([]);
    onDisconnect?.();
  }, [currentCallId, onDisconnect, status, stopPolling]);

  const initiateCall = useCallback(async (phoneNumber: string, lead?: StartCallingSessionOptions['lead']) => {
    const result = await apiInitiateCall({
      destination_number: phoneNumber,
      lead_id: lead?.id,
      lead_name: lead?.name,
    });

    if (!result.success || !result.call_control_id) {
      throw new Error(result.error || 'Failed to initiate call');
    }

    setCurrentCallId(result.call_control_id);
    startPolling(result.call_control_id);

    return { id: result.call_control_id, call_leg_id: result.call_leg_id };
  }, [startPolling]);

  const hangupCall = useCallback(async () => {
    if (!currentCallId) return;

    await apiHangupCall(currentCallId);
    setCurrentCallId(null);
    stopPolling();
    setIsSpeaking(false);
  }, [currentCallId, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

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
