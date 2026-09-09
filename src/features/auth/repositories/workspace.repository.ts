import { prisma } from "@/lib/prisma";
import type { Workspace } from "@prisma/client";

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
};
