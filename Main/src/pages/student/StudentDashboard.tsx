import { useThesisProjects, useStudents, useProgressMilestones } from "@/hooks/useStudyondData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Milestone, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DEMO_STUDENT, getInteractiveMilestoneCount, INTERACTIVE_MILESTONES_EVENT } from "@/lib/interactiveMilestones";

const stateLabels: Record<string, string> = {
  proposed: "Proposed", applied: "Applied", withdrawn: "Withdrawn", rejected: "Rejected",
  agreed: "Agreed", in_progress: "In Progress", canceled: "Canceled", completed: "Completed",
};
const stateColors: Record<string, string> = {
  proposed: "bg-muted text-muted-foreground", applied: "bg-blue-100 text-blue-800",
  agreed: "bg-green-100 text-green-800", in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-muted text-muted-foreground", canceled: "bg-muted text-muted-foreground",
};

export default function StudentDashboard() {
  const { data: projects } = useThesisProjects();
  const { data: students } = useStudents();
  const { data: milestones } = useProgressMilestones(DEMO_STUDENT);
  const [milestoneCount, setMilestoneCount] = useState(0);

  const student = students?.find((s: any) => s.id === DEMO_STUDENT);
  const studentProjects = projects?.filter((p: any) => p.student_id === DEMO_STUDENT) || [];
  const activeProject = studentProjects.find((p: any) => p.state === "in_progress" || p.state === "agreed") || studentProjects[0];

  useEffect(() => {
    setMilestoneCount(getInteractiveMilestoneCount(milestones));
  }, [milestones]);

  useEffect(() => {
    const syncMilestones = () => setMilestoneCount(getInteractiveMilestoneCount(milestones));

    window.addEventListener(INTERACTIVE_MILESTONES_EVENT, syncMilestones);
    window.addEventListener("focus", syncMilestones);

    return () => {
      window.removeEventListener(INTERACTIVE_MILESTONES_EVENT, syncMilestones);
      window.removeEventListener("focus", syncMilestones);
    };
  }, [milestones]);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="ds-title-lg tracking-tight">Hello, {student?.first_name || "Student"} 👋</h1>
        <p className="ds-body text-muted-foreground mt-1">Here's an overview of your thesis journey.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><BookOpen className="h-4 w-4 text-foreground" /></div><div><p className="ds-caption text-muted-foreground">Projects</p><p className="ds-title-cards">{studentProjects.length}</p></div></div></CardContent></Card>
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><Milestone className="h-4 w-4 text-foreground" /></div><div><p className="ds-caption text-muted-foreground">Completed Milestones</p><p className="ds-title-cards">{milestoneCount}</p></div></div></CardContent></Card>
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><Clock className="h-4 w-4 text-foreground" /></div><div><p className="ds-caption text-muted-foreground">Phase</p><p className="ds-title-cards capitalize">{activeProject?.state ? stateLabels[activeProject.state] : "—"}</p></div></div></CardContent></Card>
      </div>
      {activeProject && (
        <Card className="border shadow-none">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1"><CardTitle className="ds-title-sm">{activeProject.title}</CardTitle><p className="ds-small text-muted-foreground">{activeProject.description || activeProject.motivation || "No description"}</p></div>
            <Badge className={`${stateColors[activeProject.state]} border-0`}>{stateLabels[activeProject.state]}</Badge>
          </CardHeader>
          <CardContent><div className="flex flex-wrap gap-4 text-sm">{activeProject.supervisor_ids?.length > 0 && <span className="text-muted-foreground">{activeProject.supervisor_ids.length} supervisor(s)</span>}{activeProject.expert_ids?.length > 0 && <span className="text-muted-foreground">{activeProject.expert_ids.length} expert(s)</span>}</div></CardContent>
        </Card>
      )}
      <Card className="border border-ai shadow-none"><CardContent className="pt-6"><div className="flex items-start gap-3"><div className="rounded-full bg-ai p-2 shrink-0"><Sparkles className="h-4 w-4 text-white" /></div><div><p className="ds-label text-ai">AI Suggestion</p><p className="ds-small text-muted-foreground mt-1">You don't have any milestones yet. Create a progress plan to structure your thesis journey and receive automatic reminders.</p><Link to="/student/milestones" className="inline-flex items-center gap-1 mt-3 ds-label text-foreground hover:underline">Create milestones <ArrowRight className="h-3 w-3" /></Link></div></div></CardContent></Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/student/feedback"><Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer group"><CardContent className="pt-6"><p className="ds-title-cards group-hover:text-ai-solid transition-colors duration-200">Submit Feedback</p><p className="ds-small text-muted-foreground mt-1">Send your work to a supervisor for review.</p></CardContent></Card></Link>
        <Link to="/student/peers"><Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer group"><CardContent className="pt-6"><p className="ds-title-cards group-hover:text-ai-solid transition-colors duration-200">Find Peers</p><p className="ds-small text-muted-foreground mt-1">Connect with students working on similar topics.</p></CardContent></Card></Link>
      </div>
    </div>
  );
}
