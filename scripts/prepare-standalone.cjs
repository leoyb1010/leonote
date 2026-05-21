const fs = require("node:fs");
const path = require("node:path");

const standalone = path.join(__dirname, "..", ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error(".next/standalone does not exist. Run `npm run build` first.");
  process.exit(1);
}

const publicDir = path.join(standalone, "public");
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.cpSync(
  path.join(__dirname, "..", "public"),
  publicDir,
  { recursive: true }
);

const staticDir = path.join(standalone, ".next", "static");
if (fs.existsSync(staticDir)) {
  fs.rmSync(staticDir, { recursive: true, force: true });
}
fs.cpSync(
  path.join(__dirname, "..", ".next", "static"),
  staticDir,
  { recursive: true }
);

// Verify directories copy correctly
const checks = [
  { label: "public", dir: publicDir },
  { label: ".next/static", dir: staticDir },
];
let failed = false;
for (const { label, dir } of checks) {
  try {
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      console.error(`⚠️  Directory ${label} is empty!`);
      failed = true;
    } else {
      console.log(`✅ ${label} → ${dir} (${files.length} entries)`);
    }
  } catch (err) {
    console.error(`❌ Directory ${label} is missing: ${err.message}`);
    failed = true;
  }
}
if (failed) {
  console.error("Directory verification failed. Static assets will 404 in production.");
  process.exit(1);
}

// Strip secrets from .env files bundled into the standalone output
const SENSITIVE_KEYS = [
  "AUTH_SECRET",
  "TAVILY_API_KEY",
  "BRIEFING_CRON_TOKEN",
  "AI_API_KEY",
  "HTTPS_PROXY",
  "HTTP_PROXY",
  "ALL_PROXY",
];
for (const envFile of [".env", ".env.production"]) {
  const envPath = path.join(standalone, envFile);
  if (!fs.existsSync(envPath)) continue;
  let content = fs.readFileSync(envPath, "utf-8");
  for (const key of SENSITIVE_KEYS) {
    content = content.replace(
      new RegExp(`^${key}=.+$`, "gm"),
      `# ${key}=... (set at runtime)`
    );
  }
  fs.writeFileSync(envPath, content, "utf-8");
  console.log(`🔒  Stripped secrets from ${envFile}`);
}

console.log("Standalone output prepared with directories (Docker-safe).");
