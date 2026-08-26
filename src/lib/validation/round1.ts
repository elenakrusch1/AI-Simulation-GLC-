import { z } from "zod";

const rationaleSchema = z
  .string()
  .max(2000, "Rationale must be 2000 characters or fewer")
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const optionalCustomerId = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

/** Save Draft: partial input is allowed, but any values present must be valid. */
export const roundOneDraftSchema = z
  .object({
    primaryCustomerId: optionalCustomerId,
    secondaryCustomerId: optionalCustomerId,
    rationale: rationaleSchema,
  })
  .refine(
    (data) =>
      !data.primaryCustomerId ||
      !data.secondaryCustomerId ||
      data.primaryCustomerId !== data.secondaryCustomerId,
    { message: "Primary and secondary customer must be different.", path: ["secondaryCustomerId"] },
  );

/** Final Submit: both selections are mandatory. */
export const roundOneSubmitSchema = z
  .object({
    primaryCustomerId: z.string().uuid({ message: "Select a primary customer." }),
    secondaryCustomerId: z.string().uuid({ message: "Select a secondary customer." }),
    rationale: rationaleSchema,
  })
  .refine((data) => data.primaryCustomerId !== data.secondaryCustomerId, {
    message: "Primary and secondary customer must be different.",
    path: ["secondaryCustomerId"],
  });

export type RoundOneDraftInput = z.infer<typeof roundOneDraftSchema>;
export type RoundOneSubmitInput = z.infer<typeof roundOneSubmitSchema>;
