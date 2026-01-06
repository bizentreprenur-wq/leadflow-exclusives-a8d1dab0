import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  className?: string;
}

// Declare SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export default function VoiceSearchButton({ onResult, className }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";
      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognition) return;

    setIsListening(true);
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      
      if (event.results[last].isFinal) {
        onResult(transcript);
        setIsListening(false);
        toast.success(`Heard: "${transcript}"`);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === "no-speech") {
        toast.error("No speech detected. Try again.");
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please enable it in settings.");
      } else {
        toast.error("Voice recognition failed. Try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      toast.info("Listening... Speak now!");
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
    }
  }, [recognition, onResult]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={cn(
        "relative transition-all duration-300",
        isListening && "animate-pulse ring-2 ring-destructive ring-offset-2 ring-offset-background",
        className
      )}
      title={isListening ? "Stop listening" : "Voice search"}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}
