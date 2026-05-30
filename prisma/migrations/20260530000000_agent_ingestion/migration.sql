-- Agent ingestion credentials and idempotency logs
CREATE TABLE "AgentToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "scopes" TEXT NOT NULL DEFAULT 'note:write,schedule:write',
  "lastUsedAt" DATETIME,
  "revoked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AgentToken_tokenHash_key" ON "AgentToken"("tokenHash");
CREATE INDEX "AgentToken_userId_revoked_idx" ON "AgentToken"("userId", "revoked");

CREATE TABLE "IngestLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "rawPayload" TEXT NOT NULL,
  "resultNoteId" TEXT,
  "resultEventId" TEXT,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "IngestLog_userId_idempotencyKey_key" ON "IngestLog"("userId", "idempotencyKey");
CREATE INDEX "IngestLog_userId_createdAt_idx" ON "IngestLog"("userId", "createdAt");

ALTER TABLE "ScheduleEvent" ADD COLUMN "remindAt" DATETIME;
ALTER TABLE "ScheduleEvent" ADD COLUMN "remindOffset" INTEGER;
ALTER TABLE "ScheduleEvent" ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScheduleEvent" ADD COLUMN "notifyChannel" TEXT;

CREATE INDEX "ScheduleEvent_reminderSent_remindAt_idx" ON "ScheduleEvent"("reminderSent", "remindAt");
