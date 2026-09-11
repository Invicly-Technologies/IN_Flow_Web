import { prisma } from "@/lib/prisma";
import type { Workspace, WorkspaceRole } from "@prisma/client";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "workspace"
  );
}

export const workspaceRepository = {
  /** Creates a workspace for a brand-new user and makes them its OWNER. */
  async createWithOwner(name: string, ownerId: string): Promise<Workspace> {
    const baseSlug = slugify(name);
    const slug = `${baseSlug}-${ownerId.slice(0, 8)}`;

    return prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: { userId: ownerId, role: "OWNER" },
        },
      },
    });
  },

  async listForUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships
      .filter((m) => m.workspace.deletedAt === null)
      .map((m) => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role }));
  },

  listMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
  },

  addMember(workspaceId: string, userId: string, role: WorkspaceRole) {
    return prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      create: { workspaceId, userId, role },
      update: {},
    });
  },

  removeMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.deleteMany({ where: { workspaceId, userId } });
  },

  /** Creates or refreshes a pending invite for an email with no account yet — re-inviting the
   * same address just extends the expiry and reissues the token rather than erroring. */
  upsertInvite(workspaceId: string, email: string, role: WorkspaceRole, invitedBy: string, token: string, expiresAt: Date) {
    return prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      create: { workspaceId, email, role, invitedBy, token, expiresAt },
      update: { role, invitedBy, token, expiresAt, acceptedAt: null },
    });
  },

  findInviteByToken(token: string) {
    return prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { select: { name: true } }, inviter: { select: { fullName: true } } },
    });
  },

  listPendingInvites(workspaceId: string) {
    return prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  findPendingInvitesForEmail(email: string) {
    return prisma.workspaceInvite.findMany({
      where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { workspace: { select: { id: true, name: true } } },
    });
  },

  markInviteAccepted(id: string) {
    return prisma.workspaceInvite.update({ where: { id }, data: { acceptedAt: new Date() } });
  },

  deleteInvite(id: string, workspaceId: string) {
    return prisma.workspaceInvite.deleteMany({ where: { id, workspaceId } });
  },
};
