interface SlideProgressProps {
  current: number;
  total: number;
}

export default function SlideProgress({ current, total }: SlideProgressProps) {
  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
