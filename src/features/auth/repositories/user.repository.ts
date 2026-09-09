import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  },
};
