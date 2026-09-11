"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ColorPicker, COLOR_PALETTE } from "@/components/ui/color-picker";
import { useAppStore } from "@/features/app/store/app-store";
import { useCreateProject } from "@/features/projects/hooks";
import { ApiClientError } from "@/lib/api-client";

// A short, all-caps suggestion derived from the name (e.g. "Website Redesign" -> "WEB") —
// the user can still edit or clear it before submitting.
function suggestKey(name: string): string {
  const letters = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (letters.length === 0) return "";
  if (letters.length === 1) return letters[0]!.slice(0, 4);
  return letters.map((w) => w[0]).join("").slice(0, 6);
}

export function ProjectFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const pushToast = useAppStore((s) => s.pushToast);
  const createProject = useCreateProject();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0]!);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setKey("");
      setKeyTouched(false);
      setDescription("");
      setColor(COLOR_PALETTE[0]!);
      setError(null);
    }
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || createProject.isPending) return;
    createProject.mutate(
      {
        name: name.trim(),
        key: key.trim() || undefined,
        description: description.trim() || undefined,
        color,
        icon: name.trim().slice(0, 1).toUpperCase(),
      },
      {
        onSuccess: (project) => {
          pushToast({ message: `Project "${project.name}" created` });
          onOpenChange(false);
          router.push(`/projects/${project.id}`);
        },
        onError: (err) => {
          const message = err instanceof ApiClientError ? err.message : "Couldn't create project — please try again";
          setError(message);
          pushToast({ message });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New project" description="Projects group related tasks into sections.">
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!keyTouched) setKey(suggestKey(e.target.value));
              }}
              placeholder="e.g. Website Redesign"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              Project key <span className="font-normal text-text-faint">— prefixes this project&apos;s tasks, e.g. {key || "ENG"}-1</span>
            </label>
            <input
              value={key}
              onChange={(e) => {
                setKey(e.target.value.toUpperCase());
                setKeyTouched(true);
              }}
              maxLength={10}
              placeholder="e.g. ENG"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm uppercase text-text outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Optional"
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {error && <p className="text-xs text-state-danger">{error}</p>}

          <Button type="submit" disabled={createProject.isPending} className="mt-1 w-full justify-center">
            {createProject.isPending ? "Creating…" : "Create project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
