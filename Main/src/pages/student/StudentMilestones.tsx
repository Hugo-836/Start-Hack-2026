import { useProgressMilestones } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";

const DEMO_STUDENT = "student-04";
const phaseLabels: Record<string, string> = { orientation: "Orientation", topic_search: "Topic Search", planning: "Planning", execution: "Execution", writing: "Writing" };
const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  upcoming: { icon: Circle, color: "text-muted-foreground", label: "Upcoming" },
  in_progress: { icon: Clock, color: "text-blue-600", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-600", label: "Completed" },
  overdue: { icon: AlertTriangle, color: "text-red-600", label: "Overdue" },
};

export default function StudentMilestones() {
  const { data: milestones, isLoading } = useProgressMilestones(DEMO_STUDENT);
  const phases = ["orientation", "topic_search", "planning", "execution", "writing"];
  const milestonesByPhase = phases.map((phase) => ({ phase, milestones: milestones?.filter((m: any) => m.phase === phase) || [] }));

  return (
    <div className="space-y-8 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">Progress</h1><p className="ds-body text-muted-foreground mt-1">Track your milestones across the 5 thesis phases.</p></div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {phases.map((phase, i) => (
          <div key={phase} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary whitespace-nowrap"><span className="ds-badge text-muted-foreground">{i + 1}</span><span className="ds-label">{phaseLabels[phase]}</span></div>
            {i < phases.length - 1 && <div className="h-px w-6 bg-border shrink-0" />}
          </div>
        ))}
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : !milestones?.length ? (
        <Card className="border shadow-none"><CardContent className="pt-6 text-center"><p className="ds-body text-muted-foreground">No milestones defined yet.</p><p className="ds-small text-muted-foreground mt-2">AI can help you create a personalized plan based on your topic and schedule.</p></CardContent></Card>
      ) : milestonesByPhase.filter((g) => g.milestones.length > 0).map((group) => (
        <div key={group.phase} className="space-y-3">
          <h2 className="ds-title-cards">{phaseLabels[group.phase]}</h2>
          {group.milestones.map((m: any) => { const config = statusConfig[m.status]; const Icon = config.icon; return (
            <Card key={m.id} className="border shadow-none"><CardContent className="py-4 flex items-center gap-4"><Icon className={`h-5 w-5 shrink-0 ${config.color}`} /><div className="flex-1 min-w-0"><p className="ds-label truncate">{m.title}</p>{m.description && <p className="ds-caption text-muted-foreground truncate">{m.description}</p>}</div><div className="flex items-center gap-2 shrink-0">{m.due_date && <span className="ds-caption text-muted-foreground">{new Date(m.due_date).toLocaleDateString("en-US")}</span>}<Badge variant="secondary" className="ds-badge">{config.label}</Badge></div></CardContent></Card>
          ); })}
        </div>
      ))}
    </div>
  );
}
