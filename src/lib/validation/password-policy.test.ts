import { describe, it, expect } from "vitest";
import { passwordPolicySchema } from "./password-policy";

describe("passwordPolicySchema", () => {
  it("accepts a password with letters, numbers, and enough length", () => {
    expect(passwordPolicySchema.safeParse("CorrectHorse1").success).toBe(true);
  });

  it("rejects passwords shorter than 12 characters", () => {
    const result = passwordPolicySchema.safeParse("Short1");
    expect(result.success).toBe(false);
  });

  it("rejects a password with no letters", () => {
    expect(passwordPolicySchema.safeParse("123456789012").success).toBe(false);
  });

  it("rejects a password with no digits", () => {
    expect(passwordPolicySchema.safeParse("OnlyLettersHere").success).toBe(false);
  });

  it("rejects an overly long password", () => {
    const tooLong = "a1".repeat(150);
    expect(passwordPolicySchema.safeParse(tooLong).success).toBe(false);
  });
});
