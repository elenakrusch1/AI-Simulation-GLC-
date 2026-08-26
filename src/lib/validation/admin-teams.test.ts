import { describe, it, expect } from "vitest";
import { createTeamSchema } from "./admin-teams";

describe("createTeamSchema", () => {
  it("accepts a valid team", () => {
    const result = createTeamSchema.safeParse({
      name: "Alpha Squad",
      code: "ALPHA-01",
      password: "CorrectHorse1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a team code with spaces or symbols", () => {
    expect(
      createTeamSchema.safeParse({ name: "A", code: "team one!", password: "CorrectHorse1" })
        .success,
    ).toBe(false);
  });

  it("rejects a weak password", () => {
    expect(
      createTeamSchema.safeParse({ name: "A", code: "TEAM1", password: "short" }).success,
    ).toBe(false);
  });

  it("rejects an empty team name", () => {
    expect(
      createTeamSchema.safeParse({ name: "", code: "TEAM1", password: "CorrectHorse1" }).success,
    ).toBe(false);
  });
});
