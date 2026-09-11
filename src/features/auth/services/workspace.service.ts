import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { workspaceRepository } from "@/features/auth/repositories/workspace.repository";
import { userRepository } from "@/features/auth/repositories/user.repository";
import { notificationService } from "@/features/notifications/services/notification.service";
import { sendMail } from "@/lib/mail";
import type { WorkspaceRole } from "@prisma/client";

const INVITE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function toMemberDTO(m: { userId: string; role: string; user: { fullName: string; email: string; avatarUrl: string | null } }) {
  return { userId: m.userId, role: m.role, fullName: m.user.fullName, email: m.user.email, avatarUrl: m.user.avatarUrl };
}

export interface PendingInviteDTO {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

function toInviteDTO(i: { id: string; email: string; role: string; createdAt: Date; expiresAt: Date }): PendingInviteDTO {
  return { id: i.id, email: i.email, role: i.role, createdAt: i.createdAt.toISOString(), expiresAt: i.expiresAt.toISOString() };
}

export const workspaceService = {
  async listMembers(workspaceId: string) {
    const members = await workspaceRepository.listMembers(workspaceId);
    return members.map(toMemberDTO);
  },

  async inviteByEmail(workspaceId: string, actorUserId: string, email: string, role: WorkspaceRole) {
    const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { fullName: true } });
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });

    const user = await userRepository.findByEmail(email);
    if (!user) {
      // No account yet — send them a real invite instead of dead-ending here. They join this
      // workspace automatically the moment they register with this email (see acceptPendingInvites).
      const token = randomBytes(24).toString("hex");
      await workspaceRepository.upsertInvite(
        workspaceId,
        email,
        role,
        actorUserId,
        token,
        new Date(Date.now() + INVITE_EXPIRY_MS)
      );
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      void sendMail({
        to: email,
        subject: `${actor?.fullName ?? "Someone"} invited you to "${workspace?.name ?? "a workspace"}" on Invicly Flow`,
        html: `<p>${actor?.fullName ?? "Someone"} invited you to join the <strong>${workspace?.name ?? "workspace"}</strong> workspace on Invicly Flow.</p>
<p><a href="${appUrl}/register?invite=${token}">Create your account</a> to accept — this link works for the next 14 days.</p>`,
      });
      return { members: await this.listMembers(workspaceId), invited: email };
    }

    const existing = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId: user.id } });
    if (existing) {
      throw new ApiError("CONFLICT", "That person is already a member of this workspace");
    }
    await workspaceRepository.addMember(workspaceId, user.id, role);

    await notificationService.notify(
      user.id,
      "SYSTEM",
      `${actor?.fullName ?? "Someone"} added you to a workspace`,
      workspace?.name ?? undefined
    );
    void sendMail({
      to: user.email,
      subject: `You've been added to "${workspace?.name ?? "a workspace"}" on Invicly Flow`,
      html: `<p>${actor?.fullName ?? "Someone"} added you to the <strong>${workspace?.name ?? "workspace"}</strong> workspace on Invicly Flow.</p>`,
    });

    return { members: await this.listMembers(workspaceId), invited: null };
  },

  async listPendingInvites(workspaceId: string): Promise<PendingInviteDTO[]> {
    const invites = await workspaceRepository.listPendingInvites(workspaceId);
    return invites.map(toInviteDTO);
  },

  async cancelInvite(id: string, workspaceId: string): Promise<void> {
    await workspaceRepository.deleteInvite(id, workspaceId);
  },

  /** Public (unauthenticated) preview for the register page — never reveals anything beyond
   * what the invite email itself already says. */
  async getInvitePreview(token: string) {
    const invite = await workspaceRepository.findInviteByToken(token);
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new ApiError("NOT_FOUND", "This invite link is invalid or has expired");
    }
    return { workspaceName: invite.workspace.name, inviterName: invite.inviter.fullName, email: invite.email };
  },

  /** Called right after a new user registers — joins them to every workspace that has a
   * still-valid pending invite for their email, so the invite flow closes the loop. */
  async acceptPendingInvites(userId: string, email: string): Promise<{ id: string; name: string }[]> {
    const invites = await workspaceRepository.findPendingInvitesForEmail(email);
    const joined: { id: string; name: string }[] = [];
    for (const invite of invites) {
      await workspaceRepository.addMember(invite.workspaceId, userId, invite.role);
      await workspaceRepository.markInviteAccepted(invite.id);
      joined.push({ id: invite.workspace.id, name: invite.workspace.name });
    }
    return joined;
  },

  async removeMember(workspaceId: string, targetUserId: string) {
    const members = await workspaceRepository.listMembers(workspaceId);
    if (members.length <= 1) {
      throw new ApiError("VALIDATION_ERROR", "A workspace must have at least one member");
    }
    const target = members.find((m) => m.userId === targetUserId);
    if (target?.role === "OWNER" && members.filter((m) => m.role === "OWNER").length <= 1) {
      throw new ApiError("VALIDATION_ERROR", "A workspace must keep at least one owner");
    }
    await workspaceRepository.removeMember(workspaceId, targetUserId);
  },
};
