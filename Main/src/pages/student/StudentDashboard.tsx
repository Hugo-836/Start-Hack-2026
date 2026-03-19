import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, BookOpen, Sparkles, Building2, Briefcase, FolderOpen, Send } from "lucide-react";
=======
import { ArrowRight, BookOpen, Sparkles, Building2, Briefcase, FolderOpen } from "lucide-react";
>>>>>>> b52e979714550e4eb9d798cd5546348b49fb87bf
import {
  deleteInteractivePeerConnection,
  getInteractivePhaseState,
  getInteractivePeerConnections,
  getInteractiveProjectDocuments,
  getInteractiveSharedDocumentRequests,
  getInteractiveStudentWorkspace,
  INTERACTIVE_MILESTONES_EVENT,
  INTERACTIVE_WORKSPACE_EVENT,
  phases,
  replaceInteractivePeerConnections,
} from "@/lib/interactiveMilestones";
import { useDemoAuth } from "@/lib/demoAuth";
import { toast } from "@/components/ui/sonner";

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

<<<<<<< HEAD
type DashboardChatMessage = {
  role: "user" | "assistant";
  content: string;
};
=======
const PEER_CONNECTIONS_SYNC_URL = "/api/demo-peer-connections";

function getPeerPairKey(studentAId: string, studentBId: string) {
  return [studentAId, studentBId].sort().join(":");
}
>>>>>>> b52e979714550e4eb9d798cd5546348b49fb87bf

export default function StudentDashboard() {
  const { session } = useDemoAuth();
  const currentStudentId = session?.studentId;
  const [phaseState, setPhaseState] = useState<any[]>(() =>
    getInteractivePhaseState(currentStudentId),
  );
  const [workspace, setWorkspace] = useState(() =>
    getInteractiveStudentWorkspace(currentStudentId),
  );
  const [monthlyOwlChecks] = useState(() =>
    Array.from({ length: 4 }, () => Math.random() > 0.4),
  );
  const [dashboardChatInput, setDashboardChatInput] = useState("");
  const [dashboardChatMessages, setDashboardChatMessages] = useState<DashboardChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me any general question about your thesis progress, project direction, feedback, or shared documents.",
    },
  ]);
  const [isDashboardChatLoading, setIsDashboardChatLoading] = useState(false);

  const {
    student,
    students = [],
    studentProjects,
    supervisors,
    experts = [],
    universities = [],
    peerConnections = [],
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
    setPhaseState(getInteractivePhaseState(currentStudentId));
    setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
  }, [currentStudentId]);

  useEffect(() => {
    const syncDashboardProgress = () => {
      setPhaseState(getInteractivePhaseState(currentStudentId));
      setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    };

    window.addEventListener(INTERACTIVE_MILESTONES_EVENT, syncDashboardProgress);
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncDashboardProgress);
    window.addEventListener("storage", syncDashboardProgress);
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
      window.removeEventListener("storage", syncDashboardProgress);
      window.removeEventListener("focus", syncDashboardProgress);
    };
  }, [currentStudentId]);

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
  const acceptedPeers = peerConnections
    .filter((connection: any) => connection.status === "accepted")
    .map((connection: any) => {
      const peerId =
        connection.student_a_id === currentStudentId
          ? connection.student_b_id
          : connection.student_a_id;
      const peer = students.find((item: any) => item.id === peerId);
      return peer ? { connection, peer } : null;
    })
    .filter(Boolean) as Array<{ connection: any; peer: any }>;

  const persistPeerConnectionsToServer = async (
    connections: ReturnType<typeof getInteractivePeerConnections>,
  ) => {
    try {
      await fetch(PEER_CONNECTIONS_SYNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connections }),
      });
    } catch {
      return;
    }
  };

  const handleUnpeer = (connection: any) => {
    deleteInteractivePeerConnection(connection.student_a_id, connection.student_b_id);
    const nextConnections = getInteractivePeerConnections();
    replaceInteractivePeerConnections(
      nextConnections.filter(
        (item) =>
          getPeerPairKey(item.student_a_id, item.student_b_id) !==
          getPeerPairKey(connection.student_a_id, connection.student_b_id),
      ),
    );
    void persistPeerConnectionsToServer(
      getInteractivePeerConnections().filter(
        (item) =>
          getPeerPairKey(item.student_a_id, item.student_b_id) !==
          getPeerPairKey(connection.student_a_id, connection.student_b_id),
      ),
    );
    setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    toast("Peer removed", {
      description: "This student is no longer in your peer network.",
    });
  };

  const handleDashboardChatSend = async () => {
    const prompt = dashboardChatInput.trim();
    if (!prompt) return;

    const nextMessages = [
      ...dashboardChatMessages,
      { role: "user", content: prompt } as DashboardChatMessage,
    ];

    setDashboardChatMessages(nextMessages);
    setDashboardChatInput("");

    try {
      setIsDashboardChatLoading(true);
      const response = await fetch("/api/dashboard-ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: {
            student: student
              ? {
                  first_name: student.first_name,
                  last_name: student.last_name,
                  degree: student.degree,
                  about: student.about,
                }
              : null,
            activeProject: activeProject
              ? {
                  title: activeProject.title,
                  description: activeProject.description,
                  state: activeProject.state,
                }
              : null,
            nextMilestone: nextMilestone
              ? {
                  title: nextMilestone.title,
                  description: nextMilestone.description,
                  phaseLabel: nextMilestone.phaseLabel,
                  status: nextMilestone.status,
                }
              : null,
            sharedDocuments: {
              mine: mySharedDocuments.length,
              peers: peerSharedDocuments.length,
              requests: openPeerRequests.length,
            },
          },
          messages: nextMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Dashboard AI chat failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      const reply = data.reply?.trim() || "I could not answer that clearly right now.";

      setDashboardChatMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setDashboardChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I could not respond right now. Try asking about your next milestone, your project direction, or your shared documents.",
        },
      ]);
    } finally {
      setIsDashboardChatLoading(false);
    }
  };

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
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-ai p-2 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="ds-label text-ai">AI Chat</p>
              <div className="mt-2 max-h-[180px] space-y-2 overflow-y-auto rounded-xl border border-ai/20 bg-ai/5 p-3">
                {dashboardChatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      message.role === "assistant"
                        ? "bg-background text-foreground"
                        : "ml-auto max-w-[85%] bg-ai text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-2">
                <Textarea
                  rows={2}
                  value={dashboardChatInput}
                  onChange={(event) => setDashboardChatInput(event.target.value)}
                  placeholder="Example: What should I focus on this week?"
                />
                <div className="flex justify-end">
                  <Button onClick={handleDashboardChatSend} disabled={!dashboardChatInput.trim() || isDashboardChatLoading}>
                    <Send className="h-4 w-4" />
                    {isDashboardChatLoading ? "Thinking..." : "Ask AI"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardContent className="pt-6 space-y-4">
          <div>
            <h2 className="ds-title-sm tracking-tight">My peers</h2>
            <p className="ds-body text-muted-foreground mt-1">
              Students currently connected to you as peers.
            </p>
          </div>

          {acceptedPeers.length === 0 ? (
            <p className="ds-body text-muted-foreground">
              No peers yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {acceptedPeers.map(({ connection, peer }) => (
                <div key={connection.id} className="rounded-xl border bg-background p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="ds-label">
                        {peer.first_name} {peer.last_name}
                      </p>
                      <p className="ds-caption text-muted-foreground mt-1 capitalize">
                        {peer.degree}
                      </p>
                    </div>
                    <Badge className="border-0 bg-blue-100 text-blue-800">
                      Peer
                    </Badge>
                  </div>

                  {connection.match_reason ? (
                    <p className="ds-small text-muted-foreground">{connection.match_reason}</p>
                  ) : null}

                  {connection.shared_topics?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {connection.shared_topics.map((topic: string) => (
                        <Badge key={`${connection.id}-${topic}`} variant="secondary" className="ds-badge">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnpeer(connection)}
                    >
                      Unpeer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
