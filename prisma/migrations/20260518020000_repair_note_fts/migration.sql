-- Repair environments where the original FTS migration was marked applied
-- but the SQLite virtual table was missing from the database file.
CREATE VIRTUAL TABLE IF NOT EXISTS NoteFts USING fts5(
  noteId UNINDEXED,
  userId UNINDEXED,
  title,
  content,
  excerpt,
  tokenize = 'trigram'
);

CREATE TRIGGER IF NOT EXISTS note_fts_insert AFTER INSERT ON Note BEGIN
  INSERT INTO NoteFts(noteId, userId, title, content, excerpt)
  VALUES (new.id, new.userId, new.title, new.content, new.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS note_fts_update AFTER UPDATE OF title, content, excerpt ON Note BEGIN
  UPDATE NoteFts
  SET title = new.title, content = new.content, excerpt = new.excerpt
  WHERE noteId = new.id;
END;

CREATE TRIGGER IF NOT EXISTS note_fts_delete AFTER DELETE ON Note BEGIN
  DELETE FROM NoteFts WHERE noteId = old.id;
END;

INSERT INTO NoteFts(noteId, userId, title, content, excerpt)
SELECT id, userId, title, content, excerpt FROM Note
WHERE id NOT IN (SELECT noteId FROM NoteFts);
