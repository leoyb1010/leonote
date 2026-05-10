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
fs.symlinkSync(
  path.join("..", "..", "public"),
  publicDir,
  "dir"
);

const staticDir = path.join(standalone, ".next", "static");
if (fs.existsSync(staticDir)) {
  fs.rmSync(staticDir, { recursive: true, force: true });
}
fs.symlinkSync(
  path.join("..", "..", "..", ".next", "static"),
  staticDir,
  "dir"
);

// Verify symlinks resolve correctly
const checks = [
  { label: "public", dir: publicDir },
  { label: ".next/static", dir: staticDir },
];
let failed = false;
for (const { label, dir } of checks) {
  try {
    const resolved = fs.realpathSync(dir);
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      console.error(`⚠️  Symlink ${label} resolves but directory is empty!`);
      failed = true;
    } else {
      console.log(`✅ ${label} → ${resolved} (${files.length} entries)`);
    }
  } catch (err) {
    console.error(`❌ Symlink ${label} is broken or missing: ${err.message}`);
    failed = true;
  }
}
if (failed) {
  console.error("Symlink verification failed. Static assets will 404 in production.");
  process.exit(1);
}

console.log("Standalone output prepared with symlinks.");
