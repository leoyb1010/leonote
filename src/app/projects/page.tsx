import { ProjectBoard } from "@/components/project-board";
import { getSessionUserId } from "@/lib/session";
import { getProjectCards } from "@/lib/view-models";

export default async function ProjectsPage() {
  const userId = await getSessionUserId();
  const projects = userId ? await getProjectCards(userId) : [];

  return <ProjectBoard initialProjects={projects} signedIn={Boolean(userId)} />;
}
