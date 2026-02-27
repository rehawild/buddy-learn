import { useState, useEffect, useCallback } from "react";
import buddyImg from "@/assets/buddy-owl.png";
import type { Question } from "@/data/lessons";

interface BuddyOverlayProps {
  question: Question | null;
  difficulty: "easy" | "medium" | "hard";
  enabled: boolean;
  onAnswer: (correct: boolean) => void;
  onDismiss: () => void;
  readOnly?: boolean;
}

export default function BuddyOverlay({ question, difficulty, enabled, onAnswer, onDismiss }: BuddyOverlayProps) {
  const [phase, setPhase] = useState<"idle" | "question" | "feedback">("idle");
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (question && enabled) {
      setPhase("question");
      setUserAnswer("");
    } else {
      setPhase("idle");
    }
  }, [question, enabled]);

  const handleSubmit = useCallback((answer: string) => {
    if (!question) return;
    const correct = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
    setIsCorrect(correct);
    setPhase("feedback");
    onAnswer(correct);
    setTimeout(() => {
      setPhase("idle");
      onDismiss();
    }, 3500);
  }, [question, onAnswer, onDismiss]);

  if (!enabled) return null;

  // Idle: small avatar in corner
  if (phase === "idle") {
    return (
      <div className="absolute bottom-4 right-4 z-20">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-buddy buddy-pulse cursor-default">
          <img src={buddyImg} alt="Study Buddy" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-30 w-80 buddy-bounce">
      <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-buddy flex-shrink-0">
            <img src={buddyImg} alt="Study Buddy" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Study Buddy</p>
            <p className="text-xs text-muted-foreground">Quick check!</p>
          </div>
        </div>

        {phase === "question" && question && (
          <div className="p-4 space-y-3 fade-up">
            {/* Highlight */}
            <div className="text-xs text-muted-foreground">
              Key concept: <span className="text-buddy font-semibold">"{question.highlight}"</span>
            </div>

            {/* Question */}
            <p className="text-sm font-medium text-foreground">{question.question}</p>

            {/* Answer input */}
            {question.type === "choice" && question.options ? (
              <div className="flex gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSubmit(opt)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(userAnswer); }} className="flex gap-2">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer…"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-buddy"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                  Go
                </button>
              </form>
            )}
          </div>
        )}

        {phase === "feedback" && question && (
          <div className="p-4 space-y-2 fade-up">
            <div className={`flex items-center gap-2 text-sm font-semibold ${isCorrect ? "text-correct" : "text-incorrect"}`}>
              <span className="text-lg">{isCorrect ? "✓" : "✗"}</span>
              {isCorrect ? "Correct!" : "Not quite!"}
            </div>
            <p className="text-sm text-secondary-foreground leading-relaxed">
              {isCorrect ? question.reinforcement : question.correction}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
