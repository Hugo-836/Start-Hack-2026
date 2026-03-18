import { useThesisProjects, useStudents } from "@/hooks/useStudyondData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DEMO_SUPERVISOR = "supervisor-01";
const stateLabels: Record<string, string> = { proposed: "Proposed", applied: "Applied", agreed: "Agreed", in_progress: "In Progress", completed: "Completed", withdrawn: "Withdrawn", rejected: "Rejected", canceled: "Canceled" };
const stateColors: Record<string, string> = { proposed: "bg-muted text-muted-foreground", applied: "bg-blue-100 text-blue-800", agreed: "bg-green-100 text-green-800", in_progress: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", withdrawn: "bg-muted text-muted-foreground", canceled: "bg-muted text-muted-foreground" };

export default function MentorDashboard() {
  const { data: projects } = useThesisProjects();
  const { data: students } = useStudents();
  const myProjects = projects?.filter((p: any) => p.supervisor_ids?.includes(DEMO_SUPERVISOR)) || [];
  const activeProjects = myProjects.filter((p: any) => p.state === "in_progress" || p.state === "agreed");
  const getStudent = (id: string) => students?.find((s: any) => s.id === id);

  return (
    <div className="space-y-8 max-w-5xl">
      <div><h1 className="ds-title-lg tracking-tight">Mentor Dashboard</h1><p className="ds-body text-muted-foreground mt-1">Overview of your students and their projects.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><GraduationCap className="h-4 w-4 text-foreground" /></div><div><p className="ds-caption text-muted-foreground">Students</p><p className="ds-title-cards">{myProjects.length}</p></div></div></CardContent></Card>
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><BookOpen className="h-4 w-4 text-foreground" /></div><div><p className="ds-caption text-muted-foreground">Active Projects</p><p className="ds-title-cards">{activeProjects.length}</p></div></div></CardContent></Card>
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><MessageSquare className="h-4 w-4 text-foreground" /></div><div><p className="ds-caption text-muted-foreground">Pending Feedback</p><p className="ds-title-cards">0</p></div></div></CardContent></Card>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4"><h2 className="ds-title-sm">Active Projects</h2><Link to="/mentor/students" className="ds-label text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link></div>
        {activeProjects.length === 0 ? <Card className="border shadow-none"><CardContent className="pt-6 text-center text-muted-foreground">No active projects at the moment.</CardContent></Card> : (
          <div className="space-y-3">{activeProjects.map((project: any) => { const student = getStudent(project.student_id); return (
            <Card key={project.id} className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="py-4 flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label shrink-0">{student ? `${student.first_name[0]}${student.last_name[0]}` : "?"}</div><div className="flex-1 min-w-0"><p className="ds-label truncate">{project.title}</p><p className="ds-caption text-muted-foreground">{student ? `${student.first_name} ${student.last_name}` : project.student_id}</p></div><Badge className={`${stateColors[project.state]} border-0 shrink-0`}>{stateLabels[project.state]}</Badge></CardContent></Card>
          ); })}</div>
        )}
      </div>
    </div>
  );
}
