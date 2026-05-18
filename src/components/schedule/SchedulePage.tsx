"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, Flag, FolderKanban, Link2, NotebookText, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/base/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ScheduleEventDTO, ScheduleReferenceOptionsDTO, ScheduleStatus, ScheduleSummaryDTO } from "./types";

type Props = {
  initialEvents: ScheduleEventDTO[];
  initialSummary: ScheduleSummaryDTO;
  references: ScheduleReferenceOptionsDTO;
  signedIn: boolean;
};

const viewOptions = [
  { value: "today", label: "今天" },
  { value: "week", label: "本周" },
] as const;

const colorOptions = [
  { value: "slate", label: "默认" },
  { value: "violet", label: "思考" },
  { value: "blue", label: "工作" },
  { value: "emerald", label: "生活" },
  { value: "amber", label: "采购" },
  { value: "rose", label: "重要" },
] as const;

function dateInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function defaultStart() {
  const date = new Date();
  date.setMinutes(date.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (date.getMinutes() === 0) date.setHours(date.getHours() + 1);
  return date;
}

function formatTime(value: string, allDay?: boolean) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--:--";
  if (allDay) return "全天";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "未定";
  return date.toLocaleDateString("zh-CN", { weekday: "short", month: "2-digit", day: "2-digit" });
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function colorClass(color: string) {
  const map: Record<string, string> = {
    slate: "border-[var(--hairline)] bg-[var(--material-inset)]",
    violet: "border-[var(--primary)] bg-[var(--primary-soft)]",
    blue: "border-[var(--info)] bg-[var(--info-soft)]",
    emerald: "border-[var(--success)] bg-[var(--success-soft)]",
    amber: "border-[var(--warning)] bg-[var(--warning-soft)]",
    rose: "border-[var(--danger)] bg-[var(--danger-soft)]",
  };
  return map[color] ?? map.slate;
}

function statusIcon(status: string) {
  if (status === "done") return <CheckCircle2 size={14} className="text-[var(--success)]" />;
  if (status === "canceled") return <RotateCcw size={14} className="text-[var(--text-muted)]" />;
  return <Clock3 size={14} className="text-[var(--primary)]" />;
}

function MetricCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="quiet-inset rounded-[var(--radius-xl)] p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--material-elevated)] text-[var(--text-secondary)]">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)] numeric-display">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function EventCard({ event, onStatus, onDelete }: { event: ScheduleEventDTO; onStatus: (event: ScheduleEventDTO, status: ScheduleStatus) => void; onDelete: (event: ScheduleEventDTO) => void }) {
  return (
    <article className={`rounded-[var(--radius-xl)] border p-3 ${colorClass(event.color)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            {statusIcon(event.status)}
            <span>{formatDay(event.startAt)}</span>
            <span>{formatTime(event.startAt, event.allDay)} - {formatTime(event.endAt, event.allDay)}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">{event.title}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--hairline)] bg-[var(--material-elevated)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
          {event.statusLabel}
        </span>
      </div>
      {event.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{event.description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
        {event.project ? <Link href={`/projects/${event.project.id}`} className="inline-flex items-center gap-1 rounded-full bg-[var(--material-elevated)] px-2 py-1"><FolderKanban size={12} />{event.project.name}</Link> : null}
        {event.note ? <Link href={`/notes/${event.note.id}`} className="inline-flex items-center gap-1 rounded-full bg-[var(--material-elevated)] px-2 py-1"><NotebookText size={12} />{event.note.title}</Link> : null}
        {event.gearItem ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--material-elevated)] px-2 py-1"><Link2 size={12} />{event.gearItem.name}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {event.status !== "done" ? <Button size="sm" variant="secondary" onClick={() => onStatus(event, "done")}>完成</Button> : null}
        {event.status === "done" ? <Button size="sm" variant="secondary" onClick={() => onStatus(event, "planned")}>恢复</Button> : null}
        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => onDelete(event)}>删除</Button>
      </div>
    </article>
  );
}

export function SchedulePage({ initialEvents, initialSummary, references, signedIn }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<(typeof viewOptions)[number]["value"]>("today");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState(() => dateInput(defaultStart()));
  const [endAt, setEndAt] = useState(() => {
    const next = defaultStart();
    next.setHours(next.getHours() + 1);
    return dateInput(next);
  });
  const [projectId, setProjectId] = useState("");
  const [noteId, setNoteId] = useState("");
  const [gearItemId, setGearItemId] = useState("");
  const [color, setColor] = useState("slate");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    if (view === "today") return events.filter((event) => isToday(event.startAt) || isToday(event.endAt));
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return events.filter((event) => new Date(event.startAt) < weekEnd && new Date(event.endAt) >= weekStart);
  }, [events, view]);

  const grouped = useMemo(() => {
    const map = new Map<string, ScheduleEventDTO[]>();
    for (const event of filtered) {
      const key = formatDay(event.startAt);
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function createEvent() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        projectId: projectId || null,
        noteId: noteId || null,
        gearItemId: gearItemId || null,
        color,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "日程创建失败");
      return;
    }
    setEvents((prev) => [...prev, data.event].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    setTitle("");
    setDescription("");
    setMessage("已加入时间线。");
    window.setTimeout(() => setMessage(""), 2200);
  }

  async function updateStatus(event: ScheduleEventDTO, status: ScheduleStatus) {
    const res = await fetch(`/api/schedule/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) setEvents((prev) => prev.map((item) => (item.id === event.id ? data.event : item)));
  }

  async function deleteEvent(event: ScheduleEventDTO) {
    const res = await fetch(`/api/schedule/${event.id}`, { method: "DELETE" });
    if (res.ok) setEvents((prev) => prev.filter((item) => item.id !== event.id));
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <CalendarClock size={36} className="text-[var(--primary)]" />
        <h1 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">日程</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">登录后安排今天和本周的时间。</p>
        <Button className="mt-6" asChild><Link href="/login">进入 Leonote</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time Layer"
        icon={<CalendarClock size={19} />}
        title="日程"
        description="把笔记、项目、装备和今日安排放进同一条时间线。"
        actions={<Button icon={<Plus size={15} />} onClick={createEvent} loading={saving}>加入日程</Button>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="今天" value={String(initialSummary.today)} hint="计划中的时间块" icon={<Clock3 size={15} />} />
        <MetricCard label="本周" value={String(initialSummary.week)} hint="本周安排总量" icon={<CalendarClock size={15} />} />
        <MetricCard label="待补" value={String(initialSummary.overdue)} hint="已过期未完成" icon={<Flag size={15} />} />
        <MetricCard label="接下来" value={String(initialSummary.next.length)} hint="未来几项安排" icon={<CheckCircle2 size={15} />} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="min-w-0 space-y-4">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-1 sm:inline-flex">
            {viewOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setView(item.value)}
                className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-4 text-sm transition sm:flex-none ${
                  view === item.value ? "bg-[var(--text-primary)] text-[var(--bg-app)]" : "text-[var(--text-secondary)] hover:bg-[var(--interactive-hover)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {grouped.length === 0 ? (
            <div className="quiet-inset rounded-[var(--radius-2xl)] px-4 py-16 text-center text-sm text-[var(--text-muted)]">
              当前视图还没有日程。先从右侧创建一个时间块。
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([day, items]) => (
                <section key={day} className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 shadow-[var(--shadow-sm)]">
                  <div className="mb-3 flex items-center gap-2 px-1 text-sm font-medium text-[var(--text-secondary)]">
                    <CalendarClock size={15} />
                    {day}
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {items.map((event) => <EventCard key={event.id} event={event} onStatus={updateStatus} onDelete={deleteEvent} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Plus size={15} />
              新建时间块
            </div>
            <div className="grid gap-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="日程标题" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none" />
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="描述、目标或准备事项" className="min-h-20 resize-none rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3 text-sm outline-none" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none" />
                <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none" />
              </div>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                <option value="">关联项目</option>
                {references.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={noteId} onChange={(event) => setNoteId(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                <option value="">关联笔记</option>
                {references.notes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <select value={gearItemId} onChange={(event) => setGearItemId(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                <option value="">关联装备</option>
                {references.gearItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={color} onChange={(event) => setColor(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                {colorOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <Button icon={<Plus size={15} />} onClick={createEvent} loading={saving}>加入日程</Button>
            </div>
            {message ? <p className="mt-3 text-center text-xs text-[var(--text-muted)]">{message}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
