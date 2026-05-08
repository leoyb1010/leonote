# Leonote 生产部署指南

## 前置条件

- Node.js 22+
- npm 10+
- 一个可以从公网或局域网访问的域名（可选但推荐）

## 步骤

### 1. 克隆仓库

```bash
git clone https://github.com/leoyb1010/leonote.git
cd leonote
```

### 2. 配置环境变量

```bash
cp .env.example .env.production
```

编辑 `.env.production`，必填项：

- `AUTH_SECRET`：生成随机密钥（`openssl rand -base64 48`）
- `LEONOTE_PUBLIC_URL`：你的部署域名
- `LEONOTE_ALLOW_REGISTRATION`：设为 `"true"` 允许新用户注册

### 3. 安装依赖与构建

```bash
npm install
npx prisma generate
npm run build
```

### 4. 首次启动前创建数据库文件

SQLite 文件在首次迁移前需要存在。运行：

```bash
mkdir -p data
touch data/leonote.db
```

### 5. 启动

```bash
npm run start:prod
```

该命令会自动执行 `prisma migrate deploy`，然后启动 Next.js。

服务运行在 `http://0.0.0.0:4317`。

### 6. 反向代理（推荐）

使用 Nginx 或 Caddy 反代到 `4317` 端口，并配置 HTTPS。

Nginx 示例：

```nginx
server {
    listen 443 ssl;
    server_name leonote.example.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4317;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # X-Forwarded-Host 必须由反代覆盖，不能透传客户端值
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

> 安全提示：生产环境务必配置 `LEONOTE_PUBLIC_URL`。系统会优先信任该域名做来源校验，而非请求中的 `Host` / `X-Forwarded-Host` 头。Node 服务应绑定 `127.0.0.1`，不直接暴露公网端口。

### 7. 首次使用

1. 访问你的域名。
2. 注册第一个账号（确保 `LEONOTE_ALLOW_REGISTRATION` 为 `"true"`）。
3. 注册成功后，建议将 `LEONOTE_ALLOW_REGISTRATION` 改为 `"false"` 并重启服务。

---

## Docker 部署

```bash
cp .env.example .env.production
# 编辑 .env.production
docker compose up -d --build
```

数据持久化在 Docker volume `leonote-data` 中。

---

## PM2 部署

```bash
npm install -g pm2
pm2 start npm --name "leonote" -- run start:prod
pm2 save
pm2 startup
```

---

## 备份

### 自动备份脚本

```bash
#!/bin/sh
# backup-leonote.sh
cp ./data/leonote.db "./backups/leonote-$(date +%Y%m%d-%H%M%S).db"
echo "Backup complete"
```

建议通过 cron 每日执行：

```bash
0 3 * * * /path/to/backup-leonote.sh
```

### 手动导出

在 Leonote 设置页 → 数据备份 → 导出 JSON。导出的 JSON 可随时重新导入。

---

## 升级

```bash
git pull
npm install
npx prisma generate
npm run build
# 重启服务
```

`start:prod` 脚本会自动执行 migration。

---

## 已知依赖告警

`npm audit --omit=dev` 会报告 2 个 moderate 级别告警，来自 `next -> postcss` 依赖链（PostCSS CSS 输出中的 XSS 风险）。由于 Leonote 主要处理 Markdown 内容且不直接渲染用户 CSS，当前风险可控。

不建议使用 `npm audit fix --force`（可能导致不兼容的大版本跳转）。关注 Next.js 后续补丁版本，优先升级包含 PostCSS 修复的 release。
