-- CreateTable
CREATE TABLE "AISetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://api.deepseek.com',
    "apiKey" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT 'deepseek-v4-flash',
    "fallbackModel" TEXT NOT NULL DEFAULT 'deepseek-v4-pro',
    "enableAutoOrganize" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MemoryFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'preference',
    "content" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AISetting_userId_key" ON "AISetting"("userId");

-- CreateIndex
CREATE INDEX "MemoryFact_userId_isActive_idx" ON "MemoryFact"("userId", "isActive");

-- CreateIndex
CREATE INDEX "MemoryFact_userId_type_idx" ON "MemoryFact"("userId", "type");
