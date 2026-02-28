import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, Home, Clock, Brain, MessageCircle, Sparkles } from "lucide-react";

interface EngagementData {
  avgResponseTimeMs: number;
  attentionScore: number;
  buddyInteractions: number;
  reactionsCount: number;
}

interface RecapState {
  lessonTitle: string;
  correct: number;
  total: number;
  concepts: string[];
  engagement?: EngagementData;
}

export default function Recap() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: RecapState | null };

  const data = state ?? { lessonTitle: "Demo Lesson", correct: 0, total: 0, concepts: [] };
  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
  const engagement = data.engagement;

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 fade-up">
        <div className="text-center space-y-2">
          <span className="text-5xl">🎉</span>
          <h1 className="text-3xl font-bold text-foreground">
            {engagement ? "Session Complete!" : "Lesson Complete!"}
          </h1>
          <p className="text-muted-foreground">{data.lessonTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-primary">{data.total}</div>
            <div className="text-sm text-muted-foreground mt-1">Questions</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <div className={`text-3xl font-bold ${accuracy >= 70 ? "text-correct" : accuracy >= 40 ? "text-buddy-warm" : "text-incorrect"}`}>
              {accuracy}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Accuracy</div>
          </div>
        </div>

        {engagement && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {formatResponseTime(engagement.avgResponseTimeMs)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Response</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {engagement.attentionScore}%
                </div>
                <div className="text-xs text-muted-foreground">Attention</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {engagement.buddyInteractions}
                </div>
                <div className="text-xs text-muted-foreground">Buddy Chats</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {engagement.reactionsCount}
                </div>
                <div className="text-xs text-muted-foreground">Reactions</div>
              </div>
            </div>
          </div>
        )}

        {data.concepts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Key Concepts Covered</h3>
            <ul className="space-y-2">
              {data.concepts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
