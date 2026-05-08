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

console.log("Standalone output prepared with symlinks.");
