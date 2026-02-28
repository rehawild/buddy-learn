import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useChatChannel";

interface Notification {
  id: string;
  sender: string;
  text: string;
}

interface ChatNotificationsProps {
  messages: ChatMessage[];
  userName: string;
  chatOpen: boolean;
}

const MAX_VISIBLE = 3;

export default function ChatNotifications({ messages, userName, chatOpen }: ChatNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevLengthRef = useRef(messages.length);

  useEffect(() => {
    const prevLength = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (messages.length <= prevLength) return;

    const newMessages = messages.slice(prevLength);
    for (const msg of newMessages) {
      if (msg.sender === userName || chatOpen) continue;

      const id = crypto.randomUUID();
      setNotifications((prev) =>
        [...prev, { id, sender: msg.sender, text: msg.text }].slice(-MAX_VISIBLE),
      );

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    }
  }, [messages, userName, chatOpen]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="chat-notify max-w-xs px-3 py-2 rounded-lg bg-card border border-border shadow-lg pointer-events-auto"
        >
          <span className="text-xs font-semibold text-primary">{n.sender}</span>
          <p className="text-sm text-foreground truncate">{n.text}</p>
        </div>
      ))}
    </div>
  );
}
