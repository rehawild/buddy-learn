import { useRef, useEffect, useState, type ReactNode } from "react";
import type { Section } from "@/data/lessons";

export type SlideTheme = "default" | "dark" | "gradient" | "warm" | "ocean";

interface SlideRendererProps {
  section: Section;
  lessonTitle?: string;
  lessonIcon?: string;
  slideNumber?: number;
  totalSlides?: number;
  className?: string;
  interactive?: boolean;
  theme?: SlideTheme;
  slideKey?: string; // unique key for transition animations
}

function useScale(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / 1920, height / 1080));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);
  return scale;
}

/* ── Title Slide ── */
function TitleLayout({ section, lessonIcon }: { section: Section; lessonIcon?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-[200px] text-center">
      {lessonIcon && <div className="text-[120px] mb-[40px]">{lessonIcon}</div>}
      <h1 className="text-[96px] font-bold leading-[1.1] text-[hsl(var(--slide-fg))]">{section.title}</h1>
      <p className="mt-[48px] text-[42px] leading-[1.4] text-[hsl(var(--slide-fg)/0.6)] max-w-[1400px]">{section.content}</p>
    </div>
  );
}

/* ── Content Slide (title + bullets) ── */
function ContentLayout({ section }: { section: Section }) {
  return (
    <div className="w-full h-full flex flex-col px-[120px] py-[100px]">
      <h2 className="text-[72px] font-bold leading-[1.15] text-[hsl(var(--slide-fg))] mb-[48px]">{section.title}</h2>
      <p className="text-[36px] leading-[1.5] text-[hsl(var(--slide-fg)/0.7)] mb-[48px]">{section.content}</p>
      {section.bullets && section.bullets.length > 0 && (
        <ul className="space-y-[24px] mt-auto">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-[24px]">
              <span className="mt-[12px] w-[16px] h-[16px] rounded-full bg-[hsl(var(--primary))] flex-shrink-0" />
              <span className="text-[34px] leading-[1.4] text-[hsl(var(--slide-fg)/0.85)]">{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Two-Column Slide ── */
function TwoColumnLayout({ section }: { section: Section }) {
  const mid = section.bullets ? Math.ceil(section.bullets.length / 2) : 0;
  const left = section.bullets?.slice(0, mid) ?? [];
  const right = section.bullets?.slice(mid) ?? [];

  return (
    <div className="w-full h-full flex flex-col px-[120px] py-[100px]">
      <h2 className="text-[72px] font-bold leading-[1.15] text-[hsl(var(--slide-fg))] mb-[32px]">{section.title}</h2>
      <p className="text-[34px] leading-[1.5] text-[hsl(var(--slide-fg)/0.7)] mb-[48px]">{section.content}</p>
      <div className="flex-1 grid grid-cols-2 gap-[80px]">
        <Column items={left} />
        <Column items={right} />
      </div>
    </div>
  );
}

function Column({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[24px]">
      {items.map((b, i) => (
        <li key={i} className="flex items-start gap-[20px]">
          <span className="mt-[12px] w-[14px] h-[14px] rounded-full bg-[hsl(var(--accent))] flex-shrink-0" />
          <span className="text-[32px] leading-[1.4] text-[hsl(var(--slide-fg)/0.85)]">{b}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Quote Slide ── */
function QuoteLayout({ section }: { section: Section }) {
  return (
    <div className="w-full h-full flex flex-col px-[160px] py-[100px]">
      <h2 className="text-[64px] font-bold leading-[1.15] text-[hsl(var(--slide-fg))] mb-[48px]">{section.title}</h2>
      <div className="flex-1 flex items-center">
        <div className="border-l-[8px] border-[hsl(var(--primary))] pl-[48px]">
          <p className="text-[40px] leading-[1.5] italic text-[hsl(var(--slide-fg)/0.8)]">{section.content}</p>
        </div>
      </div>
      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-[40px] space-y-[20px]">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-[20px]">
              <span className="mt-[12px] w-[14px] h-[14px] rounded-full bg-[hsl(var(--primary))] flex-shrink-0" />
              <span className="text-[32px] leading-[1.4] text-[hsl(var(--slide-fg)/0.85)]">{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const layoutMap: Record<Section["layout"], React.FC<{ section: Section; lessonIcon?: string }>> = {
  title: TitleLayout,
  content: ContentLayout,
  "two-column": TwoColumnLayout,
  quote: QuoteLayout,
};

export default function SlideRenderer({
  section,
  lessonTitle,
  lessonIcon,
  slideNumber,
  totalSlides,
  className = "",
  interactive = true,
}: SlideRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useScale(containerRef);
  const Layout = layoutMap[section.layout] || ContentLayout;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ position: "relative" }}
    >
      {/* 1920x1080 slide surface */}
      <div
        className="slide-surface absolute"
        style={{
          width: 1920,
          height: 1080,
          left: "50%",
          top: "50%",
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          borderRadius: interactive ? 16 : 8,
          overflow: "hidden",
        }}
      >
        <Layout section={section} lessonIcon={lessonIcon} />

        {/* Slide number badge */}
        {slideNumber != null && totalSlides != null && (
          <div className="absolute bottom-[32px] right-[48px] text-[28px] font-mono text-[hsl(var(--slide-fg)/0.35)]">
            {slideNumber} / {totalSlides}
          </div>
        )}
      </div>
    </div>
  );
}
