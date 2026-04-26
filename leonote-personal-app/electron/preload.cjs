const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("leonoteRemote", {
  getConfig: () => ipcRenderer.invoke("leonote:get-config"),
  saveUrl: (url) => ipcRenderer.invoke("leonote:save-url", url),
  openExternal: (url) => ipcRenderer.invoke("leonote:open-external", url),
});
