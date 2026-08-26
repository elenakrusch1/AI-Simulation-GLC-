"use server";

import { revalidatePath } from "next/cache";
import { requireTeam } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { collectFieldErrors } from "@/lib/form-errors";
import { roundOneDraftSchema, roundOneSubmitSchema } from "@/lib/validation/round1";
import { saveRoundOneDraft, submitRoundOne, SubmissionRuleError } from "@/lib/data/submissions";

export interface RoundOneFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
  success?: string;
}

export async function saveRoundOneDraftAction(
  _prevState: RoundOneFormState,
  formData: FormData,
): Promise<RoundOneFormState> {
  const session = await requireTeam();
  if (!session.teamId) return { formError: "No team is associated with this account." };

  const parsed = roundOneDraftSchema.safeParse({
    primaryCustomerId: formData.get("primaryCustomerId"),
    secondaryCustomerId: formData.get("secondaryCustomerId"),
    rationale: formData.get("rationale"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  try {
    await saveRoundOneDraft(session.teamId, parsed.data);
  } catch (error) {
    if (error instanceof SubmissionRuleError) return { formError: error.message };
    throw error;
  }

  revalidatePath("/team/round-1");
  revalidatePath("/team");
  return { success: "Draft saved." };
}

export async function submitRoundOneAction(
  _prevState: RoundOneFormState,
  formData: FormData,
): Promise<RoundOneFormState> {
  const session = await requireTeam();
  if (!session.teamId) return { formError: "No team is associated with this account." };

  const parsed = roundOneSubmitSchema.safeParse({
    primaryCustomerId: formData.get("primaryCustomerId"),
    secondaryCustomerId: formData.get("secondaryCustomerId"),
    rationale: formData.get("rationale"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  try {
    const submission = await submitRoundOne(session.teamId, parsed.data);
    await writeAuditLog({
      userId: session.userId,
      action: "ROUND_1_SUBMITTED",
      entityType: "Submission",
      entityId: submission.id,
    });
  } catch (error) {
    if (error instanceof SubmissionRuleError) return { formError: error.message };
    throw error;
  }

  revalidatePath("/team/round-1");
  revalidatePath("/team");
  revalidatePath("/team/history");
  return { success: "Your Round 1 decisions have been submitted." };
}
