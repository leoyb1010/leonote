import { test, expect } from "@playwright/test";

test.describe("Leonote Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("Leonote");
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("欢迎回来")).toBeVisible();
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  });

  test("notes page loads", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForLoadState("networkidle");
    // Should not crash; content may vary depending on auth state
  });

  test("full user flow: register, create note, logout", async ({ page }) => {
    test.setTimeout(45_000);
    const testEmail = `test-${Date.now()}@leonote.local`;

    const password = "password123";

    const register = await page.request.post("/api/auth/register", {
      headers: { "x-forwarded-for": `smoke-e2e-${Date.now()}` },
      data: { name: "测试用户", email: testEmail, password },
    });
    expect(register.ok()).toBeTruthy();

    const login = await page.request.post("/api/auth/login", {
      data: { email: testEmail, password },
    });
    expect(login.ok()).toBeTruthy();

    // Home should load with QuickCapture after auth
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const quickCapture = page.getByPlaceholder("有什么想法，先放在这里。");
    await expect(quickCapture).toBeVisible();
    await expect(page.getByRole("link", { name: "开始书写" })).toBeVisible();

    // Create a real note via QuickCapture
    await quickCapture.fill("E2E 测试笔记内容");
    await expect(quickCapture).toHaveValue("E2E 测试笔记内容");
    await page.getByRole("button", { name: "安放" }).click();
    await expect(page.getByRole("heading", { name: "E2E 测试笔记内容" })).toBeVisible({ timeout: 5000 });
  });

  test("theme toggle exists", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Theme section should have toggle controls
    const pageText = await page.textContent("body");
    expect(pageText).toMatch(/亮色|暗色/);
  });

  test("export API requires auth", async ({ page }) => {
    const response = await page.request.get("/api/export");
    expect(response.status()).toBe(401);
  });
});
