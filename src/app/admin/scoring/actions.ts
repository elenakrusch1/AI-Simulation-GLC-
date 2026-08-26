"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { collectFieldErrors } from "@/lib/form-errors";
import {
  createScoringModelVersion,
  createScoringRule,
  setScoringRuleActive,
  activateScoringModelVersion,
  archiveScoringModelVersion,
  ScoringRuleError,
} from "@/lib/data/scoring";
import {
  createScoringModelVersionSchema,
  createScoringRuleSchema,
  ruleIdActionSchema,
  versionIdActionSchema,
} from "@/lib/validation/admin-scoring";

export interface ScoringFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
  success?: string;
}

export async function createScoringModelVersionAction(
  _prevState: ScoringFormState,
  formData: FormData,
): Promise<ScoringFormState> {
  const admin = await requireAdmin();
  const parsed = createScoringModelVersionSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  const version = await createScoringModelVersion(parsed.data.name, admin.userId);
  await writeAuditLog({
    userId: admin.userId,
    action: "SCORING_MODEL_VERSION_CREATED",
    entityType: "ScoringModelVersion",
    entityId: version.id,
    newValue: { name: version.name, status: version.status },
  });

  revalidatePath("/admin/scoring");
  return { success: `Scoring model "${version.name}" created as a draft.` };
}

export async function createScoringRuleAction(
  _prevState: ScoringFormState,
  formData: FormData,
): Promise<ScoringFormState> {
  const admin = await requireAdmin();
  const parsed = createScoringRuleSchema.safeParse({
    scoringModelVersionId: formData.get("scoringModelVersionId"),
    roundNumber: formData.get("roundNumber"),
    ruleType: formData.get("ruleType"),
    points: formData.get("points"),
    customerId: formData.get("customerId"),
    customerRole: formData.get("customerRole"),
    technicalSolutionId: formData.get("technicalSolutionId"),
    commercialModelId: formData.get("commercialModelId"),
    externalRuleId: formData.get("externalRuleId"),
    adminNote: formData.get("adminNote"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  try {
    const rule = await createScoringRule(parsed.data);
    await writeAuditLog({
      userId: admin.userId,
      action: "SCORING_RULE_CREATED",
      entityType: "ScoringRule",
      entityId: rule.id,
      newValue: { roundNumber: rule.roundNumber, ruleType: rule.ruleType, points: rule.points },
    });
  } catch (error) {
    if (error instanceof ScoringRuleError) return { formError: error.message };
    throw error;
  }

  revalidatePath(`/admin/scoring/${parsed.data.scoringModelVersionId}`);
  return { success: "Rule added." };
}

export async function setScoringRuleActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = ruleIdActionSchema.safeParse({ ruleId: formData.get("ruleId") });
  const activeRaw = formData.get("active");
  if (!parsed.success || (activeRaw !== "true" && activeRaw !== "false")) return;

  const active = activeRaw === "true";
  try {
    const rule = await setScoringRuleActive(parsed.data.ruleId, active);
    await writeAuditLog({
      userId: admin.userId,
      action: active ? "SCORING_RULE_ENABLED" : "SCORING_RULE_DISABLED",
      entityType: "ScoringRule",
      entityId: rule.id,
    });
    revalidatePath(`/admin/scoring/${rule.scoringModelVersionId}`);
  } catch {
    // Swallow — invalid state transitions just leave the page unchanged.
  }
}

export async function activateScoringModelVersionAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = versionIdActionSchema.safeParse({
    scoringModelVersionId: formData.get("scoringModelVersionId"),
  });
  if (!parsed.success) return;

  try {
    const version = await activateScoringModelVersion(parsed.data.scoringModelVersionId);
    await writeAuditLog({
      userId: admin.userId,
      action: "SCORING_MODEL_VERSION_ACTIVATED",
      entityType: "ScoringModelVersion",
      entityId: version.id,
    });
  } catch {
    // Invalid transition — ignore, page re-renders current state.
  }

  revalidatePath("/admin/scoring");
  revalidatePath(`/admin/scoring/${parsed.data.scoringModelVersionId}`);
}

export async function archiveScoringModelVersionAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = versionIdActionSchema.safeParse({
    scoringModelVersionId: formData.get("scoringModelVersionId"),
  });
  if (!parsed.success) return;

  try {
    const version = await archiveScoringModelVersion(parsed.data.scoringModelVersionId);
    await writeAuditLog({
      userId: admin.userId,
      action: "SCORING_MODEL_VERSION_ARCHIVED",
      entityType: "ScoringModelVersion",
      entityId: version.id,
    });
  } catch {
    // Invalid transition — ignore.
  }

  revalidatePath("/admin/scoring");
  revalidatePath(`/admin/scoring/${parsed.data.scoringModelVersionId}`);
}
