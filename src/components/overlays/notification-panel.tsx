"use client";

import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, UserPlus, MessageSquare, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/features/app/store/app-store";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/hooks";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof UserPlus> = {
  TASK_ASSIGNED: UserPlus,
  TASK_COMMENT: MessageSquare,
  TASK_COMPLETED: CheckCircle2,
  TASK_DUE_SOON: Bell,
  MENTION: MessageSquare,
  SYSTEM: Bell,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationPanel() {
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div className="relative">
          <IconButton title="Notifications">
            <Bell />
          </IconButton>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-state-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[120] w-[360px] max-w-[92vw] overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <h3 className="text-sm font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-brand-blue"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="scrollbar-thin max-h-[400px] overflow-y-auto">
            {!notifications?.length && (
              <div className="p-6 text-center text-xs text-text-secondary">You&apos;re all caught up.</div>
            )}
            {notifications?.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              const taskId = (n.data as { taskId?: string } | null)?.taskId;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) markRead.mutate(n.id);
                    if (taskId) openTaskDetail(taskId);
                  }}
                  className={cn(
                    "flex cursor-pointer gap-2.5 border-b border-border px-4 py-3 last:border-0 hover:bg-bg",
                    !n.readAt && "bg-brand-flow-soft/40"
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-text">{n.title}</div>
                    {n.body && <div className="truncate text-xs text-text-secondary">{n.body}</div>}
                    <div className="mt-0.5 text-[11px] text-text-faint">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />}
                </div>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
