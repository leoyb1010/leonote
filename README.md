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

# 每日简报
BRIEFING_CRON_TOKEN="change-me-long-random-token"
BRIEFING_AUTO_REFRESH="true"
BRIEFING_MIN_ITEMS="24"
BRIEFING_MAX_AGE_MINUTES="10"
BRIEFING_TRANSLATE_ENGLISH="true"
BRIEFING_TRANSLATE_MAX_ITEMS="12"
BRIEFING_TRANSLATE_TIMEOUT_MS="30000"
RSSHUB_BASE_URL="https://rsshub.app"
```

---

## 功能总览

### 数字居所 (v1.4)
- 首页 Hero 区：时间问候语 + "安放了X篇" 统计 + 开始书写
- QuickCapture Dock：仪式感安放入口
- 记忆闪回：21天前笔记轻提醒
- 本周沉淀：新增/编辑/回看/长期记忆统计
- 2xl 大屏右栏布局（主内容+320px侧栏）

### 轻记账 (v1.5)
- 5秒记账：输入"拿铁 35"自动识别金额 + 类型
- 自定义类型：name / emoji / color（快速模板：AI订阅/咖啡/书/健身）
- 月度合计 + 本周合计 + 类型分布条 + 最近记录
- 首页「今天」本周开销轻卡片
- 设置页「记账类型」入口
- 完全软删除 + 删除类型后历史账单保留

### 每日简报 (v1.6.9)
- 多源抓取：RSS / Tavily / CoinGecko / 新浪行情，支持 Cron 定时抓取、行情刷新与日报生成
- AI 协助思考：每日简报 Hero 从表层标题升级为不少于 6 条“深度影响/分析价值”思考，优先筛选国内外实时发生的 AI 科技大事件，并结合来源质量、长期记忆、近期笔记与标签判断模型平台、算力芯片、产品入口、资本成本、安全治理、开发者生态和社会情绪的潜在传导
- AI 思考区体验修正：默认展示紧凑思考卡片，命名为“思考 One / Two / Three …”，点击后再拉起轻量详情气泡，避免 Hero 区占据过多首屏空间；详情气泡保留影响判断、追问问题、来源依据和标签
- AI 思考移动端抽屉修复：iPhone 与小屏 iPad 使用可靠的底部抽屉结构，支持 `100vh` / `100dvh` 双兜底、safe-area 关闭按钮、顶部 drag handle 与内部独立滚动，避免详情内容被顶出屏幕或只能看到底部一条
- AI 思考信号加强：从单一示例触发改为 AI 科技优先的影响评分体系；前沿模型/平台、AI 算力与芯片、AI 产品入口、AI 资本与成本、AI 安全治理、AI 开发生态独立竞争，外交/政策事件只作为窄触发的补充特例，不再盖过普通但重要的 AI 科技大事件
- 简报响应式布局升级：Hero 右侧指标与星座面板提前到 `md` 断点显示，主内容与 Sidebar 提前到 `lg` 双列；今日亮点、全部资讯、AI 思考和星座区在 sm / md / lg / xl / 2xl 下使用更紧凑的网格与间距，减少中段大块留白
- 资讯源扩容与可靠性治理：新增 IT之家、少数派、V2EX、LinuxDo、微博热搜、知乎热榜、B站排行榜、掘金热榜、GitHub Trending、The Verge、Ars Technica、WIRED、MIT Technology Review、TechCrunch、Engadget、IEEE Spectrum、OpenAI Blog、DeepMind、Google Research、Hugging Face、arXiv、Simon Willison、Ben's Bites、TLDR AI、Import AI、MarkTechPost、Hacker News、ByteByteGo、The Pragmatic Engineer、GitHub Blog、Cloudflare、Product Hunt、Stratechery、Benedict Evans、a16z、VentureBeat、BleepingComputer、KrebsOnSecurity、The Register、404 Media 等真实 RSS 源；RSSHub 域名可通过 `RSSHUB_BASE_URL` 替换
- 首页自动补抓：简报页与刷新 API 会在内容不足、抓取过期或当日 digest 缺失时自动执行 RSS 抓取 + digest 标准化，避免 Cron 未跑或源刚恢复时出现“全部资讯空白”
- 高频刷新：白天 RSS 抓取升级到 10 分钟粒度，默认首屏新鲜度阈值收紧到 10 分钟，最低内容量提升到 24 条
- 抓取后即标准化：RSS 入库时保存更完整的正文摘录；digest 生成时统一做简体中文翻译/改写、摘要兜底、要点抽取、评分与标签生成
- 英文源中文化：配置 AI Key 后，英文标题/摘要/正文摘录会自动翻译成自然简体中文；没有 AI Key 时仍优先展示中文源内容，不让首页空白
- AI 摘要 + 质量评分 + 自动标签，统一输出为适合中文阅读的简报结构
- 全新日报式信息架构：可编辑标题、日期范围、刷新简报、存为笔记、复制摘要
- Hero 概览区：资讯数量、未读数量、平均质量分、重要标签、深圳天气 widget
- 核心阅读区：今日亮点、全部资讯流、深度阅读卡片、标签与洞察分布
- 市场温度侧栏：sparkline 走势、涨跌幅、波动最大标的、行情同步状态
- 底部/侧栏状态：生成时间、新闻同步时间、数据来源数量、最近 Cron 状态
- 详情弹窗只展示用户真正需要的信息：标题、来源、发布时间、评分、标签、AI 摘要、要点、编辑摘录、原文入口
- 详情弹窗可直接阅读主要内容：智能摘要永不空白，正文摘录长度提升并过滤 RSS/URL/广告/关注公众号等噪音，不再强迫每条都跳原文；移动端长内容弹窗增加固定关闭入口、底部关闭按钮与 safe-area 适配
- 数据标准化 pipeline：日期、评分、摘要长度、标签、要点、详情摘录、digest JSON、market points 全部统一清洗与容错
- 严格过滤内部/技术/低价值字段：前端 DTO 不再暴露原始 `content`，避免 RSS/Tavily 原文、JSON、URL、GUID、来源调试信息进入详情
- 一键导入 news → note / 今日简报 → note，导入内容使用同一套清洗后的展示字段
- 全局 AI 助手：保留独立 AI 页，同时新增全局右侧/移动端底部呼出入口，自动带入当前页面路径、标题、选中文本和页面摘要，让 AI 问答与正在阅读/写作的上下文绑定
- 全局 AI 助手交互修正：统一通过 body portal 与专用浮层卡片从视口右侧呼出，避免普通卡片样式把 `fixed` 定位覆盖成 `relative` 导致左侧错位；桌面不铺满遮罩，移动端使用右侧 `100dvh` 面板，顶部关闭按钮固定可见，降低遮挡和无法关闭风险
- 今日星座运势：天气信息后增加 AstroSage RSS 每日星座运势，固定展示 Leo=我/天秤座、Ellen=老婆/双鱼座、BuBu=女儿/双子座，并以五颗星展示每日星级；缓存按 Asia/Shanghai 当日 key 失效，Cron 在 00:01 与 06:30 自动刷新，RSS 失败时使用本地稳定兜底
- 笔记正文内联附件：图片、文档通过粘贴/拖拽/选择上传后会插入当前光标位置，图片直接作为 Markdown 图片显示在正文里，附件列表继续保留管理能力

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
  │     ├── NoteRevision (版本历史)
  │     └── NoteAttachment (附件：文件/图片)
  ├── Project (项目)
  ├── DailyNote (每日记录)
  ├── NewsSource / NewsItem / UserBriefingState (每日简报资讯与用户状态)
  ├── MarketSnapshot / BriefingDigest / CronRun (行情、日报摘要、定时任务记录)
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

1. **文件级**：复制 `prisma/data/leonote.db`
2. **JSON 导出**：设置页 → 数据备份 → 导出全部笔记
3. Docker 用户：`./data` 已挂载为 volume

推荐每月执行一次 JSON 导出 + 数据库文件备份。

---

## 版本记录

| 版本 | 日期 | 更新内容 |
|---|---|---|
| **v1.6.9** | 2026-05-12 | 按 `/briefing` v2 指导文档升级简报页响应式密度：Hero 从 `md` 起呈主栏 + 指标/星座栏，主内容与 Sidebar 从 `lg` 起双列，今日亮点与资讯流在 sm/lg/xl 断点自动切换网格，空态高度和卡片间距收紧，减少 768-1279px 与中段阅读区的大块留白。AI 协助思考详情在 iPhone / 小屏 iPad 改为可靠底部抽屉，使用 `100vh` + `100dvh` 双高度兜底、safe-area 关闭按钮、drag handle、flex 内部滚动，避免详情标题、正文、来源和追问被顶出屏幕。星座运势缓存从 6 小时 TTL 改为 Asia/Shanghai 当日 key，新增 `refresh-horoscope` Cron API 与 00:01 / 06:30 两次定时刷新；星座区展示来源与更新时间。README 与 `.env.example` 同步说明 |
| **v1.6.8** | 2026-05-11 | 重做每日简报 AI 协助思考的筛选逻辑：从“用户举例触发器”调整为 AI 科技优先的高影响事件评分体系，前沿模型/平台、AI 算力与芯片、AI 产品入口、AI 资本与成本、AI 安全治理、AI 开发生态独立参与排序；外交/政策类事件仅作为窄触发特例，权重降低，不再因为中美示例盖过其它重要 AI 科技新闻。默认输出不少于 6 条思考，卡片命名改为“思考 One / Two / Three …”，标题不再重复套主题前缀；详情文案全部改为“思考”。新增回归测试：普通 AI/产品新闻不会被折叠进地缘判断，足量 AI 科技事件会返回 6 条思考，特朗普访华/黄仁勋/AI 芯片这类复合事件仍可作为政策边界特例识别 |
| **v1.6.7** | 2026-05-11 | 修复浮层定位根因：普通 `card-premium` 全局样式会把 `fixed` 定位覆盖成 `relative`，导致全局 AI 助手从左侧错位呼出、AI 协助思考气泡不按点击位置弹出；新增专用 `floating-card-premium`，全局 AI 助手、AI 思考详情、资讯详情弹窗统一使用真实固定定位。AI 助手桌面端保持右侧内容伴随面板，移动端使用完整安全面板；AI 思考详情改为按鼠标点击坐标居中锚定，空间不足时自动上翻/边界夹紧。收窄地缘科技战略信号触发条件，必须同时满足高层/外交语境、双边语境和政策议题，避免普通 AI、手机、汽车、家电资讯被误判成地缘议题；新增回归测试覆盖普通资讯不误贴地缘判断和特朗普访华/黄仁勋/AI 芯片案例仍能命中战略信号 |
| **v1.6.6** | 2026-05-11 | 每日星座运势接入 AstroSage 三个独立 RSS 源：Leo=我/天秤座、Ellen=老婆/双鱼座、BuBu=女儿/双子座，天气后展示每日五颗星星级和简短运势，RSS 失败时稳定兜底；AI 协助思考详情改为按点击位置锚定弹出，桌面靠近鼠标/卡片位置，移动端继续使用底部安全面板；全局 AI 助手改用 body portal 渲染并强制右侧锚定，规避父级布局导致左侧错位/遮挡；AI 思考底层加入战略信号识别，重点覆盖特朗普访华、黄仁勋/英伟达、AI 芯片、出口许可、芯片管制等复合事件，避免高价值中美科技议题被主题去重压掉 |
| **v1.6.5** | 2026-05-11 | 修正每日简报首屏节奏：AI 协助思考区从大面积分析卡片改为紧凑缩略思考，点击后以轻量气泡/移动端底部面板查看详情，降低首屏占比并改善移动端阅读；重新调整 Hero 信息架构，天气后增加今日星座运势，固定展示“我/天秤座、老婆/双鱼座、女儿/双子座”的每日摘要和小卡；全局 AI 悬浮窗改为始终从右侧抽屉呼出，桌面不再铺满遮罩，移动端使用 `100dvh` 右侧面板、safe-area padding、顶部固定关闭按钮和 Escape 关闭，降低遮挡、错位和无法关闭风险 |
| **v1.6.4** | 2026-05-11 | 每日简报继续升级为“高级个人日报”：Hero 区移除表层三条资讯，新增 AI 协助思考区，按深度影响、分析价值、来源质量、时效性与个人长期记忆/近期笔记信号筛出 3-5 条分析思考，并输出影响标签、置信度、为什么重要、反问式思考问题和原始来源依据；RSS 源大扩容，加入国内科技/社区/热榜、国际科技、AI/机器学习、开发者/架构、商业战略、安全与企业 IT 等真实信息源，RSSHub 域名支持 `RSSHUB_BASE_URL` 配置；简报抓取频率提升为白天 10 分钟粒度，首页新鲜度阈值默认 10 分钟、最低内容量默认 24 条，减少“新事情看不到”的滞后；移动端资讯详情长弹窗增加安全关闭入口、底部关闭按钮、`100dvh` 与 safe-area 适配，降低无法关闭风险；笔记编辑器上传体验升级，粘贴/拖拽/选择图片或文档会插入当前正文光标位置，图片可直接内联阅读；新增全局 AI 助手浮层，桌面右侧、移动端底部呼出，并自动带入当前页面上下文；笔记更新接口返回最新标签和附件，列表 DTO 同步带附件，保持数据一致性；README 与环境变量更新到新频率和 RSSHub 配置 |
| **v1.6.3** | 2026-05-10 | 每日简报资讯链路可靠性修复：修复首页/简报页"全部资讯空白"的根因，列表查询从单纯 `publishedAt >= today` 扩展为 `publishedAt/fetchedAt` 双窗口，并在今日内容不足时回退到近 7 天高质量内容；新增 `ensureBriefingFreshness`，页面首屏与 `/api/briefing/digest` 会在内容不足、抓取过期、digest 缺失或用户手动刷新时自动执行 RSS 抓取 + digest 标准化；`fetch-news` Cron 完成抓取后立即生成 digest，避免抓到数据但前端仍无评分/摘要；RSS 源扩容到更稳定的真实信息源，新增联合国中文/全球、CBS、ABC、CNBC、MarketWatch、Seeking Alpha、IT之家、爱范儿、钛媒体、量子位、Solidot、VentureBeat、MIT Technology Review、Google AI Blog，并默认停用不稳定 Nitter/X RSS；RSS 入库保存正文摘录 `content`，修复部分源 `author` 为对象导致整源中断的问题；翻译 pipeline 默认开启（可用 `BRIEFING_TRANSLATE_ENGLISH=false` 关闭），配置 AI Key 后英文标题/摘要/正文摘录自动改写为简体中文；无 AI Key 时仍优先展示中文源并生成摘要兜底，确保 `aiSummary/detailText/keyPoints` 不为空；详情弹窗智能摘要恢复并升级为"摘要 + 要点 + 正文摘录"的阅读卡片，正文摘录提升到 1600 字符并过滤 RSS/URL/广告/关注公众号等噪音；导入 news→note 同步使用新摘要、要点与正文摘录；**快捷键交换**：快速记录/AI聊天/记账输入框统一改为 Enter 换行、Shift+Enter 保存/发送，避免快速输入误触；**standalone 部署加固**：`prepare-standalone.cjs` 新增 symlink 校验（创建后验证 resolve + 目录非空，失败 exit(1) 阻断部署），修复静态资源 404 白屏；翻译超时从 8s 提升至 30s；继续保持 Quiet Material 与多分辨率布局兼容 |
| **v1.6.2** | 2026-05-09 | 每日简报体验与数据逻辑大升级：将 Briefing 页面从四列信息看板重构为安静高级的个人日报；新增可编辑简报标题、日期范围、刷新简报、存为笔记、复制摘要；Hero 区展示资讯数、未读数、AI 平均质量分、重要标签与天气；核心内容拆分为今日亮点、全部资讯流、深度阅读、标签洞察、市场温度、来源/Cron 状态；重写 BriefingHero / BriefingShell / NewsCard / NewsColumn / NewsDetailModal / TopBar / DeepReadCard / loading；市场侧栏改为更轻的行式 Market Strip，保留 sparkline、涨跌幅、波动最大、缓存状态；详情弹窗彻底过滤无用信息，只展示标题、来源、时间、质量评分、标签、AI 摘要、要点、编辑摘录与原文入口；新增 briefing normalize pipeline，统一处理 HTML 清洗、空白折叠、摘要截断、JSON 数组解析、标签标准化、评分 clamp、阅读时间估算、详情摘录生成、digest JSON 容错、market points 容错；NewsItemDTO 移除原始 content，改为安全 detailText，从源头避免 RSS/Tavily 原文、URL/GUID/JSON/API 字段进入前端详情；/api/briefing/digest 增加 range/category 参数校验与 meta 输出；/api/briefing/state 不再返回完整内部 state；今日简报导入和单条新闻导入统一使用清洗后的标题、摘要、要点、标签与来源名；保持 Quiet Material 体系，使用 material-elevated/inset、hairline、克制动效、中文阅读字体栈与响应式侧栏 |
| **v1.6.1** | 2026-05-09 | 安全加固+X监控修复：Cron定时任务Token鉴权（header/bearer双模式+timingSafeEqual）；img-proxy SSRF全链路防护（DNS解析校验/私有IP拦截/Content-Type白名单/2MB限制）；logout跨域请求拒绝；Docker入口SQLite迁移前备份+完整性校验；X监控内容显示逻辑修复（有AI摘要即展示翻译版）；清理未使用import；postcss override修复依赖冲突；新增briefing-auth鉴权单元测试 |
| **v1.6.0** | 2026-05-08 | 每日简报系统：5表（NewsSource/NewsItem/MarketSnapshot/BriefingDigest/CronRun）；RSS/Tavily/CoinGecko/Sina多源抓取；AI摘要+评分+标签；市场sparkline；天气widget；cron日报生成；news→note一键导入；简报专属UI |
| **v1.5.2** | 2026-05-08 | 全局质量优化：export/import 重构（流式+进度）；AI summary/memory 增强上下文；register 强化校验+限流；daily ensure 独立端点；ThemeProvider/SegmentedControl 初始化优化；TodayPage 布局微调；request-guard 日志增强；部署文档更新 |
| **v1.5.1** | 2026-05-08 | 安全加固：SSRF 172.x 范围精确到 172.16.0.0/12；CSP 新增 object-src 'none'；AI 支持 effort 参数（AI_EFFORT_LEVEL）；新增 /api/health 健康检查端点；新增 .dockerignore；删除死代码 storage.ts；完善限流/金额单位注释 |
| **v1.5.0** | 2026-05-07 | 轻记账模块：ExpenseCategory + Expense 模型；format-money 金额格式化（分存储，¥展示）；5秒记账 QuickCapture（输入"拿铁 35"自动识别）；月度/本周合计 + 类型分布条；首页本周开销轻卡片；设置页记账类型入口；setNull 删除类型保留历史；全 API Zod 校验 + 软删除 |
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
