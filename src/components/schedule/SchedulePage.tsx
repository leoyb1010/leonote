"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarPlus, CheckCircle2, Clock3, Flag, FolderKanban, Link2, NotebookText, Plus, RotateCcw, Trash2 } from "lucide-react";
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

function overlapsRange(event: ScheduleEventDTO, start: Date, end: Date) {
  const eventStart = new Date(event.startAt);
  const eventEnd = new Date(event.endAt);
  if (!Number.isFinite(eventStart.getTime()) || !Number.isFinite(eventEnd.getTime())) return false;
  return eventStart < end && eventEnd >= start;
}

function icsDate(value: string, allDay?: boolean) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  if (allDay) return date.toISOString().slice(0, 10).replaceAll("-", "");
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function downloadIcs(event: ScheduleEventDTO) {
  const title = escapeIcs(event.title);
  const description = escapeIcs(event.description || "Leonote 日程");
  const start = icsDate(event.startAt, event.allDay);
  const end = icsDate(event.endAt, event.allDay);
  if (!start || !end) return;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Leonote//Schedule//ZH-CN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@leonote.local`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    event.allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    event.allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.slice(0, 40) || "leonote-schedule"}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
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
    <div className="quiet-inset min-w-0 rounded-[var(--radius-xl)] p-2.5 sm:p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--material-elevated)] text-[var(--text-secondary)] sm:h-7 sm:w-7">{icon}</span>
        {label}
      </div>
      <p className="mt-1.5 text-lg font-semibold text-[var(--text-primary)] numeric-display sm:mt-3 sm:text-2xl">{value}</p>
      <p className="mt-1 hidden text-xs text-[var(--text-muted)] sm:block">{hint}</p>
    </div>
  );
}

function EventCard({ event, onStatus, onDelete }: { event: ScheduleEventDTO; onStatus: (event: ScheduleEventDTO, status: ScheduleStatus) => void; onDelete: (event: ScheduleEventDTO) => void }) {
  return (
    <article className={`min-w-0 rounded-[var(--radius-xl)] border p-3 ${colorClass(event.color)}`}>
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
        <Button size="sm" variant="secondary" icon={<CalendarPlus size={13} />} onClick={() => downloadIcs(event)}>导出</Button>
        {event.status !== "done" ? <Button size="sm" variant="secondary" onClick={() => onStatus(event, "done")}>完成</Button> : null}
        {event.status === "done" ? <Button size="sm" variant="secondary" onClick={() => onStatus(event, "planned")}>恢复</Button> : null}
        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => onDelete(event)}>删除</Button>
      </div>
    </article>
  );
}

export function SchedulePage({ initialEvents, references, signedIn }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<(typeof viewOptions)[number]["value"]>("today");
  const formRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
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
  const [allDay, setAllDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const computedSummary = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const planned = events.filter((event) => event.status === "planned");

    return {
      today: planned.filter((event) => overlapsRange(event, todayStart, todayEnd)).length,
      week: planned.filter((event) => overlapsRange(event, weekStart, weekEnd)).length,
      overdue: planned.filter((event) => new Date(event.endAt).getTime() < now.getTime()).length,
      next: planned.filter((event) => new Date(event.startAt).getTime() >= now.getTime()).length,
    };
  }, [events]);

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
    if (saving) return;
    if (!title.trim()) {
      setMessage("先写日程标题。");
      titleInputRef.current?.focus();
      return;
    }
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
      setMessage("结束时间需要晚于开始时间。");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        allDay,
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
    setAllDay(false);
    setMessage("已加入时间线。");
    window.setTimeout(() => setMessage(""), 2200);
  }

  function focusCreateForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => titleInputRef.current?.focus(), 180);
    if (!title.trim()) setMessage("先写标题，再加入日程。");
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
        actions={<Button icon={<Plus size={15} />} onClick={focusCreateForm}>加入日程</Button>}
      />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <MetricCard label="今天" value={String(computedSummary.today)} hint="计划中的时间块" icon={<Clock3 size={15} />} />
        <MetricCard label="本周" value={String(computedSummary.week)} hint="本周安排总量" icon={<CalendarClock size={15} />} />
        <MetricCard label="待补" value={String(computedSummary.overdue)} hint="已过期未完成" icon={<Flag size={15} />} />
        <MetricCard label="接下来" value={String(computedSummary.next)} hint="未来几项安排" icon={<CheckCircle2 size={15} />} />
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start">
        <main className="min-w-0 space-y-4">
          <div className="grid rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-1 sm:inline-grid sm:grid-cols-2">
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
            <div className="quiet-inset rounded-[var(--radius-2xl)] px-4 py-12 text-center text-sm text-[var(--text-muted)] sm:py-14">
              当前视图还没有日程。先建一个时间块。
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([day, items]) => (
                <section key={day} className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 shadow-[var(--shadow-sm)]">
                  <div className="mb-3 flex items-center gap-2 px-1 text-sm font-medium text-[var(--text-secondary)]">
                    <CalendarClock size={15} />
                    {day}
                  </div>
                  <div className="grid min-w-0 gap-3 2xl:grid-cols-2">
                    {items.map((event) => <EventCard key={event.id} event={event} onStatus={updateStatus} onDelete={deleteEvent} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        <aside ref={formRef} className="min-w-0 space-y-4 xl:sticky xl:top-6">
          <section className="min-w-0 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Plus size={15} />
              新建时间块
            </div>
            <div className="grid min-w-0 gap-3">
              <input ref={titleInputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="日程标题" className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none" />
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="描述、目标或准备事项" className="min-h-20 w-full min-w-0 resize-none rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3 text-sm outline-none" />
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none" />
                <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none" />
              </div>
              <label className="inline-flex min-h-9 items-center gap-2 px-1 text-xs text-[var(--text-muted)]">
                <input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                全天安排
              </label>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                <option value="">关联项目</option>
                {references.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={noteId} onChange={(event) => setNoteId(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                <option value="">关联笔记</option>
                {references.notes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <select value={gearItemId} onChange={(event) => setGearItemId(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                <option value="">关联装备</option>
                {references.gearItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={color} onChange={(event) => setColor(event.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm outline-none">
                {colorOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <Button icon={<Plus size={15} />} onClick={createEvent} loading={saving} className="w-full">加入日程</Button>
            </div>
            {message ? <p className="mt-3 text-center text-xs text-[var(--text-muted)]">{message}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
