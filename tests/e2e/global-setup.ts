import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/lib/auth/password";

export const E2E_ADMIN = { identifier: "e2e-admin@example.com", password: "E2eAdminPass1!" };
// Teams have no password — the code alone is the credential (see
// src/lib/data/teams.ts). This fixture team is pre-seeded (rather
// than exercising /register) so the login spec has a stable,
// deterministic account; registration itself would need its own spec.
export const E2E_TEAM = { code: "E2ETEAM", name: "E2E Test Team" };

// Any random value works here — never checked by team login, only
// present to satisfy the shared, non-null User.passwordHash column.
function unusablePasswordHash() {
  return hashPassword(`e2e-unused-${crypto.randomUUID()}`);
}

export default async function globalSetup() {
  const prisma = new PrismaClient();
  try {
    await prisma.user.upsert({
      where: { loginIdentifier: E2E_ADMIN.identifier },
      update: { passwordHash: await hashPassword(E2E_ADMIN.password), active: true, role: "ADMIN" },
      create: {
        loginIdentifier: E2E_ADMIN.identifier,
        passwordHash: await hashPassword(E2E_ADMIN.password),
        role: "ADMIN",
      },
    });

    const existingTeam = await prisma.team.findUnique({ where: { code: E2E_TEAM.code } });
    if (existingTeam) {
      await prisma.user.update({
        where: { id: existingTeam.userId },
        data: { active: true },
      });
      await prisma.team.update({ where: { id: existingTeam.id }, data: { active: true } });
    } else {
      const teamUser = await prisma.user.create({
        data: {
          loginIdentifier: E2E_TEAM.code,
          passwordHash: await unusablePasswordHash(),
          role: "TEAM",
        },
      });
      await prisma.team.create({
        data: { name: E2E_TEAM.name, code: E2E_TEAM.code, userId: teamUser.id },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
