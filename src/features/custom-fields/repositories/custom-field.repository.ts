import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const customFieldRepository = {
  list(workspaceId: string) {
    return prisma.customFieldDefinition.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { position: "asc" },
    });
  },

  findById(id: string, workspaceId: string) {
    return prisma.customFieldDefinition.findFirst({ where: { id, workspaceId, deletedAt: null } });
  },

  findByName(workspaceId: string, name: string) {
    return prisma.customFieldDefinition.findFirst({ where: { workspaceId, name, deletedAt: null } });
  },

  async create(data: Prisma.CustomFieldDefinitionUncheckedCreateInput) {
    const last = await prisma.customFieldDefinition.findFirst({
      where: { workspaceId: data.workspaceId, deletedAt: null },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    return prisma.customFieldDefinition.create({
      data: { ...data, position: (last?.position ?? -1) + 1 },
    });
  },

  update(id: string, data: Prisma.CustomFieldDefinitionUncheckedUpdateInput) {
    return prisma.customFieldDefinition.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.customFieldDefinition.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async upsertValue(taskId: string, fieldId: string, value: string | number | boolean | null) {
    const jsonValue = value === null ? Prisma.DbNull : value;
    return prisma.taskCustomFieldValue.upsert({
      where: { taskId_fieldId: { taskId, fieldId } },
      create: { taskId, fieldId, value: jsonValue },
      update: { value: jsonValue },
    });
  },
};
