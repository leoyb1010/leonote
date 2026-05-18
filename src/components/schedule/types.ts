export type ScheduleStatus = "planned" | "done" | "canceled";
export type ScheduleColor = "slate" | "violet" | "blue" | "emerald" | "amber" | "rose";

export type ScheduleEventDTO = {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: ScheduleStatus | string;
  statusLabel: string;
  source: string;
  sourceLabel: string;
  color: ScheduleColor | string;
  noteId: string | null;
  projectId: string | null;
  gearItemId: string | null;
  createdAt: string;
  updatedAt: string;
  note: { id: string; title: string } | null;
  project: { id: string; name: string; status: string } | null;
  gearItem: { id: string; name: string; status: string; category: string } | null;
};

export type ScheduleSummaryDTO = {
  today: number;
  week: number;
  overdue: number;
  next: ScheduleEventDTO[];
};

export type ScheduleReferenceOptionsDTO = {
  projects: Array<{ id: string; name: string; status: string }>;
  notes: Array<{ id: string; title: string }>;
  gearItems: Array<{ id: string; name: string; status: string; category: string }>;
};
