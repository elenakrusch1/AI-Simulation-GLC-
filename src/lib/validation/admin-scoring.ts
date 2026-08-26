import { z } from "zod";

const idSchema = z.string().uuid("Invalid identifier");
// Every "optional" schema below accepts null as well as undefined/"":
// a conditionally-rendered field (e.g. technicalSolutionId when
// roundNumber=1) is absent from the DOM entirely, so FormData.get()
// returns null rather than "" for it. Without this, such a field
// fails validation with no field-level error shown anywhere in the
// UI (see AddScoringRuleForm.tsx) — the create silently no-ops.
const optionalId = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : undefined));

function optionalText(maxLength: number, message: string) {
  return z
    .union([z.string().max(maxLength, message), z.null()])
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined));
}

export const createScoringModelVersionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
});

export const scoringRuleTypeSchema = z.enum(["BASE", "COMBINATION", "BONUS", "PENALTY", "MANUAL_CATEGORY"]);
export const customerRoleSchema = z.enum(["PRIMARY", "SECONDARY"]);

export const createScoringRuleSchema = z.object({
  scoringModelVersionId: idSchema,
  roundNumber: z.coerce.number().int().min(1).max(2, "Round must be 1 or 2"),
  ruleType: scoringRuleTypeSchema,
  points: z.coerce.number().int("Points must be a whole number"),
  customerId: optionalId,
  customerRole: z
    .union([customerRoleSchema, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  technicalSolutionId: optionalId,
  commercialModelId: optionalId,
  externalRuleId: optionalText(100, "External rule ID is too long"),
  adminNote: optionalText(1000, "Admin note is too long"),
});

export const ruleIdActionSchema = z.object({ ruleId: idSchema });
export const versionIdActionSchema = z.object({ scoringModelVersionId: idSchema });

export const manualAdjustmentSchema = z.object({
  teamId: idSchema,
  roundId: optionalId,
  amount: z.coerce.number().int("Amount must be a whole number"),
  reason: z.string().trim().min(1, "A reason is required").max(500, "Reason is too long"),
});
