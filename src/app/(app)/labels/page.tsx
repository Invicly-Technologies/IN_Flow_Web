"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Plus, Trash2 } from "lucide-react";
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from "@/features/labels/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useAppStore } from "@/features/app/store/app-store";
import { ColorPicker, COLOR_PALETTE } from "@/components/ui/color-picker";
import { ApiClientError } from "@/lib/api-client";
import { Skeleton } from "@/components/states/skeleton";
import { ErrorState } from "@/components/states/error-state";

export default function LabelsPage() {
  const { data: labels, isLoading, isError, refetch } = useLabels();
  const createLabel = useCreateLabel();
  const pushToast = useAppStore((s) => s.pushToast);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0]!);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || createLabel.isPending) return;
    createLabel.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          pushToast({ message: `Label "${name.trim()}" created` });
          setName("");
          setColor(COLOR_PALETTE[0]!);
          setCreating(false);
        },
        onError: (err) =>
          pushToast({ message: err instanceof ApiClientError ? err.message : "Couldn't create label — please try again" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex max-w-[520px] flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (isError) return <ErrorState title="Couldn't load labels" onRetry={() => refetch()} />;

  return (
    <div className="flex max-w-[520px] flex-col gap-0.5">
      {labels?.map((l) => (
        <LabelRow key={l.id} id={l.id} name={l.name} color={l.color ?? "#315CFF"} />
      ))}

      {creating ? (
        <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setCreating(false)}
              placeholder="Label name"
              className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[13.5px] text-text outline-none focus:border-brand-blue"
            />
            <button type="submit" className="rounded-lg bg-brand-flow px-2.5 py-1.5 text-xs font-semibold text-white">
              Add
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs font-semibold text-text-secondary">
              Cancel
            </button>
          </div>
          <ColorPicker value={color} onChange={setColor} size={22} />
        </form>
      ) : (
        <div
          onClick={() => setCreating(true)}
          className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 font-semibold text-brand-blue hover:bg-surface"
        >
          <Plus className="h-[14px] w-[14px]" />
          <span>Add label</span>
        </div>
      )}
    </div>
  );
}

function LabelRow({ id, name, color }: { id: string; name: string; color: string }) {
  const { data: tasks } = useTasks({ labelId: id });
  const pushToast = useAppStore((s) => s.pushToast);
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const count = tasks?.length ?? 0;

  return (
    <div className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-surface">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            className="h-3 w-3 shrink-0 rounded-full ring-offset-2 ring-offset-surface hover:ring-2 hover:ring-border"
            style={{ background: color }}
            aria-label="Change label color"
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-[120] rounded-[10px] border border-border bg-surface p-2.5 shadow-lg"
          >
            <ColorPicker
              value={color}
              onChange={(next) =>
                updateLabel.mutate(
                  { id, color: next },
                  { onError: () => pushToast({ message: "Couldn't update label color" }) }
                )
              }
              size={22}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <span className="text-[13.5px] font-semibold">#{name}</span>
      <span className="ml-auto text-xs text-text-secondary">
        {count} task{count !== 1 ? "s" : ""}
      </span>
      <button
        onClick={() => {
          if (confirm(`Delete label "${name}"?`)) {
            deleteLabel.mutate(id, {
              onSuccess: () => pushToast({ message: "Label deleted" }),
              onError: () => pushToast({ message: "Couldn't delete label — please try again" }),
            });
          }
        }}
        className="rounded-md p-1.5 text-text-faint opacity-0 hover:bg-bg hover:text-state-danger group-hover:opacity-100"
        aria-label="Delete label"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
