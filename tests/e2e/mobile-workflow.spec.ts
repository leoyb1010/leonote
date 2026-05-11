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

test("today create chooser and notes create button open the editor on mobile", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const todayStartWriting = page.getByTestId("today-start-writing");
  await expect(todayStartWriting).toHaveJSProperty("tagName", "SUMMARY");
  await todayStartWriting.click();
  const createMenu = page.getByTestId("today-create-menu");
  await expect(createMenu).toBeVisible();
  await createMenu.getByRole("link", { name: /新笔记/ }).click();
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

test("desktop notes new route keeps the app shell usable", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("/notes");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "新建", exact: true }).click();

  await expect(page).toHaveURL(/\/notes\/new$/);
  await expect(page.getByLabel("笔记标题")).toBeVisible();
  await expect(page.getByLabel("笔记内容")).toBeVisible();

  await page.getByRole("link", { name: "项目", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "项目", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "笔记", exact: true }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("heading", { name: "全部笔记" })).toBeVisible();
});

test("editor can choose an existing project and paste an image attachment", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const projectName = `项目选择 ${Date.now()}`;
  const title = `附件笔记 ${Date.now()}`;
  const project = await page.request.post("/api/projects", {
    data: { name: projectName, description: "用于验证项目下拉选择" },
  });
  expect(project.ok()).toBeTruthy();

  await page.goto("/notes/new");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("笔记标题").fill(title);
  await page.getByLabel("选择已有项目").selectOption({ label: projectName });

  const body = page.getByLabel("笔记内容");
  await body.fill("这里会粘贴一张图片。");
  await body.evaluate((element) => {
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "paste-image.png", { type: "image/png" });
    const data = new DataTransfer();
    data.items.add(file);
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });

  await expect(body).toHaveValue(/paste-image\.png/);
  await expect(page.getByText("已添加 1 个附件。")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(projectName)).toBeVisible();
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
