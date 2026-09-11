export function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-bg">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${percent}%`, background: color }}
      />
    </div>
  );
}
