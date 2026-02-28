import { useState, useEffect, useRef } from "react";

export type BuddyMood = "happy" | "thinking" | "sad" | "wave" | "idle";

const MOOD_SRCS: Record<BuddyMood, string> = {
  happy: "/happy.gif",
  thinking: "/thinking.gif",
  sad: "/sad.gif",
  wave: "/wave.gif",
  idle: "/idle.gif",
};

const DEBOUNCE_MS = 3_000;
const GREETING_DURATION_MS = 10_000;
const WAVE_ON_RETURN_MS = 4_000;
const ATTENTION_POLL_MS = 3_000;

interface UseBuddyMoodParams {
  computeAttention: () => number;
  phase: "idle" | "question" | "feedback";
  isCorrect: boolean;
  enabled: boolean;
}

export function useBuddyMood({
  computeAttention,
  phase,
  isCorrect,
  enabled,
}: UseBuddyMoodParams): { mood: BuddyMood; moodSrc: string } {
  const [mood, setMood] = useState<BuddyMood>("wave");
  const moodRef = useRef<BuddyMood>("wave");
  const lastMoodChangeRef = useRef(Date.now());
  const greetingActiveRef = useRef(true);
  const waveOverrideRef = useRef(false);

  const changeMood = (newMood: BuddyMood) => {
    if (newMood !== moodRef.current) {
      moodRef.current = newMood;
      setMood(newMood);
      lastMoodChangeRef.current = Date.now();
    }
  };

  // Greeting phase: show wave for first 10s
  useEffect(() => {
    if (!enabled) return;
    greetingActiveRef.current = true;
    const timer = setTimeout(() => {
      greetingActiveRef.current = false;
    }, GREETING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Tab return detection → brief wave
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        !greetingActiveRef.current
      ) {
        waveOverrideRef.current = true;
        changeMood("wave");
        setTimeout(() => {
          waveOverrideRef.current = false;
        }, WAVE_ON_RETURN_MS);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled]);

  // Main mood computation on a 3s interval
  useEffect(() => {
    if (!enabled) return;

    const compute = () => {
      // Wave overrides (greeting / tab-return) take priority
      if (greetingActiveRef.current || waveOverrideRef.current) {
        changeMood("wave");
        return;
      }

      // Debounce: skip if last change was < 3s ago
      if (Date.now() - lastMoodChangeRef.current < DEBOUNCE_MS) return;

      let newMood: BuddyMood;

      if (phase === "question") {
        newMood = "thinking";
      } else if (phase === "feedback") {
        newMood = isCorrect ? "happy" : "sad";
      } else {
        const attention = computeAttention();
        if (attention >= 70) {
          newMood = "happy";
        } else if (attention < 40) {
          newMood = "sad";
        } else {
          newMood = "idle";
        }
      }

      changeMood(newMood);
    };

    compute();
    const interval = setInterval(compute, ATTENTION_POLL_MS);
    return () => clearInterval(interval);
  }, [enabled, phase, isCorrect, computeAttention]);

  if (!enabled) {
    return { mood: "happy", moodSrc: MOOD_SRCS.happy };
  }

  return { mood, moodSrc: MOOD_SRCS[mood] };
}
