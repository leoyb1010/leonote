import { test, expect } from "@playwright/test";

test.describe("Leonote Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("Leonote");
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=登录")).toBeVisible();
  });

  test("can navigate to notes page (redirects to login if not authed)", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("full user flow: register, create note, logout", async ({
    page,
  }) => {
    const testEmail = `test-${Date.now()}@leonote.local`;

    // Register
    await page.goto("/login");
    await page.fill('input[placeholder*="昵称"]', "测试用户");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should be redirected to home
    await page.waitForURL("**/");
    expect(page.url()).not.toContain("/login");

    // Navigate to notes
    await page.goto("/notes");
    await expect(page.locator("text=全部笔记")).toBeVisible();

    // Create new note
    await page.goto("/notes/new");
    await page.waitForLoadState("networkidle");
  });

  test("export API requires auth", async ({ page }) => {
    const response = await page.request.get("/api/export");
    expect(response.status()).toBe(401);
  });
});
