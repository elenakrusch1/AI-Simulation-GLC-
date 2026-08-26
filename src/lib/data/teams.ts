import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";

// Admin-only projections and mutations for Team accounts. Never
// imported from any /team/** code path.

export interface TeamListItem {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  locked: boolean;
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
      user: { select: { lastLoginAt: true, lockedUntil: true } },
    },
  });
  const now = Date.now();
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    code: team.code,
    active: team.active,
    createdAt: team.createdAt,
    lastLoginAt: team.user.lastLoginAt,
    locked: !!team.user.lockedUntil && team.user.lockedUntil.getTime() > now,
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
      user: { select: { lastLoginAt: true, lockedUntil: true, failedLoginCount: true } },
    },
  });
}

export async function createTeam(input: { name: string; code: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
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

export async function resetTeamPassword(teamId: string, newPassword: string) {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: team.userId },
    data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
  });
  // Force re-authentication with the new password.
  await destroyAllSessionsForUser(team.userId);
  return team;
}
