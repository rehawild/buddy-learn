import { Mic, Video, Captions, Hand, Settings } from "lucide-react";

interface MeetBottomBarProps {
  buddyEnabled: boolean;
  onToggleBuddy: () => void;
  difficulty: "easy" | "medium" | "hard";
  onChangeDifficulty: (d: "easy" | "medium" | "hard") => void;
}

const diffColors = { easy: "text-correct", medium: "text-buddy-warm", hard: "text-incorrect" } as const;

export default function MeetBottomBar({ buddyEnabled, onToggleBuddy, difficulty, onChangeDifficulty }: MeetBottomBarProps) {
  const nextDiff = () => {
    const order: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    const i = order.indexOf(difficulty);
    onChangeDifficulty(order[(i + 1) % 3]);
  };

  return (
    <div className="h-16 bg-meet-bar border-t border-border flex items-center justify-center gap-3 px-4">
      {/* Cosmetic buttons */}
      {[Mic, Video, Captions, Hand].map((Icon, i) => (
        <button key={i} className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Icon className="w-5 h-5" />
        </button>
      ))}

      <div className="w-px h-8 bg-border mx-2" />

      {/* Buddy toggle */}
      <button
        onClick={onToggleBuddy}
        className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
          buddyEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
        }`}
      >
        🦉 Buddy {buddyEnabled ? "ON" : "OFF"}
      </button>

      {/* Difficulty */}
      <button
        onClick={nextDiff}
        className={`px-3 py-2 rounded-full text-xs font-semibold bg-secondary transition-colors ${diffColors[difficulty]}`}
      >
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </button>
    </div>
  );
}
