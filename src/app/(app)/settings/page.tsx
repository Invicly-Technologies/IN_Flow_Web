"use client";

import { useEffect, useState } from "react";
import { UserPlus, X, User, Palette, Bell, Users, SlidersHorizontal, Lock, CircleUserRound, Sun, Moon, Monitor, CheckCheck } from "lucide-react";
import { useAppStore, type Theme } from "@/features/app/store/app-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useLogout, useUpdateProfile, useChangePassword } from "@/features/auth/hooks";
import {
  useWorkspaceMembers,
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
  usePendingInvites,
  useCancelInvite,
} from "@/features/workspaces/members-hooks";
import { useNotifications, useMarkAllNotificationsRead } from "@/features/notifications/hooks";
import { ApiClientError } from "@/lib/api-client";
import { Panel, PanelHead, PanelBody } from "@/components/ui/panel";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { CustomFieldsPanel } from "@/components/settings/custom-fields-panel";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["UTC"];

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "members", label: "Members", icon: Users },
  { id: "custom-fields", label: "Custom fields", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: Lock },
  { id: "account", label: "Account", icon: CircleUserRound },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("profile");

  return (
    <div className="flex max-w-[900px] gap-6 max-md:flex-col">
      <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-[200px] md:flex-col md:overflow-visible">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-3 py-2 text-left text-[13.5px] font-medium text-text-secondary transition-colors hover:bg-bg",
              section === s.id && "bg-brand-flow-soft font-semibold text-brand-blue"
            )}
          >
            <s.icon className="h-[16px] w-[16px] shrink-0" />
            {s.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 max-w-[560px]">
        {section === "profile" && <ProfileSection />}
        {section === "appearance" && <AppearanceSection />}
        {section === "notifications" && <NotificationsSection />}
        {section === "members" && <WorkspaceMembersPanel />}
        {section === "custom-fields" && <CustomFieldsPanel />}
        {section === "security" && <SecuritySection />}
        {section === "account" && <AccountSection />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const pushToast = useAppStore((s) => s.pushToast);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setTimezone(user.timezone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.fullName, user?.timezone]);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfile.mutate(
      { fullName: fullName.trim(), timezone },
      { onSuccess: () => pushToast({ message: "Profile updated" }) }
    );
  }

  return (
    <Panel>
      <PanelHead title="Profile" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        <div className="mb-4 flex items-center gap-3.5">
          <Avatar initials={user ? initialsOf(user.fullName) : "U"} size={56} className="text-lg" />
          <div>
            <div className="font-bold">{user?.fullName ?? "…"}</div>
            <div className="text-xs text-text-secondary">{user?.email ?? ""}</div>
          </div>
        </div>
        <form onSubmit={saveProfile} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" disabled={updateProfile.isPending} className="w-fit">
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </PanelBody>
    </Panel>
  );
}

function AppearanceSection() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Panel>
      <PanelHead title="Appearance" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        <span className="mb-2 block text-xs font-semibold text-text-secondary">Theme</span>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface py-3 text-[12.5px] font-semibold text-text-secondary transition-colors hover:border-brand-blue",
                theme === o.value && "border-transparent bg-brand-flow-soft text-brand-blue"
              )}
            >
              <o.icon className="h-4 w-4" />
              {o.label}
            </button>
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}

function NotificationsSection() {
  const pushToast = useAppStore((s) => s.pushToast);
  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") pushToast({ message: "Desktop notifications enabled" });
  }

  return (
    <Panel>
      <PanelHead title="Notifications" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        <div className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-text">Desktop notifications</div>
            <div className="text-[12px] text-text-secondary">
              {permission === "granted" && "Enabled for this browser."}
              {permission === "denied" && "Blocked — allow notifications for this site in your browser settings."}
              {permission === "default" && "Get a system alert when something needs your attention."}
              {permission === "unsupported" && "Not supported in this browser."}
            </div>
          </div>
          {permission === "default" && (
            <Button size="sm" variant="ghost" onClick={requestPermission}>
              Enable
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-border py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-text">Email reminders</div>
            <div className="text-[12px] text-text-secondary">Sent automatically for any reminders you set on a task.</div>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">Recent ({unreadCount} unread)</span>
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
          {!notifications?.length ? (
            <p className="py-2 text-[13px] text-text-secondary">You&apos;re all caught up.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-center gap-2 py-1.5 text-[12.5px]">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand-blue")} />
                  <span className="min-w-0 flex-1 truncate text-text">{n.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}

function SecuritySection() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  function submitPasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setPasswordSuccess(true);
        },
        onError: (err) => setPasswordError(err instanceof ApiClientError ? err.message : "Something went wrong"),
      }
    );
  }

  return (
    <Panel>
      <PanelHead title="Change password" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        <form onSubmit={submitPasswordChange} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Current password</label>
            <PasswordInput
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">New password</label>
            <PasswordInput
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {passwordError && <p className="text-xs text-state-danger">{passwordError}</p>}
          {passwordSuccess && <p className="text-xs text-state-success">Password changed.</p>}
          <Button type="submit" size="sm" disabled={changePassword.isPending} className="w-fit">
            {changePassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </PanelBody>
    </Panel>
  );
}

function AccountSection() {
  const logout = useLogout();
  return (
    <Panel>
      <PanelHead title="Account" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        <div className="flex items-center gap-2.5 py-2.5 text-[13px]">
          <span className="w-[100px] shrink-0 font-semibold text-text-secondary">Session</span>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="text-state-danger">
            Log out
          </Button>
        </div>
      </PanelBody>
    </Panel>
  );
}

function WorkspaceMembersPanel() {
  const pushToast = useAppStore((s) => s.pushToast);
  const currentUser = useAuthStore((s) => s.user);
  const { data: members, isLoading } = useWorkspaceMembers();
  const { data: pendingInvites } = usePendingInvites();
  const invite = useInviteWorkspaceMember();
  const remove = useRemoveWorkspaceMember();
  const cancelInvite = useCancelInvite();

  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    invite.mutate(
      { email: trimmed },
      {
        onSuccess: (result) => {
          setEmail("");
          pushToast({
            message: result.invited
              ? `Invite sent to ${result.invited} — they'll join once they sign up`
              : "Member added to workspace",
          });
        },
        onError: (err) =>
          setInviteError(
            err instanceof ApiClientError ? err.message : "Something went wrong"
          ),
      }
    );
  }

  return (
    <Panel>
      <PanelHead title="Workspace members" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        {isLoading ? (
          <p className="py-2 text-[13px] text-text-secondary">Loading…</p>
        ) : (
          <div className="mb-3 flex flex-col gap-1">
            {members?.map((m) => (
              <div key={m.userId} className="group flex items-center gap-3 rounded-[10px] px-1 py-2">
                <Avatar initials={initialsOf(m.fullName)} size={32} />
                <div className="flex-1">
                  <div className="text-[13.8px] font-medium">
                    {m.fullName}
                    {m.userId === currentUser?.id && <span className="ml-1.5 text-text-faint">(you)</span>}
                  </div>
                  <div className="text-[11.5px] text-text-secondary">{m.email}</div>
                </div>
                <span className="text-[11px] font-semibold capitalize text-text-faint">{m.role.toLowerCase()}</span>
                {m.userId !== currentUser?.id && (
                  <button
                    onClick={() =>
                      remove.mutate(m.userId, {
                        onError: () => pushToast({ message: "Couldn't remove member" }),
                      })
                    }
                    className="rounded-md p-1.5 text-text-faint opacity-0 hover:bg-bg hover:text-state-danger group-hover:opacity-100"
                    aria-label="Remove from workspace"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!!pendingInvites?.length && (
          <div className="mb-3 flex flex-col gap-1 border-t border-border pt-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              Pending invites
            </div>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="group flex items-center gap-3 rounded-[10px] px-1 py-2">
                <Avatar initials={inv.email.slice(0, 2).toUpperCase()} size={32} />
                <div className="flex-1">
                  <div className="text-[13.8px] font-medium">{inv.email}</div>
                  <div className="text-[11.5px] text-text-secondary">Invited — awaiting sign up</div>
                </div>
                <span className="text-[11px] font-semibold capitalize text-text-faint">{inv.role.toLowerCase()}</span>
                <button
                  onClick={() =>
                    cancelInvite.mutate(inv.id, {
                      onSuccess: () => pushToast({ message: "Invite cancelled" }),
                      onError: () => pushToast({ message: "Couldn't cancel invite" }),
                    })
                  }
                  className="rounded-md p-1.5 text-text-faint opacity-0 hover:bg-bg hover:text-state-danger group-hover:opacity-100"
                  aria-label="Cancel invite"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitInvite} className="flex items-end gap-2 border-t border-border pt-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Invite by email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
          </div>
          <Button type="submit" size="sm" disabled={invite.isPending} className="mb-px">
            <UserPlus className="h-3.5 w-3.5" />
            {invite.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
        {inviteError && <p className="mt-1.5 text-xs text-state-danger">{inviteError}</p>}
        <p className="mt-2 text-[11.5px] leading-snug text-text-faint">
          If they already have an account they&apos;re added right away — otherwise we email them an invite link.
        </p>
      </PanelBody>
    </Panel>
  );
}
