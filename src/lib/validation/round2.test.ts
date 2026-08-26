import { describe, it, expect } from "vitest";
import { roundTwoDraftSchema, roundTwoSubmitSchema } from "./round2";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const T1 = "33333333-3333-4333-8333-333333333333";
const C1 = "44444444-4444-4444-8444-444444444444";

const base = {
  primaryCustomerId: A,
  secondaryCustomerId: B,
};

describe("roundTwoDraftSchema", () => {
  it("allows leaving technical solution / commercial model unset", () => {
    const result = roundTwoDraftSchema.safeParse({
      ...base,
      primaryTechnicalSolutionId: "",
      primaryCommercialModelId: "",
      secondaryTechnicalSolutionId: "",
      secondaryCommercialModelId: "",
    });
    expect(result.success).toBe(true);
  });

  it("still requires the (hidden, server-derived) customer ids to be valid", () => {
    const result = roundTwoDraftSchema.safeParse({
      primaryCustomerId: "not-a-uuid",
      secondaryCustomerId: B,
    });
    expect(result.success).toBe(false);
  });
});

describe("roundTwoSubmitSchema", () => {
  it("requires all four selections for both customers", () => {
    const complete = roundTwoSubmitSchema.safeParse({
      ...base,
      primaryTechnicalSolutionId: T1,
      primaryCommercialModelId: C1,
      secondaryTechnicalSolutionId: T1,
      secondaryCommercialModelId: C1,
    });
    expect(complete.success).toBe(true);

    const missingSecondaryModel = roundTwoSubmitSchema.safeParse({
      ...base,
      primaryTechnicalSolutionId: T1,
      primaryCommercialModelId: C1,
      secondaryTechnicalSolutionId: T1,
      secondaryCommercialModelId: "",
    });
    expect(missingSecondaryModel.success).toBe(false);
  });
});
