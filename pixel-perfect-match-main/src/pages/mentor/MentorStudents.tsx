import { useThesisProjects, useStudents } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_SUPERVISOR = "supervisor-01";
const stateLabels: Record<string, string> = { proposed: "Proposed", applied: "Applied", agreed: "Agreed", in_progress: "In Progress", completed: "Completed", withdrawn: "Withdrawn", rejected: "Rejected", canceled: "Canceled" };
const stateColors: Record<string, string> = { proposed: "bg-muted text-muted-foreground", applied: "bg-blue-100 text-blue-800", agreed: "bg-green-100 text-green-800", in_progress: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", withdrawn: "bg-muted text-muted-foreground", canceled: "bg-muted text-muted-foreground" };

export default function MentorStudents() {
  const { data: projects } = useThesisProjects();
  const { data: students } = useStudents();
  const myProjects = projects?.filter((p: any) => p.supervisor_ids?.includes(DEMO_SUPERVISOR)) || [];
  const getStudent = (id: string) => students?.find((s: any) => s.id === id);
  const studentMap = new Map<string, any[]>();
  myProjects.forEach((p: any) => { const e = studentMap.get(p.student_id) || []; e.push(p); studentMap.set(p.student_id, e); });

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">My Students</h1><p className="ds-body text-muted-foreground mt-1">All students you are supervising.</p></div>
      {studentMap.size === 0 ? <Card className="border shadow-none"><CardContent className="pt-6 text-center text-muted-foreground">No students found.</CardContent></Card> : Array.from(studentMap.entries()).map(([studentId, studentProjects]) => {
        const student = getStudent(studentId);
        return (
          <Card key={studentId} className="border shadow-none"><CardContent className="py-5 space-y-4">
            <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-title-cards shrink-0">{student ? `${student.first_name[0]}${student.last_name[0]}` : "?"}</div><div><p className="ds-title-cards">{student ? `${student.first_name} ${student.last_name}` : studentId}</p><p className="ds-small text-muted-foreground">{student?.email} · {student?.degree?.toUpperCase()}</p></div></div>
            {student?.about && <p className="ds-small text-muted-foreground">{student.about}</p>}
            {student?.skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{student.skills.slice(0, 6).map((s: string) => <Badge key={s} variant="secondary" className="ds-badge">{s}</Badge>)}</div>}
            <div className="border-t pt-3"><p className="ds-label mb-2">Projects</p>{studentProjects.map((p: any) => <div key={p.id} className="flex items-center justify-between py-2"><p className="ds-small truncate flex-1 mr-3">{p.title}</p><Badge className={`${stateColors[p.state]} border-0`}>{stateLabels[p.state]}</Badge></div>)}</div>
          </CardContent></Card>
        );
      })}
    </div>
  );
}
