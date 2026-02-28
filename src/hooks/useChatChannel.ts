import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

export function useChatChannel(roomCode: string | null, userName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase.channel(`chat:${roomCode}`);
    channel.on("broadcast", { event: "chat_message" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as ChatMessage]);
    });
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const msg: ChatMessage = {
        sender: userName,
        text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, msg]);

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "chat_message",
          payload: msg,
        });
      }
    },
    [userName],
  );

  return { messages, sendMessage };
}
