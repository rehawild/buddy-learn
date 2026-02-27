import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, Home } from "lucide-react";

interface RecapState {
  lessonTitle: string;
  correct: number;
  total: number;
  concepts: string[];
}

export default function Recap() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: RecapState | null };

  const data = state ?? { lessonTitle: "Demo Lesson", correct: 0, total: 0, concepts: [] };
  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 fade-up">
        <div className="text-center space-y-2">
          <span className="text-5xl">🎉</span>
          <h1 className="text-3xl font-bold text-foreground">Lesson Complete!</h1>
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
