-- Add missing source and lastViewedAt columns to Note
ALTER TABLE "Note" ADD COLUMN "source" TEXT;
ALTER TABLE "Note" ADD COLUMN "lastViewedAt" DATETIME;

-- Create NoteRevision table
CREATE TABLE "NoteRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT 'autosave',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteRevision_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX "NoteRevision_noteId_createdAt_idx" ON "NoteRevision"("noteId", "createdAt");
CREATE INDEX "NoteRevision_userId_createdAt_idx" ON "NoteRevision"("userId", "createdAt");
