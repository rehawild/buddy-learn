import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, BookOpen, GraduationCap } from "lucide-react";
import { lessons } from "@/data/lessons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateRoomCode } from "@/lib/room";

const subjectBadge: Record<string, string> = {
  STEM: "bg-primary/20 text-primary border border-primary/30",
  Humanities: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Finance: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

export default function Learn() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleTeach = async (lessonId: string) => {
    if (!user || role !== "teacher") {
      navigate("/auth");
      return;
    }
    setLoadingId(lessonId);
    const code = generateRoomCode();
    await supabase.from("sessions").insert({
      teacher_id: user.id,
      presentation_id: null,
      room_code: code,
      status: "active",
    });
    navigate(`/lobby?room=${code}&lesson=${lessonId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <button
          onClick={() => navigate(user ? "/" : "/landing")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Video className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Finny</span>
        </button>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-mono uppercase tracking-widest">
            <BookOpen className="w-4 h-4" />
            Course Catalog
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Browse lessons</h1>
          <p className="text-lg text-muted-foreground">
            Pick a course and teach it live with Finny — no upload needed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lessons.map((lesson) => {
            const questionCount = lesson.sections.reduce((n, s) => n + s.questions.length, 0);
            return (
              <div
                key={lesson.id}
                className="group flex flex-col p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{lesson.icon}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${subjectBadge[lesson.subject] ?? "bg-muted text-muted-foreground"}`}>
                    {lesson.subject}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground leading-snug mb-1">{lesson.title}</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {lesson.sections.length} slides · {questionCount} questions
                </p>
                <button
                  onClick={() => handleTeach(lesson.id)}
                  disabled={loadingId === lesson.id}
                  className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loadingId === lesson.id ? (
                    <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  Teach this course
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
