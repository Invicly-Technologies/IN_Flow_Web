import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const labelRepository = {
  list(workspaceId: string) {
    return prisma.label.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { name: "asc" } });
  },

  findById(id: string, workspaceId: string) {
    return prisma.label.findFirst({ where: { id, workspaceId, deletedAt: null } });
  },

  findByName(workspaceId: string, name: string) {
    return prisma.label.findFirst({ where: { workspaceId, name, deletedAt: null } });
  },

  create(data: Prisma.LabelUncheckedCreateInput) {
    return prisma.label.create({ data });
  },

  update(id: string, data: Prisma.LabelUncheckedUpdateInput) {
    return prisma.label.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.label.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
