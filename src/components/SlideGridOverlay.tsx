import type { Section } from "@/data/lessons";
import SlideRenderer from "./SlideRenderer";
import type { SlideTheme } from "./SlideRenderer";
import { X } from "lucide-react";

interface SlideGridOverlayProps {
  sections: Section[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  lessonIcon?: string;
  theme?: SlideTheme;
}

export default function SlideGridOverlay({ sections, currentIndex, onSelect, onClose, lessonIcon, theme }: SlideGridOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Slide Overview</h3>
        <button onClick={onClose} className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {sections.map((section, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); onClose(); }}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] ${
                i === currentIndex
                  ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <SlideRenderer
                section={section}
                lessonIcon={i === 0 ? lessonIcon : undefined}
                interactive={false}
                theme={theme}
              />
              <div className="absolute bottom-1 left-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
              {i === currentIndex && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 py-3 border-t border-border text-center text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px]">G</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px]">Esc</kbd> to close
      </div>
    </div>
  );
}
