import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Question } from "@/data/lessons";
import mascotImg from "@/assets/catchy.png";

const WAYPOINTS = [
  { x: 85, y: 75 },
  { x: 80, y: 25 },
  { x: 15, y: 20 },
  { x: 15, y: 65 },
  { x: 45, y: 72 },
  { x: 85, y: 75 },
];

const SAFE_POS = { x: 75, y: 55 };
const FLOAT_STEP_MS = 14000;

interface BuddyOverlayProps {
  question: Question | null;
  difficulty: "easy" | "medium" | "hard";
  enabled: boolean;
  onAnswer: (correct: boolean) => void;
  onDismiss: () => void;
  readOnly?: boolean;
  questionSource?: "slides" | "transcript";
}

export default function BuddyOverlay({
  question,
  difficulty,
  enabled,
  onAnswer,
  onDismiss,
  readOnly = false,
  questionSource,
}: BuddyOverlayProps) {
  const [phase, setPhase] = useState<"idle" | "question" | "feedback">("idle");
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [pos, setPos] = useState(WAYPOINTS[0]);
  const waypointIdxRef = useRef(0);
  const floatPausedRef = useRef(false);

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const advance = () => {
      if (floatPausedRef.current) return;
      waypointIdxRef.current = (waypointIdxRef.current + 1) % WAYPOINTS.length;
      setPos(WAYPOINTS[waypointIdxRef.current]);
    };
    const timer = setInterval(advance, FLOAT_STEP_MS);
    return () => clearInterval(timer);
  }, [enabled]);

  useEffect(() => { floatPausedRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    if (question && enabled) {
      setPhase("question");
      setUserAnswer("");
      setIsOpen(true);
      setPos(SAFE_POS);
    } else if (!question) {
      if (phase !== "feedback") setPhase("idle");
    }
  }, [question, enabled]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase]);

  const handleSubmit = useCallback(
    (answer: string) => {
      if (!question) return;
      const correct = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
      setIsCorrect(correct);
      setPhase("feedback");
      onAnswer(correct);

      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        setPhase("idle");
        setPos(WAYPOINTS[waypointIdxRef.current]);
        onDismiss();
      }, 3500);
    },
    [question, onAnswer, onDismiss],
  );

  const handleClose = useCallback(() => {
    clearTimeout(dismissTimerRef.current);
    setIsOpen(false);
    setPhase("idle");
    setPos(WAYPOINTS[waypointIdxRef.current]);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current);
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="absolute z-30 flex flex-col items-end gap-2 pointer-events-none"
      style={{
        left: `clamp(10%, ${pos.x}%, 90%)`,
        top: `clamp(5%, ${pos.y}%, 85%)`,
        transform: "translate(-50%, -50%)",
        transition: isOpen
          ? "left 600ms cubic-bezier(0.25, 0.1, 0.25, 1), top 600ms cubic-bezier(0.25, 0.1, 0.25, 1)"
          : `left ${FLOAT_STEP_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1), top ${FLOAT_STEP_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
      }}
    >
      {/* Dialog panel */}
      {isOpen && phase !== "idle" && question && (
        <div className="w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden buddy-bounce pointer-events-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-buddy flex-shrink-0">
              <img src={mascotImg} alt="Catchy" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Catchy</p>
              <p className="text-xs text-muted-foreground">
                {phase === "question" ? "Quick check!" : isCorrect ? "Nice work!" : "Keep trying!"}
              </p>
            </div>
            {questionSource && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                questionSource === "transcript"
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-primary/20 text-primary"
              }`}>
                {questionSource === "transcript" ? "From discussion" : "From slides"}
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Question content */}
          <ScrollArea className="max-h-56">
            <div className="p-3 space-y-2">
              {question.highlight && (
                <div className="text-xs text-muted-foreground px-1">
                  Key concept: <span className="text-buddy font-semibold">"{question.highlight}"</span>
                </div>
              )}

              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-lg bg-secondary text-sm text-foreground rounded-bl-none">
                  {question.question}
                </div>
              </div>

              {phase === "question" && (
                <div className="fade-up">
                  {question.type === "choice" && question.options ? (
                    <div className="flex gap-2 px-1">
                      {question.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => !readOnly && handleSubmit(opt)}
                          disabled={readOnly}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors font-medium ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSubmit(userAnswer); }}
                      className="flex gap-2 px-1"
                    >
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Type your answer…"
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-buddy"
                        autoFocus
                      />
                      <button type="submit" className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                        Go
                      </button>
                    </form>
                  )}
                </div>
              )}

              {phase === "feedback" && (
                <div className="flex justify-start fade-up">
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg rounded-bl-none text-sm ${
                    isCorrect ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"
                  }`}>
                    <div className="flex items-center gap-1 font-semibold mb-0.5">
                      <span>{isCorrect ? "✓" : "✗"}</span>
                      {isCorrect ? "Correct!" : "Not quite!"}
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {isCorrect ? question.reinforcement : question.correction}
                    </p>
                  </div>
                </div>
              )}

              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Mascot button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-16 h-16 rounded-full overflow-hidden border-2 border-buddy buddy-float cursor-pointer hover:scale-110 transition-transform flex-shrink-0 shadow-lg pointer-events-auto"
      >
        <img src={mascotImg} alt="Catchy" className="w-full h-full object-cover" />
      </button>
    </div>
  );
}
