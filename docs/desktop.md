# Leonote 桌面端说明

## 架构

Leonote 桌面端是一个 Tauri WebView 壳，不负责本地存储。所有数据存储在服务端 SQLite 中。

启动桌面端 → WebView 加载 `LEONOTE_PUBLIC_URL` 指向的生产地址 → 与 Web 版共享同一服务端。

## 为什么不是本地数据库

v1.1.0 的目标是四端（Mac / Windows / iOS / 鸿蒙）共享同一数据源。本地数据库方案（SQLite + 本地 Next.js server）会让多端同步变成需要解决的问题，而不是已经解决的问题。

WebView 壳方案让桌面端成为 Web 版的"原生窗口"，立即可用。

## 构建

确保已配置 `LEONOTE_PUBLIC_URL` 环境变量，指向你的生产域名。

```bash
npm run tauri build
```

构建产物：
- macOS: `src-tauri/target/release/bundle/dmg/Leonote_*.dmg`
- Windows: `src-tauri/target/release/bundle/msi/Leonote_*.msi`

## 安装与使用

1. 安装对应平台的 dmg/msi。
2. 打开 Leonote 桌面端。
3. 登录你的账号。
4. 桌面端无需安装 Node.js。

## 技术细节

- Tauri WebView 加载 `LEONOTE_PUBLIC_URL`
- 不启动本地 Node 进程
- 不捆绑 `.next/standalone`
- 桌面端没有特权能力，与浏览器安全等级一致
