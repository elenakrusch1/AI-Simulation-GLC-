import { describe, it, expect } from "vitest";
import { roundOneRuleMatches, roundTwoRuleMatches, describeRule } from "./scoring-rules";

const decision = { primaryCustomerId: "cust-a", secondaryCustomerId: "cust-b" };

describe("roundOneRuleMatches", () => {
  it("matches everything when no target fields are set (flat award)", () => {
    expect(roundOneRuleMatches({ customerId: null, customerRole: null }, decision)).toBe(true);
  });

  it("matches only the primary slot when customerRole=PRIMARY", () => {
    expect(
      roundOneRuleMatches({ customerId: "cust-a", customerRole: "PRIMARY" }, decision),
    ).toBe(true);
    expect(
      roundOneRuleMatches({ customerId: "cust-b", customerRole: "PRIMARY" }, decision),
    ).toBe(false);
  });

  it("matches only the secondary slot when customerRole=SECONDARY", () => {
    expect(
      roundOneRuleMatches({ customerId: "cust-b", customerRole: "SECONDARY" }, decision),
    ).toBe(true);
    expect(
      roundOneRuleMatches({ customerId: "cust-a", customerRole: "SECONDARY" }, decision),
    ).toBe(false);
  });

  it("matches either slot when customerRole is unset", () => {
    expect(roundOneRuleMatches({ customerId: "cust-a", customerRole: null }, decision)).toBe(true);
    expect(roundOneRuleMatches({ customerId: "cust-b", customerRole: null }, decision)).toBe(true);
    expect(roundOneRuleMatches({ customerId: "cust-z", customerRole: null }, decision)).toBe(false);
  });
});

const row = {
  customerId: "cust-a",
  customerRole: "PRIMARY" as const,
  technicalSolutionId: "tech-1",
  commercialModelId: "com-1",
};

describe("roundTwoRuleMatches", () => {
  it("matches everything when no target fields are set", () => {
    expect(
      roundTwoRuleMatches(
        { customerId: null, customerRole: null, technicalSolutionId: null, commercialModelId: null },
        row,
      ),
    ).toBe(true);
  });

  it("requires ALL set fields to agree (combination semantics)", () => {
    expect(
      roundTwoRuleMatches(
        { customerId: "cust-a", customerRole: null, technicalSolutionId: "tech-1", commercialModelId: null },
        row,
      ),
    ).toBe(true);
    // technicalSolutionId disagrees -> no match, even though customerId agrees.
    expect(
      roundTwoRuleMatches(
        { customerId: "cust-a", customerRole: null, technicalSolutionId: "tech-2", commercialModelId: null },
        row,
      ),
    ).toBe(false);
  });

  it("rejects when customerRole disagrees", () => {
    expect(
      roundTwoRuleMatches(
        { customerId: null, customerRole: "SECONDARY", technicalSolutionId: null, commercialModelId: null },
        row,
      ),
    ).toBe(false);
  });

  it("rejects when commercialModelId disagrees", () => {
    expect(
      roundTwoRuleMatches(
        { customerId: null, customerRole: null, technicalSolutionId: null, commercialModelId: "com-2" },
        row,
      ),
    ).toBe(false);
  });
});

describe("describeRule", () => {
  it("always includes rule type and signed points", () => {
    expect(describeRule({ ruleType: "BASE", points: 10 })).toBe("BASE · +10 pts");
    expect(describeRule({ ruleType: "PENALTY", points: -5 })).toBe("PENALTY · -5 pts");
  });

  it("appends every populated target field", () => {
    const description = describeRule({
      ruleType: "COMBINATION",
      points: 25,
      customer: { name: "NorthGrid AI Campus" },
      customerRole: "PRIMARY",
      technicalSolution: { name: "Efficient Core Infrastructure" },
      commercialModel: { name: "Customer-Funded CAPEX" },
      externalRuleId: "R-001",
    });
    expect(description).toBe(
      "COMBINATION · +25 pts · customer=NorthGrid AI Campus · role=PRIMARY · solution=Efficient Core Infrastructure · model=Customer-Funded CAPEX · ref=R-001",
    );
  });
});
