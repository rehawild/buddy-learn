import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  SlideQuestionBank,
  QuestionDispatchEvent,
  StudentResponseEvent,
  PreGeneratePayload,
} from "@/types/agent";
import type { Question } from "@/data/lessons";
import type { UploadedSlide } from "@/hooks/useSessionSlides";

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

interface SpeechRecognition extends EventTarget {
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
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// ── Config ──

const COVERAGE_THRESHOLD = 0.4; // 40% of key phrases to mark slide as covered
const TRANSCRIPT_WINDOW_SIZE = 500; // rolling window of characters

// ── Types ──

export interface CoordinatorState {
  questionBank: SlideQuestionBank[] | null;
  isPreGenerating: boolean;
  preGenerateError: string | null;
  currentTranscript: string;
  coveredSlides: Set<number>;
  isListening: boolean;
  studentResponses: StudentResponseEvent[];
}

interface UseCoordinatorAgentParams {
  slides: UploadedSlide[] | null;
  channel: RealtimeChannel | null;
  isConnected: boolean;
  lessonTitle: string;
  difficulty: "easy" | "medium" | "hard";
  currentSlideIndex: number;
  sessionId: string | null;
  enabled: boolean; // only true for teacher with uploaded slides
}

export function useCoordinatorAgent({
  slides,
  channel,
  isConnected,
  lessonTitle,
  difficulty,
  currentSlideIndex,
  sessionId,
  enabled,
}: UseCoordinatorAgentParams) {
  const [questionBank, setQuestionBank] = useState<SlideQuestionBank[] | null>(null);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const [preGenerateError, setPreGenerateError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [coveredSlides, setCoveredSlides] = useState<Set<number>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [studentResponses, setStudentResponses] = useState<StudentResponseEvent[]>([]);

  const questionBankRef = useRef<SlideQuestionBank[] | null>(null);
  const coveredSlidesRef = useRef<Set<number>>(new Set());
  const transcriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dispatchedQuestionsRef = useRef<Set<string>>(new Set()); // "slideIdx-qIdx"
  const [dispatchCount, setDispatchCount] = useState(0);

  // Keep refs in sync
  useEffect(() => {
    questionBankRef.current = questionBank;
  }, [questionBank]);

  useEffect(() => {
    coveredSlidesRef.current = coveredSlides;
  }, [coveredSlides]);

  // ── 1. Pre-generation: call edge function on session start ──

  useEffect(() => {
    if (!enabled || !slides || slides.length === 0 || questionBank) return;

    const preGenerate = async () => {
      setIsPreGenerating(true);
      setPreGenerateError(null);

      try {
        const slidePayload = slides.map((s, i) => ({
          index: i,
          title: `Slide ${s.slideNumber}`,
          content: s.contentText || `[Slide ${s.slideNumber} - no text extracted]`,
        }));

        const payload: PreGeneratePayload = {
          slides: slidePayload,
          difficulty,
          lessonTitle,
        };

        const { data, error } = await supabase.functions.invoke("buddy-ai", {
          body: { action: "pre-generate", payload },
        });

        if (error) {
          // Try to extract the actual error from the response body
          let detail = error.message;
          try {
            const body = await (error as any).context?.json?.();
            if (body?.message) detail = body.message;
            if (body?.error) detail = body.error;
          } catch {
            // ignore parse failure
          }
          throw new Error(detail);
        }
        if (data?.error) throw new Error(data.error);

        const bank: SlideQuestionBank[] = data.questionBank;
        setQuestionBank(bank);
        console.log("[Coordinator] Question bank generated:", bank.length, "slides");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Pre-generation failed";
        setPreGenerateError(msg);
        console.error("[Coordinator] Pre-generation error:", msg);
      } finally {
        setIsPreGenerating(false);
      }
    };

    preGenerate();
  }, [enabled, slides, lessonTitle, difficulty, questionBank]);

  // ── 2. Speech tracking with Web Speech API ──

  useEffect(() => {
    if (!enabled) return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      console.warn("[Coordinator] Web Speech API not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
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

      // Append final text to the rolling window (stable, for coverage matching)
      if (finalText) {
        transcriptRef.current = (transcriptRef.current + " " + finalText)
          .slice(-TRANSCRIPT_WINDOW_SIZE)
          .trim();
        checkCoverage(transcriptRef.current);
      }

      // Display = stable transcript + current interim (visual only)
      const display = (transcriptRef.current + " " + interimText).trim();
      setCurrentTranscript(display);
    };

    recognition.onerror = (event) => {
      // "no-speech" is common and not a real error
      if (event.error !== "no-speech") {
        console.warn("[Coordinator] Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (enabled && recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started, ignore
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      console.log("[Coordinator] Speech recognition started");
    } catch {
      console.warn("[Coordinator] Failed to start speech recognition");
    }

    return () => {
      recognitionRef.current = null;
      setIsListening(false);
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    };
  }, [enabled]);

  // ── 3. Content matching: compare transcript against key phrases ──

  const checkCoverage = useCallback(
    (transcript: string) => {
      const bank = questionBankRef.current;
      if (!bank) return;

      const lowerTranscript = transcript.toLowerCase();

      for (const slideBank of bank) {
        if (coveredSlidesRef.current.has(slideBank.slideIndex)) continue;

        const totalPhrases = slideBank.keyPhrases.length;
        if (totalPhrases === 0) continue;

        const matchedPhrases = slideBank.keyPhrases.filter((phrase) =>
          lowerTranscript.includes(phrase.toLowerCase()),
        );

        const coverage = matchedPhrases.length / totalPhrases;

        if (coverage >= COVERAGE_THRESHOLD) {
          console.log(
            `[Coordinator] Slide ${slideBank.slideIndex} covered (${Math.round(coverage * 100)}%)`,
          );
          setCoveredSlides((prev) => {
            const next = new Set(prev);
            next.add(slideBank.slideIndex);
            return next;
          });

          // Dispatch all questions for this slide
          dispatchAllForSlide(slideBank);
        }
      }
    },
    [],
  );

  // ── 4. Question dispatch via Realtime (batch: all undispatched for a slide) ──

  const dispatchAllForSlide = useCallback(
    (slideBank: SlideQuestionBank) => {
      if (!channel) return;

      let dispatched = 0;
      slideBank.questions.forEach((question, i) => {
        const key = `${slideBank.slideIndex}-${i}`;
        if (dispatchedQuestionsRef.current.has(key)) return;

        dispatchedQuestionsRef.current.add(key);
        dispatched++;

        const event: QuestionDispatchEvent = {
          slideIndex: slideBank.slideIndex,
          question,
          dispatchedAt: new Date().toISOString(),
        };

        channel.send({
          type: "broadcast",
          event: "buddy_question",
          payload: event,
        });

        console.log(
          `[Coordinator] Dispatched question for slide ${slideBank.slideIndex}:`,
          question.question,
        );
      });

      if (dispatched > 0) setDispatchCount((c) => c + dispatched);
    },
    [channel],
  );

  // ── 5. Manual dispatch: teacher triggers questions for current slide ──

  const dispatchForCurrentSlide = useCallback(() => {
    const bank = questionBankRef.current;
    if (!bank || !channel) return;

    const slideBank = bank.find((b) => b.slideIndex === currentSlideIndex);
    if (slideBank) {
      dispatchAllForSlide(slideBank);
    }
  }, [currentSlideIndex, channel, dispatchAllForSlide]);

  // ── 5b. Dispatch all remaining questions across ALL slides ──

  const dispatchAll = useCallback(() => {
    const bank = questionBankRef.current;
    if (!bank || !channel) return;

    for (const slideBank of bank) {
      dispatchAllForSlide(slideBank);
    }
  }, [channel, dispatchAllForSlide]);

  // ── 5c. Dispatch a single question by slide + question index ──

  const dispatchSingleQuestion = useCallback(
    (slideIndex: number, questionIndex: number) => {
      const bank = questionBankRef.current;
      if (!bank || !channel) return;

      const slideBank = bank.find((b) => b.slideIndex === slideIndex);
      if (!slideBank) return;

      const question = slideBank.questions[questionIndex];
      if (!question) return;

      const key = `${slideIndex}-${questionIndex}`;
      if (dispatchedQuestionsRef.current.has(key)) return;

      dispatchedQuestionsRef.current.add(key);
      setDispatchCount((c) => c + 1);

      const event: QuestionDispatchEvent = {
        slideIndex,
        question,
        dispatchedAt: new Date().toISOString(),
      };

      channel.send({
        type: "broadcast",
        event: "buddy_question",
        payload: event,
      });

      console.log(
        `[Coordinator] Dispatched single question for slide ${slideIndex}:`,
        question.question,
      );
    },
    [channel],
  );

  // ── 5d. Check if a question has been dispatched ──

  const isQuestionDispatched = useCallback(
    (slideIndex: number, questionIndex: number) => {
      return dispatchedQuestionsRef.current.has(`${slideIndex}-${questionIndex}`);
    },
    [],
  );

  // ── 6. Agent factory: broadcast init to new students ──

  const broadcastAgentInit = useCallback(() => {
    if (!channel) return;

    channel.send({
      type: "broadcast",
      event: "buddy_agent_init",
      payload: {
        lessonTitle,
        currentSlideIndex,
        difficulty,
      },
    });
  }, [channel, lessonTitle, currentSlideIndex, difficulty]);

  // Broadcast init when connected and when slide changes
  useEffect(() => {
    if (!enabled || !isConnected || !channel) return;
    broadcastAgentInit();
  }, [enabled, isConnected, channel, currentSlideIndex, broadcastAgentInit]);

  // ── 7. Response collection: listen for student answers ──

  useEffect(() => {
    if (!enabled || !channel) return;

    const subscription = channel.on(
      "broadcast",
      { event: "buddy_response" },
      ({ payload }) => {
        const response = payload as StudentResponseEvent;
        console.log("[Coordinator] Student response:", response.studentName, response.correct);

        setStudentResponses((prev) => [...prev, response]);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, channel]);

  // ── 8. Persist engagement data periodically ──

  useEffect(() => {
    if (!enabled || !sessionId || studentResponses.length === 0) return;

    const persist = async () => {
      // Aggregate per-student
      const byStudent = new Map<string, StudentResponseEvent[]>();
      for (const r of studentResponses) {
        const existing = byStudent.get(r.studentId) || [];
        existing.push(r);
        byStudent.set(r.studentId, existing);
      }

      for (const [studentId, responses] of byStudent) {
        const correct = responses.filter((r) => r.correct).length;
        const avgTime =
          responses.reduce((sum, r) => sum + r.responseTimeMs, 0) / responses.length;

        await supabase.from("session_engagement").upsert(
          {
            session_id: sessionId,
            student_id: studentId,
            questions_answered: responses.length,
            correct_answers: correct,
            avg_response_time: Math.round(avgTime),
            buddy_interactions: responses.length,
          },
          { onConflict: "session_id,student_id" },
        );
      }
    };

    const timer = setInterval(persist, 10_000); // every 10s
    return () => clearInterval(timer);
  }, [enabled, sessionId, studentResponses]);

  return {
    questionBank,
    isPreGenerating,
    preGenerateError,
    currentTranscript,
    coveredSlides,
    isListening,
    studentResponses,
    dispatchForCurrentSlide,
    dispatchAll,
    dispatchSingleQuestion,
    isQuestionDispatched,
    dispatchCount,
  };
}
