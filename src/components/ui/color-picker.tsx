"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const COLOR_PALETTE = ["#6D3DF5", "#315CFF", "#19C8E8", "#F59E0B", "#10B981", "#EF4444"];

/** Preset swatches plus a native color input for any custom hex — used for project and label colors. */
export function ColorPicker({
  value,
  onChange,
  size = 28,
}: {
  value: string;
  onChange: (color: string) => void;
  size?: number;
}) {
  const isCustom = !COLOR_PALETTE.includes(value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn("rounded-full ring-offset-2 ring-offset-surface transition-shadow", value === c && "ring-2 ring-text")}
          style={{ background: c, width: size, height: size }}
          aria-label={c}
        />
      ))}
      <label
        className={cn(
          "relative flex shrink-0 cursor-pointer items-center justify-center rounded-full text-text-faint ring-offset-2 ring-offset-surface",
          isCustom ? "ring-2 ring-text" : "border-[1.5px] border-dashed border-text-faint"
        )}
        style={{ width: size, height: size, background: isCustom ? value : undefined }}
        title="Custom color"
      >
        {!isCustom && <Plus className="h-3.5 w-3.5" />}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Custom color"
        />
      </label>
    </div>
  );
}
