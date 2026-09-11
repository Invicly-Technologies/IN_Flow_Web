import type { TaskStatus } from "@prisma/client";

export type ProjectTab =
  | "list"
  | "board"
  | "calendar"
  | "timeline"
  | "milestones"
  | "files"
  | "members"
  | "settings";

export interface BoardColumn {
  id: TaskStatus;
  name: string;
  color: string;
}

// Mirrors the real TaskStatus enum exactly (no client-only pseudo-statuses),
// so a card's board column always matches its persisted status.
export const BOARD_COLUMNS: BoardColumn[] = [
  { id: "TODO", name: "To Do", color: "#94A3B8" },
  { id: "IN_PROGRESS", name: "In Progress", color: "#315CFF" },
  { id: "CANCELLED", name: "Cancelled", color: "#EF4444" },
  { id: "COMPLETED", name: "Done", color: "#10B981" },
];
