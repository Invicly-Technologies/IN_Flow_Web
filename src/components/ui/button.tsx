import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-[7px] rounded-[9px] font-semibold transition-transform active:scale-[0.97]",
          size === "md" ? "px-3.5 py-2 text-[13.5px]" : "px-2.5 py-1.5 text-[12.5px]",
          variant === "primary" &&
            "bg-brand-flow text-white shadow-[0_2px_10px_rgba(76,66,230,.28)] hover:opacity-90",
          variant === "ghost" && "border border-border bg-surface text-text hover:bg-bg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
