# Leonote

> 一个面向个人长期使用的中文笔记 + 轻知识库产品。
> 移动端优先，强调简约、安全、项目制录入与可持续迭代。

---

## 1. 项目简介

Leonote 不是演示型笔记 UI，而是一个正在往“可长期使用的个人知识工作台”推进的 Web 产品。

当前产品方向：
- **中文优先**
- **个人单人使用场景优先**
- **移动端优先**
- **低饱和、黑白灰为主**
- **Notesnook 的产品感 + memos 的轻结构**
- 支持普通笔记、每日记录、项目制录入、资料导入

---

## 2. 当前已支持能力

### 2.1 账号与安全
- 首个账号注册
- 登录
- 签名 session cookie
- 统一认证失败口径
- 移除公开 bootstrap 初始化后门

### 2.2 笔记主链路
- 新建笔记
- 编辑笔记
- 手动保存
- 自动保存开关（默认关闭，可记住偏好）
- `Cmd/Ctrl + S` 快捷保存
- 保存成功后弹窗，可选择返回目录

### 2.3 组织能力
- 标签系统（关系型 tags）
- 收藏
- 置顶
- 归档
- 回收站
- 恢复
- 彻底删除

### 2.4 内容入口
- 全部笔记
- 搜索
- 每日笔记
- 项目
- 我的

### 2.5 项目能力
- 项目一级导航入口
- 新建项目
- 项目简介
- 笔记归属项目
- 按项目查看相关笔记

### 2.6 导入导出
#### 已支持导入
- JSON
- Markdown (`.md`)
- TXT (`.txt`)
- HTML (`.html`)
- DOCX (`.docx`)
- PDF (`.pdf`)
- 网页链接 / 新闻链接

#### 已支持导出
- 当前账号真实数据 JSON 导出

> 注：DOCX / PDF 当前为“文本导入优先”策略，复杂排版保真不是本阶段重点。

---

## 3. 当前页面结构

### 一级页面
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

### API
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

## 4. 技术栈

- **Next.js 16**
- **React**
- **TypeScript**
- **Prisma**
- **SQLite**
- **Tailwind CSS**
- **Zod**

---

## 5. 数据结构概要

当前核心模型：
- `User`
- `Note`
- `Tag`
- `NoteTag`
- `DailyNote`
- `Project`

### 关系说明
- 一个用户可有多条笔记
- 一条笔记可关联多个标签
- 一条笔记可选归属一个项目
- DailyNote 将“某天”与一条 Note 绑定

---

## 6. 目录结构（核心）

```text
leonote-feat-leonote-release-candidate/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ auth/
│  │  │  ├─ daily/
│  │  │  ├─ import/
│  │  │  ├─ export/
│  │  │  ├─ notes/
│  │  │  └─ projects/
│  │  ├─ notes/
│  │  ├─ daily/
│  │  ├─ projects/
│  │  ├─ search/
│  │  ├─ import/
│  │  └─ settings/
│  ├─ components/
│  │  ├─ app-shell.tsx
│  │  ├─ bottom-nav.tsx
│  │  ├─ server-note-editor.tsx
│  │  ├─ server-note-detail-client.tsx
│  │  ├─ server-note-list.tsx
│  │  ├─ server-home-client.tsx
│  │  ├─ server-search-view.tsx
│  │  ├─ server-daily-client.tsx
│  │  ├─ server-filter-view.tsx
│  │  ├─ import-export-panel.tsx
│  │  └─ project-board.tsx
│  └─ lib/
│     ├─ auth.ts
│     ├─ prisma.ts
│     └─ server-notes.ts
├─ README.md
├─ PRD.md
├─ ARCHITECTURE.md
└─ package.json
```

---

## 7. 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

必填：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
```

---

## 8. 本地启动

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

默认地址：
- `http://localhost:3000`

---

## 9. 工程验证命令

```bash
npm run lint
npm run typecheck
npm run build
```

当前这三个命令已通过。

---

## 10. 手动测试建议

### 10.1 登录 / 注册
- 打开 `/login`
- 注册首个账号
- 登录进入首页

### 10.2 笔记录入
- 打开 `/notes/new`
- 输入标题 / 内容 / 标签 / 项目
- 点击手动保存
- 检查是否弹出“回到目录”窗口

### 10.3 自动保存
- 查看自动保存开关默认是否关闭
- 打开已有笔记测试自动保存是否按预期工作
- 手动保存是否不再被自动保存打断

### 10.4 回收站
- 创建笔记
- 移入回收站
- 在回收站恢复
- 再次移入后彻底删除

### 10.5 每日记录
- 打开 `/daily`
- 检查是否自动生成今日每日笔记

### 10.6 项目
- 打开 `/projects`
- 创建项目
- 新建笔记时写入项目名
- 检查是否能按项目看到对应笔记

### 10.7 导入导出
- 测试导入 JSON / Markdown / TXT / HTML / DOCX / PDF
- 测试网页链接导入
- 测试导出 JSON

---

## 11. 已完成迭代记录

### Iteration 0：前端原型与基础信息架构
已完成：
- 首页 / 登录 / 笔记 / 搜索 / 每日 / 收藏 / 归档 / 回收站 / 设置基础页面
- 本地交互闭环
- 基础 UI 风格建立

### Iteration 1：服务端化第一轮
已完成：
- 接入 Prisma + SQLite
- 接入真实登录流程
- 笔记 API 初版
- `/notes`、`/notes/new`、`/notes/[id]` 改到服务端数据流

### Iteration 2：线上样式修复与产品第一轮补齐
已完成：
- 补齐 Tailwind 接入
- 修复线上样式错乱
- 补编辑入口
- 补回收站恢复 / 彻底删除
- 补归档取消归档
- 补导入导出第一版

### Iteration 3：上线前重构
已完成：
- 移除公开 bootstrap
- 认证改为签名 session
- 数据模型改为 `Note / Tag / NoteTag / DailyNote`
- notes API / trash / restore 重构
- 导入导出服务端化
- Daily API 落地
- 全部核心前端组件适配新数据结构
- lint / typecheck / build 全通过

### Iteration 4：交互与结构升级
已完成：
- 自动保存改为可开关并记住偏好
- 手动保存与自动保存冲突修复
- 手动保存成功弹窗
- 项目一级模块落地
- 链接导入落地
- 导入能力扩到 HTML / DOCX / PDF
- 动效与交互质感统一升级
- GitHub 主线更新到 `main`

---

## 12. 当前未做 / 待评估

### 暂未做
- 通用附件上传系统
- 附件预览与管理
- Apple Notes 同步
- 多用户协作
- 分享链接
- 富文本 / 块编辑器
- 版本历史

### 待你评估
- 是否继续做附件系统
- 是否继续做更强的项目视图（阶段、任务、会议纪要）
- 是否继续做更高级网页采集
- 是否继续做更完整 DOCX / PDF 解析

---

## 13. 产品定位总结

Leonote 当前不是“大而全”的 all-in-one 工具，
而是一个已经具备：
- 安全基础
- 服务端数据闭环
- 个人记录主链路
- 每日 + 项目双入口
- 可导入资料
- 可继续稳定迭代

的中文个人知识工作台基线。

---

## 14. 仓库信息

- GitHub: <https://github.com/leoyb1010/leonote>
- 默认分支: `main`

---

## 15. 维护说明

如果后续继续迭代，请优先保持以下原则：
- 不回退到 demo 逻辑
- 不恢复公开初始化接口
- 所有核心链路优先基于真实服务端数据
- 优先保证录入体验、稳定性和可持续演进能力
