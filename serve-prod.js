/**
 * Leonote production server wrapper.
 *
 * Starts the Next.js standalone server on a random internal port,
 * then runs an HTTP reverse-proxy on the public PORT that rewrites
 * HTML responses to inject `data-cfasync="false"` on every `<script>`.
 *
 * This prevents Cloudflare Rocket Loader from deferring/rewriting
 * Next.js RSC data-stream scripts, which otherwise causes hydration
 * failure ("This page couldn't load. Reload to try again, or go back.").
 *
 * @see https://developers.cloudflare.com/speed/optimization/content/rocket-loader/ignore-javascripts/
 */

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PUBLIC_PORT = parseInt(process.env.PORT || "4317", 10);
const INTERNAL_PORT = PUBLIC_PORT + 1;
const STANDALONE_DIR = __dirname;

// Load .env from both project root and standalone dir (if present).
// PM2 does not auto-load .env files, so we must do it manually for
// runtime-resolved variables like DATABASE_URL that Prisma needs.
function loadDotEnv(dir) {
  const envPath = path.join(dir, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}
loadDotEnv(STANDALONE_DIR);
loadDotEnv(path.join(STANDALONE_DIR, ".next/standalone"));

// Start the Next.js standalone server on INTERNAL_PORT
const nextServer = spawn(process.execPath, [path.join(STANDALONE_DIR, ".next/standalone/server.js")], {
  cwd: STANDALONE_DIR,
  env: { ...process.env, PORT: String(INTERNAL_PORT), HOSTNAME: "127.0.0.1" },
  stdio: ["inherit", "inherit", "inherit"],
});

nextServer.on("exit", (code) => process.exit(code ?? 1));

// Wait for the internal server to be ready, then start the proxy
function tryStartProxy(retries = 30) {
  if (retries <= 0) {
    console.error("[proxy] internal server did not start in time");
    process.exit(1);
  }
  const probe = http.get(`http://127.0.0.1:${INTERNAL_PORT}/`, (res) => {
    res.resume(); // drain
    startProxy();
  });
  probe.on("error", () => {
    setTimeout(() => tryStartProxy(retries - 1), 500);
  });
}

function startProxy() {
  const proxy = http.createServer((req, res) => {
    const proxyReq = http.request(
      `http://127.0.0.1:${INTERNAL_PORT}${req.url}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          // Force internal server to return uncompressed HTML so we can
          // safely do text replacement (inject data-cfasync).  Cloudflare
          // will re-compress for the client anyway.
          "accept-encoding": "identity",
        },
      },
      (proxyRes) => {
        const isHtml = (proxyRes.headers["content-type"] || "").includes("text/html");

        if (!isHtml) {
          // Non-HTML: pass through as-is
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
          return;
        }

        // HTML: collect body, inject data-cfasync="false", then forward
        const chunks = [];
        proxyRes.on("data", (chunk) => chunks.push(chunk));
        proxyRes.on("end", () => {
          let body = Buffer.concat(chunks).toString("utf-8");

          // Inject data-cfasync="false" on all <script> tags that don't already have it
          body = body.replace(
            /<script(?![^>]*data-cfasync)/g,
            '<script data-cfasync="false"'
          );

          const headers = { ...proxyRes.headers };
          headers["content-length"] = Buffer.byteLength(body);
          res.writeHead(proxyRes.statusCode, headers);
          res.end(body);
        });
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[proxy] upstream error:", err.message);
      res.writeHead(502);
      res.end("Bad Gateway");
    });

    req.pipe(proxyReq);
  });

  proxy.listen(PUBLIC_PORT, "0.0.0.0", () => {
    console.log(`[proxy] listening on :${PUBLIC_PORT} → internal :${INTERNAL_PORT}`);
  });
}

tryStartProxy();
