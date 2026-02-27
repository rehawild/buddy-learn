import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──

export interface StudentRow {
  studentId: string;
  name: string;
  questionsAnswered: number;
  correctAnswers: number;
  avgResponseTime: number;
  reactionsCount: number;
  buddyInteractions: number;
  attentionScore: number;
  tabSwitchCount: number;
  idleCount: number;
}

export interface TimelinePoint {
  time: string;
  attention: number;
  participation: number;
}

export interface DifficultyBreakdown {
  difficulty: string;
  total: number;
  correct: number;
}

export interface ReactionSummary {
  emoji: string;
  label: string;
  count: number;
}

const EMOJI_LABELS: Record<string, string> = {
  "👍": "Thumbs Up",
  "🔥": "Fire",
  "❓": "Confused",
  "💡": "Lightbulb",
  "😂": "Funny",
  "👏": "Clap",
};

// ── Hook ──

export function useSessionEngagement(sessionId: string | null) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<DifficultyBreakdown[]>([]);
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setStudents([]);
      setTimeline([]);
      setDifficultyBreakdown([]);
      setReactions([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch all data in parallel
      const [engagementResult, eventsResult] = await Promise.all([
        supabase
          .from("session_engagement")
          .select("*")
          .eq("session_id", sessionId),
        supabase
          .from("engagement_events")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
      ]);

      // ── Students ──
      const engagementRows = engagementResult.data || [];
      const events = eventsResult.data || [];

      // Count tab_switch and idle events per student
      const tabSwitchCounts = new Map<string, number>();
      const idleCounts = new Map<string, number>();
      for (const evt of events) {
        if (evt.event_type === "tab_switch") {
          const payload = evt.payload as Record<string, unknown>;
          if (!payload.visible) {
            tabSwitchCounts.set(evt.student_id, (tabSwitchCounts.get(evt.student_id) || 0) + 1);
          }
        }
        if (evt.event_type === "idle_start") {
          idleCounts.set(evt.student_id, (idleCounts.get(evt.student_id) || 0) + 1);
        }
      }

      const studentRows: StudentRow[] = engagementRows.map((row) => ({
        studentId: row.student_id,
        name: row.student_name || "Anonymous",
        questionsAnswered: row.questions_answered || 0,
        correctAnswers: row.correct_answers || 0,
        avgResponseTime: row.avg_response_time ? row.avg_response_time / 1000 : 0,
        reactionsCount: row.reactions_count || 0,
        buddyInteractions: row.buddy_interactions || 0,
        attentionScore: row.attention_score || 0,
        tabSwitchCount: tabSwitchCounts.get(row.student_id) || 0,
        idleCount: idleCounts.get(row.student_id) || 0,
      }));
      setStudents(studentRows);

      // ── Timeline: bucket attention_snapshot events by 2-minute intervals ──
      const snapshots = events.filter((e) => e.event_type === "attention_snapshot");
      if (snapshots.length > 0) {
        const startTime = new Date(snapshots[0].created_at).getTime();
        const buckets = new Map<number, { totalScore: number; count: number }>();

        for (const snap of snapshots) {
          const t = new Date(snap.created_at).getTime();
          const bucket = Math.floor((t - startTime) / 120_000); // 2-minute buckets
          const existing = buckets.get(bucket) || { totalScore: 0, count: 0 };
          const payload = snap.payload as Record<string, unknown>;
          existing.totalScore += (payload.score as number) || 0;
          existing.count++;
          buckets.set(bucket, existing);
        }

        const timelineData: TimelinePoint[] = [];
        for (const [bucket, data] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
          const minutes = bucket * 2;
          timelineData.push({
            time: `${minutes}:00`,
            attention: Math.round(data.totalScore / data.count),
            participation: Math.min(100, Math.round((data.count / studentRows.length) * 100)),
          });
        }
        setTimeline(timelineData);
      } else {
        setTimeline([]);
      }

      // ── Difficulty breakdown ──
      const questionResponses = events.filter((e) => e.event_type === "question_response");
      const diffMap = new Map<string, { total: number; correct: number }>();
      for (const evt of questionResponses) {
        const payload = evt.payload as Record<string, unknown>;
        // Default difficulty based on slide position if not available
        const diff = (payload.difficulty as string) || "medium";
        const existing = diffMap.get(diff) || { total: 0, correct: 0 };
        existing.total++;
        if (payload.correct) existing.correct++;
        diffMap.set(diff, existing);
      }
      // Ensure all three difficulties exist
      for (const d of ["easy", "medium", "hard"]) {
        if (!diffMap.has(d)) diffMap.set(d, { total: 0, correct: 0 });
      }
      setDifficultyBreakdown(
        ["easy", "medium", "hard"].map((d) => ({
          difficulty: d,
          total: diffMap.get(d)!.total,
          correct: diffMap.get(d)!.correct,
        })),
      );

      // ── Reactions ──
      const reactionEvents = events.filter((e) => e.event_type === "reaction");
      const emojiCounts = new Map<string, number>();
      for (const evt of reactionEvents) {
        const payload = evt.payload as Record<string, unknown>;
        const emoji = payload.emoji as string;
        if (emoji) {
          emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1);
        }
      }
      const reactionSummary: ReactionSummary[] = Array.from(emojiCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([emoji, count]) => ({
          emoji,
          label: EMOJI_LABELS[emoji] || emoji,
          count,
        }));
      setReactions(reactionSummary);

      setLoading(false);
    };

    fetchData();
  }, [sessionId]);

  return { students, timeline, difficultyBreakdown, reactions, loading };
}
