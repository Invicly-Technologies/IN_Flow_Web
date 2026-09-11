"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useWorkspaces, useCreateWorkspace, switchWorkspace } from "@/features/workspaces/hooks";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function WorkspaceSwitcher() {
  const qc = useQueryClient();
  const currentWorkspaceId = useAuthStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspaceId = useAuthStore((s) => s.setCurrentWorkspaceId);
  const { data: workspaces } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  const current = workspaces?.find((w) => w.id === currentWorkspaceId) ?? workspaces?.[0];

  if (!workspaces || workspaces.length === 0) return null;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="mb-3.5 flex w-full items-center gap-2 rounded-[10px] border border-white/[.06] bg-white/[.06] px-2.5 py-2 text-left text-[13px] font-semibold text-white transition-colors hover:bg-white/10">
            <span className="min-w-0 flex-1 truncate lg:block hidden">{current?.name}</span>
            <span className="lg:hidden">{current?.name?.slice(0, 1).toUpperCase()}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[#8091B5] lg:block hidden" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className="z-[120] min-w-[220px] rounded-[10px] border border-border bg-surface p-1.5 shadow-lg"
          >
            {workspaces.map((w) => (
              <DropdownMenu.Item
                key={w.id}
                onClick={() => switchWorkspace(w.id, setCurrentWorkspaceId, qc)}
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-text outline-none hover:bg-bg"
              >
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                {(w.id === currentWorkspaceId || (!currentWorkspaceId && w === workspaces[0])) && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
                )}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              onClick={() => setCreateOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-brand-blue outline-none hover:bg-bg"
            >
              <Plus className="h-3.5 w-3.5" />
              Create workspace
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function CreateWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const createWorkspace = useCreateWorkspace();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || createWorkspace.isPending) return;
    createWorkspace.mutate(name.trim(), {
      onSuccess: () => {
        onOpenChange(false);
        setName("");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Create workspace" description="A separate space with its own projects, tasks, and members.">
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Workspace name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Marketing"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
          </div>
          <Button type="submit" disabled={createWorkspace.isPending} className="w-full justify-center">
            {createWorkspace.isPending ? "Creating…" : "Create workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
