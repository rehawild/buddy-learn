import type { Section } from "@/data/lessons";
import SlideRenderer from "./SlideRenderer";

interface SlideThumbnailProps {
  sections: Section[];
  currentIndex: number;
  onSelect?: (index: number) => void;
  lessonIcon?: string;
}

export default function SlideThumbnail({ sections, currentIndex, onSelect, lessonIcon }: SlideThumbnailProps) {
  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      {sections.map((section, i) => (
        <button
          key={i}
          onClick={() => onSelect?.(i)}
          className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
            i === currentIndex
              ? "border-primary shadow-lg shadow-primary/20"
              : "border-border/50 hover:border-border"
          }`}
        >
          <SlideRenderer
            section={section}
            lessonIcon={i === 0 ? lessonIcon : undefined}
            interactive={false}
          />
          <div className="absolute bottom-1 left-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
            {i + 1}
          </div>
        </button>
      ))}
    </div>
  );
}
