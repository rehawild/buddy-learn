import { ChevronLeft } from "lucide-react";

interface MeetTopBarProps {
  title: string;
  onBack: () => void;
}

export default function MeetTopBar({ title, onBack }: MeetTopBarProps) {
  return (
    <div className="h-14 bg-meet-bar border-b border-border flex items-center px-4 gap-3">
      <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Presenting
      </div>
    </div>
  );
}
