-- v1.8 Personal Schedule
CREATE TABLE "ScheduleEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "startAt" DATETIME NOT NULL,
  "endAt" DATETIME NOT NULL,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "source" TEXT NOT NULL DEFAULT 'manual',
  "noteId" TEXT,
  "projectId" TEXT,
  "gearItemId" TEXT,
  "color" TEXT NOT NULL DEFAULT 'slate',
  "deletedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ScheduleEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ScheduleEvent_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ScheduleEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ScheduleEvent_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ScheduleEvent_userId_startAt_idx" ON "ScheduleEvent"("userId", "startAt");
CREATE INDEX "ScheduleEvent_userId_status_idx" ON "ScheduleEvent"("userId", "status");
CREATE INDEX "ScheduleEvent_userId_deletedAt_idx" ON "ScheduleEvent"("userId", "deletedAt");
CREATE INDEX "ScheduleEvent_noteId_idx" ON "ScheduleEvent"("noteId");
CREATE INDEX "ScheduleEvent_projectId_idx" ON "ScheduleEvent"("projectId");
CREATE INDEX "ScheduleEvent_gearItemId_idx" ON "ScheduleEvent"("gearItemId");
