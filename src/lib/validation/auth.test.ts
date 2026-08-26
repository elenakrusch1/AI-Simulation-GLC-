import { describe, it, expect } from "vitest";
import { teamLoginSchema, adminLoginSchema } from "./auth";

describe("teamLoginSchema", () => {
  it("accepts a well-formed team code + password", () => {
    const result = teamLoginSchema.safeParse({ teamCode: "ALPHA1", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from the team code", () => {
    const result = teamLoginSchema.safeParse({ teamCode: "  ALPHA1  ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.teamCode).toBe("ALPHA1");
  });

  it("rejects an empty team code", () => {
    expect(teamLoginSchema.safeParse({ teamCode: "", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(teamLoginSchema.safeParse({ teamCode: "ALPHA1", password: "" }).success).toBe(false);
  });
});

describe("adminLoginSchema", () => {
  it("accepts an identifier + password", () => {
    expect(
      adminLoginSchema.safeParse({ identifier: "admin@example.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects a missing identifier", () => {
    expect(adminLoginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
  });
});
