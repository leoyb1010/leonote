import { PageContainer } from "@/components/layout/PageContainer";
import { SchedulePage } from "@/components/schedule/SchedulePage";
import { getSessionUserId } from "@/lib/session";
import {
  endOfWeek,
  getScheduleReferenceOptions,
  getScheduleSummary,
  listScheduleEvents,
  startOfDay,
  toScheduleDTO,
} from "@/lib/schedule";

export default async function ScheduleRoutePage() {
  const userId = await getSessionUserId();
  const now = new Date();
  const [events, summary, references] = userId
    ? await Promise.all([
        listScheduleEvents(userId, { from: startOfDay(now), to: endOfWeek(now), take: 120 }),
        getScheduleSummary(userId, now),
        getScheduleReferenceOptions(userId),
      ])
    : [[], { today: 0, week: 0, overdue: 0, next: [] }, { projects: [], notes: [], gearItems: [] }];

  return (
    <PageContainer width="dashboard">
      <SchedulePage
        signedIn={Boolean(userId)}
        initialEvents={events.map(toScheduleDTO)}
        initialSummary={summary}
        references={references}
      />
    </PageContainer>
  );
}
