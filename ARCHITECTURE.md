# Leonote 技术架构

## 1. 总体架构

Leonote 当前采用轻量 Server-first Web 架构：
- Next.js App Router 承载页面与 Route Handlers
- React 客户端组件负责编辑、搜索筛选、项目管理等交互
- Prisma ORM 负责数据访问
- SQLite 作为当前主存储，适合单人知识库和本地/轻量部署
- 签名 session cookie 负责登录态

当前定位是个人长期使用的笔记与轻知识库，不做多人协作和重平台能力。

## 2. 技术栈

### 前端
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### 后端
- Next.js Route Handlers
- Prisma
- SQLite
- Zod
- bcryptjs
- Node crypto HMAC session signing

## 3. 数据模型

核心模型：
- `User`
- `Note`
- `Tag`
- `NoteTag`
- `DailyNote`
- `Project`

关键约束：
- `User.email` 唯一
- `Tag.name + userId` 唯一
- `Project.slug + userId` 唯一
- `DailyNote.date + userId` 唯一，避免同一天重复每日笔记
- `Note.projectId` 删除项目时置空，保留笔记

关键索引：
- `Note.userId + updatedAt`
- `Note.userId + deletedAt`
- `Note.userId + isArchived`
- `Note.userId + projectId`
- `DailyNote.userId + date`
- `Project.userId + updatedAt`

## 4. API 边界

认证：
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/password`

笔记：
- `/api/notes`
- `/api/notes/[id]`
- `/api/notes/[id]/trash`
- `/api/notes/[id]/restore`

组织：
- `/api/daily`
- `/api/projects`
- `/api/projects/[id]`

数据迁移：
- `/api/import`
- `/api/export`

所有受保护接口都需要 session。涉及具体资源的读写必须按 `userId` 过滤，找不到统一返回不存在，避免泄露资源归属。

## 5. 导入导出策略

导入支持：
- JSON
- Markdown
- TXT
- HTML
- 网页链接

可靠性约束：
- JSON 批量导入使用事务，避免半写入
- 上传文件限制为 2MB
- 外部导入数据只接受白名单字段，不信任外部 `id` / `userId`
- 链接导入限制协议、内网地址、响应大小和请求时长

导出策略：
- 只导出当前登录用户的数据
- 导出结构保持 JSON，可作为未来导入协议基础

## 6. 编辑器策略

当前编辑器是 Markdown/纯文本录入体验：
- 手动保存为主
- 自动保存可开关，默认关闭
- 自动保存只对已有笔记生效
- `Cmd/Ctrl + S` 手动保存
- 离开页面前对 dirty/saving 状态做提醒
- 中文输入法 composition 期间不触发自动保存

当前没有 Markdown Preview，也没有 `dangerouslySetInnerHTML` 渲染面。后续如果加入 Markdown Preview，需要使用 `react-markdown + rehype-sanitize` 或等价方案。

## 7. 迁移与验证

数据库迁移保存在 `prisma/migrations/`。

新环境推荐：

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

已有本地 SQLite 且没有迁移历史时，可先同步并标记 baseline：

```bash
npx prisma db push
npx prisma migrate resolve --applied 20260425000100_baseline
```

交付前至少运行：

```bash
npm run lint
npm run typecheck
npm run build
```

## 8. 当前不做的事

- 多人协作
- 通用附件系统
- 富文本块编辑器
- Apple Notes 双向同步
- AI 摘要或知识图谱

这些能力不是当前稳定性迭代的目标。
