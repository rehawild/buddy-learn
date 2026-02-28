import { useEffect, useState } from "react";
import { Check, X, MessageSquareText } from "lucide-react";
import type { PendingTranscriptQuestion } from "@/types/agent";

interface TranscriptApprovalQueueProps {
  pendingQuestions: PendingTranscriptQuestion[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}

function CountdownBar({ expiresAt }: { expiresAt: number }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const total = 30_000;
    const update = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setProgress((remaining / total) * 100);
    };
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-purple-500 transition-all duration-200 ease-linear rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function TranscriptApprovalQueue({
  pendingQuestions,
  onApprove,
  onDismiss,
}: TranscriptApprovalQueueProps) {
  if (pendingQuestions.length === 0) return null;

  const visible = pendingQuestions.slice(0, 3);
  const overflow = pendingQuestions.length - visible.length;

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 w-72">
      {visible.map((pq) => (
        <div
          key={pq.id}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 animate-in slide-in-from-right duration-300"
        >
          <CountdownBar expiresAt={pq.expiresAt} />

          <div className="flex items-center gap-1.5 mt-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-semibold">
              <MessageSquareText className="w-3 h-3" />
              From discussion
            </span>
            <span className="text-[10px] text-muted-foreground">
              Slide {pq.slideIndex + 1}
            </span>
          </div>

          <p className="text-xs text-foreground leading-snug line-clamp-2 mb-2">
            {pq.question.question}
          </p>

          {pq.question.options && (
            <div className="flex gap-1.5 mb-2">
              {pq.question.options.map((opt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground truncate max-w-[45%]"
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            <button
              onClick={() => onApprove(pq.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={() => onDismiss(pq.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss
            </button>
          </div>
        </div>
      ))}

      {overflow > 0 && (
        <div className="text-center text-[10px] text-muted-foreground font-medium">
          +{overflow} more pending
        </div>
      )}
    </div>
  );
}
