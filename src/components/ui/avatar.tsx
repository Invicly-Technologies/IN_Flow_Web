import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  size = 30,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-flow font-bold text-white",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </div>
  );
}
