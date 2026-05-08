CREATE TABLE "NewsSource" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "region" TEXT NOT NULL DEFAULT 'global',
  "weight" INTEGER NOT NULL DEFAULT 50,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "lastFetchAt" DATETIME,
  "failCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "NewsItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "imageUrl" TEXT,
  "excerpt" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '',
  "author" TEXT,
  "publishedAt" DATETIME NOT NULL,
  "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'zh',
  "region" TEXT NOT NULL DEFAULT 'global',
  "aiSummary" TEXT,
  "aiKeyPoints" TEXT,
  "aiScore" REAL,
  "aiTags" TEXT,
  CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserBriefingState" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isFavorited" BOOLEAN NOT NULL DEFAULT false,
  "isImported" BOOLEAN NOT NULL DEFAULT false,
  "importedNoteId" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserBriefingState_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NewsItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MarketSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "symbol" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "price" REAL NOT NULL,
  "changePct" REAL NOT NULL,
  "changeAbs" REAL NOT NULL,
  "pointsJson" TEXT NOT NULL DEFAULT '[]',
  "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BriefingDigest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" DATETIME NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CronRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "task" TEXT NOT NULL,
  "ok" BOOLEAN NOT NULL,
  "message" TEXT NOT NULL DEFAULT '',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" DATETIME
);

CREATE UNIQUE INDEX "NewsItem_sourceId_externalId_key" ON "NewsItem"("sourceId", "externalId");
CREATE INDEX "NewsSource_enabled_category_idx" ON "NewsSource"("enabled", "category");
CREATE INDEX "NewsSource_lastFetchAt_idx" ON "NewsSource"("lastFetchAt");
CREATE INDEX "NewsItem_category_publishedAt_idx" ON "NewsItem"("category", "publishedAt");
CREATE INDEX "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt");
CREATE INDEX "NewsItem_aiScore_idx" ON "NewsItem"("aiScore");
CREATE UNIQUE INDEX "UserBriefingState_userId_itemId_key" ON "UserBriefingState"("userId", "itemId");
CREATE INDEX "UserBriefingState_userId_isRead_idx" ON "UserBriefingState"("userId", "isRead");
CREATE INDEX "UserBriefingState_userId_isFavorited_idx" ON "UserBriefingState"("userId", "isFavorited");
CREATE INDEX "UserBriefingState_itemId_idx" ON "UserBriefingState"("itemId");
CREATE INDEX "MarketSnapshot_symbol_capturedAt_idx" ON "MarketSnapshot"("symbol", "capturedAt");
CREATE INDEX "MarketSnapshot_category_capturedAt_idx" ON "MarketSnapshot"("category", "capturedAt");
CREATE UNIQUE INDEX "BriefingDigest_date_key" ON "BriefingDigest"("date");
CREATE INDEX "CronRun_task_startedAt_idx" ON "CronRun"("task", "startedAt");
CREATE INDEX "CronRun_ok_startedAt_idx" ON "CronRun"("ok", "startedAt");
