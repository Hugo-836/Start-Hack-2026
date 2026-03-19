import { useEffect, useState } from "react";
import {
  useMentorMatches,
  usePeerThesisSimilarity,
} from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Users, Sparkles, GraduationCap, Brain, Mail, Send, UserRoundSearch, CheckCircle2 } from "lucide-react";
import { buildPeerSuggestions } from "@/lib/peerMatching";
import {
  addInteractivePeerConnection,
  addInteractivePeerRequest,
  deleteInteractivePeerRequest,
  getInteractivePeerConnections,
  getInteractivePeerRequests,
  getInteractiveStudentWorkspace,
  INTERACTIVE_WORKSPACE_EVENT,
  replaceInteractivePeerConnections,
  replaceInteractivePeerRequests,
} from "@/lib/interactiveMilestones";
import { useDemoAuth } from "@/lib/demoAuth";
import { toast } from "@/components/ui/sonner";

const statusLabels: Record<string, string> = {
  suggested: "Suggested",
  accepted: "Accepted",
  declined: "Declined",
};

const statusColors: Record<string, string> = {
  suggested: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-muted text-muted-foreground",
};

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : null;
}

function getPrimaryProject(projects: any[], studentId: string) {
  const studentProjects = projects.filter((project) => project.student_id === studentId);
  return (
    studentProjects.find(
      (project) => project.state === "in_progress" || project.state === "agreed",
    ) || studentProjects[0]
  );
}

const PEER_REQUESTS_SYNC_URL = "/api/demo-peer-requests";
const PEER_CONNECTIONS_SYNC_URL = "/api/demo-peer-connections";

function getPeerPairKey(studentAId: string, studentBId: string) {
  return [studentAId, studentBId].sort().join(":");
}

export default function StudentPeers() {
  const { session } = useDemoAuth();
  const currentStudentId = session?.studentId;
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [mentorDialogId, setMentorDialogId] = useState<string | null>(null);
  const [mentorEmailDraft, setMentorEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingMentorEmail, setIsGeneratingMentorEmail] = useState(false);
  const [peerRequests, setPeerRequests] = useState(() => getInteractivePeerRequests(currentStudentId));
  const [workspace, setWorkspace] = useState(() => getInteractiveStudentWorkspace(currentStudentId));
  const connections = workspace.peerConnections;
  const students = workspace.students;
  const projects = workspace.projects;
  const fields = workspace.fields;
  const mentors = workspace.mockMentors;

  const syncPeerRequestsFromServer = async () => {
    try {
      const response = await fetch(PEER_REQUESTS_SYNC_URL, { method: "GET" });
      if (!response.ok) return;
      const payload = await response.json();
      const nextRequests = Array.isArray(payload?.requests) ? payload.requests : [];
      if (JSON.stringify(nextRequests) !== JSON.stringify(getInteractivePeerRequests())) {
        replaceInteractivePeerRequests(nextRequests);
        setPeerRequests(getInteractivePeerRequests(currentStudentId));
      }
    } catch {
      return;
    }
  };

  const syncPeerConnectionsFromServer = async () => {
    try {
      const response = await fetch(PEER_CONNECTIONS_SYNC_URL, { method: "GET" });
      if (!response.ok) return;
      const payload = await response.json();
      const nextConnections = Array.isArray(payload?.connections) ? payload.connections : [];
      if (JSON.stringify(nextConnections) !== JSON.stringify(getInteractivePeerConnections())) {
        replaceInteractivePeerConnections(nextConnections);
        setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
      }
    } catch {
      return;
    }
  };

  const persistPeerRequestsToServer = async (requests: ReturnType<typeof getInteractivePeerRequests>) => {
    try {
      await fetch(PEER_REQUESTS_SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      });
    } catch {
      return;
    }
  };

  const persistPeerConnectionsToServer = async (
    connections: ReturnType<typeof getInteractivePeerConnections>,
  ) => {
    try {
      await fetch(PEER_CONNECTIONS_SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connections }),
      });
    } catch {
      return;
    }
  };

  useEffect(() => {
    const syncWorkspace = () => {
      setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
      setPeerRequests(getInteractivePeerRequests(currentStudentId));
    };

    const syncAllSources = () => {
      syncWorkspace();
      void syncPeerRequestsFromServer();
      void syncPeerConnectionsFromServer();
    };

    syncAllSources();
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
    window.addEventListener("storage", syncWorkspace);
    window.addEventListener("focus", syncAllSources);
    const pollId = window.setInterval(() => {
      void syncPeerRequestsFromServer();
      void syncPeerConnectionsFromServer();
    }, 1500);

    return () => {
      window.removeEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
      window.removeEventListener("storage", syncWorkspace);
      window.removeEventListener("focus", syncAllSources);
      window.clearInterval(pollId);
    };
  }, [currentStudentId]);

  const {
    data: thesisSimilarityByStudentId,
    isLoading: isThesisSimilarityLoading,
    isError: isThesisSimilarityError,
    error: thesisSimilarityError,
    status: thesisSimilarityStatus,
  } = usePeerThesisSimilarity(currentStudentId || "", students, projects);

  const { data: mentorMatchesById, isLoading: isMentorMatchesLoading } = useMentorMatches(
    currentStudentId || "",
    students,
    projects,
    mentors,
  );

  type SimilarityEntry = {
    score?: number | null;
    reason?: string | null;
  };

  type SimilarityMap = Record<string, SimilarityEntry> & {
    __debug?: unknown;
  };

  const similarityMap: SimilarityMap = (thesisSimilarityByStudentId ?? {}) as SimilarityMap;

  const getStudent = (id: string) => students?.find((s: any) => s.id === id);

  const getPeer = (conn: any) =>
    getStudent(conn.student_a_id === currentStudentId ? conn.student_b_id : conn.student_a_id);

  const currentStudent = currentStudentId ? getStudent(currentStudentId) : null;
  const currentProject = currentStudentId && projects ? getPrimaryProject(projects, currentStudentId) : null;
  const incomingPeerRequests = peerRequests.filter((request: any) => request.recipient_student_id === currentStudentId);
  const peerConnectionPairs = new Set(
    connections.map((connection: any) => getPeerPairKey(connection.student_a_id, connection.student_b_id)),
  );
  const pendingPeerRequestPairs = new Set(
    peerRequests.map((request: any) => getPeerPairKey(request.requester_student_id, request.recipient_student_id)),
  );

  const mentorSuggestions = (mentors || [])
    .map((mentor) => ({
      mentor,
      match: mentorMatchesById?.[mentor.id] || null,
    }))
    .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
    .slice(0, 3);
  const prioritizedMentorSuggestions = selectedMentorId
    ? [
        ...mentorSuggestions.filter((item) => item.mentor.id === selectedMentorId),
        ...mentorSuggestions.filter((item) => item.mentor.id !== selectedMentorId),
      ]
    : mentorSuggestions;

  const suggestions =
    students && projects && fields
      ? buildPeerSuggestions({
          currentStudentId: currentStudentId || "",
          students,
          projects,
          fields,
          thesisSimilarityByStudentId: similarityMap,
        })
      : [];
  const thesisSimilarityDebug = similarityMap.__debug ?? null;
  const claudeScores = Object.entries(similarityMap).filter(
    (entry): entry is [string, SimilarityEntry] => {
      const [studentId, value] = entry;
      return studentId !== "__debug" && typeof value?.score === "number";
    },
  );

  const claudeScoresByStudentId = claudeScores.reduce<Record<string, SimilarityEntry>>(
    (acc, [studentId, value]) => {
      acc[studentId] = value;
      return acc;
    },
    {},
  );

  const debugPayload = {
    thesisSimilarityQuery: {
      status: thesisSimilarityStatus,
      isLoading: isThesisSimilarityLoading,
      isError: isThesisSimilarityError,
      error:
        thesisSimilarityError instanceof Error
          ? thesisSimilarityError.message
          : thesisSimilarityError ?? null,
      hasData: thesisSimilarityByStudentId !== undefined,
    },
    hasPositiveClaudeScores: claudeScores.some(([, value]) => (value.score ?? 0) > 0),
    thesisSimilarityDebug,
    claudeScoresByStudentId,
    topRecommendations: suggestions.slice(0, 3).map((suggestion) => ({
      studentId: suggestion.student.id,
      studentName: `${suggestion.student.first_name} ${suggestion.student.last_name}`,
      claudeRawScore: formatPercent(similarityMap[suggestion.student.id]?.score ?? null),
      claudeReason: similarityMap[suggestion.student.id]?.reason ?? null,
      rankingThesisScore: formatPercent(suggestion.thesisSimilarityScore),
      finalMatchScore: formatPercent(suggestion.score),
    })),
  };

  const hasCoreWorkspaceData = students.length > 0 && projects.length > 0 && fields.length > 0;

  const selectedSuggestion =
    suggestions.find((suggestion) => suggestion.student.id === selectedPeerId) || null;

  const openEmailDialog = async (peerId: string) => {
    if (!students || !projects || !currentStudent) return;

    const suggestion = suggestions.find((item) => item.student.id === peerId);
    if (!suggestion) return;

    const peerProject = getPrimaryProject(projects, peerId);
    setSelectedPeerId(peerId);
    setEmailDraft(null);
    setIsGeneratingEmail(true);

    try {
      const response = await fetch("/api/peer-intro-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentStudent,
          currentProject,
          peerStudent: suggestion.student,
          peerProject: peerProject
            ? {
                title: peerProject.title,
                description: peerProject.description,
                motivation: peerProject.motivation,
              }
            : null,
          thesisSimilarityScore: similarityMap[peerId]?.score ?? null,
          thesisSimilarityReason: similarityMap[peerId]?.reason ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email generation failed with status ${response.status}`);
      }

      const data = (await response.json()) as { subject: string; body: string };
      setEmailDraft(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setEmailDraft({
        subject: "Thesis collaboration opportunity",
        body: `Hi ${suggestion.student.first_name},\n\nI noticed some overlap between our thesis work and thought it could be interesting to connect.\n\nWould you be open to a short exchange?\n\nBest,\n${currentStudent.first_name} ${currentStudent.last_name}\n\nGeneration fallback: ${message}`,
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };
  const closeEmailDialog = () => {
    setSelectedPeerId(null);
    setEmailDraft(null);
    setIsGeneratingEmail(false);
  };
  const selectedMentor = mentorSuggestions.find((item) => item.mentor.id === mentorDialogId) || null;

  const openMentorEmailDialog = async (mentorId: string) => {
    if (!currentStudent || !currentProject || !mentors) return;
    const item = mentorSuggestions.find((entry) => entry.mentor.id === mentorId);
    if (!item) return;

    setSelectedMentorId(mentorId);
    setMentorDialogId(mentorId);
    setMentorEmailDraft(null);
    setIsGeneratingMentorEmail(true);

    try {
      const response = await fetch("/api/mentor-intro-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentStudent,
          currentProject: {
            title: currentProject.title,
            description: currentProject.description,
            motivation: currentProject.motivation,
          },
          mentor: item.mentor,
          mentorMatchScore: item.match?.score ?? null,
          mentorMatchReason: item.match?.reason ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mentor email generation failed with status ${response.status}`);
      }

      const data = (await response.json()) as { subject: string; body: string };
      setMentorEmailDraft(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMentorEmailDraft({
        subject: "Mentorship request regarding my thesis",
        body: `Hello ${item.mentor.full_name},\n\nI am currently working on my thesis and your expertise seems very relevant to my topic. I would be grateful for a short exchange if you are available.\n\nBest regards,\n${currentStudent.first_name} ${currentStudent.last_name}\n\nGeneration fallback: ${message}`,
      });
    } finally {
      setIsGeneratingMentorEmail(false);
    }
  };

  const closeMentorDialog = () => {
    setMentorDialogId(null);
    setMentorEmailDraft(null);
    setIsGeneratingMentorEmail(false);
  };

  const handleAskToPeer = (peerId: string) => {
    if (!currentStudentId || !peerId) return;

    const pairKey = getPeerPairKey(currentStudentId, peerId);
    if (peerConnectionPairs.has(pairKey) || pendingPeerRequestPairs.has(pairKey)) {
      return;
    }

    addInteractivePeerRequest({
      id: `peer-request-${Date.now()}`,
      requester_student_id: currentStudentId,
      recipient_student_id: peerId,
      created_at: new Date().toISOString(),
      message: currentProject?.title
        ? `I'd like to connect as peers around "${currentProject.title}".`
        : "I'd like to connect as peers.",
    });

    const nextRequests = getInteractivePeerRequests();
    setPeerRequests(getInteractivePeerRequests(currentStudentId));
    void persistPeerRequestsToServer(nextRequests);
    toast("Peer request sent", {
      description: "The other student will see it in their Peer requests section.",
    });
  };

  const handleDeclinePeerRequest = (requestId: string) => {
    deleteInteractivePeerRequest(requestId);
    const nextRequests = getInteractivePeerRequests();
    setPeerRequests(getInteractivePeerRequests(currentStudentId));
    void persistPeerRequestsToServer(nextRequests);
  };

  const handleAcceptPeerRequest = (request: (typeof incomingPeerRequests)[number]) => {
    const requesterId = request.requester_student_id;
    const recipientId = request.recipient_student_id;
    const requesterSuggestion = suggestions.find((item) => item.student.id === requesterId);
    const sharedTopics = requesterSuggestion?.sharedTopics || [];
    const matchReason =
      requesterSuggestion?.matchReason ||
      `Peer connection accepted between ${getStudent(requesterId)?.first_name || "two students"} and ${getStudent(recipientId)?.first_name || "peer"}.`;

    const studentAId = [requesterId, recipientId].sort()[0];
    const studentBId = [requesterId, recipientId].sort()[1];

    addInteractivePeerConnection({
      id: `peer-connection-${studentAId}-${studentBId}`,
      student_a_id: studentAId,
      student_b_id: studentBId,
      match_reason: matchReason,
      shared_topics: sharedTopics,
      status: "accepted",
      created_at: new Date().toISOString(),
    });

    const nextConnections = getInteractivePeerConnections();
    setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    void persistPeerConnectionsToServer(nextConnections);

    deleteInteractivePeerRequest(request.id);
    const nextRequests = getInteractivePeerRequests();
    setPeerRequests(getInteractivePeerRequests(currentStudentId));
    void persistPeerRequestsToServer(nextRequests);

    toast("Peer request accepted", {
      description: "You are now marked as peers and your documents will be treated as peer documents.",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="ds-title-lg tracking-tight">Network</h1>
        <p className="ds-body text-muted-foreground mt-1">
          Connect with peers and mentors around your thesis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Colonne gauche : Peers */}
        <section className="space-y-4">
          <div>
            <h2 className="ds-title-sm tracking-tight">Peers</h2>
            <p className="ds-body text-muted-foreground mt-1">
              Connect with students working on similar topics.
            </p>
          </div>

          {!hasCoreWorkspaceData ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : suggestions.length ? (
            <div className="space-y-4">
              {isThesisSimilarityLoading ? (
                <p className="ds-small text-muted-foreground">
                  Refining peer matches with AI...
                </p>
              ) : null}
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card
                    key={suggestion.student.id}
                    className="border shadow-none hover:shadow-md transition-shadow duration-300"
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label">
                          {suggestion.student.first_name[0]}
                          {suggestion.student.last_name[0]}
                        </div>
                        <div>
                          <p className="ds-label">
                            {suggestion.student.first_name} {suggestion.student.last_name}
                          </p>
                          <p className="ds-caption text-muted-foreground capitalize">
                            {suggestion.student.degree}
                          </p>
                        </div>
                      </div>

                      <p className="ds-small text-muted-foreground">
                        {suggestion.matchReason}
                      </p>

                      {suggestion.thesisSimilarityScore > 0 && (
                        <div className="rounded-lg border border-ai/20 bg-ai/5 px-3 py-2">
                          <div className="flex items-center gap-2 text-ai">
                            <Brain className="h-4 w-4" />
                            <span className="ds-label">
                              AI thesis similarity {formatPercent(suggestion.thesisSimilarityScore)}
                            </span>
                          </div>
                          {suggestion.thesisSimilarityReason && (
                            <p className="ds-small text-muted-foreground mt-1">
                              {suggestion.thesisSimilarityReason}
                            </p>
                          )}
                        </div>
                      )}

                      {suggestion.sharedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {suggestion.sharedTopics.map((topic) => (
                            <Badge
                              key={topic}
                              variant="secondary"
                              className="ds-badge"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Badge className="border-0 bg-ai/15 text-ai">
                        Match score {formatPercent(suggestion.score)}
                      </Badge>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => openEmailDialog(suggestion.student.id)}
                      >
                        <Mail className="h-4 w-4" />
                        Generate outreach email
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => handleAskToPeer(suggestion.student.id)}
                        disabled={
                          peerConnectionPairs.has(
                            getPeerPairKey(currentStudentId || "", suggestion.student.id),
                          ) ||
                          pendingPeerRequestPairs.has(
                            getPeerPairKey(currentStudentId || "", suggestion.student.id),
                          )
                        }
                      >
                        <Users className="h-4 w-4" />
                        {peerConnectionPairs.has(
                          getPeerPairKey(currentStudentId || "", suggestion.student.id),
                        )
                          ? "Already peers"
                          : pendingPeerRequestPairs.has(
                                getPeerPairKey(currentStudentId || "", suggestion.student.id),
                              )
                            ? "Request pending"
                            : "Ask to peer"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : connections?.length ? (
            <div className="space-y-4">
              {connections.map((conn: any) => {
                const peer = getPeer(conn);
                if (!peer) return null;

                return (
                  <Card
                    key={conn.id}
                    className="border shadow-none hover:shadow-md transition-shadow duration-300"
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label">
                          {peer.first_name[0]}
                          {peer.last_name[0]}
                        </div>
                        <div>
                          <p className="ds-label">
                            {peer.first_name} {peer.last_name}
                          </p>
                          <p className="ds-caption text-muted-foreground capitalize">
                            {peer.degree}
                          </p>
                        </div>
                      </div>

                      {conn.match_reason && (
                        <p className="ds-small text-muted-foreground">
                          {conn.match_reason}
                        </p>
                      )}

                      {conn.shared_topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {conn.shared_topics.map((t: string) => (
                            <Badge key={t} variant="secondary" className="ds-badge">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Badge className={`${statusColors[conn.status]} border-0`}>
                        {statusLabels[conn.status]}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border shadow-none">
              <CardContent className="pt-6 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="ds-body text-muted-foreground">No peer connections yet.</p>
                <div className="mt-4 p-4 rounded-lg border border-ai inline-block">
                  <div className="flex items-center gap-2 text-ai">
                    <Sparkles className="h-4 w-4" />
                    <span className="ds-label">No AI matches found yet</span>
                  </div>
                  <p className="ds-small text-muted-foreground mt-1">
                    Add more thesis details and skills to generate stronger peer
                    recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Colonne droite : Mentors */}
        <section className="space-y-4">
          <div>
            <h2 className="ds-title-sm tracking-tight">Mentors</h2>
            <p className="ds-body text-muted-foreground mt-1">
              Find supervisors and experts related to your thesis.
            </p>
          </div>
          {!hasCoreWorkspaceData ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : mentorSuggestions.length ? (
            <div className="space-y-4">
              {isMentorMatchesLoading ? (
                <p className="ds-small text-muted-foreground">
                  Refining mentor matches with AI...
                </p>
              ) : null}
              {prioritizedMentorSuggestions.map(({ mentor, match }) => {
                const isPreferredMentor = selectedMentorId === mentor.id;
                const hasPreferredMentor = Boolean(selectedMentorId);

                return (
                  <Card
                    key={mentor.id}
                    className={`border shadow-none transition-all duration-300 ${
                      isPreferredMentor
                        ? "border-ai/40 bg-ai/5 shadow-md"
                        : hasPreferredMentor
                          ? "opacity-45 grayscale"
                          : "hover:shadow-md"
                    }`}
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center ds-label">
                            {mentor.full_name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="ds-label">{mentor.full_name}</p>
                            <p className="ds-caption text-muted-foreground">
                              {mentor.institution || "Independent mentor"}
                            </p>
                          </div>
                        </div>
                        {isPreferredMentor ? (
                          <Badge className="border-0 bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Preferred
                          </Badge>
                        ) : null}
                      </div>

                      <p className="ds-small text-muted-foreground">{match?.reason}</p>

                      <div className="rounded-lg border border-ai/20 bg-ai/5 px-3 py-2">
                        <div className="flex items-center gap-2 text-ai">
                          <UserRoundSearch className="h-4 w-4" />
                          <span className="ds-label">
                            Mentor relevance {formatPercent(match?.score)}
                          </span>
                        </div>
                        <p className="ds-small text-muted-foreground mt-1">{mentor.bio}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertise.map((topic) => (
                          <Badge key={topic} variant="secondary" className="ds-badge">
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      {isPreferredMentor ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => openMentorEmailDialog(mentor.id)}
                        >
                          <Mail className="h-4 w-4" />
                          Contact preferred mentor
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant={hasPreferredMentor ? "secondary" : "default"}
                          className="w-full"
                          onClick={() => openMentorEmailDialog(mentor.id)}
                          disabled={isGeneratingMentorEmail}
                        >
                          <Mail className="h-4 w-4" />
                          Select this mentor
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border shadow-none">
              <CardContent className="pt-6 text-center">
                <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="ds-body text-muted-foreground">
                  {isMentorMatchesLoading
                    ? "Mentor matching is taking longer than expected."
                    : "No mentor matches found yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="ds-title-sm tracking-tight">Peer requests</h2>
          <p className="ds-body text-muted-foreground mt-1">
            Requests from other students who want to connect as peers.
          </p>
        </div>

        {incomingPeerRequests.length === 0 ? (
          <Card className="border shadow-none">
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="ds-body text-muted-foreground">No peer requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {incomingPeerRequests.map((request) => {
              const requester = getStudent(request.requester_student_id);
              const requesterProject = getPrimaryProject(projects, request.requester_student_id);

              return (
                <Card key={request.id} className="border shadow-none">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ds-label">
                          {requester ? `${requester.first_name} ${requester.last_name}` : "Unknown student"}
                        </p>
                        <p className="ds-caption text-muted-foreground mt-1">
                          {requesterProject?.title || "No active thesis project"}
                        </p>
                      </div>
                      <Badge className="border-0 bg-blue-100 text-blue-800">
                        Peer request
                      </Badge>
                    </div>

                    {request.message ? (
                      <p className="ds-small text-muted-foreground">{request.message}</p>
                    ) : null}

                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDeclinePeerRequest(request.id)}
                      >
                        Decline
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleAcceptPeerRequest(request)}
                      >
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={Boolean(selectedPeerId)} onOpenChange={(open) => !open && closeEmailDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              AI email draft{selectedSuggestion ? ` for ${selectedSuggestion.student.first_name}` : ""}
            </DialogTitle>
            <DialogDescription>
              This draft uses your profile, the peer profile, and thesis overlap.
            </DialogDescription>
          </DialogHeader>

          {isGeneratingEmail ? (
            <p className="text-sm text-muted-foreground">Generating email...</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Subject</p>
                <Input
                  value={emailDraft?.subject || ""}
                  onChange={(event) =>
                    setEmailDraft((current) =>
                      current
                        ? {
                            ...current,
                            subject: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Body</p>
                <Textarea
                  value={emailDraft?.body || ""}
                  onChange={(event) =>
                    setEmailDraft((current) =>
                      current
                        ? {
                            ...current,
                            body: event.target.value,
                          }
                        : current,
                    )
                  }
                  className="min-h-[260px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={closeEmailDialog} disabled={isGeneratingEmail}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(mentorDialogId)} onOpenChange={(open) => !open && closeMentorDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              AI email draft{selectedMentor ? ` for ${selectedMentor.mentor.full_name}` : ""}
            </DialogTitle>
            <DialogDescription>
              This draft uses your thesis and the mentor expertise profile.
            </DialogDescription>
          </DialogHeader>

          {isGeneratingMentorEmail ? (
            <p className="text-sm text-muted-foreground">Generating email...</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Subject</p>
                <Input
                  value={mentorEmailDraft?.subject || ""}
                  onChange={(event) =>
                    setMentorEmailDraft((current) =>
                      current
                        ? {
                            ...current,
                            subject: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Body</p>
                <Textarea
                  value={mentorEmailDraft?.body || ""}
                  onChange={(event) =>
                    setMentorEmailDraft((current) =>
                      current
                        ? {
                            ...current,
                            body: event.target.value,
                          }
                        : current,
                    )
                  }
                  className="min-h-[260px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={closeMentorDialog} disabled={isGeneratingMentorEmail}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
