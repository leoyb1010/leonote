import { test, expect } from "@playwright/test";

test("briefing page requires login", async ({ page }) => {
  await page.goto("/briefing");
  await expect(page).toHaveURL(/\/login/);
});
