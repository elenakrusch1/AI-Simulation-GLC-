"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { isAccountLocked, recordFailedLogin, recordSuccessfulLogin } from "@/lib/auth/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { teamLoginSchema, adminLoginSchema } from "@/lib/validation/auth";
import { collectFieldErrors } from "@/lib/form-errors";

export interface LoginFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
}

// Identical wording regardless of which check failed (unknown team
// code / wrong password / inactive team / locked account) so a login
// attempt can never be used to enumerate valid team codes or admin
// identifiers.
const GENERIC_INVALID_CREDENTIALS = "Invalid team code or password.";
const GENERIC_INVALID_ADMIN_CREDENTIALS = "Invalid email/username or password.";

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: await getClientIp(),
    userAgent: h.get("user-agent"),
  };
}

export async function loginTeamAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = teamLoginSchema.safeParse({
    teamCode: formData.get("teamCode"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { teamCode, password } = parsed.data;

  const team = await prisma.team.findUnique({
    where: { code: teamCode },
    include: { user: true },
  });

  const user = team?.user ?? null;

  if (!user || user.role !== "TEAM") {
    await verifyPassword(password, null);
    return { formError: GENERIC_INVALID_CREDENTIALS };
  }

  if (isAccountLocked(user)) {
    // Still compare against the real hash so timing doesn't
    // distinguish "locked" from "wrong password".
    await verifyPassword(password, user.passwordHash);
    return { formError: GENERIC_INVALID_CREDENTIALS };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    await recordFailedLogin(user.id, user.failedLoginCount);
    return { formError: GENERIC_INVALID_CREDENTIALS };
  }

  if (!user.active || !team || !team.active) {
    return { formError: GENERIC_INVALID_CREDENTIALS };
  }

  await recordSuccessfulLogin(user.id);
  const meta = await requestMeta();
  const { token, expiresAt } = await createSession(user.id, meta);
  await setSessionCookie(token, expiresAt);
  await writeAuditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "Team",
    entityId: team.id,
  });

  redirect("/team");
}

export async function loginAdminAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = adminLoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { identifier, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { loginIdentifier: identifier } });

  if (!user || user.role !== "ADMIN") {
    await verifyPassword(password, null);
    return { formError: GENERIC_INVALID_ADMIN_CREDENTIALS };
  }

  if (isAccountLocked(user)) {
    await verifyPassword(password, user.passwordHash);
    return { formError: GENERIC_INVALID_ADMIN_CREDENTIALS };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    await recordFailedLogin(user.id, user.failedLoginCount);
    return { formError: GENERIC_INVALID_ADMIN_CREDENTIALS };
  }

  if (!user.active) {
    return { formError: GENERIC_INVALID_ADMIN_CREDENTIALS };
  }

  await recordSuccessfulLogin(user.id);
  const meta = await requestMeta();
  const { token, expiresAt } = await createSession(user.id, meta);
  await setSessionCookie(token, expiresAt);
  await writeAuditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "User",
    entityId: user.id,
  });

  redirect("/admin");
}
