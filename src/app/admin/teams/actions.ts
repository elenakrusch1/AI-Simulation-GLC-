"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { collectFieldErrors } from "@/lib/form-errors";
import { updateTeam, setTeamActive, getTeamForAdmin } from "@/lib/data/teams";
import { updateTeamSchema, setTeamActiveSchema } from "@/lib/validation/admin-teams";

export interface TeamFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
  success?: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function updateTeamAction(
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const admin = await requireAdmin();

  const parsed = updateTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  const before = await getTeamForAdmin(parsed.data.teamId);
  if (!before) return { formError: "Team not found." };

  try {
    const team = await updateTeam(parsed.data);
    await writeAuditLog({
      userId: admin.userId,
      action: "TEAM_UPDATED",
      entityType: "Team",
      entityId: team.id,
      previousValue: { name: before.name, code: before.code },
      newValue: { name: team.name, code: team.code },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { formError: "That team code is already in use. Choose a different one." };
    }
    throw error;
  }

  revalidatePath("/admin/teams");
  return { success: "Team updated." };
}

export async function setTeamActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = setTeamActiveSchema.safeParse({
    teamId: formData.get("teamId"),
    active: formData.get("active"),
  });
  if (!parsed.success) return;

  const before = await getTeamForAdmin(parsed.data.teamId);
  if (!before) return;

  const team = await setTeamActive(parsed.data.teamId, parsed.data.active);
  await writeAuditLog({
    userId: admin.userId,
    action: parsed.data.active ? "TEAM_ACTIVATED" : "TEAM_DEACTIVATED",
    entityType: "Team",
    entityId: team.id,
    previousValue: { active: before.active },
    newValue: { active: team.active },
  });

  revalidatePath("/admin/teams");
}
