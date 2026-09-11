export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const today = todayISO();
  const tomorrow = todayISO(1);
  const yesterday = todayISO(-1);
  if (iso === today) return "Today";
  if (iso === tomorrow) return "Tomorrow";
  if (iso === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric" });
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return iso < todayISO();
}

/** Full ISO datetime (as returned by the API, e.g. dueAt) -> date-only "YYYY-MM-DD". */
export function dateOnly(isoDateTime: string | null): string | null {
  return isoDateTime ? isoDateTime.slice(0, 10) : null;
}

/** Date-only "YYYY-MM-DD" -> a full ISO datetime string suitable for the API. */
export function toISODateTime(dateOnlyStr: string): string {
  return `${dateOnlyStr}T00:00:00.000Z`;
}

const RELATIVE_DAY_PATTERNS: Array<[RegExp, number]> = [
  [/\btomorrow\b/i, 1],
  [/\btoday\b/i, 0],
  [/\bnext week\b/i, 7],
];

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Lightweight natural-language date parsing for quick-add ("Buy groceries tomorrow"). */
export function parseQuickTitle(raw: string): { title: string; dueDate: string | null } {
  let title = raw;
  let dueDate: string | null = null;

  for (const [pattern, offset] of RELATIVE_DAY_PATTERNS) {
    if (pattern.test(raw)) {
      dueDate = todayISO(offset);
      title = title.replace(pattern, "").trim();
      break;
    }
  }

  if (!dueDate) {
    for (let i = 0; i < DAY_NAMES.length; i++) {
      const pattern = new RegExp(`\\b${DAY_NAMES[i]}\\b`, "i");
      if (pattern.test(raw)) {
        const now = new Date();
        let diff = (i - now.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        dueDate = todayISO(diff);
        title = title.replace(pattern, "").trim();
        break;
      }
    }
  }

  title = title.replace(/\s{2,}/g, " ").replace(/,\s*$/, "").trim();
  return { title, dueDate };
}
