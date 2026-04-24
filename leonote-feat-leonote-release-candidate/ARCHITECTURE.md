# Leonote 技术架构（精简版）

## 1. 总体架构
采用轻量 Web First 架构：
- 前端应用负责 UI、交互、编辑体验
- 后端负责认证、数据读写、搜索接口
- PostgreSQL 负责主数据存储
- 文件存储负责图片附件

## 2. 技术选择
### 前端
- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI / shadcn/ui
- Tiptap
- React Query
- Zustand

### 后端
- Next.js Route Handlers 或独立 API
- Prisma ORM
- PostgreSQL

### 附件
- 本地存储（开发期）
- S3 兼容对象存储（上线期）

## 3. 数据模型（第一版）
### User
- id
- username
- email
- passwordHash
- createdAt

### Note
- id
- title
- content
- excerpt
- isFavorite
- isPinned
- isArchived
- deletedAt
- createdAt
- updatedAt
- userId

### Tag
- id
- name
- userId

### NoteTag
- noteId
- tagId

### Attachment
- id
- noteId
- url
- type
- createdAt

### DailyNote
- id
- date
- noteId
- userId

### NoteLink
- id
- sourceNoteId
- targetNoteId

## 4. 页面模块划分
- 首页：最近笔记、置顶、快速新建
- 笔记页：阅读 / 编辑一体
- 搜索页：关键词搜索 + 标签过滤
- 标签页：按标签聚合
- 每日页：日记入口与日期归档
- 设置页：账号与基础偏好

## 5. 最小目录建议
```text
src/
  app/
  components/
  features/
    notes/
    tags/
    search/
    daily/
    settings/
  lib/
  hooks/
  server/
  styles/
```

## 6. 安全原则
- 服务端校验输入
- 密码只存 hash
- 富文本输出做安全处理
- 上传文件限制类型和大小
- 所有数据按用户隔离

## 7. 开发顺序
1. 项目初始化
2. 登录与基础布局
3. 笔记 CRUD
4. 标签与搜索
5. 收藏 / 归档 / 删除
6. 每日笔记
7. 关联笔记
8. 图片上传
9. 上线部署

## 8. 当前结论
Leonote 不采用重平台架构，不做过度工程化。第一版追求：
- 轻
- 稳
- 好看
- 中文完整
- 可上线
