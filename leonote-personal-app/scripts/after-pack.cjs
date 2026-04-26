const fs = require("node:fs");
const path = require("node:path");

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const root = context.packager.projectDir;
  const productFilename = context.packager.appInfo.productFilename;
  const appResourcesDir = path.join(
    context.appOutDir,
    `${productFilename}.app`,
    "Contents",
    "Resources",
  );

  const sourceNodeModules = path.join(root, ".next", "standalone", "node_modules");
  const destinationNodeModules = path.join(appResourcesDir, "server", "node_modules");

  fs.rmSync(destinationNodeModules, { force: true, recursive: true });
  fs.cpSync(sourceNodeModules, destinationNodeModules, {
    recursive: true,
    dereference: true,
  });
};
