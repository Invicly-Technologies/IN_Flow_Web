export function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1.5 pb-1.5 pt-2.5 text-[13px] font-bold text-text-secondary">
      <span>{label}</span>
      <span className="font-medium text-text-faint">{count}</span>
    </div>
  );
}
