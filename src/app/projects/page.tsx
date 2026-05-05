import { ProjectBoard } from "@/components/project-board";
import { getSessionUserId } from "@/lib/session";
import { getProjectCards } from "@/lib/view-models";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function ProjectsPage() {
  const userId = await getSessionUserId();
  const projects = userId ? await getProjectCards(userId) : [];

  return (
    <PageContainer width="default">
      <ProjectBoard initialProjects={projects} signedIn={Boolean(userId)} />
    </PageContainer>
  );
}
