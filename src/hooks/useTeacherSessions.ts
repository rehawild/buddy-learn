import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeacherSession {
  id: string;
  room_code: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  presentation_title: string | null;
  presentation_id: string | null;
}

export function useTeacherSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("id, room_code, status, started_at, ended_at, presentation_id, presentations(title)")
        .eq("teacher_id", user.id)
        .order("started_at", { ascending: false });

      if (error) {
        console.error("[useTeacherSessions] Error:", error.message);
        setLoading(false);
        return;
      }

      const mapped: TeacherSession[] = (data || []).map((row: any) => ({
        id: row.id,
        room_code: row.room_code,
        status: row.status,
        started_at: row.started_at,
        ended_at: row.ended_at,
        presentation_id: row.presentation_id,
        presentation_title: row.presentations?.title ?? null,
      }));

      setSessions(mapped);
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  return { sessions, loading };
}
