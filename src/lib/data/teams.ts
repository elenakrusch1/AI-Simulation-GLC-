import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";

// Team accounts are self-registered (see src/app/register) and never
// use a password — teams authenticate with their team code alone
// (see src/app/login/actions.ts). The User row still needs a non-null
// passwordHash (shared column with admin accounts, which DO use a
// password), so registration hashes a random, never-issued value that
// is discarded immediately after — it can never be used to log in,
// since the team-login path never checks it.
function randomUnusablePassword(): string {
  return randomBytes(24).toString("base64url");
}

export interface TeamListItem {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export async function listTeamsForAdmin(): Promise<TeamListItem[]> {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      active: true,
      createdAt: true,
      user: { select: { lastLoginAt: true } },
    },
  });
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    code: team.code,
    active: team.active,
    createdAt: team.createdAt,
    lastLoginAt: team.user.lastLoginAt,
  }));
}

export async function getTeamForAdmin(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      code: true,
      active: true,
      userId: true,
      user: { select: { lastLoginAt: true } },
    },
  });
}

/** Used by self-registration (no admin actor involved). */
export async function createTeam(input: { name: string; code: string }) {
  const passwordHash = await hashPassword(randomUnusablePassword());
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { loginIdentifier: input.code, passwordHash, role: "TEAM" },
    });
    const team = await tx.team.create({
      data: { name: input.name, code: input.code, userId: user.id },
    });
    return team;
  });
}

export async function updateTeam(input: { teamId: string; name: string; code: string }) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.update({
      where: { id: input.teamId },
      data: { name: input.name, code: input.code },
    });
    // Keep the underlying login identifier in sync with the team code
    // (team code is what teams actually authenticate with).
    await tx.user.update({
      where: { id: team.userId },
      data: { loginIdentifier: input.code },
    });
    return team;
  });
}

export async function setTeamActive(teamId: string, active: boolean) {
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { active },
  });
  if (!active) {
    // Immediately revoke any live sessions for a deactivated team.
    await destroyAllSessionsForUser(team.userId);
  }
  return team;
}
