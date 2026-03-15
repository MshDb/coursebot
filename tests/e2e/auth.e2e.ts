import { test, expect } from "@playwright/test";

test.describe("Authentication Flow E2E", () => {
  // Currently a conceptual spec validation until Playwright is fully installed in CI config.
  // Testing Phase involves validating standard registration, rejection on duplicate, and login success.

  test("User can navigate to login page from root", async ({ page }) => {
    await page.goto("/");
    // Root will redirect to dashboard, which redirects to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("User can navigate to register page and back", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Register here");
    await expect(page).toHaveURL(/.*\/register/);

    await page.click("text=Sign in here");
    await expect(page).toHaveURL(/.*\/login/);
  });
});
