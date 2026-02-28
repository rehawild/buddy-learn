import { useState } from "react";
import { BookOpen, Send, X } from "lucide-react";
import type { SlideQuestionBank } from "@/types/agent";

interface SlideQuestionSuggestionsProps {
  questionBank: SlideQuestionBank[] | null;
  currentSlideIndex: number;
  onDispatchSingle: (slideIndex: number, questionIndex: number) => void;
  isQuestionDispatched: (slideIndex: number, questionIndex: number) => boolean;
}

export default function SlideQuestionSuggestions({
  questionBank,
  currentSlideIndex,
  onDispatchSingle,
  isQuestionDispatched,
}: SlideQuestionSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!questionBank) return null;

  const slideEntry = questionBank.find((s) => s.slideIndex === currentSlideIndex);
  if (!slideEntry) return null;

  const undispatched = slideEntry.questions
    .map((q, i) => ({ question: q, questionIndex: i }))
    .filter(
      ({ questionIndex }) =>
        !isQuestionDispatched(currentSlideIndex, questionIndex) &&
        !dismissed.has(`${currentSlideIndex}-${questionIndex}`),
    );

  if (undispatched.length === 0) return null;

  const visible = undispatched.slice(0, 2);
  const overflow = undispatched.length - visible.length;

  const handleDismiss = (questionIndex: number) => {
    setDismissed((prev) => new Set(prev).add(`${currentSlideIndex}-${questionIndex}`));
  };

  return (
    <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 w-72">
      {visible.map(({ question, questionIndex }) => (
        <div
          key={`${currentSlideIndex}-${questionIndex}`}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 animate-in slide-in-from-left duration-300"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
              <BookOpen className="w-3 h-3" />
              From slides
            </span>
            <span className="text-[10px] text-muted-foreground">
              Slide {currentSlideIndex + 1}
            </span>
          </div>

          <p className="text-xs text-foreground leading-snug line-clamp-2 mb-2">
            {question.question}
          </p>

          {question.options && (
            <div className="flex gap-1.5 mb-2">
              {question.options.map((opt, i) => (
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
              onClick={() => onDispatchSingle(currentSlideIndex, questionIndex)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
            <button
              onClick={() => handleDismiss(questionIndex)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>
        </div>
      ))}

      {overflow > 0 && (
        <div className="text-center text-[10px] text-muted-foreground font-medium">
          +{overflow} more available
        </div>
      )}
    </div>
  );
}
