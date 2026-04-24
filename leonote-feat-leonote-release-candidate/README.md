# Leonote

一个面向个人长期使用的中文笔记与轻知识库 Web 产品。

## 当前版本能力
- 首个账号注册 + 登录
- 安全 session cookie
- 笔记 CRUD
- 自动保存
- 标签系统
- 搜索
- 收藏 / 置顶
- 归档 / 回收站 / 恢复 / 彻底删除
- 每日笔记
- 导入 JSON / Markdown / TXT
- 导出当前用户真实数据

## 环境变量
复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

必填：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="替换为长随机串"
```

## 安装与初始化
```bash
npm install
npx prisma generate
npx prisma db push
```

## 首个账号注册
1. 启动开发环境
2. 打开 `/login`
3. 选择“创建账号”
4. 创建首个账号
5. 之后公开注册自动关闭

## 本地开发
```bash
npm run dev
```

## 验证命令
```bash
npm run lint
npm run typecheck
npm run build
```

## 手动验证步骤
### 认证
- 首个账号可注册
- 登录成功后进入首页
- 篡改 cookie 后接口应返回未登录

### 回收站
- 新建笔记
- 在详情页移入回收站
- 在回收站页恢复
- 再次移入回收站后彻底删除

### 导入导出
- 在导入页导入 JSON / Markdown / TXT
- 导入后跳转到真实笔记详情页
- 点击导出，下载当前用户真实数据 JSON

## 说明
当前版本聚焦单人闭环与稳定迭代，不包含附件、关联笔记、Apple Notes 同步等增强能力。
