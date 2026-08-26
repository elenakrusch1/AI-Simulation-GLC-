import { test, expect } from "@playwright/test";
import { E2E_ADMIN, E2E_TEAM } from "./global-setup";

test.describe("route guards", () => {
  test("unauthenticated visitors are redirected to /login", async ({ page }) => {
    await page.goto("/team");
    await page.waitForURL("**/login");
    await page.goto("/admin");
    await page.waitForURL("**/login");
  });
});

test.describe("team login", () => {
  test("wrong password and a nonexistent team code show the identical generic error", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Team code").fill(E2E_TEAM.code);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in as team" }).click();
    await expect(page.getByText("Invalid team code or password.")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Team code").fill("NO-SUCH-TEAM-CODE");
    await page.getByLabel("Password").fill("whatever12345");
    await page.getByRole("button", { name: "Sign in as team" }).click();
    await expect(page.getByText("Invalid team code or password.")).toBeVisible();
  });

  test("a correct login reaches /team and a team session cannot reach /admin", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Team code").fill(E2E_TEAM.code);
    await page.getByLabel("Password").fill(E2E_TEAM.password);
    await page.getByRole("button", { name: "Sign in as team" }).click();
    await page.waitForURL("**/team");
    await expect(page.locator("h1")).toContainText(E2E_TEAM.name);

    await page.goto("/admin");
    await page.waitForURL("**/team");

    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === "dcsim_session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");

    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login");
  });
});

test.describe("admin login", () => {
  test("a correct login reaches /admin and an admin session cannot reach /team", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("tab", { name: "Administrator" }).click();
    await page.getByLabel("Email or admin username").fill(E2E_ADMIN.identifier);
    await page.getByLabel("Password", { exact: true }).fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Sign in as administrator" }).click();
    await page.waitForURL("**/admin");
    await expect(page.locator("h1")).toContainText(E2E_ADMIN.identifier);

    await page.goto("/team");
    await page.waitForURL("**/admin");

    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login");
  });
});
