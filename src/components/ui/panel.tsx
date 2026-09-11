import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface shadow-xs", className)}>
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  linkLabel,
  onLinkClick,
}: {
  title: string;
  linkLabel?: string;
  onLinkClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-[18px] pb-2.5 pt-4">
      <h3 className="m-0 text-[14.5px] font-bold">{title}</h3>
      {linkLabel && (
        <span onClick={onLinkClick} className="ml-auto cursor-pointer text-[12.5px] font-semibold text-brand-blue">
          {linkLabel}
        </span>
      )}
    </div>
  );
}

export function PanelBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-2 pb-3 pt-1", className)}>{children}</div>;
}
