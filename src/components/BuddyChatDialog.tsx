import { useState, useCallback, useRef, useEffect } from "react";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import buddyImg from "@/assets/buddy-owl.png";

interface BuddyChatDialogProps {
  chatHistory: { role: "user" | "assistant"; content: string }[];
  isChatLoading: boolean;
  onSendChat: (message: string) => void;
}

export default function BuddyChatDialog({
  chatHistory,
  isChatLoading,
  onSendChat,
}: BuddyChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  const handleSend = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    onSendChat(trimmed);
    setChatInput("");
  }, [chatInput, onSendChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      e.stopPropagation();
    },
    [handleSend],
  );

  return (
    <div className="absolute bottom-4 left-4 z-30 flex flex-col items-start gap-2">
      {/* Chat panel */}
      {isOpen && (
        <div className="w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden buddy-bounce">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-buddy flex-shrink-0">
              <img src={buddyImg} alt="Study Buddy" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Ask Buddy</p>
              <p className="text-xs text-muted-foreground">Chat about the lesson</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="max-h-64">
            <div className="p-3 space-y-2">
              {chatHistory.length === 0 && !isChatLoading && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Ask me anything about the current slide!
                </p>
              )}

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

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-secondary rounded-bl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-secondary/30">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this slide…"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-buddy"
            />
            <button
              onClick={handleSend}
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
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border-2 border-buddy shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-4 h-4 text-buddy" />
        <span className="text-xs font-semibold text-foreground">Chat</span>
      </button>
    </div>
  );
}
