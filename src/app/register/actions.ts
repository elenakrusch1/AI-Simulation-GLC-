"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { createTeam } from "@/lib/data/teams";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { registerTeamSchema } from "@/lib/validation/admin-teams";
import { collectFieldErrors } from "@/lib/form-errors";

export interface RegisterFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function registerTeamAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerTeamSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  let team;
  try {
    team = await createTeam(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { formError: "That team code is already in use. Choose a different one." };
    }
    throw error;
  }

  await writeAuditLog({
    userId: team.userId,
    action: "TEAM_REGISTERED",
    entityType: "Team",
    entityId: team.id,
    newValue: { name: team.name, code: team.code },
  });

  // Registration doubles as sign-in — teams have no password to log
  // in with separately afterwards.
  const h = await headers();
  const { token, expiresAt } = await createSession(team.userId, {
    ipAddress: await getClientIp(),
    userAgent: h.get("user-agent"),
  });
  await setSessionCookie(token, expiresAt);
  await writeAuditLog({
    userId: team.userId,
    action: "LOGIN_SUCCESS",
    entityType: "Team",
    entityId: team.id,
  });

  redirect("/team");
}
