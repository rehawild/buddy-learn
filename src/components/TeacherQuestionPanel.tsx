import { useMemo } from "react";
import { X, Send, CheckCircle2, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { SlideQuestionBank } from "@/types/agent";
import type { Question } from "@/data/lessons";

interface TopicGroup {
  topic: string;
  questions: { slideIndex: number; questionIndex: number; question: Question }[];
}

interface TeacherQuestionPanelProps {
  questionBank: SlideQuestionBank[] | null;
  isPreGenerating: boolean;
  preGenerateError: string | null;
  onDispatchSingle: (slideIndex: number, questionIndex: number) => void;
  onDispatchAll: () => void;
  isQuestionDispatched: (slideIndex: number, questionIndex: number) => boolean;
  dispatchCount: number;
  onClose: () => void;
}

const diffColors = {
  easy: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/15 text-red-400 border-red-500/30",
} as const;

export default function TeacherQuestionPanel({
  questionBank,
  isPreGenerating,
  preGenerateError,
  onDispatchSingle,
  onDispatchAll,
  isQuestionDispatched,
  dispatchCount,
  onClose,
}: TeacherQuestionPanelProps) {
  // Group questions by topic
  const topicGroups = useMemo(() => {
    if (!questionBank) return [];

    const groupMap = new Map<string, TopicGroup["questions"]>();

    for (const slideBank of questionBank) {
      for (let qIdx = 0; qIdx < slideBank.questions.length; qIdx++) {
        const q = slideBank.questions[qIdx];
        const topic = q.topic || `Slide ${slideBank.slideIndex + 1}`;

        if (!groupMap.has(topic)) {
          groupMap.set(topic, []);
        }
        groupMap.get(topic)!.push({
          slideIndex: slideBank.slideIndex,
          questionIndex: qIdx,
          question: q,
        });
      }
    }

    return Array.from(groupMap.entries()).map(([topic, questions]) => ({
      topic,
      questions,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionBank, dispatchCount]);

  const totalQuestions = topicGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const sentCount = topicGroups.reduce(
    (sum, g) =>
      sum + g.questions.filter((q) => isQuestionDispatched(q.slideIndex, q.questionIndex)).length,
    0,
  );
  const allSent = totalQuestions > 0 && sentCount === totalQuestions;

  return (
    <div className="w-80 h-full bg-meet-bar border-l border-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Questions</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status bar */}
      <div className="px-4 py-3 border-b border-border">
        {isPreGenerating ? (
          <div className="flex items-center gap-2 text-primary text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>AI analyzing presentation...</span>
          </div>
        ) : preGenerateError ? (
          <div className="flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="truncate">{preGenerateError}</span>
          </div>
        ) : questionBank ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>
                {sentCount}/{totalQuestions} sent
              </span>
            </div>
            <button
              onClick={onDispatchAll}
              disabled={allSent}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                allSent
                  ? "bg-green-500/15 text-green-400 cursor-default"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {allSent ? "All sent" : "Send all"}
            </button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No questions generated yet</div>
        )}
      </div>

      {/* Question list */}
      <ScrollArea className="flex-1">
        {topicGroups.length > 0 && (
          <Accordion type="multiple" defaultValue={topicGroups.map((g) => g.topic)} className="px-3">
            {topicGroups.map((group) => {
              const groupSent = group.questions.filter((q) =>
                isQuestionDispatched(q.slideIndex, q.questionIndex),
              ).length;

              return (
                <AccordionItem key={group.topic} value={group.topic} className="border-border">
                  <AccordionTrigger className="py-3 text-xs font-semibold text-foreground hover:no-underline">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{group.topic}</span>
                      <Badge
                        variant={groupSent === group.questions.length ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {groupSent}/{group.questions.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pt-0">
                    <div className="space-y-2">
                      {group.questions.map((item) => {
                        const sent = isQuestionDispatched(item.slideIndex, item.questionIndex);
                        return (
                          <QuestionCard
                            key={`${item.slideIndex}-${item.questionIndex}`}
                            slideIndex={item.slideIndex}
                            question={item.question}
                            sent={sent}
                            onSend={() => onDispatchSingle(item.slideIndex, item.questionIndex)}
                          />
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
}

function QuestionCard({
  slideIndex,
  question,
  sent,
  onSend,
}: {
  slideIndex: number;
  question: Question;
  sent: boolean;
  onSend: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              Slide {slideIndex + 1}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0 rounded-full border ${diffColors[question.difficulty]}`}
            >
              {question.difficulty}
            </span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{question.question}</p>
        </div>
        <button
          onClick={onSend}
          disabled={sent}
          className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
            sent
              ? "text-green-400 cursor-default"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
          title={sent ? "Sent" : "Send to students"}
        >
          {sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {question.options && (
        <div className="flex gap-1.5">
          {question.options.map((opt, i) => (
            <span
              key={i}
              className={`text-[10px] px-2 py-0.5 rounded-full border border-border ${
                opt === question.answer
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
