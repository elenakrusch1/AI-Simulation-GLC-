import type { ZodError } from "zod";

/** Turns Zod issues into a flat { fieldName: message } map for form UIs (first issue per field wins). */
export function collectFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
