import { AppShell } from "@/components/app-shell";
import { ProjectBoard } from "@/components/project-board";

export default function ProjectsPage() {
  return (
    <AppShell title="项目" subtitle="把阶段性工作、会议纪要和资料录入到项目维度。" current="/projects">
      <ProjectBoard />
    </AppShell>
  );
}
