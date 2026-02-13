/**
 * Live Call Transcript Viewer
 * Displays real-time conversation between AI agent and caller
 * with speaker labels, timestamps, and auto-scroll.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bot, User, Mic, MicOff, Phone, PhoneOff, Clock, 
  Download, Trash2, Activity, Volume2
} from 'lucide-react';
import { TranscriptEntry, getCallTranscript } from '@/lib/api/calling';

interface LiveTranscriptViewerProps {
  callSid?: string | null;
  isLive?: boolean;
  transcript?: TranscriptEntry[];
  leadName?: string;
  onClose?: () => void;
}

function formatTimestamp(ts: number): string {
  const mins = Math.floor(ts / 60);
  const secs = Math.floor(ts % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LiveTranscriptViewer({
  callSid,
  isLive = false,
  transcript: externalTranscript,
  leadName = 'Caller',
  onClose,
}: LiveTranscriptViewerProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(externalTranscript || []);
  const [isPolling, setIsPolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<number | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Sync external transcript
  useEffect(() => {
    if (externalTranscript) setTranscript(externalTranscript);
  }, [externalTranscript]);

  // Poll for live transcript
  useEffect(() => {
    if (!isLive || !callSid) return;
    setIsPolling(true);

    pollingRef.current = window.setInterval(async () => {
      try {
        const result = await getCallTranscript(callSid);
        if (result.success && result.transcript) {
          setTranscript(result.transcript);
        }
      } catch (e) {
        console.error('Transcript poll error:', e);
      }
    }, 1500);

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      setIsPolling(false);
    };
  }, [isLive, callSid]);

  const handleExport = () => {
    const text = transcript.map(e => 
      `[${formatTimestamp(e.timestamp)}] ${e.role === 'agent' ? 'AI Agent' : leadName}: ${e.text}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${callSid || 'call'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-base font-extrabold">Live Transcript</CardTitle>
            {isLive && isPolling && (
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] animate-pulse">
                <Mic className="w-3 h-3 mr-1" /> LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {transcript.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExport}>
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <PhoneOff className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </div>
        {leadName && (
          <p className="text-xs text-muted-foreground mt-1">
            Call with <span className="font-semibold text-foreground">{leadName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="h-[350px] overflow-y-auto px-4 pb-4">
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              {isLive ? (
                <>
                  <Volume2 className="w-8 h-8 animate-pulse text-cyan-400/50" />
                  <p className="text-sm">Waiting for conversation to begin...</p>
                </>
              ) : (
                <>
                  <MicOff className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm">No transcript available</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <AnimatePresence initial={false}>
                {transcript.map((entry, idx) => {
                  const isAgent = entry.role === 'agent';
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2.5 ${isAgent ? '' : 'flex-row-reverse'}`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                        isAgent 
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
                          : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                      }`}>
                        {isAgent ? (
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>

                      {/* Message bubble */}
                      <div className={`max-w-[75%] ${isAgent ? '' : 'text-right'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isAgent ? 'text-cyan-400' : 'text-amber-400'
                          }`}>
                            {isAgent ? 'AI Agent' : leadName}
                          </span>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                        <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          isAgent 
                            ? 'bg-cyan-500/10 border border-cyan-500/20 text-foreground' 
                            : 'bg-amber-500/10 border border-amber-500/20 text-foreground'
                        }`}>
                          {entry.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Live typing indicator */}
              {isLive && isPolling && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
