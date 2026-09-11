"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, LayoutGrid, User, Plus } from "lucide-react";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

const ITEMS_RIGHT = [
  { href: "/projects", label: "Projects", icon: LayoutGrid },
  { href: "/settings", label: "Profile", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-border bg-surface px-1.5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] md:hidden">
      {ITEMS.map((item) => (
        <NavItem key={item.href} {...item} active={pathname === item.href} />
      ))}
      <div
        onClick={() => setAddTaskOpen(true)}
        className="flex flex-1 cursor-pointer flex-col items-center gap-[3px] px-2.5 py-1 text-white"
      >
        <div className="-mt-[26px] flex h-11 w-11 items-center justify-center rounded-full border-4 border-bg bg-brand-flow shadow-[0_6px_16px_rgba(76,66,230,.4)]">
          <Plus className="h-5 w-5 stroke-[2.6] text-white" />
        </div>
      </div>
      {ITEMS_RIGHT.map((item) => (
        <NavItem key={item.href} {...item} active={pathname === item.href || pathname.startsWith("/projects")} />
      ))}

      <TaskFormDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} />
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-[3px] px-2.5 py-1 text-[10.5px] font-semibold text-text-faint",
        active && "text-brand-blue"
      )}
    >
      <Icon className="h-[21px] w-[21px]" />
      {label}
    </Link>
  );
}
