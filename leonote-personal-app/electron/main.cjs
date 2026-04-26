const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let mainWindow;
let activeServerUrl = "";

function getConfigPath() {
  return path.join(app.getPath("userData"), "server-url.txt");
}

function normalizeServerUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("请输入完整地址，例如 https://notes.example.com");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("服务器地址必须以 http:// 或 https:// 开头");
  }

  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function readServerUrl() {
  const envUrl = normalizeServerUrl(process.env.LEONOTE_SERVER_URL || "");
  if (envUrl) return envUrl;

  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return "";
  return normalizeServerUrl(fs.readFileSync(configPath, "utf8"));
}

function saveServerUrl(url) {
  const normalized = normalizeServerUrl(url);
  fs.mkdirSync(path.dirname(getConfigPath()), { recursive: true });
  fs.writeFileSync(getConfigPath(), `${normalized}\n`);
  activeServerUrl = normalized;
  return normalized;
}

function getLanSuggestions() {
  const suggestions = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        suggestions.push(`http://${entry.address}:4317`);
      }
    }
  }
  return suggestions;
}

function settingsFile() {
  return path.join(__dirname, "settings.html");
}

async function loadSettings(errorMessage = "") {
  if (!mainWindow) return;
  await mainWindow.loadFile(settingsFile(), {
    query: errorMessage ? { error: errorMessage } : undefined,
  });
}

async function loadRemote(url) {
  activeServerUrl = normalizeServerUrl(url);
  await mainWindow.loadURL(activeServerUrl);
}

function createMenu() {
  const template = [
    {
      label: "Leonote",
      submenu: [
        {
          label: "设置服务器地址",
          accelerator: "CmdOrCtrl+,",
          click: () => loadSettings(),
        },
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.reload(),
        },
        {
          label: "打开开发者工具",
          accelerator: "Alt+CmdOrCtrl+I",
          click: () => mainWindow?.webContents.openDevTools({ mode: "detach" }),
        },
        {
          label: "在浏览器打开当前地址",
          click: () => {
            if (activeServerUrl) shell.openExternal(activeServerUrl);
          },
        },
        { type: "separator" },
        { role: "quit", label: "退出" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "selectAll", label: "全选" },
      ],
    },
    {
      label: "窗口",
      submenu: [
        { role: "minimize", label: "最小化" },
        { role: "zoom", label: "缩放" },
        { role: "togglefullscreen", label: "全屏" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: "Leonote",
    backgroundColor: "#06070a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-fail-load", (_event, _errorCode, errorDescription, validatedURL) => {
    if (!validatedURL.startsWith("file:")) {
      void loadSettings(`无法打开 ${validatedURL}：${errorDescription}`);
    }
  });
}

ipcMain.handle("leonote:get-config", () => ({
  currentUrl: activeServerUrl || readServerUrl(),
  configPath: getConfigPath(),
  lanSuggestions: getLanSuggestions(),
}));

ipcMain.handle("leonote:save-url", async (_event, url) => {
  const saved = saveServerUrl(url);
  await loadRemote(saved);
  return { ok: true, url: saved };
});

ipcMain.handle("leonote:open-external", (_event, url) => {
  shell.openExternal(url);
});

app.whenReady().then(async () => {
  try {
    createWindow();
    createMenu();
    const url = readServerUrl();
    if (url) {
      await loadRemote(url);
    } else {
      await loadSettings();
    }
  } catch (error) {
    dialog.showErrorBox(
      "Leonote 启动失败",
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    const url = readServerUrl();
    void (url ? loadRemote(url) : loadSettings());
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
