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
    offenders: Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
          left: rect.left,
          right: rect.right,
          width: rect.width,
          visible: style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1,
        };
      })
      .filter((item) => item.visible)
      .filter((item) => item.left < -1 || item.right > document.documentElement.clientWidth + 1 || item.width > document.documentElement.clientWidth + 1)
      .slice(0, 10),
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.offenders).toEqual([]);
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

test("today and notes create buttons open the editor on mobile", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "开始书写" }).click();
  await expect(page).toHaveURL(/\/notes\/new$/);
  await expect(page.getByLabel("笔记标题")).toBeVisible();
  await expect(page.getByLabel("笔记内容")).toBeVisible();

  await page.goto("/notes");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "新建" }).click();
  await expect(page).toHaveURL(/\/notes\/new$/);
  await expect(page.getByLabel("笔记标题")).toBeVisible();
  await expect(page.getByLabel("笔记内容")).toBeVisible();
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

test("today page uses compact mobile typography", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const headingSize = await page.locator("h1").first().evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(headingSize).toBeLessThanOrEqual(20);
  await expectNoHorizontalOverflow(page);
});
