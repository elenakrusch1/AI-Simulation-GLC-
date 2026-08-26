import { describe, it, expect } from "vitest";
import { roundOneDraftSchema, roundOneSubmitSchema } from "./round1";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("roundOneDraftSchema", () => {
  it("allows a fully empty draft (both fields blank)", () => {
    const result = roundOneDraftSchema.safeParse({
      primaryCustomerId: "",
      secondaryCustomerId: "",
      rationale: "",
    });
    expect(result.success).toBe(true);
  });

  it("allows a partial draft (only primary set)", () => {
    const result = roundOneDraftSchema.safeParse({
      primaryCustomerId: A,
      secondaryCustomerId: "",
      rationale: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects primary === secondary even as a draft", () => {
    const result = roundOneDraftSchema.safeParse({
      primaryCustomerId: A,
      secondaryCustomerId: A,
    });
    expect(result.success).toBe(false);
  });

  it("trims rationale and drops it when blank", () => {
    const result = roundOneDraftSchema.safeParse({
      primaryCustomerId: A,
      secondaryCustomerId: B,
      rationale: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rationale).toBeUndefined();
  });
});

describe("roundOneSubmitSchema", () => {
  it("requires both customers to be present", () => {
    expect(roundOneSubmitSchema.safeParse({ primaryCustomerId: A }).success).toBe(false);
    expect(
      roundOneSubmitSchema.safeParse({ primaryCustomerId: A, secondaryCustomerId: B }).success,
    ).toBe(true);
  });

  it("rejects primary === secondary", () => {
    const result = roundOneSubmitSchema.safeParse({
      primaryCustomerId: A,
      secondaryCustomerId: A,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("secondaryCustomerId"))).toBe(true);
    }
  });

  it("rejects a rationale longer than 2000 characters", () => {
    const result = roundOneSubmitSchema.safeParse({
      primaryCustomerId: A,
      secondaryCustomerId: B,
      rationale: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
