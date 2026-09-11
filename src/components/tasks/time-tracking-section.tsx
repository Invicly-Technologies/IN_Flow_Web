"use client";

import { useEffect, useState } from "react";
import { Clock, X, Plus, Play, Square } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import { useAddTimeEntry, useDeleteTimeEntry } from "@/features/tasks/hooks";
import { useAuthStore } from "@/features/auth/store/auth-store";

function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function fmtElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Buckets logged time entries into the trailing 7 days (oldest first) for the mini bar chart. */
function weeklyBuckets(entries: TaskDTO["timeEntries"]): { key: string; label: string; minutes: number }[] {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-US", { weekday: "narrow" }), minutes: 0 };
  });
  for (const entry of entries) {
    const key = new Date(entry.loggedAt).toISOString().slice(0, 10);
    const bucket = days.find((d) => d.key === key);
    if (bucket) bucket.minutes += entry.minutes;
  }
  return days;
}

function WeeklyTimeChart({ entries }: { entries: TaskDTO["timeEntries"] }) {
  const days = weeklyBuckets(entries);
  const max = Math.max(1, ...days.map((d) => d.minutes));
  return (
    <div className="mb-3 flex h-14 items-end gap-1.5">
      {days.map((d) => (
        <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-10 w-full items-end overflow-hidden rounded-[3px] bg-bg">
            <div
              className="w-full rounded-[3px] bg-brand-flow"
              style={{ height: d.minutes > 0 ? `${Math.max(10, Math.round((d.minutes / max) * 100))}%` : "0%" }}
              title={d.minutes > 0 ? fmtMinutes(d.minutes) : undefined}
            />
          </div>
          <span className="text-[9px] font-semibold uppercase text-text-faint">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Live "Start timer" — logs the elapsed time as a real time entry on stop, via the same endpoint as manual logging. */
function TimerControl({ taskId }: { taskId: string }) {
  const addTimeEntry = useAddTimeEntry();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  function stop() {
    const minutes = Math.max(1, Math.round(elapsedSec / 60));
    addTimeEntry.mutate({ taskId, minutes, note: "Timer session" });
    setStartedAt(null);
    setElapsedSec(0);
  }

  if (startedAt === null) {
    return (
      <button
        onClick={() => setStartedAt(Date.now())}
        className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue"
      >
        <Play className="h-3 w-3" />
        Start timer
      </button>
    );
  }
  return (
    <button
      onClick={stop}
      className="ml-auto flex items-center gap-1.5 rounded-full bg-brand-flow px-2.5 py-1 text-[11.5px] font-semibold text-white"
    >
      <Square className="h-3 w-3" />
      {fmtElapsed(elapsedSec)}
    </button>
  );
}

export function TimeTrackingSection({ task }: { task: TaskDTO }) {
  const userId = useAuthStore((s) => s.user?.id);
  const addTimeEntry = useAddTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();
  const [adding, setAdding] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const estimate = task.durationMinutes;
  const pctOfEstimate = estimate ? Math.min(100, Math.round((task.timeSpentMinutes / estimate) * 100)) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(minutes);
    if (!value || value <= 0) return;
    addTimeEntry.mutate(
      { taskId: task.id, minutes: value, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setAdding(false);
          setMinutes("");
          setNote("");
        },
      }
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-[13px] font-bold text-text-secondary">
        <Clock className="h-[13px] w-[13px]" />
        <span>Time tracked</span>
        <span className="font-medium text-text-faint">
          {task.timeSpentMinutes > 0 ? fmtMinutes(task.timeSpentMinutes) : "0m"}
          {estimate ? ` / ${fmtMinutes(estimate)} estimated` : ""}
        </span>
        <TimerControl taskId={task.id} />
      </div>

      {pctOfEstimate !== null && (
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-brand-blue"
            style={{ width: `${pctOfEstimate}%`, background: pctOfEstimate >= 100 ? "rgb(var(--state-danger))" : undefined }}
          />
        </div>
      )}

      {task.timeEntries.length > 0 && <WeeklyTimeChart entries={task.timeEntries} />}

      {task.timeEntries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-[9px] py-1.5 text-[13.5px]">
          <span className="font-semibold">{fmtMinutes(entry.minutes)}</span>
          <span className="flex-1 truncate text-text-secondary">
            {entry.note || entry.userName}
            {entry.note && <span className="text-text-faint"> — {entry.userName}</span>}
          </span>
          <span className="shrink-0 text-[11px] text-text-faint">
            {new Date(entry.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          {entry.userId === userId && (
            <button
              onClick={() => deleteTimeEntry.mutate({ taskId: task.id, entryId: entry.id })}
              className="text-text-faint hover:text-state-danger"
              aria-label="Delete time entry"
            >
              <X className="h-[14px] w-[14px]" />
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <form onSubmit={submit} className="mt-1 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            required
            autoFocus
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="e.g. 90"
            aria-label="Minutes spent"
            className="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-brand-blue"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-brand-blue"
          />
          <button type="submit" className="rounded-lg bg-brand-flow px-2.5 py-1.5 text-xs font-semibold text-white">
            Log
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-text-secondary">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 flex items-center gap-[9px] py-1 text-[12.5px] font-semibold text-text-secondary hover:text-brand-blue"
        >
          <Plus className="h-[13px] w-[13px]" />
          Log time
        </button>
      )}
    </div>
  );
}
