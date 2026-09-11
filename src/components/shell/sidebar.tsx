"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Home, Inbox, CalendarDays, CalendarRange, Filter, LayoutGrid, Tag, Settings, Plus, LogOut, Moon, Sun, ShieldCheck, BarChart3 } from "lucide-react";
import { useAppStore } from "@/features/app/store/app-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useLogout } from "@/features/auth/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useProjects } from "@/features/projects/hooks";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox, countView: "inbox" as const },
  { href: "/today", label: "Today", icon: CalendarDays, countView: "today" as const },
  { href: "/upcoming", label: "Upcoming", icon: CalendarRange },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/filters", label: "Filters", icon: Filter },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

export function Sidebar() {
  const pathname = usePathname();
  const openSearch = useAppStore((s) => s.openSearch);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const { data: projects = [] } = useProjects();
  const { data: inboxTasks } = useTasks({ view: "inbox" });
  const { data: todayTasks } = useTasks({ view: "today" });
  const navCounts: Record<string, number> = { inbox: inboxTasks?.length ?? 0, today: todayTasks?.length ?? 0 };

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  return (
    <aside className="hidden shrink-0 flex-col gap-1 overflow-hidden border-r border-white/5 bg-navy px-3.5 py-5 text-[#C9D3E8] md:flex md:w-[76px] lg:w-[264px]">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
        <Image src="/branding/flow_icon.png" alt="Invicly Flow" width={30} height={30} />
        <div className="hidden whitespace-nowrap text-[16.5px] font-extrabold tracking-tight text-white lg:block">
          Invicly <span className="bg-brand-flow bg-clip-text text-transparent">Flow</span>
        </div>
      </div>

      <WorkspaceSwitcher />

      <button
        onClick={openSearch}
        className="mb-3.5 flex items-center gap-2 rounded-[10px] border border-white/[.06] bg-white/[.06] px-2.5 py-2 text-[#8091B5] transition-colors hover:bg-white/10"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden lg:inline">Search</span>
        <kbd className="ml-auto hidden rounded-[5px] bg-white/[.08] px-1.5 py-0.5 text-[11px] text-[#8091B5] lg:inline">
          ⌘K
        </kbd>
      </button>

      <nav className="mb-3.5 flex flex-col gap-[2px]">
        {PRIMARY_NAV.map((item) => {
          const active = pathname === item.href;
          const count = item.countView ? navCounts[item.countView] : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors lg:justify-start",
                active
                  ? "bg-gradient-to-r from-[rgba(109,61,245,.28)] to-[rgba(49,92,255,.20)] text-white"
                  : "hover:bg-white/[.06] hover:text-white"
              )}
            >
              <item.icon className="h-[17px] w-[17px] shrink-0 opacity-85" />
              <span className="hidden lg:inline">{item.label}</span>
              {!!count && <span className="ml-auto hidden text-[11.5px] font-semibold text-[#7A88AC] lg:inline">{count}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mb-3.5 min-h-0 flex-1 overflow-y-auto">
        <div className="mb-0.5 hidden px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#5C6B8C] lg:block">
          PROJECTS
        </div>
        <Link
          href="/projects"
          className={cn(
            "flex items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors hover:bg-white/[.06] hover:text-white lg:justify-start",
            pathname === "/projects" && "bg-gradient-to-r from-[rgba(109,61,245,.28)] to-[rgba(49,92,255,.20)] text-white"
          )}
        >
          <LayoutGrid className="h-[17px] w-[17px] shrink-0 opacity-85" />
          <span className="hidden lg:inline">All projects</span>
        </Link>
        {projects.map((p) => {
          const active = pathname === `/projects/${p.id}`;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={cn(
                "flex items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors hover:bg-white/[.06] hover:text-white lg:justify-start",
                active && "bg-gradient-to-r from-[rgba(109,61,245,.28)] to-[rgba(49,92,255,.20)] text-white"
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color ?? "#94A3B8" }} />
              <span className="hidden lg:inline">{p.name}</span>
              {p.taskCount - p.completedCount > 0 && (
                <span className="ml-auto hidden text-[11.5px] font-semibold lg:inline">
                  {p.taskCount - p.completedCount}
                </span>
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setProjectDialogOpen(true)}
          className="flex w-full items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors hover:bg-white/[.06] hover:text-white lg:justify-start"
        >
          <Plus className="h-[17px] w-[17px] shrink-0 opacity-85" />
          <span className="hidden lg:inline">Add project</span>
        </button>

        <div className="mb-0.5 mt-3.5 hidden px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#5C6B8C] lg:block">
          LABELS
        </div>
        <Link
          href="/labels"
          className={cn(
            "flex items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors hover:bg-white/[.06] hover:text-white lg:justify-start",
            pathname === "/labels" && "bg-gradient-to-r from-[rgba(109,61,245,.28)] to-[rgba(49,92,255,.20)] text-white"
          )}
        >
          <Tag className="h-[17px] w-[17px] shrink-0 opacity-85" />
          <span className="hidden lg:inline">All labels</span>
        </Link>
      </div>

      <div className="mt-auto border-t border-white/[.06] pt-2.5">
        {user?.isSuperAdmin && (
          <Link
            href="/admin"
            className={cn(
              "mb-1 flex items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors hover:bg-white/[.06] hover:text-white lg:justify-start",
              pathname === "/admin" && "bg-gradient-to-r from-[rgba(109,61,245,.28)] to-[rgba(49,92,255,.20)] text-white"
            )}
          >
            <ShieldCheck className="h-[17px] w-[17px] shrink-0 opacity-85" />
            <span className="hidden lg:inline">Admin</span>
          </Link>
        )}
        <Link
          href="/settings"
          className={cn(
            "mb-1 flex items-center justify-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm font-medium text-[#B7C2DC] transition-colors hover:bg-white/[.06] hover:text-white lg:justify-start",
            pathname === "/settings" && "bg-gradient-to-r from-[rgba(109,61,245,.28)] to-[rgba(49,92,255,.20)] text-white"
          )}
        >
          <Settings className="h-[17px] w-[17px] shrink-0 opacity-85" />
          <span className="hidden lg:inline">Settings</span>
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex w-full items-center justify-center gap-2.5 rounded-[10px] p-2 transition-colors hover:bg-white/[.06] lg:justify-start">
              <Avatar initials={user ? initialsOf(user.fullName) : "U"} />
              <div className="hidden text-left leading-tight lg:block">
                <div className="truncate text-[13px] font-semibold text-white">{user?.fullName ?? "…"}</div>
                <div className="truncate text-[11.5px] text-[#7A88AC]">{user?.email ?? ""}</div>
              </div>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-[120] min-w-[200px] rounded-[10px] border border-border bg-surface p-1.5 shadow-lg"
            >
              <DropdownMenu.Item
                onClick={toggleTheme}
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-text outline-none hover:bg-bg"
              >
                {theme === "dark" ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
                {theme === "dark" ? "Switch to light" : "Switch to dark"}
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onClick={() => logout()}
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-state-danger outline-none hover:bg-bg"
              >
                <LogOut className="h-[15px] w-[15px]" />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <ProjectFormDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} />
    </aside>
  );
}
