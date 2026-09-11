// Idempotent — safe to re-run (e.g. on every deploy). Creates or promotes the
// super-admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env, and gives
// them a workspace of their own so the regular dashboard works too.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(name) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "workspace"
  );
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env.example)");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { isSuperAdmin: true },
    create: {
      email,
      passwordHash,
      fullName: "Invicly Admin",
      isSuperAdmin: true,
    },
  });

  const existingMembership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!existingMembership) {
    const baseSlug = slugify("Invicly HQ");
    await prisma.workspace.create({
      data: {
        name: "Invicly HQ",
        slug: `${baseSlug}-${user.id.slice(0, 8)}`,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    console.log(`Created workspace "Invicly HQ" for ${email}`);
  }

  console.log(`Super admin ready: ${email} (isSuperAdmin=true)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
