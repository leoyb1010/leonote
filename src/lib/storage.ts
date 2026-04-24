"use client";

import type { NoteItem } from "@/lib/data";

const STORAGE_KEY = "leonote.notes";

function nowLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createId() {
  return `note-${Date.now()}`;
}

export function loadNotes(): NoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NoteItem[]) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: NoteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function createNote(input: Pick<NoteItem, "title" | "content" | "excerpt" | "tags">) {
  const notes = loadNotes();
  const note: NoteItem = {
    id: createId(),
    title: input.title,
    content: input.content,
    excerpt: input.excerpt,
    tags: input.tags,
    updatedAt: nowLabel(),
  };
  saveNotes([note, ...notes]);
  return note;
}

export function updateNote(id: string, input: Partial<NoteItem>) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id
      ? {
          ...note,
          ...input,
          updatedAt: nowLabel(),
        }
      : note,
  );
  saveNotes(next);
}

export function toggleFavorite(id: string) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id ? { ...note, favorite: !note.favorite, updatedAt: nowLabel() } : note,
  );
  saveNotes(next);
}

export function togglePinned(id: string) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id ? { ...note, pinned: !note.pinned, updatedAt: nowLabel() } : note,
  );
  saveNotes(next);
}

export function archiveNote(id: string) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id ? { ...note, archived: true, updatedAt: nowLabel() } : note,
  );
  saveNotes(next);
}

export function unarchiveNote(id: string) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id ? { ...note, archived: false, updatedAt: nowLabel() } : note,
  );
  saveNotes(next);
}

export function deleteNote(id: string) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id ? { ...note, deleted: true, updatedAt: nowLabel() } : note,
  );
  saveNotes(next);
}

export function restoreNote(id: string) {
  const notes = loadNotes();
  const next = notes.map((note) =>
    note.id === id ? { ...note, deleted: false, archived: false, updatedAt: nowLabel() } : note,
  );
  saveNotes(next);
}

export function removeNoteForever(id: string) {
  const notes = loadNotes();
  saveNotes(notes.filter((note) => note.id !== id));
}
