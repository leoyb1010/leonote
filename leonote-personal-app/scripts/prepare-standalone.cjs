const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
const nextStaticDir = path.join(root, ".next", "static");

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  throw new Error("Missing .next/standalone/server.js. Run npm run build first.");
}

for (const envFile of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  fs.rmSync(path.join(standaloneDir, envFile), { force: true });
}

fs.rmSync(standaloneStaticDir, { force: true, recursive: true });
copyDirectory(nextStaticDir, standaloneStaticDir);

const publicDir = path.join(root, "public");
if (fs.existsSync(publicDir)) {
  copyDirectory(publicDir, path.join(standaloneDir, "public"));
}

console.log("Prepared Next standalone assets.");
