# Agent 接入指南（Hermes / openclaw → leonote）

远程 agent 作为客户端，通过带 token 的 HTTP 接口把**笔记**和**日程/提醒**写进 leonote。方向是 **agent 调 leonote**。

## 1. 颁发 token（在 leonote 服务器上）

token 存在数据库 `AgentToken` 表（sha256 哈希存储），用脚本颁发：

```bash
npm run agent:token create hermes   note:write,schedule:write
npm run agent:token create openclaw note:write,schedule:write
npm run agent:token list
npm run agent:token revoke <id|name>
```

`create` 会**一次性**打印原始 token，复制给对应 agent。scopes：`note:write`（写笔记）、`schedule:write`（写日程/提醒）。

请求头：`Authorization: Bearer <raw-token>`。命中哪个 name，笔记 `source` 即 `agent:<source 字段>`，并按 scope 鉴权。

## 2. 写入接口

`POST /api/agent/ingest`

```jsonc
{
  "idempotencyKey": "hermes-2026-05-30-001",   // 必填，去重键（IngestLog 唯一）
  "source": "hermes",                            // 可选，默认 telegram；决定笔记 source 标记
  "intent": "note",                              // note | note_with_event | event
  "note": {
    "title": "标题",                             // intent 含 note 时必填
    "summary": "一句话摘要",
    "bodyMarkdown": "## 正文\n- markdown",
    "tags": ["agent", "inbox"],
    "projectName": "可选，自动建/挂项目",
    "links": [{ "url": "https://example.com", "label": "来源" }],
    "attachments": [{ "url": "https://.../a.pdf", "filename": "a.pdf" }]
  },
  "event": {                                     // intent 含 event 时
    "title": "提醒/日程标题",
    "description": "",
    "startAt": "2026-05-31T09:00:00+08:00",      // ISO8601 带时区
    "endAt":   "2026-05-31T09:30:00+08:00",      // 必须晚于 startAt
    "remindOffsetMinutes": 60,                   // 提前多少分钟提醒
    "notifyChannel": "telegram"                  // telegram | web
  }
}
```

返回 `{ "ok": true, "noteId": "...", "eventId": "...", "attachments": [...] }`；
重复 `idempotencyKey` 返回 `{ "ok": true, "duplicate": true, ... }`，不重复创建。

约束：每用户写入 60 次/分钟；body ≤ 80k、tags ≤ 30、links ≤ 20、attachments ≤ 10；外链经 SSRF 校验。
错误：无/错 token→401，scope 不足→403，参数非法→400，超频→429。

### curl 自测

```bash
curl -sS -X POST https://leonote.top/api/agent/ingest \
  -H "Authorization: Bearer <hermes-token>" \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey":"smoke-1","source":"hermes","intent":"note",
       "note":{"title":"hello from hermes","summary":"接入自测","bodyMarkdown":"ok"}}'
```

## 3. 提醒推送（Telegram，可选）

`intent` 含 `event` 且 `notifyChannel=telegram` 的日程，到 `remindAt`（=startAt−remindOffset）后由 cron 发送。

```env
# leonote .env
REMINDER_CRON_TOKEN="<openssl rand -hex 24>"
TG_BOT_TOKEN="<telegram bot token>"
```

chat id 通过一个名字带 chat id 的 AgentToken 配置：

```bash
npm run agent:token create "telegram:123456789" note:write
```

触发（二选一）：

```bash
# A) 常驻 worker（pm2 可托管）
npm run reminder:cron
# B) 外部每分钟 POST
curl -X POST http://127.0.0.1:4317/api/reminders/cron/send-due \
  -H "x-reminder-cron-token: $REMINDER_CRON_TOKEN"
```

未配 `TG_BOT_TOKEN` 或缺 chat id token 时不发送，日程数据仍保留。

## 4. 公网可达

- 生产域名 `LEONOTE_PUBLIC_URL`（当前 `https://leonote.top`）需能被远程 agent 访问，务必 HTTPS。
- token 轮换：`npm run agent:token revoke <name>` 后重新 `create`。
