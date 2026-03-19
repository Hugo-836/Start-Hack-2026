import { useEffect, useState } from "react";
import { useProgressMilestones } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import {
  DEMO_STUDENT,
  loadInteractiveMilestones,
  type MilestoneStatus,
  type PhaseState,
  phases,
  saveInteractiveMilestones,
} from "@/lib/interactiveMilestones";

const statusConfig: Record<MilestoneStatus, { icon: typeof Circle; color: string; label: string }> = {
  upcoming: { icon: Circle, color: "text-muted-foreground", label: "Upcoming" },
  in_progress: { icon: Clock, color: "text-blue-600", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-600", label: "Completed" },
  overdue: { icon: AlertTriangle, color: "text-red-600", label: "Overdue" },
};

export default function StudentMilestones() {
  const { data: milestones, isLoading } = useProgressMilestones(DEMO_STUDENT);
  const [phaseState, setPhaseState] = useState<PhaseState[]>(() => loadInteractiveMilestones(undefined));

  useEffect(() => {
    if (!isLoading) {
      setPhaseState(loadInteractiveMilestones(milestones));
    }
  }, [isLoading, milestones]);

  const toggleMilestone = (phaseKey: string, milestoneId: string, checked: boolean) => {
    setPhaseState((current) => {
      const nextState =
      current.map((phase) => {
        if (phase.key !== phaseKey) return phase;

        const updatedMilestones = phase.milestones.map((milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, status: checked ? "completed" : "upcoming" }
            : milestone,
        );

        return {
          ...phase,
          milestones: updatedMilestones,
        };
      });

      saveInteractiveMilestones(nextState);
      return nextState;
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="ds-title-lg tracking-tight">Progress</h1>
        <p className="ds-body text-muted-foreground mt-1">Track your milestones across the 5 thesis phases and check them off as you go.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {phases.map((phase, i) => (
          <div key={phase.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary whitespace-nowrap">
              <span className="ds-badge text-muted-foreground">{i + 1}</span>
              <span className="ds-label">{phase.label}</span>
            </div>
            {i < phases.length - 1 && <div className="h-px w-6 bg-border shrink-0" />}
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        phaseState.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="ds-title-cards">{group.label}</h2>
                {group.isUsingFallback && (
                  <Badge variant="outline" className="ds-badge">
                    Interactive plan
                  </Badge>
                )}
              </div>
              <p className="ds-small text-muted-foreground">{group.intro}</p>
            </div>

            {group.milestones.map((milestone) => {
              const config = statusConfig[milestone.status] || statusConfig.upcoming;
              const Icon = config.icon;
              const isCompleted = milestone.status === "completed";

              return (
                <Card key={milestone.id} className="border shadow-none">
                  <CardContent className="py-4 flex items-center gap-4">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => toggleMilestone(group.key, milestone.id, checked === true)}
                      aria-label={`Mark ${milestone.title} as completed`}
                    />

                    <Icon className={`h-5 w-5 shrink-0 ${config.color}`} />

                    <div className="flex-1 min-w-0">
                      <p className={`ds-label truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{milestone.title}</p>
                      {milestone.description && (
                        <p className={`ds-caption truncate ${isCompleted ? "text-muted-foreground/70 line-through" : "text-muted-foreground"}`}>
                          {milestone.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {milestone.due_date && <span className="ds-caption text-muted-foreground">{new Date(milestone.due_date).toLocaleDateString("en-US")}</span>}
                      <Badge variant="secondary" className="ds-badge">
                        {config.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
