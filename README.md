# Leonote

> 把想法安放成时间里的智慧 — 安静保存、温柔唤回的个人知识居所。
> 自托管 Web 优先，PWA 支持，桌面端 WebView 壳。

---

## 快速开始

### 本地开发

```bash
git clone https://github.com/leoyb1010/leonote.git
cd leonote

cp .env.example .env
# 编辑 .env，至少设置 AUTH_SECRET
# 生成随机密钥: openssl rand -base64 48

npm install
npx prisma migrate deploy
npm run dev
```

打开 http://localhost:3000，注册第一个账号即可使用。

### 自托管生产部署

```bash
npm install
npm run build
npm run start:prod   # 自动执行 migration + 启动服务
```

服务运行在 http://0.0.0.0:4317，建议前置 Nginx/Caddy 反代并配置 HTTPS。

### Docker 部署

```bash
cp .env.example .env.production
# 编辑 .env.production
docker compose up -d --build
```

详细部署说明见 [`docs/deployment.md`](docs/deployment.md)。

---

## 跨设备使用

| 设备 | 访问方式 |
|---|---|
| Mac / PC 浏览器 | 直接访问部署域名 |
| 手机浏览器 (iOS / 鸿蒙 / Android) | 直接访问部署域名 |
| iOS PWA | Safari → 添加到主屏幕 |
| 桌面端 App | Tauri WebView 壳，指向部署域名 |

**关键要点：**
- 选一台机器部署 server（个人 Mac/PC 或云服务器），手机和桌面都访问同一域名
- 桌面端是 WebView 壳，不负责本地存储，所有数据在服务端
- 数据库文件路径：`./data/leonote.db`（SQLite 单文件）
- 备份方式：复制数据库文件，或使用设置页的 JSON 导出功能（推荐每月备份）

---

## 环境变量

```env
# 必填
AUTH_SECRET="change-me-to-a-long-random-secret"

# 数据库
DATABASE_URL="file:./data/leonote.db"

# 部署域名（用于桌面端 WebView）
LEONOTE_PUBLIC_URL="https://leonote.example.com"

# 是否允许新用户注册（首个用户始终可注册）
LEONOTE_ALLOW_REGISTRATION="false"

# AI 配置（可选，使用 DeepSeek 兼容接口）
AI_BASE_URL="https://api.deepseek.com"
AI_MODEL="deepseek-v4-flash"
AI_FALLBACK_MODEL="deepseek-v4-pro"
```

---

## 功能总览

### 数字居所 (v1.4)
- 首页 Hero 区：时间问候语 + "安放了X篇" 统计 + 开始书写
- QuickCapture Dock：仪式感安放入口
- 记忆闪回：21天前笔记轻提醒
- 本周沉淀：新增/编辑/回看/长期记忆统计
- 2xl 大屏右栏布局（主内容+320px侧栏）

### 写作体验 (v1.4)
- Focus Mode 安静写作：编辑器降噪、内容居中
- Apple 风格编辑器 — 760px 固定宽度，17px 字体，1.78 行高（大屏 18px）
- 保存仪式感："已安静保存" / "正在安放…"，1.6s 淡出
- layout 动画预览/分栏切换

### 笔记核心
- Markdown 编辑 + 实时安全预览（支持 GFM 表格、任务列表、代码块）
- 自动保存（默认关闭，可在编辑器更多菜单手动开启）
- 手动保存 / Cmd+S 快捷键
- 版本历史（NoteRevision）— 保存时自动快照、查看、恢复历史版本
- 标签系统、项目归属、收藏、置顶、归档、回收站
- 快速记录（QuickCapture）— 今日页面直接输入，回车保存

### 静读助手 (v1.4 AI)
- 提炼要点、整理长期记忆
- ThinkingLine 思考态动画
- 全局 AI 对话
- 导入时 AI 自动整理
- DeepSeek / OpenAI 兼容接口
- AI Key 数据库加密存储（AES-256-GCM）

### 搜索
- FTS5 全文搜索 + trigram 分词器，中文短语匹配
- 搜索结果关联笔记列表，实时过滤

### 导入导出
- 导入：JSON / Markdown / TXT / HTML / 网页链接
- 导出：JSON 全量导出 / 当前笔记 Markdown 导出
- 导入链接 SSRF 防御（拦截 localhost/内网/metadata 地址）

### 安全
- Session 签名 cookie（tokenVersion 机制，改密立即失效全部旧会话）
- 登录 / 注册 / AI 接口三级限流（含 LRU Map GC）
- 生产环境 `__Host-` cookie 前缀
- Markdown 预览 XSS 防御（rehype-sanitize）
- 注册开关控制（首个用户后默认关闭）
- AUTH_SECRET 强制验证

### 设计 (v1.4 Quiet Material)
- Quiet Material 设计语言：material-canvas/elevated/inset + hairline border
- 深色 / 浅色自适应主题（Design Token 体系，支持 Light/Dark/System 三态）
- 大屏响应式布局：侧边栏 264px (2xl: 288px)、导航项 44px hit-target
- 全局环境背景（极淡径向渐变）
- 响应式布局（桌面侧栏 / 移动端底部 TabBar）
- 全局命令面板（Cmd+K）
- 移动端 safe-area 适配
- 中文字体栈优化（PingFang SC / Microsoft YaHei / Noto Sans SC）
- PageContainer 6 种宽度变体（dashboard/reader/workbench/ai 2xl 放大）

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 16 + React 19 + TypeScript |
| 数据库 | Prisma + SQLite |
| 样式 | Tailwind CSS + CSS Variables Design Token |
| 桌面端 | Tauri 2（纯 WebView 壳，不启动本地 Node） |
| AI | DeepSeek / OpenAI 兼容接口 |
| 测试 | Vitest（单测）+ Playwright（E2E） |
| 部署 | Docker / PM2 / 直接运行 |

---

## 数据模型

```
User (用户)
  ├── Note (笔记) → Tag (标签) via NoteTag
  │     └── NoteRevision (版本历史)
  ├── Project (项目)
  ├── DailyNote (每日记录)
  ├── AISetting (AI 配置，API Key 加密存储)
  └── MemoryFact (AI 长期记忆)
```

---

## 工程命令

```bash
npm run dev          # 本地开发
npm run build        # 生产构建
npm run start:prod   # 生产启动（含 migration）
npm run lint         # ESLint
npm run typecheck    # TypeScript 类型检查
npm run test         # 单元测试（vitest）
npm run test:e2e     # E2E 测试（playwright）
npm run ci           # 全链路：lint → typecheck → test → build
```

---

## 项目文档

- [`docs/deployment.md`](docs/deployment.md) — 生产部署指南（Nginx / Docker / PM2 / 备份策略）
- [`docs/desktop.md`](docs/desktop.md) — 桌面端构建说明
- [`PRD.md`](PRD.md) — 产品需求文档

---

## 备份数据

1. **文件级**：复制 `./data/leonote.db`
2. **JSON 导出**：设置页 → 数据备份 → 导出全部笔记
3. Docker 用户：`./data` 已挂载为 volume

推荐每月执行一次 JSON 导出 + 数据库文件备份。

---

## 版本记录

| 版本 | 日期 | 更新内容 |
|---|---|---|
| **v1.4.0** | 2026-05-06 | 情绪价值与高级感升级：Quiet Material 设计语言（--material-*、--hairline）；首页重构为数字居所（Hero + Capture Dock + 记忆闪回 + 本周沉淀 + 右栏）；大屏侧边栏 264/288px + 导航 44px hit-target；Button 尺寸 h-8/10/12 + Apple 风格系统按钮；编辑器 Focus Mode + 17px typography + 保存仪式感；AI 静读助手（ThinkingLine + 提炼要点/整理记忆）；全局微文案情绪化升级（删除/空状态/加载/版本）；PageContainer dashboard/reader 2xl 宽度策略 |
| **v1.3.0** | 2026-05-05 | 双主题自适应升级：Light/Dark/System 三态模型 + FOUC 防闪烁；语义交互 Token 体系（--interactive-hover/active/selected、--surface-*-glass、--overlay-scrim）；16 个组件硬编码暗色残留清理；ThemeProvider + ThemeSegmentedControl；Tailwind darkMode selector 改造；全面测试验证 |
| **v1.2.1** | 2026-05-05 | 补丁修复：全局按钮对齐（Button 组件 + buttonClass() 统一）；表单输入框高度标准化（h-10 对齐 Button lg）；快速记录后列表即时刷新；AI 设置面板布局重叠修复（space-y-4 挂载层级修正）；数据库迁移补全（Note.source / Note.lastViewedAt / NoteRevision） |
| **v1.2.0** | 2026-05-05 | 悄然专业工作台：FTS5 全文搜索 + trigram 分词；NoteRevision 版本历史（查看/恢复/GC）；Apple 风格编辑器重写（760px）；今日页重构（QuickCapture/NoteRow/模版）；Design Token 体系 v1.2；PageContainer 居中布局；动画减少（移除 hover scale/shadow）；离线回退页暗色匹配；AUTH_SECRET 强制校验；限流 GC |
| **v1.1.0** | 2026-05-05 | 修复 requireSessionUserId 语义（null → throw）；新增 offline.html 离线回退页；SW 离线缓存策略完善；环境变量注册开关默认打开 |
| **v1.0.0** | 2026-05-04 | 上线级重构：架构收敛、安全加固、体验升级。修复 SSR opacity:0 导致白屏、Tailwind 类名损坏、窄屏布局崩溃、全局硬编码颜色/白条/背景图；UX 打磨 |
| **v0.9.0** | 2026-05-03 | PWA 支持（manifest + service worker）；macOS 原生 DMG（Tauri + WKWebView）；全面焕新 Design System + 导航重构 + 跨端适配 + AI 增强 |
| **v0.8.0** | 2026-05-02 | Design Token 体系（CSS Variables）；响应式布局（桌面侧栏 + 移动端 TabBar）；中文字体栈优化；safe-area 适配 |
| **v0.7.0** | 2026-05-01 | AI 知识助手工作流：笔记总结、问答、长期记忆提取；导入自动整理；全局 AI 对话；API Key AES-256-GCM 加密存储 |
| **v0.6.0** | 2026-04-30 | 项目看板（Kanban）；每日笔记；导入导出（JSON/Markdown/TXT/HTML/网页链接 + SSRF 防御）；数据备份 |
| **v0.5.0** | 2026-04-29 | 用户系统（注册/登录/改密）；Session 签名 cookie + tokenVersion 机制；三级限流（登录/注册/AI）；注册开关 |
| **v0.4.0** | 2026-04-28 | 笔记 CRUD 完善：收藏、置顶、归档、回收站、标签系统；Markdown 预览（GFM + XSS 防御）；自动保存 |
| **v0.3.0** | 2026-04-27 | 全局命令面板（Cmd+K）；玻璃拟态 UI 系统；framer-motion 动画体系；深色/浅色主题切换 |
| **v0.2.0** | 2026-04-26 | Prisma + SQLite 数据层；Next.js App Router 迁移；基础笔记 CRUD API；登录页面 |
| **v0.1.0** | 2026-04-25 | 项目初始化：Next.js 16 + React 19 + TypeScript + Tailwind CSS；Tauri 2 桌面壳；基础工程脚手架 |

## License

Private — 个人使用项目。
