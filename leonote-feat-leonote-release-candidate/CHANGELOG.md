# CHANGELOG

## 2026-04-24

### 仓库与文档
- 将 GitHub 默认分支切换为 `main`
- 重整主仓库 README，使仓库主页可直接阅读与 review
- 新增 `CHANGELOG.md` / `ROADMAP.md` / `REVIEW_GUIDE.md`

### 安全与认证
- 移除公开 bootstrap 初始化接口
- 登录改为签名 session cookie
- 注册改为仅允许首个账号创建
- 统一登录错误口径

### 数据模型
- Prisma schema 重构为：
  - `User`
  - `Note`
  - `Tag`
  - `NoteTag`
  - `DailyNote`
  - `Project`
- 删除语义改为软删除 `deletedAt`
- 标签从扁平字符串改为关系型结构

### 笔记系统
- `/api/notes` 与 `/api/notes/[id]` 改为真实服务端闭环
- 新增 `/api/notes/[id]/trash`
- 新增 `/api/notes/[id]/restore`
- 详情页操作区补齐：收藏 / 置顶 / 归档 / 删除

### 编辑器体验
- 初版自动保存落地后，根据反馈重构为：
  - 自动保存可开关
  - 默认关闭
  - 记住用户偏好
  - 手动保存时取消自动保存计时器
- 手动保存成功后弹出“是否回目录”窗口

### 页面与入口
- 首页、搜索、每日、收藏、归档、回收站已适配新数据结构
- 新增项目一级导航入口 `/projects`
- 底部导航调整为：首页 / 搜索 / 每日 / 项目 / 我的

### 项目模块
- 新增 `Project` 数据模型
- 新增 `/api/projects`
- 新增项目页与项目创建能力
- 笔记可归属项目

### 导入导出
- 导出当前账号真实数据 JSON
- 导入支持：
  - JSON
  - Markdown
  - TXT
  - HTML
  - DOCX
  - PDF
  - 网页链接 / 新闻链接

### UI / 动效
- 修复 Tailwind 接入问题
- 修复线上样式错乱
- 增强按钮、卡片、输入框、弹窗与导航动效
- 整体升级为更接近产品态的玻璃面板风格

### 工程验证
- `npm run lint` 通过
- `npm run typecheck` 通过
- `npm run build` 通过
