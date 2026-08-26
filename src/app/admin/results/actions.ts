"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { collectFieldErrors } from "@/lib/form-errors";
import { recalculateRoundScores, ScoringRuleError } from "@/lib/data/scoring";
import { prisma } from "@/lib/prisma";
import { manualAdjustmentSchema } from "@/lib/validation/admin-scoring";

export interface RecalculateState {
  formError?: string;
  success?: string;
}

// Only Round 2 is ever scored — see AddScoringRuleForm.tsx, which
// only ever creates round-2 rules.
const recalculateSchema = z.object({ roundSlug: z.literal("round-2") });

export async function recalculateRoundAction(
  _prevState: RecalculateState,
  formData: FormData,
): Promise<RecalculateState> {
  const admin = await requireAdmin();
  const parsed = recalculateSchema.safeParse({ roundSlug: formData.get("roundSlug") });
  if (!parsed.success) return { formError: "Invalid round." };

  try {
    const count = await recalculateRoundScores(parsed.data.roundSlug);
    await writeAuditLog({
      userId: admin.userId,
      action: "SCORES_RECALCULATED",
      entityType: "Round",
      reason: `${parsed.data.roundSlug}: recalculated ${count} team score(s)`,
    });
    revalidatePath("/admin/results");
    return { success: `Recalculated scores for ${count} team(s).` };
  } catch (error) {
    if (error instanceof ScoringRuleError) return { formError: error.message };
    throw error;
  }
}

export interface AdjustmentFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
  success?: string;
}

export async function addManualAdjustmentAction(
  _prevState: AdjustmentFormState,
  formData: FormData,
): Promise<AdjustmentFormState> {
  const admin = await requireAdmin();
  const parsed = manualAdjustmentSchema.safeParse({
    teamId: formData.get("teamId"),
    roundId: formData.get("roundId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  const adjustment = await prisma.manualScoreAdjustment.create({
    data: {
      teamId: parsed.data.teamId,
      roundId: parsed.data.roundId ?? null,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      createdByUserId: admin.userId,
    },
  });
  await writeAuditLog({
    userId: admin.userId,
    action: "MANUAL_SCORE_ADJUSTMENT_ADDED",
    entityType: "ManualScoreAdjustment",
    entityId: adjustment.id,
    newValue: { amount: adjustment.amount, reason: adjustment.reason },
  });

  revalidatePath(`/admin/results/${parsed.data.teamId}`);
  return { success: "Adjustment recorded." };
}
