"use client";

import { useWorkspaceMembers } from "@/features/workspaces/members-hooks";

export function AssigneeSelect({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (userId: string | null) => void;
  className?: string;
}) {
  const { data: members } = useWorkspaceMembers();

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={
        className ??
        "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
      }
    >
      <option value="">Unassigned</option>
      {members?.map((m) => (
        <option key={m.userId} value={m.userId}>
          {m.fullName}
        </option>
      ))}
    </select>
  );
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

const AVATAR_COLORS = ["#6D3DF5", "#315CFF", "#19C8E8", "#F59E0B", "#10B981", "#EF4444", "#EC4899", "#8B5CF6"];

export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

export function AssigneeAvatar({ userId, size = 20 }: { userId: string; size?: number }) {
  const { data: members } = useWorkspaceMembers();
  const member = members?.find((m) => m.userId === userId);
  if (!member) return null;
  return (
    <span
      title={member.fullName}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: colorForId(userId) }}
    >
      {initialsOf(member.fullName)}
    </span>
  );
}
