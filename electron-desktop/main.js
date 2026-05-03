const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let mainWindow;
let serverProcess;

const PORT = 4317;
const SERVER_DIR = path.join(__dirname, "server");

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(SERVER_DIR, "server.js");

    serverProcess = spawn(process.execPath ? process.execPath : "node", [serverPath], {
      cwd: SERVER_DIR,
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let started = false;

    serverProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      if (!started && (text.includes("started") || text.includes("Ready") || text.includes("listening"))) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr?.on("data", (data) => {
      // Next.js logs startup to stderr
      const text = data.toString();
      if (!started && (text.includes("started") || text.includes("Ready") || text.includes("localhost"))) {
        started = true;
        resolve();
      }
    });

    serverProcess.on("error", reject);
    serverProcess.on("exit", (code) => {
      if (!started) reject(new Error(`Server exited with code ${code}`));
    });

    // Timeout fallback
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve();
      }
    }, 8000);
  });
}

function waitForServer() {
  return new Promise((resolve) => {
    const check = () => {
      http.get(`http://127.0.0.1:${PORT}`, (res) => {
        resolve();
      }).on("error", () => {
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function createMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Leonote",
        submenu: [
          { role: "reload", label: "重新加载" },
          { role: "toggleDevTools", label: "开发者工具" },
          { type: "separator" },
          { role: "quit", label: "退出" },
        ],
      },
      {
        label: "编辑",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
    ])
  );
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: "Leonote",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#080a0f",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Start local server
  try {
    await startServer();
    await waitForServer();
    await mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  } catch (e) {
    await mainWindow.loadURL(`data:text/html,<h1>启动失败</h1><p>${e.message}</p>`);
  }
}

app.whenReady().then(async () => {
  createMenu();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
