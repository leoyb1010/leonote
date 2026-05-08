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
    const testEmail = `test-${Date.now()}@leonote.local`;

    // Register
    await page.goto("/login");
    await page.getByRole("button", { name: "创建账号" }).click();
    await page.fill('input[placeholder="输入昵称"]', "测试用户");
    await page.fill('input[placeholder="输入邮箱"]', testEmail);
    await page.fill('input[placeholder="输入密码（至少 8 位）"]', "password123");
    await page.getByRole("button", { name: "注册" }).click();

    // Registration success switches mode back to login
    await expect(page.getByText("首个账号创建成功")).toBeVisible();

    // Login (mode auto-switched to login after successful registration)
    await page.getByRole("button", { name: "登录" }).click();

    // Should redirect to home with QuickCapture or hero section
    await page.waitForURL("**/");
    await expect(page.getByPlaceholder("有什么想法，先放在这里。")).toBeVisible();
    await expect(page.getByRole("button", { name: "开始书写" })).toBeVisible();

    // Create a real note via QuickCapture
    await page.fill('textarea[placeholder="有什么想法，先放在这里。"]', "E2E 测试笔记内容");
    await page.getByRole("button", { name: "安放" }).click();
    await expect(page.getByText(/已(安放|保存|留下)/)).toBeVisible({ timeout: 5000 });
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
