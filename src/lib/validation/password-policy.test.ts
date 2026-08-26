import { describe, it, expect } from "vitest";
import { passwordPolicySchema } from "./password-policy";

describe("passwordPolicySchema", () => {
  it("accepts a short, letters-only password (relaxed policy)", () => {
    expect(passwordPolicySchema.safeParse("nimda").success).toBe(true);
  });

  it("accepts a password with letters, numbers, and enough length", () => {
    expect(passwordPolicySchema.safeParse("CorrectHorse1").success).toBe(true);
  });

  it("rejects passwords shorter than 4 characters", () => {
    const result = passwordPolicySchema.safeParse("abc");
    expect(result.success).toBe(false);
  });

  it("rejects an overly long password", () => {
    const tooLong = "a1".repeat(150);
    expect(passwordPolicySchema.safeParse(tooLong).success).toBe(false);
  });
});
