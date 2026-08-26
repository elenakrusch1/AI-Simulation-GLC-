import { describe, it, expect } from "vitest";
import { registerTeamSchema } from "./admin-teams";

describe("registerTeamSchema", () => {
  it("accepts a valid team", () => {
    const result = registerTeamSchema.safeParse({
      name: "Alpha Squad",
      code: "ALPHA-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a team code with spaces or symbols", () => {
    expect(
      registerTeamSchema.safeParse({ name: "A", code: "team one!" }).success,
    ).toBe(false);
  });

  it("rejects an empty team name", () => {
    expect(
      registerTeamSchema.safeParse({ name: "", code: "TEAM1" }).success,
    ).toBe(false);
  });

  it("trims whitespace from name and code", () => {
    const result = registerTeamSchema.safeParse({ name: "  Alpha  ", code: "  TEAM1  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alpha");
      expect(result.data.code).toBe("TEAM1");
    }
  });
});
