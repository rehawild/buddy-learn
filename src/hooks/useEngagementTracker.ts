import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──

interface EngagementEvent {
  session_id: string;
  student_id: string;
  event_type: string;
  payload: Record<string, unknown>;
}

interface UseEngagementTrackerParams {
  sessionId: string | null;
  userId: string | undefined;
  userName: string;
  enabled: boolean; // only true for students
}

export interface EngagementAggregate {
  questionsAnswered: number;
  correctAnswers: number;
  totalResponseTimeMs: number;
  reactionsCount: number;
  buddyInteractions: number;
  tabSwitchCount: number;
  idleCount: number;
  attentionScore: number;
}

interface EngagementTracker {
  recordQuestionResponse: (correct: boolean, responseTimeMs: number, slideIndex: number, difficulty?: string, questionText?: string) => void;
  recordReaction: (emoji: string) => void;
  recordBuddyChat: () => void;
  flush: () => Promise<void>;
  getAggregate: () => EngagementAggregate;
  computeAttention: () => number;
}

// ── Constants ──

const IDLE_THRESHOLD_MS = 15_000;
const PERSIST_INTERVAL_MS = 30_000;
const ATTENTION_SNAPSHOT_INTERVAL_MS = 30_000;
const MOUSE_ACTIVE_WINDOW_MS = 15_000;
const SCROLL_ACTIVE_WINDOW_MS = 30_000;
const QUESTION_ACTIVE_WINDOW_MS = 60_000;

// ── Hook ──

export function useEngagementTracker({
  sessionId,
  userId,
  userName,
  enabled,
}: UseEngagementTrackerParams): EngagementTracker {
  const eventQueueRef = useRef<EngagementEvent[]>([]);
  const aggregateRef = useRef({
    questionsAnswered: 0,
    correctAnswers: 0,
    totalResponseTimeMs: 0,
    reactionsCount: 0,
    buddyInteractions: 0,
    tabSwitchCount: 0,
    idleCount: 0,
    attentionScore: 0,
  });

  // Signal timestamps
  const lastMouseMoveRef = useRef(Date.now());
  const lastScrollRef = useRef(0);
  const lastQuestionRef = useRef(0);
  const idleStartRef = useRef<number | null>(null);
  const tabVisibleRef = useRef(true);

  const queueEvent = useCallback(
    (event_type: string, payload: Record<string, unknown>) => {
      if (!sessionId || !userId) return;
      eventQueueRef.current.push({
        session_id: sessionId,
        student_id: userId,
        event_type,
        payload,
      });
    },
    [sessionId, userId],
  );

  // ── Compute attention score (0-100) ──
  const computeAttention = useCallback(() => {
    const now = Date.now();
    let score = 0;

    // Tab visible: +40
    if (tabVisibleRef.current) score += 40;

    // Mouse active in last 15s: +30
    if (now - lastMouseMoveRef.current < MOUSE_ACTIVE_WINDOW_MS) score += 30;

    // Scroll activity in last 30s: +15
    if (now - lastScrollRef.current < SCROLL_ACTIVE_WINDOW_MS) score += 15;

    // Answered question in last 60s: +15
    if (now - lastQuestionRef.current < QUESTION_ACTIVE_WINDOW_MS) score += 15;

    return score;
  }, []);

  // ── Persist: batch insert events + upsert aggregate ──
  const flush = useCallback(async () => {
    if (!sessionId || !userId) return;

    // Drain the event queue
    const events = eventQueueRef.current.splice(0);
    if (events.length > 0) {
      await supabase.from("engagement_events").insert(
        events.map((e) => ({ ...e, payload: e.payload as unknown as import("@/integrations/supabase/types").Json }))
      );
    }

    // Upsert aggregate
    const agg = aggregateRef.current;
    const avgResponseTime =
      agg.questionsAnswered > 0
        ? Math.round(agg.totalResponseTimeMs / agg.questionsAnswered)
        : null;

    await supabase.from("session_engagement").upsert(
      {
        session_id: sessionId,
        student_id: userId,
        student_name: userName,
        questions_answered: agg.questionsAnswered,
        correct_answers: agg.correctAnswers,
        avg_response_time: avgResponseTime,
        reactions_count: agg.reactionsCount,
        buddy_interactions: agg.buddyInteractions,
        attention_score: agg.attentionScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,student_id" },
    );
  }, [sessionId, userId, userName]);

  // ── Visibility change tracking ──
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      tabVisibleRef.current = visible;
      queueEvent("tab_switch", { visible });
      if (!visible) {
        aggregateRef.current.tabSwitchCount++;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, queueEvent]);

  // ── Mouse movement + idle detection ──
  useEffect(() => {
    if (!enabled) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      lastMouseMoveRef.current = Date.now();

      // End idle if currently idle
      if (idleStartRef.current !== null) {
        const duration = Date.now() - idleStartRef.current;
        queueEvent("idle_end", { idle_duration_ms: duration });
        idleStartRef.current = null;
      }

      // Start new idle timer
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleStartRef.current = Date.now();
        aggregateRef.current.idleCount++;
        queueEvent("idle_start", { idle_after_ms: IDLE_THRESHOLD_MS });
      }, IDLE_THRESHOLD_MS);
    };

    const handleMouseMove = () => resetIdle();
    const handleKeyDown = () => resetIdle();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    // Initialize idle timer
    idleTimer = setTimeout(() => {
      idleStartRef.current = Date.now();
      aggregateRef.current.idleCount++;
      queueEvent("idle_start", { idle_after_ms: IDLE_THRESHOLD_MS });
    }, IDLE_THRESHOLD_MS);

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, queueEvent]);

  // ── Scroll tracking ──
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      lastScrollRef.current = Date.now();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  // ── Periodic attention snapshot + persistence ──
  useEffect(() => {
    if (!enabled || !sessionId || !userId) return;

    const interval = setInterval(() => {
      const score = computeAttention();
      aggregateRef.current.attentionScore = score;
      queueEvent("attention_snapshot", {
        score,
        mouse_active: Date.now() - lastMouseMoveRef.current < MOUSE_ACTIVE_WINDOW_MS,
        tab_visible: tabVisibleRef.current,
      });
      flush();
    }, PERSIST_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled, sessionId, userId, computeAttention, queueEvent, flush]);

  // ── Flush on page unload ──
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability during unload
      if (!sessionId || !userId) return;
      const events = eventQueueRef.current.splice(0);
      if (events.length > 0) {
        // Best-effort: navigator.sendBeacon doesn't support auth headers,
        // so we just try a regular flush
        flush();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, sessionId, userId, flush]);

  // ── Public actions ──

  const recordQuestionResponse = useCallback(
    (correct: boolean, responseTimeMs: number, slideIndex: number, difficulty?: string, questionText?: string) => {
      aggregateRef.current.questionsAnswered++;
      if (correct) aggregateRef.current.correctAnswers++;
      aggregateRef.current.totalResponseTimeMs += responseTimeMs;
      lastQuestionRef.current = Date.now();
      queueEvent("question_response", {
        slide_index: slideIndex,
        correct,
        response_time_ms: responseTimeMs,
        ...(difficulty && { difficulty }),
        ...(questionText && { question_text: questionText }),
      });
    },
    [queueEvent],
  );

  const recordReaction = useCallback(
    (emoji: string) => {
      aggregateRef.current.reactionsCount++;
      queueEvent("reaction", { emoji });
    },
    [queueEvent],
  );

  const recordBuddyChat = useCallback(() => {
    aggregateRef.current.buddyInteractions++;
    queueEvent("buddy_chat", { message_count: 1 });
  }, [queueEvent]);

  const getAggregate = useCallback((): EngagementAggregate => {
    return { ...aggregateRef.current };
  }, []);

  return { recordQuestionResponse, recordReaction, recordBuddyChat, flush, getAggregate, computeAttention };
}
