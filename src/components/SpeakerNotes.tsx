import { ChevronDown, ChevronUp, StickyNote } from "lucide-react";
import { useState } from "react";

interface SpeakerNotesProps {
  notes?: string;
}

export default function SpeakerNotes({ notes }: SpeakerNotesProps) {
  const [open, setOpen] = useState(false);

  if (!notes) return null;

  return (
    <div className="border-t border-border bg-meet-bar">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <StickyNote className="w-3.5 h-3.5" />
        Speaker Notes
        {open ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto" />}
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-secondary-foreground leading-relaxed max-h-32 overflow-y-auto">
          {notes}
        </div>
      )}
    </div>
  );
}
