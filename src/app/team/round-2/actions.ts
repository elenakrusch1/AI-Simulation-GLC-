"use server";

import { revalidatePath } from "next/cache";
import { requireTeam } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { collectFieldErrors } from "@/lib/form-errors";
import { roundTwoDraftSchema, roundTwoSubmitSchema } from "@/lib/validation/round2";
import { saveRoundTwoDraft, submitRoundTwo, SubmissionRuleError } from "@/lib/data/submissions";

export interface RoundTwoFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
  success?: string;
}

function readFormData(formData: FormData) {
  return {
    primaryCustomerId: formData.get("primaryCustomerId"),
    primaryTechnicalSolutionId: formData.get("primaryTechnicalSolutionId"),
    primaryCommercialModelId: formData.get("primaryCommercialModelId"),
    primaryRationale: formData.get("primaryRationale"),
    secondaryCustomerId: formData.get("secondaryCustomerId"),
    secondaryTechnicalSolutionId: formData.get("secondaryTechnicalSolutionId"),
    secondaryCommercialModelId: formData.get("secondaryCommercialModelId"),
    secondaryRationale: formData.get("secondaryRationale"),
  };
}

export async function saveRoundTwoDraftAction(
  _prevState: RoundTwoFormState,
  formData: FormData,
): Promise<RoundTwoFormState> {
  const session = await requireTeam();
  if (!session.teamId) return { formError: "No team is associated with this account." };

  const parsed = roundTwoDraftSchema.safeParse(readFormData(formData));
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };
  const data = parsed.data;

  try {
    await saveRoundTwoDraft(session.teamId, {
      primary: {
        role: "PRIMARY",
        customerId: data.primaryCustomerId,
        technicalSolutionId: data.primaryTechnicalSolutionId,
        commercialModelId: data.primaryCommercialModelId,
        rationale: data.primaryRationale,
      },
      secondary: {
        role: "SECONDARY",
        customerId: data.secondaryCustomerId,
        technicalSolutionId: data.secondaryTechnicalSolutionId,
        commercialModelId: data.secondaryCommercialModelId,
        rationale: data.secondaryRationale,
      },
    });
  } catch (error) {
    if (error instanceof SubmissionRuleError) return { formError: error.message };
    throw error;
  }

  revalidatePath("/team/round-2");
  revalidatePath("/team");
  return { success: "Draft saved." };
}

export async function submitRoundTwoAction(
  _prevState: RoundTwoFormState,
  formData: FormData,
): Promise<RoundTwoFormState> {
  const session = await requireTeam();
  if (!session.teamId) return { formError: "No team is associated with this account." };

  const parsed = roundTwoSubmitSchema.safeParse(readFormData(formData));
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };
  const data = parsed.data;

  try {
    const submission = await submitRoundTwo(session.teamId, {
      primary: {
        role: "PRIMARY",
        customerId: data.primaryCustomerId,
        technicalSolutionId: data.primaryTechnicalSolutionId,
        commercialModelId: data.primaryCommercialModelId,
        rationale: data.primaryRationale,
      },
      secondary: {
        role: "SECONDARY",
        customerId: data.secondaryCustomerId,
        technicalSolutionId: data.secondaryTechnicalSolutionId,
        commercialModelId: data.secondaryCommercialModelId,
        rationale: data.secondaryRationale,
      },
    });
    await writeAuditLog({
      userId: session.userId,
      action: "ROUND_2_SUBMITTED",
      entityType: "Submission",
      entityId: submission.id,
    });
  } catch (error) {
    if (error instanceof SubmissionRuleError) return { formError: error.message };
    throw error;
  }

  revalidatePath("/team/round-2");
  revalidatePath("/team");
  revalidatePath("/team/history");
  return { success: "Your Round 2 decisions have been submitted." };
}
