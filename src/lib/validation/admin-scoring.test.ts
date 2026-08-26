import { describe, it, expect } from "vitest";
import { createScoringRuleSchema } from "./admin-scoring";

const VERSION_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

describe("createScoringRuleSchema", () => {
  it("accepts a minimal round 1 rule with only required fields", () => {
    const result = createScoringRuleSchema.safeParse({
      scoringModelVersionId: VERSION_ID,
      roundNumber: "1",
      ruleType: "BASE",
      points: "10",
    });
    expect(result.success).toBe(true);
  });

  // Regression test: technicalSolutionId/commercialModelId are only
  // rendered in the UI for round 2, so FormData.get() returns `null`
  // (not "") for them when adding a round 1 rule — the schema must
  // accept that, or rule creation silently fails with no visible
  // error (see AddScoringRuleForm.tsx).
  it("accepts null for optional id fields (as FormData.get returns for absent fields)", () => {
    const result = createScoringRuleSchema.safeParse({
      scoringModelVersionId: VERSION_ID,
      roundNumber: "1",
      ruleType: "BASE",
      points: "10",
      customerId: null,
      customerRole: null,
      technicalSolutionId: null,
      commercialModelId: null,
      externalRuleId: null,
      adminNote: null,
    });
    expect(result.success).toBe(true);
  });

  it("coerces points and roundNumber from string form input", () => {
    const result = createScoringRuleSchema.safeParse({
      scoringModelVersionId: VERSION_ID,
      roundNumber: "2",
      ruleType: "PENALTY",
      points: "-15",
      customerId: CUSTOMER_ID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roundNumber).toBe(2);
      expect(result.data.points).toBe(-15);
    }
  });

  it("rejects a round number outside 1-2", () => {
    const result = createScoringRuleSchema.safeParse({
      scoringModelVersionId: VERSION_ID,
      roundNumber: "3",
      ruleType: "BASE",
      points: "10",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer points value", () => {
    const result = createScoringRuleSchema.safeParse({
      scoringModelVersionId: VERSION_ID,
      roundNumber: "1",
      ruleType: "BASE",
      points: "10.5",
    });
    expect(result.success).toBe(false);
  });
});
