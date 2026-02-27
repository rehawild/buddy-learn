import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { lessons, type Question } from "@/data/lessons";
import MeetTopBar from "@/components/MeetTopBar";
import MeetBottomBar from "@/components/MeetBottomBar";
import BuddyOverlay from "@/components/BuddyOverlay";

export default function Presentation() {
  const navigate = useNavigate();
  const [lessonIdx, setLessonIdx] = useState(0);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [buddyEnabled, setBuddyEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [results, setResults] = useState<{ correct: number; total: number; concepts: string[] }>({
    correct: 0,
    total: 0,
    concepts: [],
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const lesson = lessons[lessonIdx];
  const section = lesson.sections[sectionIdx];
  const isLastSection = sectionIdx >= lesson.sections.length - 1;

  // Trigger buddy question after a delay when section changes
  useEffect(() => {
    if (!buddyEnabled) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Pick a question matching difficulty, fallback to any
      const matching = section.questions.filter((q) => q.difficulty === difficulty);
      const q = matching.length > 0 ? matching[0] : section.questions[0];
      if (q) setActiveQuestion(q);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [sectionIdx, lessonIdx, buddyEnabled, difficulty, section.questions]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setResults((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
        concepts: [...new Set([...prev.concepts, section.title])].slice(-5),
      }));
    },
    [section.title]
  );

  const handleDismiss = useCallback(() => setActiveQuestion(null), []);

  const nextSection = () => {
    if (isLastSection) {
      navigate("/recap", {
        state: {
          lessonTitle: lesson.title,
          ...results,
          concepts: [...new Set([...results.concepts, section.title])].slice(0, 3),
        },
      });
    } else {
      setSectionIdx((i) => i + 1);
      setActiveQuestion(null);
    }
  };

  const prevSection = () => {
    if (sectionIdx > 0) {
      setSectionIdx((i) => i - 1);
      setActiveQuestion(null);
    }
  };

  const switchLesson = () => {
    setLessonIdx((i) => (i + 1) % lessons.length);
    setSectionIdx(0);
    setActiveQuestion(null);
    setResults({ correct: 0, total: 0, concepts: [] });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <MeetTopBar title={lesson.title} onBack={() => navigate("/")} />

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-border slide-surface">
          {/* Slide content */}
          <div className="absolute inset-0 p-8 md:p-12 overflow-y-auto">
            {/* Lesson switcher */}
            <div className="flex items-center gap-2 mb-6">
              {lessons.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => { setLessonIdx(i); setSectionIdx(0); setActiveQuestion(null); setResults({ correct: 0, total: 0, concepts: [] }); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === lessonIdx
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.icon} {l.subject}
                </button>
              ))}
            </div>

            {/* Section */}
            <div className="fade-up" key={`${lessonIdx}-${sectionIdx}`}>
              <div className="text-xs text-muted-foreground mb-2 font-mono">
                Section {sectionIdx + 1} of {lesson.sections.length}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slide-fg mb-4">{section.title}</h2>
              <p className="text-base md:text-lg leading-relaxed text-slide-fg/80">{section.content}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
              <button
                onClick={prevSection}
                disabled={sectionIdx === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-secondary/50 text-slide-fg hover:bg-secondary"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={nextSection}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {isLastSection ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buddy */}
          <BuddyOverlay
            question={activeQuestion}
            difficulty={difficulty}
            enabled={buddyEnabled}
            onAnswer={handleAnswer}
            onDismiss={handleDismiss}
          />
        </div>
      </div>

      <MeetBottomBar
        buddyEnabled={buddyEnabled}
        onToggleBuddy={() => setBuddyEnabled((b) => !b)}
        difficulty={difficulty}
        onChangeDifficulty={setDifficulty}
      />
    </div>
  );
}
