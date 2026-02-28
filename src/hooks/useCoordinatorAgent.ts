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

// ── Config ──

const COVERAGE_THRESHOLD = 0.4; // 40% of key phrases to mark slide as covered
const TRANSCRIPT_QUESTION_THRESHOLD = 200; // chars of stable transcript before generating questions

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
  teacherId: string | null;
  enabled: boolean; // only true for teacher with uploaded slides
  /** Stable transcript text from useLiveTranscript */
  transcriptText?: string;
  /** Whether live transcript is listening */
  transcriptListening?: boolean;
}

export function useCoordinatorAgent({
  slides,
  channel,
  isConnected,
  lessonTitle,
  difficulty,
  currentSlideIndex,
  sessionId,
  teacherId,
  enabled,
  transcriptText = "",
  transcriptListening = false,
}: UseCoordinatorAgentParams) {
  const [questionBank, setQuestionBank] = useState<SlideQuestionBank[] | null>(null);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const [preGenerateError, setPreGenerateError] = useState<string | null>(null);
  const [coveredSlides, setCoveredSlides] = useState<Set<number>>(new Set());
  const [studentResponses, setStudentResponses] = useState<StudentResponseEvent[]>([]);

  const questionBankRef = useRef<SlideQuestionBank[] | null>(null);
  const coveredSlidesRef = useRef<Set<number>>(new Set());
  const dispatchedQuestionsRef = useRef<Set<string>>(new Set()); // "slideIdx-qIdx"
  const [dispatchCount, setDispatchCount] = useState(0);
  const transcriptQuestionsSentRef = useRef<Set<number>>(new Set()); // slide indices already processed
  const lastTranscriptLenRef = useRef(0);

  // ── Persistence helpers (fire-and-forget) ──

  const persistDispatchEvent = useCallback(
    (question: Question, slideIndex: number, source: string) => {
      if (!sessionId || !teacherId) return;
      supabase
        .from("engagement_events")
        .insert({
          session_id: sessionId,
          student_id: teacherId, // teacher acts as actor for dispatches
          event_type: "question_dispatch",
          payload: {
            slide_index: slideIndex,
            question_text: question.question,
            difficulty: question.difficulty,
            correct_answer: question.answer,
            options: question.options || null,
            source,
            dispatched_at: new Date().toISOString(),
          },
        })
        .then(({ error }) => {
          if (error) console.warn("[Coordinator] Failed to persist dispatch:", error.message);
        });
    },
    [sessionId, teacherId],
  );

  const persistResponseEvent = useCallback(
    (response: StudentResponseEvent) => {
      if (!sessionId) return;
      supabase
        .from("engagement_events")
        .insert({
          session_id: sessionId,
          student_id: response.studentId,
          event_type: "coordinator_response",
          payload: {
            student_name: response.studentName,
            slide_index: response.slideIndex,
            question_text: response.questionText,
            answer: response.answer,
            correct: response.correct,
            response_time_ms: response.responseTimeMs,
            answered_at: response.answeredAt,
          },
        })
        .then(({ error }) => {
          if (error) console.warn("[Coordinator] Failed to persist response:", error.message);
        });
    },
    [sessionId],
  );

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

  // ── 2. Content matching: compare transcript against key phrases ──

  // Run coverage check whenever transcriptText changes
  useEffect(() => {
    if (!enabled || !transcriptText) return;
    checkCoverage(transcriptText);
  }, [enabled, transcriptText]);

  // ── 2b. Transcript-based question generation ──

  useEffect(() => {
    if (!enabled || !slides || !channel || !transcriptText) return;
    if (transcriptText.length < TRANSCRIPT_QUESTION_THRESHOLD) return;
    // Only trigger when significant new text arrives
    if (transcriptText.length - lastTranscriptLenRef.current < TRANSCRIPT_QUESTION_THRESHOLD) return;

    const slideIdx = currentSlideIndex;
    if (transcriptQuestionsSentRef.current.has(slideIdx)) return;
    transcriptQuestionsSentRef.current.add(slideIdx);
    lastTranscriptLenRef.current = transcriptText.length;

    const slide = slides[slideIdx];
    if (!slide) return;

    const generateTranscriptQuestions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("buddy-ai", {
          body: {
            action: "transcript-questions",
            payload: {
              transcript: transcriptText,
              slideContent: slide.contentText || `[Slide ${slide.slideNumber}]`,
              slideTitle: `Slide ${slide.slideNumber}`,
              lessonTitle,
              slideIndex: slideIdx,
              difficulty,
            },
          },
        });

        if (error || data?.error) {
          console.warn("[Coordinator] Transcript question generation error:", error?.message || data?.error);
          return;
        }

        const questions = data.questions as Question[];
        if (!questions || questions.length === 0) return;

        // Dispatch transcript-based questions
        for (const question of questions) {
          const event: QuestionDispatchEvent = {
            slideIndex: slideIdx,
            question: { ...question, source: "transcript" },
            dispatchedAt: new Date().toISOString(),
          };

          channel.send({
            type: "broadcast",
            event: "buddy_question",
            payload: event,
          });

          persistDispatchEvent(question, slideIdx, "transcript");
          console.log("[Coordinator] Dispatched transcript question:", question.question);
        }

        setDispatchCount((c) => c + questions.length);
      } catch (err) {
        console.warn("[Coordinator] Transcript question error:", err);
      }
    };

    generateTranscriptQuestions();
  }, [enabled, slides, channel, transcriptText, currentSlideIndex, lessonTitle, difficulty, persistDispatchEvent]);

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

        persistDispatchEvent(question, slideBank.slideIndex, question.source || "slides");
        console.log(
          `[Coordinator] Dispatched question for slide ${slideBank.slideIndex}:`,
          question.question,
        );
      });

      if (dispatched > 0) setDispatchCount((c) => c + dispatched);
    },
    [channel, persistDispatchEvent],
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

      persistDispatchEvent(question, slideIndex, question.source || "slides");
      console.log(
        `[Coordinator] Dispatched single question for slide ${slideIndex}:`,
        question.question,
      );
    },
    [channel, persistDispatchEvent],
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
        persistResponseEvent(response);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, channel, persistResponseEvent]);

  return {
    questionBank,
    isPreGenerating,
    preGenerateError,
    currentTranscript: transcriptText,
    coveredSlides,
    isListening: transcriptListening,
    studentResponses,
    dispatchForCurrentSlide,
    dispatchAll,
    dispatchSingleQuestion,
    isQuestionDispatched,
    dispatchCount,
  };
}
