import { useEffect, useState, useCallback, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  QuestionDispatchEvent,
  StudentResponseEvent,
  AgentInitEvent,
  BuddyChatPayload,
} from "@/types/agent";
import type { Question } from "@/data/lessons";

interface UseStudentAgentParams {
  channel: RealtimeChannel | null;
  isConnected: boolean;
  studentId: string;
  studentName: string;
  currentSlideIndex: number;
  enabled: boolean;
  fallbackLessonTitle?: string;
}

export interface StudentAgentState {
  activeQuestion: Question | null;
  sessionContext: AgentInitEvent | null;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  isChatLoading: boolean;
}

export function useStudentAgent({
  channel,
  isConnected,
  studentId,
  studentName,
  currentSlideIndex,
  enabled,
  fallbackLessonTitle,
}: UseStudentAgentParams) {
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [sessionContext, setSessionContext] = useState<AgentInitEvent | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  const questionReceivedAtRef = useRef<number>(0);
  const currentDispatchRef = useRef<QuestionDispatchEvent | null>(null);
  const questionQueueRef = useRef<QuestionDispatchEvent[]>([]);

  // ── Queue helpers ──

  const popNextQuestion = useCallback(() => {
    const next = questionQueueRef.current.shift();
    setQueueLength(questionQueueRef.current.length);
    if (next) {
      currentDispatchRef.current = next;
      questionReceivedAtRef.current = Date.now();
      setActiveQuestion(next.question);
      console.log("[StudentAgent] Popped next question:", next.question.question, `(${questionQueueRef.current.length} remaining)`);
    } else {
      currentDispatchRef.current = null;
      setActiveQuestion(null);
    }
  }, []);

  // ── 1. Receive questions from coordinator (push to FIFO queue) ──

  useEffect(() => {
    if (!enabled || !channel) return;

    const subscription = channel.on(
      "broadcast",
      { event: "buddy_question" },
      ({ payload }) => {
        const event = payload as QuestionDispatchEvent;
        console.log("[StudentAgent] Received question:", event.question.question);

        // If no active question, show immediately; otherwise enqueue
        if (!currentDispatchRef.current) {
          currentDispatchRef.current = event;
          questionReceivedAtRef.current = Date.now();
          setActiveQuestion(event.question);
        } else {
          questionQueueRef.current.push(event);
          setQueueLength(questionQueueRef.current.length);
          console.log("[StudentAgent] Enqueued question, queue length:", questionQueueRef.current.length);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, channel]);

  // ── 2. Receive session context (agent init) ──

  useEffect(() => {
    if (!enabled || !channel) return;

    const subscription = channel.on(
      "broadcast",
      { event: "buddy_agent_init" },
      ({ payload }) => {
        const event = payload as AgentInitEvent;
        console.log("[StudentAgent] Session context received:", event.lessonTitle);
        setSessionContext(event);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, channel]);

  // ── 3. Answer tracking: send response back to coordinator ──

  const answerQuestion = useCallback(
    (correct: boolean, answer: string) => {
      if (!channel || !currentDispatchRef.current) return;

      const responseTimeMs = Date.now() - questionReceivedAtRef.current;

      const response: StudentResponseEvent = {
        studentId,
        studentName,
        slideIndex: currentDispatchRef.current.slideIndex,
        questionText: currentDispatchRef.current.question.question,
        answer,
        correct,
        responseTimeMs,
        answeredAt: new Date().toISOString(),
      };

      channel.send({
        type: "broadcast",
        event: "buddy_response",
        payload: response,
      });

      console.log("[StudentAgent] Sent response:", correct ? "correct" : "incorrect", responseTimeMs + "ms");
    },
    [channel, studentId, studentName],
  );

  // ── 4. Dismiss question (auto-advance to next in queue) ──

  const dismissQuestion = useCallback(() => {
    popNextQuestion();
  }, [popNextQuestion]);

  // ── 5. Buddy chat ──

  const sendChatMessage = useCallback(
    async (message: string, slideContent: string, slideTitle: string) => {
      const lessonTitle = sessionContext?.lessonTitle || fallbackLessonTitle || "Lesson";

      setIsChatLoading(true);
      const updatedHistory = [...chatHistory, { role: "user" as const, content: message }];
      setChatHistory(updatedHistory);

      try {
        const payload: BuddyChatPayload = {
          message,
          slideContent,
          slideTitle,
          lessonTitle,
          conversationHistory: updatedHistory,
        };

        const { data, error } = await supabase.functions.invoke("buddy-ai", {
          body: { action: "buddy-chat", payload },
        });

        if (error) {
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

        const reply = data.reply as string;
        setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        console.error("[StudentAgent] Chat error:", err);
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I had trouble thinking. Try asking again!" },
        ]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [sessionContext, chatHistory, fallbackLessonTitle],
  );

  return {
    activeQuestion,
    sessionContext,
    chatHistory,
    isChatLoading,
    queueLength,
    answerQuestion,
    dismissQuestion,
    sendChatMessage,
  };
}
