import { useThesisProjects, useSupervisors, useExperts } from "@/hooks/useStudyondData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_STUDENT = "student-04";
const stateLabels: Record<string, string> = { proposed: "Proposed", applied: "Applied", withdrawn: "Withdrawn", rejected: "Rejected", agreed: "Agreed", in_progress: "In Progress", canceled: "Canceled", completed: "Completed" };
const stateColors: Record<string, string> = { proposed: "bg-muted text-muted-foreground", applied: "bg-blue-100 text-blue-800", agreed: "bg-green-100 text-green-800", in_progress: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", withdrawn: "bg-muted text-muted-foreground", canceled: "bg-muted text-muted-foreground" };

export default function StudentProject() {
  const { data: projects } = useThesisProjects();
  const { data: supervisors } = useSupervisors();
  const { data: experts } = useExperts();
  const studentProjects = projects?.filter((p: any) => p.student_id === DEMO_STUDENT) || [];
  const getSupervisor = (id: string) => supervisors?.find((s: any) => s.id === id);
  const getExpert = (id: string) => experts?.find((e: any) => e.id === id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">My Thesis Project</h1><p className="ds-body text-muted-foreground mt-1">Manage your projects and track your progress.</p></div>
      {studentProjects.length === 0 ? (
        <Card className="border shadow-none"><CardContent className="pt-6 text-center text-muted-foreground">No projects found. Explore available topics to get started.</CardContent></Card>
      ) : studentProjects.map((project: any) => (
        <Card key={project.id} className="border shadow-none">
          <CardHeader><div className="flex items-start justify-between"><CardTitle className="ds-title-sm">{project.title}</CardTitle><Badge className={`${stateColors[project.state]} border-0`}>{stateLabels[project.state]}</Badge></div></CardHeader>
          <CardContent className="space-y-4">
            {(project.description || project.motivation) && <p className="ds-body text-muted-foreground">{project.description || project.motivation}</p>}
            {project.supervisor_ids?.length > 0 && <div><p className="ds-label mb-2">Supervisors</p><div className="space-y-2">{project.supervisor_ids.map((id: string) => { const sup = getSupervisor(id); return sup ? <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary"><div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-badge">{sup.first_name[0]}{sup.last_name[0]}</div><div><p className="ds-label">{sup.title} {sup.first_name} {sup.last_name}</p><p className="ds-caption text-muted-foreground">{sup.email}</p></div></div> : null; })}</div></div>}
            {project.expert_ids?.length > 0 && <div><p className="ds-label mb-2">Experts</p><div className="space-y-2">{project.expert_ids.map((id: string) => { const exp = getExpert(id); return exp ? <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary"><div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center ds-badge">{exp.first_name[0]}{exp.last_name[0]}</div><div><p className="ds-label">{exp.first_name} {exp.last_name}</p><p className="ds-caption text-muted-foreground">{exp.title}</p></div></div> : null; })}</div></div>}
            <div className="flex gap-4 ds-caption text-muted-foreground pt-2 border-t"><span>Created {new Date(project.created_at).toLocaleDateString("en-US")}</span><span>Updated {new Date(project.updated_at).toLocaleDateString("en-US")}</span></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
