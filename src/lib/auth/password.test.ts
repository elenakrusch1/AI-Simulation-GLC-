import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("produces a hash different from the plaintext", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple1!");
    expect(hash).not.toBe("CorrectHorseBatteryStaple1!");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple1!");
    await expect(verifyPassword("CorrectHorseBatteryStaple1!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple1!");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("returns false (not throw) when hash is null — the no-such-account path", async () => {
    await expect(verifyPassword("anything", null)).resolves.toBe(false);
    await expect(verifyPassword("anything", undefined)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("SamePassword123");
    const b = await hashPassword("SamePassword123");
    expect(a).not.toBe(b);
  });
});
