# Leonote

> 一个面向个人长期使用的中文笔记 + 轻知识库产品。
> 当前主仓库已经整理为可直接阅读、下载、review 的单仓结构。

---

## 快速入口

- **仓库主页**：<https://github.com/leoyb1010/leonote>
- **默认分支**：`main`
- **项目文档**：见本页下方
- **变更记录**：[`CHANGELOG.md`](./CHANGELOG.md)
- **路线图**：[`ROADMAP.md`](./ROADMAP.md)
- **Review 指南**：[`REVIEW_GUIDE.md`](./REVIEW_GUIDE.md)
- **产品需求**：[`PRD.md`](./PRD.md)
- **架构说明**：[`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 项目是什么

Leonote 是一个：
- 中文优先
- 单人使用优先
- 移动端优先
- 面向长期记录与资料沉淀
- 同时支持普通笔记、每日记录、项目制录入的 Web 产品

定位不是 demo，而是一个可持续迭代的个人知识工作台基线。

---

## 版本更新

### v0.6.0 · 安全修复与产品基线升级（2026-04-24）
- 修复链接导入 SSRF 风险：限制 http/https、拦截 localhost/私网/metadata 地址、增加 DNS 检查、超时与响应体大小上限
- 修复 note 绑定 project 的 ownership 校验，不再信任任意 projectId
- 修复 Daily 首次创建并发问题，降低孤儿 note 和 500 风险
- 移除 DOCX/PDF“伪支持”，避免导入坏数据
- 补齐账号管理基础闭环：`/api/auth/me`、`/api/auth/password`、`/api/auth/logout`
- “我的/个人资料”升级为可查看账号、改昵称、改密码、退出登录
- 首页改为 server-first 工作台结构：Today / Focus / Recent
- 项目页推进到 server-first 入口，新增项目详情页 `/projects/[id]`
- 项目管理补齐编辑/删除闭环：支持修改名称、描述、状态，并支持删除项目；删除后原项目下笔记保留并转为未归属项目
- 搜索页升级为搜索 + 筛选，支持项目 / 收藏 / 归档组合筛选
- 开始建立设计 token：颜色、圆角、阴影、动效时长、easing 收口到 CSS variables
- 统一通过：`npm run lint`、`npm run typecheck`、`npm run build`

### v0.5.0 · 仓库整理与产品闭环增强（2026-04-24）
- 仓库结构提升到根目录，不再多套一层项目文件夹
- GitHub 默认分支整理为 `main`
- README / CHANGELOG / ROADMAP / REVIEW_GUIDE 重整为主仓库文档结构
- 自动保存改为可开关、默认关闭、记住偏好
- 手动保存后弹窗返回目录
- 新增项目一级模块
- 导入增强到 HTML / 链接（移除不可靠的 DOCX/PDF 假支持）
- 动效与交互质感升级

### v0.4.0 · 上线前重构（2026-04-24）
- 移除公开 bootstrap
- 认证改为签名 session cookie
- 重构 Prisma 数据模型为 `Note / Tag / NoteTag / DailyNote`
- notes / trash / restore API 重构
- 导入导出服务端化
- Daily API 落地
- lint / typecheck / build 全通过

### v0.3.0 · 服务端链路与导入导出初版（2026-04-24）
- 接入 Prisma + SQLite
- 接入真实登录与基础注册流程
- `/notes` / `/notes/new` / `/notes/[id]` 切到服务端数据链路
- 导入 / 导出初版落地

### v0.2.0 · 样式修复与产品补齐（2026-04-24）
- 修复 Tailwind 未正确接入导致的线上样式错乱
- 增加编辑入口、回收站恢复、取消归档等交互补全

### v0.1.0 · 原型基线（2026-04-24）
- 完成首页、登录、笔记、搜索、每日、收藏、归档、回收站、设置等基础页面
- 完成本地交互闭环与 Leonote 初始风格

---

## 当前已完成能力

### 账号与安全
- 首个账号注册
- 登录
- 签名 session cookie
- 移除公开 bootstrap 初始化入口

### 笔记系统
- 新建 / 编辑 / 保存
- 手动保存
- 自动保存开关（默认关闭，可记住偏好）
- 手动保存成功弹窗
- `Cmd/Ctrl + S` 快捷保存

### 内容组织
- 标签系统
- 收藏
- 置顶
- 归档
- 回收站
- 恢复
- 彻底删除

### 内容入口
- 首页
- 搜索
- 每日
- 项目
- 我的

### 项目能力
- 项目一级导航
- 创建项目
- 项目简介
- 笔记归属项目
- 按项目查看相关笔记

### 导入导出
#### 导入
- JSON
- Markdown
- TXT
- HTML
- 新闻链接 / 网页链接

#### 导出
- 当前账号真实数据 JSON 导出

---

## 当前页面结构

- `/` 首页
- `/login` 登录 / 首个账号注册
- `/notes` 全部笔记
- `/notes/new` 新建笔记
- `/notes/[id]` 笔记详情 / 编辑
- `/search` 搜索
- `/daily` 每日记录
- `/projects` 项目
- `/favorites` 收藏
- `/archive` 归档
- `/trash` 回收站
- `/import` 导入与迁移
- `/profile` 个人资料
- `/settings` 我的 / 设置

---

## API 结构

- `/api/auth/login`
- `/api/auth/register`
- `/api/notes`
- `/api/notes/[id]`
- `/api/notes/[id]/trash`
- `/api/notes/[id]/restore`
- `/api/daily`
- `/api/projects`
- `/api/import`
- `/api/export`

---

## 技术栈

- Next.js 16
- React
- TypeScript
- Prisma
- SQLite
- Tailwind CSS
- Zod

---

## 数据模型

核心模型：
- `User`
- `Note`
- `Tag`
- `NoteTag`
- `DailyNote`
- `Project`

说明：
- 一个用户可有多条笔记
- 笔记可关联多个标签
- 笔记可选归属一个项目
- DailyNote 将“日期”与一条笔记绑定

---

## 仓库目录结构

```text
leonote/
├─ README.md
├─ CHANGELOG.md
├─ ROADMAP.md
├─ REVIEW_GUIDE.md
├─ PRD.md
├─ ARCHITECTURE.md
├─ package.json
├─ prisma/
│  └─ schema.prisma
└─ src/
   ├─ app/
   │  ├─ api/
   │  ├─ notes/
   │  ├─ daily/
   │  ├─ projects/
   │  ├─ search/
   │  ├─ import/
   │  └─ settings/
   ├─ components/
   └─ lib/
```

---

## 本地启动

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

默认地址：
- `http://localhost:3000`

---

## 工程验证

```bash
npm run lint
npm run typecheck
npm run build
```

当前这三个命令已通过。

---

## 当前仓库建议如何阅读

### 如果你是使用者
先看：
1. 本页 README
2. `CHANGELOG.md`
3. `ROADMAP.md`

### 如果你是 reviewer（如 Claude）
先看：
1. 本页 README
2. `REVIEW_GUIDE.md`
3. `PRD.md`
4. `ARCHITECTURE.md`

---

## 当前阶段总结

Leonote 当前已经不是原型骨架，而是一个具备：
- 安全基础
- 服务端数据闭环
- 每日记录能力
- 项目制录入能力
- 导入导出链路
- 可持续迭代工程结构

的主仓库基线。

---

## 当前未完成 / 待评估

- 通用附件上传系统
- 附件预览与管理
- Apple Notes 同步
- 更完整的 DOCX / PDF 解析
- 更强的项目视图（阶段 / 任务 / 风险 / 会议纪要）
- 富文本 / 块编辑器
- 版本历史

---

## 仓库维护原则

后续继续迭代时，优先坚持：
- 不回退到 demo 逻辑
- 不恢复公开初始化接口
- 核心链路始终基于真实服务端数据
- 优先保证录入体验、稳定性、可维护性
