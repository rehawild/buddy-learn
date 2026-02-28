import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── SpeechRecognition types (Web Speech API) ──

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ── Types ──

export interface TranscriptLine {
  speaker: string;
  peerId: string;
  text: string;
  timestamp: number;
}

interface UseLiveTranscriptParams {
  channel: RealtimeChannel | null;
  isConnected: boolean;
  localPeerId: string;
  speakerName: string;
  audioEnabled: boolean;
}

const TRANSCRIPT_WINDOW_SIZE = 500;
const LINE_EXPIRE_MS = 8000;
const BROADCAST_DEBOUNCE_MS = 800;

export function useLiveTranscript({
  channel,
  isConnected,
  localPeerId,
  speakerName,
  audioEnabled,
}: UseLiveTranscriptParams) {
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [localTranscript, setLocalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const stableTextRef = useRef("");
  const broadcastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const channelRef = useRef(channel);
  const enabledRef = useRef(false);

  channelRef.current = channel;

  // Expire old lines periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - LINE_EXPIRE_MS;
      setTranscriptLines((prev) => {
        const filtered = prev.filter((l) => l.timestamp > cutoff);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update local line in state and debounce broadcast
  const updateLocalLine = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      setTranscriptLines((prev) => {
        const filtered = prev.filter((l) => l.peerId !== localPeerId);
        return [
          ...filtered,
          { speaker: speakerName, peerId: localPeerId, text, timestamp: Date.now() },
        ];
      });

      // Debounced broadcast to other peers
      clearTimeout(broadcastTimerRef.current);
      broadcastTimerRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: "broadcast",
          event: "live_transcript",
          payload: { text, speaker: speakerName, peerId: localPeerId },
        });
      }, BROADCAST_DEBOUNCE_MS);
    },
    [localPeerId, speakerName],
  );

  // Listen for remote transcript broadcasts
  useEffect(() => {
    if (!channel || !isConnected) return;

    const handler = ({ payload }: { payload: any }) => {
      const { text, speaker, peerId } = payload;
      if (peerId === localPeerId) return;

      setTranscriptLines((prev) => {
        const filtered = prev.filter((l) => l.peerId !== peerId);
        return [
          ...filtered,
          { speaker, peerId, text, timestamp: Date.now() },
        ];
      });
    };

    channel.on("broadcast", { event: "live_transcript" }, handler);
    return () => {
      // Supabase JS v2 doesn't have .off(); cleanup happens on unsubscribe
    };
  }, [channel, isConnected, localPeerId]);

  // Start/stop speech recognition based on audio
  useEffect(() => {
    if (!audioEnabled || !isConnected) {
      enabledRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* already stopped */ }
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    enabledRef.current = true;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      if (finalText) {
        stableTextRef.current = (stableTextRef.current + " " + finalText)
          .slice(-TRANSCRIPT_WINDOW_SIZE)
          .trim();
      }

      const display = (stableTextRef.current + " " + interimText).trim();
      // Only keep last ~150 chars for display
      const displayTrimmed = display.length > 150 ? "…" + display.slice(-150) : display;
      setLocalTranscript(display);
      updateLocalLine(displayTrimmed);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.warn("[LiveTranscript] Speech error:", event.error);
      }
    };

    recognition.onend = () => {
      if (enabledRef.current && recognitionRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      console.warn("[LiveTranscript] Failed to start speech recognition");
    }

    return () => {
      enabledRef.current = false;
      recognitionRef.current = null;
      setIsListening(false);
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, [audioEnabled, isConnected, updateLocalLine]);

  // Cleanup broadcast timer
  useEffect(() => {
    return () => clearTimeout(broadcastTimerRef.current);
  }, []);

  return {
    /** All active transcript lines from all peers (expire after ~8s) */
    transcriptLines,
    /** Full local transcript text (for coordinator coverage matching) */
    localTranscript,
    /** The stable/final portion of local transcript (for question generation) */
    stableTranscript: stableTextRef.current,
    isListening,
  };
}
