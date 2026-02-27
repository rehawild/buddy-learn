import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const EMOJIS = ["👍", "🔥", "❓", "👏", "😂", "💡"];

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

interface EmojiReactionsProps {
  roomCode: string | null;
  onReaction?: (emoji: string) => void;
}

export default function EmojiReactions({ roomCode, onReaction }: EmojiReactionsProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    const channel = supabase.channel(`reactions:${roomCode}`);
    channel.on("broadcast", { event: "emoji_reaction" }, ({ payload }) => {
      addFloating(payload.emoji);
    });
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode]);

  const addFloating = useCallback((emoji: string) => {
    const id = crypto.randomUUID();
    const x = 10 + Math.random() * 80;
    setFloating((prev) => [...prev.slice(-15), { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((e) => e.id !== id)), 2500);
  }, []);

  const handleClick = (emoji: string) => {
    addFloating(emoji);
    onReaction?.(emoji);
    if (roomCode && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "emoji_reaction",
        payload: { emoji },
      });
    }
  };

  return (
    <>
      {/* Floating emojis */}
      <div className="fixed bottom-24 right-4 w-20 pointer-events-none z-50">
        {floating.map((f) => (
          <div
            key={f.id}
            className="absolute emoji-float text-2xl"
            style={{ left: `${f.x}%`, bottom: 0 }}
          >
            {f.emoji}
          </div>
        ))}
      </div>

      {/* Reaction bar */}
      <div className="flex items-center gap-0.5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-base hover:scale-125 active:scale-90 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
