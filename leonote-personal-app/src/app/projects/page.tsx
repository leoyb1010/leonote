import { AppShell } from "@/components/app-shell";
import { ProjectBoard } from "@/components/project-board";
import { getSessionUserId } from "@/lib/session";
import { getProjectCards } from "@/lib/view-models";

export default async function ProjectsPage() {
  const userId = await getSessionUserId();
  const projects = userId ? await getProjectCards(userId) : [];

  return (
    <AppShell title="项目" subtitle="把阶段性工作、会议纪要和资料录入到项目维度。" current="/projects">
      <ProjectBoard initialProjects={projects} signedIn={Boolean(userId)} />
    </AppShell>
  );
}
