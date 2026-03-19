import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Sparkles, Building2, Briefcase, FolderOpen } from "lucide-react";
import {
  DEMO_STUDENT,
  getInteractivePhaseState,
  getInteractiveProjectDocuments,
  getInteractiveSharedDocumentRequests,
  getInteractiveStudentWorkspace,
  INTERACTIVE_MILESTONES_EVENT,
  INTERACTIVE_WORKSPACE_EVENT,
  phases,
} from "@/lib/interactiveMilestones";

const stateLabels: Record<string, string> = {
  proposed: "Proposed",
  applied: "Applied",
  withdrawn: "Withdrawn",
  rejected: "Rejected",
  agreed: "Agreed",
  in_progress: "In Progress",
  canceled: "Canceled",
  completed: "Completed",
};

const stateColors: Record<string, string> = {
  proposed: "bg-muted text-muted-foreground",
  applied: "bg-blue-100 text-blue-800",
  agreed: "bg-green-100 text-green-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-muted text-muted-foreground",
  canceled: "bg-muted text-muted-foreground",
};

const milestoneStatusLabels: Record<string, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export default function StudentDashboard() {
  const [phaseState, setPhaseState] = useState<any[]>(() =>
    getInteractivePhaseState(),
  );
  const [workspace, setWorkspace] = useState(() =>
    getInteractiveStudentWorkspace(DEMO_STUDENT),
  );
  const [monthlyOwlChecks] = useState(() =>
    Array.from({ length: 4 }, () => Math.random() > 0.4),
  );

  const {
    student,
    studentProjects,
    supervisors,
    experts = [],
    universities = [],
  } = workspace;

  const activeProject =
    studentProjects.find(
      (p: any) => p.state === "in_progress" || p.state === "agreed",
    ) || studentProjects[0];

  const assignedSupervisor = supervisors?.find((s: any) =>
    activeProject?.supervisor_ids?.includes(s.id),
  );

  const assignedUniversity = universities?.find(
    (u: any) =>
      u.id === assignedSupervisor?.university_id ||
      u.id === student?.university_id,
  );

  const assignedExperts =
    activeProject?.expert_ids
      ?.map((id: string) => experts?.find((e: any) => e.id === id))
      .filter(Boolean) || [];

  useEffect(() => {
    setPhaseState(getInteractivePhaseState());
    setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
  }, []);

  useEffect(() => {
    const syncDashboardProgress = () => {
      setPhaseState(getInteractivePhaseState());
      setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
    };

    window.addEventListener(INTERACTIVE_MILESTONES_EVENT, syncDashboardProgress);
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncDashboardProgress);
    window.addEventListener("focus", syncDashboardProgress);

    return () => {
      window.removeEventListener(
        INTERACTIVE_MILESTONES_EVENT,
        syncDashboardProgress,
      );
      window.removeEventListener(
        INTERACTIVE_WORKSPACE_EVENT,
        syncDashboardProgress,
      );
      window.removeEventListener("focus", syncDashboardProgress);
    };
  }, []);

  const totalMilestones = phaseState.reduce(
    (total, phase) => total + phase.milestones.length,
    0,
  );

  const completedMilestones = phaseState.reduce(
    (total, phase) =>
      total +
      phase.milestones.filter(
        (milestone: any) => milestone.status === "completed",
      ).length,
    0,
  );

  const completionPercentage =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  const currentPhaseKey =
    phaseState.find((phase) =>
      phase.milestones.some((milestone: any) => milestone.status === "in_progress"),
    )?.key ||
    phaseState.find((phase) =>
      phase.milestones.some((milestone: any) => milestone.status !== "completed"),
    )?.key ||
    phases[0]?.key;

  const pendingMilestones = phaseState.flatMap((phase) =>
    phase.milestones
      .filter((milestone: any) => milestone.status !== "completed")
      .map((milestone: any) => ({
        ...milestone,
        phaseKey: phase.key,
        phaseLabel: phase.label,
      })),
  );

  const nextMilestone =
    pendingMilestones.find((milestone: any) => milestone.status === "in_progress") ||
    pendingMilestones.find((milestone: any) => milestone.status === "overdue") ||
    pendingMilestones.find((milestone: any) => milestone.status === "upcoming") ||
    null;

  const aiSuggestionText =
    totalMilestones === 0
      ? "You don't have any milestones yet. Create a progress plan to structure your thesis journey."
      : nextMilestone
        ? `Your next focus should be "${nextMilestone.title}". Keep your milestone page updated so your dashboard stays in sync.`
        : "All current milestones are completed. You can add new ones to keep structuring the next phase of your thesis.";

  const allSharedDocuments = getInteractiveProjectDocuments();
  const sharedDocumentRequests = getInteractiveSharedDocumentRequests();
  const mySharedDocuments = allSharedDocuments.filter((document) =>
    studentProjects.some((project: any) => project.id === document.project_id),
  );
  const peerSharedDocuments = allSharedDocuments.filter(
    (document) => !studentProjects.some((project: any) => project.id === document.project_id),
  );
  const openPeerRequests = sharedDocumentRequests.filter((request) => request.student_id !== student?.id);
  const currentMonthLabel = new Date().toLocaleString("en-US", { month: "long" });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="ds-title-lg tracking-tight">
            Hello, {student?.first_name || "Student"}
          </h1>
          <p className="ds-body text-muted-foreground mt-1">
            Here's an overview of your thesis journey.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 rounded-2xl border bg-secondary px-4 py-2 shrink-0">
          <div>
            <p className="ds-caption text-muted-foreground">Current month</p>
            <p className="ds-label">{currentMonthLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {monthlyOwlChecks.map((didSubmit, index) => (
              <div
                key={`owl-week-${index}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                  didSubmit
                    ? "border-emerald-200 bg-emerald-100"
                    : "border-border bg-background text-muted-foreground"
                }`}
                aria-label={`Week ${index + 1}: ${didSubmit ? "submitted" : "missed"}`}
              >
                <span className={didSubmit ? "text-xl leading-none" : "text-base leading-none"} aria-hidden="true">
                  {didSubmit ? "🦉" : "✕"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link
        to={currentPhaseKey ? `/student/milestones?phase=${currentPhaseKey}` : "/student/milestones"}
        className="block"
      >
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer">
          <CardContent className="pt-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="ds-title-sm">Overall Progress</h2>
              <p className="ds-title-cards">{completionPercentage}%</p>
            </div>

            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {phases.map((phase) => {
                const phaseData = phaseState.find((item) => item.key === phase.key);

                const isCompleted =
                  phaseData?.milestones?.length > 0 &&
                  phaseData.milestones.every(
                    (milestone: any) => milestone.status === "completed",
                  );

                const hasStarted = phaseData?.milestones?.some(
                  (milestone: any) =>
                    milestone.status === "in_progress" ||
                    milestone.status === "completed",
                );

                const isCurrent = currentPhaseKey === phase.key;

                return (
                  <div key={phase.key} className="space-y-3">
                    <div
                      className={`h-2 w-full rounded-full transition-colors ${
                        isCompleted || isCurrent || hasStarted
                          ? "bg-foreground"
                          : "bg-secondary"
                      }`}
                    />
                    <p
                      className={`ds-body ${
                        isCompleted || isCurrent || hasStarted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {phase.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link to="/student/project" className="block">
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer">
          <CardContent className="pt-6">
            {activeProject ? (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="ds-label text-muted-foreground mb-2">Thesis Theme</p>
                      <p className="ds-title-sm leading-tight">{activeProject.title}</p>

                      {(activeProject.description || activeProject.motivation) && (
                        <p className="ds-body text-muted-foreground mt-3">
                          {activeProject.description || activeProject.motivation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Badge className={`${stateColors[activeProject.state]} border-0 shrink-0`}>
                  {stateLabels[activeProject.state]}
                </Badge>
              </div>
            ) : (
              <div>
                <p className="ds-label text-muted-foreground mb-2">Thesis Theme</p>
                <p className="ds-title-sm">You do not have a thesis for now</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      <div
        className={`grid grid-cols-1 ${
          assignedExperts.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2"
        } gap-4`}
      >
        <Card className="border shadow-none h-full">
          <CardContent className="pt-6">
            <h3 className="ds-title-sm">Next Steps</h3>

            {nextMilestone ? (
              <div className="mt-6 space-y-3">
                <p className="ds-title-cards">{nextMilestone.title}</p>

                {nextMilestone.description && (
                  <p className="ds-small text-muted-foreground">
                    {nextMilestone.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="border-0">
                    {nextMilestone.phaseLabel}
                  </Badge>
                  <Badge className="bg-muted text-muted-foreground border-0">
                    {milestoneStatusLabels[nextMilestone.status] || nextMilestone.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="ds-body text-muted-foreground mt-6">
                No upcoming milestones.
              </p>
            )}

            <Link
              to="/student/milestones"
              className="inline-flex items-center gap-1 mt-8 ds-label text-foreground hover:underline"
            >
              View all milestones <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border shadow-none h-full">
          <CardContent className="pt-6">
            <h3 className="ds-title-sm">Your Supervisor</h3>

            {assignedSupervisor ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center ds-label shrink-0">
                    {assignedSupervisor.first_name?.[0]}
                    {assignedSupervisor.last_name?.[0]}
                  </div>

                  <div>
                    <p className="ds-label text-muted-foreground mb-1">Assigned Supervisor</p>
                    <p className="ds-title-cards">
                      {assignedSupervisor.title ? `${assignedSupervisor.title} ` : ""}
                      {assignedSupervisor.first_name} {assignedSupervisor.last_name}
                    </p>
                    <p className="ds-small text-muted-foreground mt-1">
                      {assignedSupervisor.email || "No email available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="ds-label text-muted-foreground mb-1">University</p>
                    <p className="ds-small">
                      {assignedUniversity?.name || "No university available"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <p className="ds-label text-muted-foreground mb-1">Assigned Supervisor</p>
                  <p className="ds-title-cards">You do not have a supervisor for now</p>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="ds-label text-muted-foreground mb-1">University</p>
                    <p className="ds-small text-muted-foreground">
                      {assignedUniversity?.name || "No university available"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {assignedExperts.length > 0 && (
          <Card className="border shadow-none h-full">
            <CardContent className="pt-6">
              <h3 className="ds-title-sm">Experts</h3>

              <div className="mt-6 space-y-4">
                {assignedExperts.map((expert: any) => (
                  <div key={expert.id} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center ds-label shrink-0">
                      {expert.first_name?.[0]}
                      {expert.last_name?.[0]}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="ds-title-cards">
                          {expert.title ? `${expert.title} ` : ""}
                          {expert.first_name} {expert.last_name}
                        </p>
                        <Badge className="bg-emerald-100 text-emerald-800 border-0">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            Expert
                          </span>
                        </Badge>
                      </div>

                      <p className="ds-small text-muted-foreground mt-1">
                        {expert.email || "No email available"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border border-ai shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-ai p-2 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>

            <div>
              <p className="ds-label text-ai">AI Suggestion</p>
              <p className="ds-body text-muted-foreground mt-2">{aiSuggestionText}</p>

              <Link
                to="/student/milestones"
                className="inline-flex items-center gap-1 mt-5 ds-label text-foreground hover:underline"
              >
                {totalMilestones === 0 ? "Create milestones" : "Open milestones"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/student/shared-documents">
          <Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer group h-full">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="ds-title-cards group-hover:text-ai-solid transition-colors duration-200">
                    Shared Documents
                  </p>
                  <p className="ds-small text-muted-foreground mt-1">
                    Search shared files and respond to student document requests.
                  </p>
                </div>
                <div className="rounded-full bg-ai p-2 shrink-0">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="border-0">
                  {mySharedDocuments.length} my docs
                </Badge>
                <Badge variant="secondary" className="border-0">
                  {peerSharedDocuments.length} peer docs
                </Badge>
                <Badge className="bg-ai text-white border-0">
                  {openPeerRequests.length} requests
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/student/feedback">
          <Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer group">
            <CardContent className="pt-6">
              <p className="ds-title-cards group-hover:text-ai-solid transition-colors duration-200">
                Get Feedback
              </p>
              <p className="ds-small text-muted-foreground mt-1">
                Send your work to a supervisor for review.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/student/peers">
          <Card className="border shadow-none hover:shadow-md transition-shadow duration-300 cursor-pointer group">
            <CardContent className="pt-6">
              <p className="ds-title-cards group-hover:text-ai-solid transition-colors duration-200">
                Find Peers
              </p>
              <p className="ds-small text-muted-foreground mt-1">
                Connect with students working on similar topics.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
