-- v1.7 Gear Library
CREATE TABLE "GearItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL DEFAULT '',
  "model" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT 'other',
  "status" TEXT NOT NULL DEFAULT 'active',
  "location" TEXT NOT NULL DEFAULT '',
  "serialNumber" TEXT NOT NULL DEFAULT '',
  "purchaseDate" DATETIME,
  "purchasePrice" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'CNY',
  "purchaseChannel" TEXT NOT NULL DEFAULT '',
  "warrantyUntil" DATETIME,
  "specsJson" TEXT NOT NULL DEFAULT '{}',
  "notes" TEXT NOT NULL DEFAULT '',
  "linkedExpenseId" TEXT,
  "deletedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GearItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GearItem_linkedExpenseId_fkey" FOREIGN KEY ("linkedExpenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "GearItem_userId_status_idx" ON "GearItem"("userId", "status");
CREATE INDEX "GearItem_userId_category_idx" ON "GearItem"("userId", "category");
CREATE INDEX "GearItem_userId_updatedAt_idx" ON "GearItem"("userId", "updatedAt");
CREATE INDEX "GearItem_userId_deletedAt_idx" ON "GearItem"("userId", "deletedAt");
CREATE INDEX "GearItem_linkedExpenseId_idx" ON "GearItem"("linkedExpenseId");
