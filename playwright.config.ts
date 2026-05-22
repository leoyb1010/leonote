import { defineConfig } from "@playwright/test";

const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL || "file:/private/tmp/leonote-e2e.db";

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== e2eDatabaseUrl) {
  throw new Error(
    "E2E 测试必须使用隔离数据库：请设置 E2E_DATABASE_URL，或不要在 Playwright 进程里传入生产 DATABASE_URL。",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4318",
    headless: true,
  },
  webServer: {
    command: "npx prisma migrate deploy && npm run dev -- -p 4318",
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      AUTH_SECRET: "e2e-auth-secret-32-chars-minimum",
      LEONOTE_ALLOW_REGISTRATION: "true",
    },
    port: 4318,
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
