import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text [&_svg]:h-4 [&_svg]:w-4",
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
