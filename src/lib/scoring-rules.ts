// Pure scoring-rule matching logic — deliberately free of any
// database/framework import so it can be unit tested directly. See
// src/lib/data/scoring.ts for how this is wired up to real data.
//
// Matching semantics (a design decision documented here, not a
// scoring VALUE — the app never invents point values):
// - A rule's target fields are each optional; unset = wildcard. A
//   rule matches when every field it DOES set agrees with the
//   decision (logical AND) — this is what makes ruleType COMBINATION
//   meaningful: set more than one field on a rule to require they
//   occur together.
// - Round 1 rules match against the team's single decision; if
//   customerRole is unset, the rule matches if EITHER the primary or
//   secondary customer equals customerId.
// - Round 2 rules are matched independently against each of the two
//   decision rows (PRIMARY/SECONDARY) — a rule with no customerRole
//   set can therefore match, and award points, on both rows.

export type CustomerRoleValue = "PRIMARY" | "SECONDARY";

export interface RoundOneRuleTarget {
  customerId: string | null;
  customerRole: CustomerRoleValue | null;
}

export interface RoundOneDecisionLike {
  primaryCustomerId: string;
  secondaryCustomerId: string;
}

export function roundOneRuleMatches(
  rule: RoundOneRuleTarget,
  decision: RoundOneDecisionLike,
): boolean {
  if (!rule.customerId) return true;
  if (rule.customerRole === "PRIMARY") return decision.primaryCustomerId === rule.customerId;
  if (rule.customerRole === "SECONDARY") return decision.secondaryCustomerId === rule.customerId;
  return (
    decision.primaryCustomerId === rule.customerId ||
    decision.secondaryCustomerId === rule.customerId
  );
}

export interface RoundTwoRuleTarget {
  customerId: string | null;
  customerRole: CustomerRoleValue | null;
  technicalSolutionId: string | null;
  commercialModelId: string | null;
}

export interface RoundTwoDecisionRowLike {
  customerId: string;
  customerRole: CustomerRoleValue;
  technicalSolutionId: string;
  commercialModelId: string;
}

export function roundTwoRuleMatches(
  rule: RoundTwoRuleTarget,
  row: RoundTwoDecisionRowLike,
): boolean {
  if (rule.customerRole && rule.customerRole !== row.customerRole) return false;
  if (rule.customerId && rule.customerId !== row.customerId) return false;
  if (rule.technicalSolutionId && rule.technicalSolutionId !== row.technicalSolutionId) return false;
  if (rule.commercialModelId && rule.commercialModelId !== row.commercialModelId) return false;
  return true;
}

export interface DescribableRule {
  ruleType: string;
  points: number;
  customer?: { name: string } | null;
  customerRole?: string | null;
  technicalSolution?: { name: string } | null;
  commercialModel?: { name: string } | null;
  externalRuleId?: string | null;
}

/** Human-readable, admin-only description stored on ScoreBreakdown rows. */
export function describeRule(rule: DescribableRule): string {
  const parts = [rule.ruleType, `${rule.points >= 0 ? "+" : ""}${rule.points} pts`];
  if (rule.customer) parts.push(`customer=${rule.customer.name}`);
  if (rule.customerRole) parts.push(`role=${rule.customerRole}`);
  if (rule.technicalSolution) parts.push(`solution=${rule.technicalSolution.name}`);
  if (rule.commercialModel) parts.push(`model=${rule.commercialModel.name}`);
  if (rule.externalRuleId) parts.push(`ref=${rule.externalRuleId}`);
  return parts.join(" · ");
}
