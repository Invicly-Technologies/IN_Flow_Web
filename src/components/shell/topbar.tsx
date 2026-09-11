"use client";

import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { Search, Sun, Moon, Plus } from "lucide-react";
import { useAppStore } from "@/features/app/store/app-store";
import { useProject } from "@/features/projects/hooks";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { NotificationPanel } from "@/components/overlays/notification-panel";

const TITLES: Record<string, [string, string]> = {
  "/": ["Home", ""],
  "/inbox": ["Inbox", "Tasks without a project"],
  "/today": ["Today", ""],
  "/upcoming": ["Upcoming", ""],
  "/calendar": ["Calendar", ""],
  "/filters": ["Filters", "Smart views across all your tasks"],
  "/analytics": ["Analytics", "How your workspace is trending"],
  "/labels": ["Labels", ""],
  "/settings": ["Settings", ""],
  "/projects": ["Projects", "All your projects in one place"],
};

export function Topbar() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const openSearch = useAppStore((s) => s.openSearch);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const isProjectDetail = pathname.startsWith("/projects/") && !!params?.id;
  const { data: project } = useProject(isProjectDetail ? params.id! : null);

  const [title, sub] = isProjectDetail
    ? [project?.name ?? "Loading…", project?.dueDate ? `Due ${new Date(project.dueDate).toLocaleDateString()}` : ""]
    : TITLES[pathname] ?? ["Invicly Flow", ""];

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-7 py-3.5 max-md:px-4">
      <div>
        <h1 className="m-0 text-[18px] font-bold tracking-tight max-md:text-[16.5px]">{title}</h1>
        {sub && <div className="mt-px text-[12.5px] text-text-secondary">{sub}</div>}
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <IconButton title="Search" className="md:hidden" onClick={openSearch}>
          <Search />
        </IconButton>
        <IconButton title="Toggle theme" onClick={toggleTheme}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </IconButton>
        <NotificationPanel />
        <Button className="max-md:hidden" onClick={() => setAddTaskOpen(true)}>
          <Plus className="stroke-[2.4]" />
          Add task
        </Button>
      </div>

      <TaskFormDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} />
    </div>
  );
}
