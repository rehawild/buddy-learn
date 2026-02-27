import { useState, useEffect, useCallback, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import buddyImg from "@/assets/buddy-owl.png";
import type { Question } from "@/data/lessons";

interface BuddyOverlayProps {
  question: Question | null;
  difficulty: "easy" | "medium" | "hard";
  enabled: boolean;
  onAnswer: (correct: boolean) => void;
  onDismiss: () => void;
  readOnly?: boolean;
  chatHistory?: { role: "user" | "assistant"; content: string }[];
  isChatLoading?: boolean;
  onSendChat?: (message: string) => void;
}

export default function BuddyOverlay({
  question,
  difficulty,
  enabled,
  onAnswer,
  onDismiss,
  readOnly = false,
  chatHistory = [],
  isChatLoading = false,
  onSendChat,
}: BuddyOverlayProps) {
  const [phase, setPhase] = useState<"idle" | "question" | "feedback">("idle");
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const chatActiveRef = useRef(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // When a new question arrives, open dialog and enter question phase
  useEffect(() => {
    if (question && enabled) {
      setPhase("question");
      setUserAnswer("");
      setIsOpen(true);
      chatActiveRef.current = false;
    } else if (!question) {
      // Only reset phase if we're not in feedback (feedback has its own timer)
      if (phase !== "feedback") {
        setPhase("idle");
      }
    }
  }, [question, enabled]);

  // Auto-scroll chat when content changes
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading, phase]);

  const handleSubmit = useCallback(
    (answer: string) => {
      if (!question) return;
      const correct =
        answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
      setIsCorrect(correct);
      setPhase("feedback");
      onAnswer(correct);

      // Start auto-dismiss timer
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        if (!chatActiveRef.current) {
          setIsOpen(false);
          setPhase("idle");
        }
        onDismiss();
      }, 3500);
    },
    [question, onAnswer, onDismiss],
  );

  const handleClose = useCallback(() => {
    clearTimeout(dismissTimerRef.current);
    setIsOpen(false);
    setPhase("idle");
    chatActiveRef.current = false;
    setChatInput("");
    onDismiss();
  }, [onDismiss]);

  const handleSendChat = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed || !onSendChat) return;
    onSendChat(trimmed);
    setChatInput("");
  }, [chatInput, onSendChat]);

  const handleChatInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setChatInput(e.target.value);
      // Cancel auto-dismiss when student starts typing
      if (e.target.value.length > 0) {
        clearTimeout(dismissTimerRef.current);
        chatActiveRef.current = true;
      }
    },
    [],
  );

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendChat();
      }
      // Stop keyboard nav from firing on the slide
      e.stopPropagation();
    },
    [handleSendChat],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current);
  }, []);

  if (!enabled) return null;

  const hasChatCapability = !!onSendChat;
  const hasContent =
    phase !== "idle" || chatHistory.length > 0 || isChatLoading;

  return (
    <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2">
      {/* Dialog panel */}
      {isOpen && (
        <div className="w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden buddy-bounce">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-buddy flex-shrink-0">
              <img
                src={buddyImg}
                alt="Study Buddy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Study Buddy
              </p>
              <p className="text-xs text-muted-foreground">
                {phase === "question"
                  ? "Quick check!"
                  : phase === "feedback"
                    ? isCorrect
                      ? "Nice work!"
                      : "Keep trying!"
                    : "Ask me anything"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable message area */}
          <ScrollArea className="max-h-56">
            <div className="p-3 space-y-2">
              {/* Question bubble (buddy side) */}
              {phase !== "idle" && question && (
                <>
                  {/* Concept chip */}
                  {question.highlight && (
                    <div className="text-xs text-muted-foreground px-1">
                      Key concept:{" "}
                      <span className="text-buddy font-semibold">
                        "{question.highlight}"
                      </span>
                    </div>
                  )}

                  {/* Question text as buddy bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-3 py-2 rounded-lg bg-secondary text-sm text-foreground rounded-bl-none">
                      {question.question}
                    </div>
                  </div>

                  {/* Answer buttons — only during question phase */}
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
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(userAnswer);
                          }}
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

                  {/* Feedback bubble */}
                  {phase === "feedback" && (
                    <div className="flex justify-start fade-up">
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-lg rounded-bl-none text-sm ${
                          isCorrect
                            ? "bg-green-500/15 text-green-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-semibold mb-0.5">
                          <span>{isCorrect ? "✓" : "✗"}</span>
                          {isCorrect ? "Correct!" : "Not quite!"}
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          {isCorrect
                            ? question.reinforcement
                            : question.correction}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Chat history messages */}
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary/20 text-foreground rounded-br-none"
                        : "bg-secondary text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-secondary rounded-bl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Empty state when dialog is open but no content */}
              {!hasContent && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Ask me about the current slide!
                </p>
              )}

              {/* Scroll anchor */}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>

          {/* Chat input row — only when chat capability is available */}
          {hasChatCapability && (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-secondary/30">
              <input
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask a follow-up…"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-buddy"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isChatLoading}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mascot button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full overflow-hidden border-2 border-buddy buddy-pulse cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
      >
        <img
          src={buddyImg}
          alt="Study Buddy"
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  );
}
