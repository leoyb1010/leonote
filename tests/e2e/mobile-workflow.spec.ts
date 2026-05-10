import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const password = "password123";
let email: string;

test.beforeAll(async ({ request }) => {
  email = `mobile-${Date.now()}@leonote.local`;
  const res = await request.post("/api/auth/register", {
    headers: { "x-forwarded-for": `mobile-e2e-${Date.now()}` },
    data: { name: "移动端验证", email, password },
  });
  expect(res.ok()).toBeTruthy();
});

async function login(page: Page) {
  const res = await page.request.post("/api/auth/login", {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
}

test("key pages share the mobile width contract", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);

  const viewports = [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
  ];
  const paths = ["/", "/briefing", "/notes", "/notes/new", "/ledger", "/projects"];

  for (const viewport of viewports) {
    for (const path of paths) {
      const target = await page.context().newPage();
      await target.setViewportSize(viewport);
      await target.goto(path, { waitUntil: "domcontentloaded" });
      await expectNoHorizontalOverflow(target);
      await target.close();
    }
  }
});

test("clicking the editor save button saves and closes the note", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });

  const title = `手动保存关闭 ${Date.now()}`;
  await page.goto("/notes/new");
  await page.waitForLoadState("networkidle");
  const titleInput = page.getByLabel("笔记标题");
  const bodyInput = page.getByLabel("笔记内容");
  await expect(titleInput).toBeVisible();
  await titleInput.fill(title);
  await bodyInput.fill("点击保存后应该回到笔记列表。");
  await expect(titleInput).toHaveValue(title);
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByText("全部笔记")).toBeVisible();
  await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
});
