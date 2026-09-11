"use client";

import { useState } from "react";
import { ShieldAlert, Users, Building2, FolderKanban, ListChecks, UserPlus } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useAdminStats, useAdminUsers, useAdminWorkspaces } from "@/features/admin/hooks";
import { EmptyState } from "@/components/states/empty-state";
import { Skeleton } from "@/components/states/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const TABS = ["users", "organizations"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);

  if (!user?.isSuperAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Not available"
        description="This area is only visible to Invicly Flow super admins."
      />
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const [tab, setTab] = useState<Tab>("users");
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  const cards = [
    { label: "Users", value: stats?.userCount, icon: Users },
    { label: "Organizations", value: stats?.workspaceCount, icon: Building2 },
    { label: "Projects", value: stats?.projectCount, icon: FolderKanban },
    { label: "Tasks", value: stats?.taskCount, icon: ListChecks },
    { label: "New users (7d)", value: stats?.newUsersLast7Days, icon: UserPlus },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold text-text">Admin</h1>
      <p className="mb-5 text-[13px] text-text-secondary">
        Every user and organization on Invicly Flow — visible only to super admins.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-3.5">
            <c.icon className="mb-2 h-4 w-4 text-brand-blue" />
            {statsLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <div className="text-xl font-extrabold text-text">{c.value ?? 0}</div>
            )}
            <div className="text-[11.5px] font-medium text-text-secondary">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative top-px mr-4 whitespace-nowrap border-b-2 border-transparent py-2.5 text-[13.5px] font-semibold capitalize text-text-secondary",
              tab === t && "border-brand-blue text-text"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "users" ? <UsersTable /> : <OrganizationsTable />}
    </div>
  );
}

function UsersTable() {
  const { data: users, isLoading } = useAdminUsers();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!users?.length) {
    return <EmptyState icon={Users} title="No users yet" description="Registered users will appear here." />;
  }

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-bg text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
            <th className="px-3.5 py-2.5">User</th>
            <th className="px-3.5 py-2.5">Workspaces</th>
            <th className="px-3.5 py-2.5">Tasks created</th>
            <th className="px-3.5 py-2.5">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar initials={initialsOf(u.fullName)} size={28} />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-text">
                      {u.fullName}
                      {u.isSuperAdmin && (
                        <span className="rounded-full bg-brand-flow-soft px-1.5 py-[1px] text-[10px] font-bold text-brand-blue">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-text-secondary">{u.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-3.5 py-2.5 text-text-secondary">{u.workspaceCount}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">{u.taskCount}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">{fmtDateTime(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrganizationsTable() {
  const { data: workspaces, isLoading } = useAdminWorkspaces();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!workspaces?.length) {
    return <EmptyState icon={Building2} title="No organizations yet" description="Workspaces created by users will appear here." />;
  }

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-bg text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
            <th className="px-3.5 py-2.5">Organization</th>
            <th className="px-3.5 py-2.5">Owner</th>
            <th className="px-3.5 py-2.5">Members</th>
            <th className="px-3.5 py-2.5">Projects</th>
            <th className="px-3.5 py-2.5">Tasks</th>
            <th className="px-3.5 py-2.5">Created</th>
          </tr>
        </thead>
        <tbody>
          {workspaces.map((w) => (
            <tr key={w.id} className="border-b border-border last:border-0">
              <td className="px-3.5 py-2.5 font-semibold text-text">{w.name}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">
                {w.owner ? (
                  <>
                    {w.owner.fullName}
                    <span className="ml-1.5 text-text-faint">({w.owner.email})</span>
                  </>
                ) : (
                  <span className="text-text-faint">—</span>
                )}
              </td>
              <td className="px-3.5 py-2.5 text-text-secondary">{w.memberCount}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">{w.projectCount}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">{w.taskCount}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">{fmtDateTime(w.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
