import { useState, useEffect, useCallback, useRef } from "react";
import { X, Pin, PinOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Question } from "@/data/lessons";
import type { BuddyMood } from "@/hooks/useBuddyMood";
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
  mood?: BuddyMood;
  moodSrc?: string;
}

export default function BuddyOverlay({
  question,
  difficulty,
  enabled,
  onAnswer,
  onDismiss,
  readOnly = false,
  questionSource,
  moodSrc,
}: BuddyOverlayProps) {
  const [phase, setPhase] = useState<"idle" | "question" | "feedback">("idle");
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [pos, setPos] = useState(WAYPOINTS[0]);
  const [pinned, setPinned] = useState(false);
  const waypointIdxRef = useRef(0);
  const floatPausedRef = useRef(false);

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, moved: false });

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

  useEffect(() => { floatPausedRef.current = isOpen || pinned; }, [isOpen, pinned]);

  useEffect(() => {
    if (question && enabled) {
      setPhase("question");
      setUserAnswer("");
      setIsOpen(true);
      if (!pinned) setPos(SAFE_POS);
    } else if (!question) {
      if (phase !== "feedback") setPhase("idle");
    }
  }, [question, enabled, pinned]);

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
        if (!pinned) setPos(WAYPOINTS[waypointIdxRef.current]);
        onDismiss();
      }, 3500);
    },
    [question, onAnswer, onDismiss, pinned],
  );

  const handleClose = useCallback(() => {
    clearTimeout(dismissTimerRef.current);
    setIsOpen(false);
    setPhase("idle");
    if (!pinned) setPos(WAYPOINTS[waypointIdxRef.current]);
    onDismiss();
  }, [onDismiss, pinned]);

  const pointerToPercent = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, moved: false };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.abs(dx) + Math.abs(dy) > 5) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      const pct = pointerToPercent(e.clientX, e.clientY);
      if (pct) setPos(pct);
    }
  }, [pointerToPercent]);

  const handleDragEnd = useCallback(() => {
    const wasDrag = dragRef.current.moved;
    dragRef.current = { active: false, startX: 0, startY: 0, moved: false };
    setDragging(false);
    if (wasDrag) setPinned(true);
  }, []);

  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current);
  }, []);

  if (!enabled) return null;

  // When dialog is open, clamp the center point so the full assembly stays in bounds.
  // Assembly: dialog (ScrollArea max-h-48 + header + padding ≈ 16.5rem) + gap (0.5rem) + mascot (4rem) ≈ 21rem tall, 20rem wide.
  // translate(-50%,-50%) centers at the point, so clamp by half-size + small buffer.
  const dialogOpen = isOpen && phase !== "idle" && !!question;
  const nearTop = pos.y < 35;

  const easing = "cubic-bezier(0.25, 0.1, 0.25, 1)";
  const transitionDuration = dragging ? "0ms" : isOpen ? "600ms" : `${FLOAT_STEP_MS}ms`;

  return (
    <div ref={containerRef} className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      <div
        className={`absolute flex ${nearTop && dialogOpen ? "flex-col-reverse" : "flex-col"} items-end gap-2`}
        style={{
          left: dialogOpen
            ? `clamp(10.5rem, ${pos.x}%, calc(100% - 10.5rem))`
            : `clamp(2.5rem, ${pos.x}%, calc(100% - 2.5rem))`,
          top: dialogOpen
            ? `clamp(11rem, ${pos.y}%, calc(100% - 11rem))`
            : `clamp(2.5rem, ${pos.y}%, calc(100% - 2.5rem))`,
          transform: "translate(-50%, -50%)",
          transition: `left ${transitionDuration} ${easing}, top ${transitionDuration} ${easing}`,
        }}
      >
        {/* Dialog panel */}
        {dialogOpen && (
          <div className="w-80 max-w-[min(20rem,calc(100vw-3rem))] bg-card border border-border rounded-xl shadow-2xl overflow-hidden buddy-bounce pointer-events-auto">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/50">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-buddy flex-shrink-0">
                <img src={moodSrc || mascotImg} alt="Catchy" className="w-full h-full object-cover transition-opacity duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">Catchy</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {phase === "question" ? "Quick check!" : isCorrect ? "Nice work!" : "Keep trying!"}
                </p>
              </div>
              {questionSource && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${
                  questionSource === "transcript"
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-primary/20 text-primary"
                }`}>
                  {questionSource === "transcript" ? "From discussion" : "From slides"}
                </span>
              )}
              <button
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Question content */}
            <ScrollArea className="max-h-48">
              <div className="p-3 space-y-2">
                {question.highlight && (
                  <div className="text-xs text-muted-foreground px-1">
                    Key concept: <span className="text-buddy font-semibold">"{question.highlight}"</span>
                  </div>
                )}

                <div className="flex justify-start">
                  <div className="max-w-[90%] px-3 py-2 rounded-lg bg-secondary text-sm text-foreground rounded-bl-none leading-relaxed">
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
                    <div className={`max-w-[90%] px-3 py-2 rounded-lg rounded-bl-none text-sm ${
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

        {/* Mascot button + pin */}
        <div className="relative group flex-shrink-0 pointer-events-auto">
          <div
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={() => {
              const wasDrag = dragRef.current.moved;
              handleDragEnd();
              if (!wasDrag) setIsOpen((prev) => !prev);
            }}
            className={`w-16 h-16 rounded-full overflow-hidden border-2 border-buddy cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-lg touch-none select-none ${pinned || dragging ? "" : "buddy-float"}`}
          >
            <img src={moodSrc || mascotImg} alt="Catchy" className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" draggable={false} />
          </div>
          <button
            onClick={() => setPinned((p) => !p)}
            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border border-border shadow-md transition-all ${
              pinned
                ? "bg-primary text-primary-foreground opacity-100"
                : "bg-card text-muted-foreground opacity-0 group-hover:opacity-100"
            }`}
            title={pinned ? "Unpin buddy" : "Pin buddy in place"}
          >
            {pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
