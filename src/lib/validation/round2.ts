import { z } from "zod";

const rationaleSchema = z
  .string()
  .max(2000, "Rationale must be 2000 characters or fewer")
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const requiredUuid = (message: string) => z.string().uuid({ message });

/** Save Draft: technical solution / commercial model may be left unset per side. */
export const roundTwoDraftSchema = z.object({
  primaryCustomerId: z.string().uuid(),
  primaryTechnicalSolutionId: optionalUuid,
  primaryCommercialModelId: optionalUuid,
  primaryRationale: rationaleSchema,
  secondaryCustomerId: z.string().uuid(),
  secondaryTechnicalSolutionId: optionalUuid,
  secondaryCommercialModelId: optionalUuid,
  secondaryRationale: rationaleSchema,
});

/** Final Submit: all four selections are mandatory. */
export const roundTwoSubmitSchema = z.object({
  primaryCustomerId: z.string().uuid(),
  primaryTechnicalSolutionId: requiredUuid("Select a technical solution for the primary customer."),
  primaryCommercialModelId: requiredUuid("Select a commercial model for the primary customer."),
  primaryRationale: rationaleSchema,
  secondaryCustomerId: z.string().uuid(),
  secondaryTechnicalSolutionId: requiredUuid("Select a technical solution for the secondary customer."),
  secondaryCommercialModelId: requiredUuid("Select a commercial model for the secondary customer."),
  secondaryRationale: rationaleSchema,
});

export type RoundTwoDraftInput = z.infer<typeof roundTwoDraftSchema>;
export type RoundTwoSubmitInput = z.infer<typeof roundTwoSubmitSchema>;
