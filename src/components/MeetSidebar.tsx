import { X, Send, Users, MessageSquare, Hand } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { RoomParticipant } from "@/hooks/useRealtimeRoom";
import type { ChatMessage } from "@/hooks/useChatChannel";

interface MeetSidebarProps {
  panel: "chat" | "people";
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  realtimeParticipants?: RoomParticipant[];
  isTeacher?: boolean;
  onLowerHand?: (targetId: string) => void;
}

export default function MeetSidebar({ panel, onClose, messages, onSendMessage, realtimeParticipants = [], isTeacher = false, onLowerHand }: MeetSidebarProps) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
  };

  return (
    <div className="w-80 h-full bg-meet-bar border-l border-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          {panel === "chat" ? <MessageSquare className="w-4 h-4 text-foreground" /> : <Users className="w-4 h-4 text-foreground" />}
          <span className="text-sm font-semibold text-foreground">{panel === "chat" ? "In-call messages" : "People"}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {panel === "people" ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {realtimeParticipants.length > 0
            ? [...realtimeParticipants]
                .sort((a, b) => (b.handRaised ? 1 : 0) - (a.handRaised ? 1 : 0))
                .map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                  {p.handRaised && (
                    <Hand className="w-4 h-4 text-buddy-warm animate-bounce flex-shrink-0" />
                  )}
                  {p.handRaised && isTeacher && onLowerHand && (
                    <button
                      onClick={() => onLowerHand(p.id)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-buddy-warm/15 text-buddy-warm hover:bg-buddy-warm/25 transition-colors flex-shrink-0"
                    >
                      Lower
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{p.role}</span>
                </div>
              ))
            : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No participants yet
              </div>
            )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-foreground">{m.sender}</span>
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                </div>
                <p className="text-sm text-secondary-foreground">{m.text}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message…"
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
