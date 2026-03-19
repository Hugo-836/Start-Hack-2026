import { useState } from "react";
import {
  useFields,
  usePeerConnections,
  usePeerThesisSimilarity,
  useStudents,
  useThesisProjects,
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
import { Users, Sparkles, GraduationCap, Brain, Mail, Send } from "lucide-react";
import { buildPeerSuggestions } from "@/lib/peerMatching";

const DEMO_STUDENT = "student-11";

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

export default function StudentPeers() {
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const { data: connections, isLoading } = usePeerConnections(DEMO_STUDENT);
  const { data: students } = useStudents();
  const { data: projects } = useThesisProjects();
  const { data: fields } = useFields();
  const {
    data: thesisSimilarityByStudentId,
    isLoading: isThesisSimilarityLoading,
    isError: isThesisSimilarityError,
    error: thesisSimilarityError,
    status: thesisSimilarityStatus,
  } = usePeerThesisSimilarity(DEMO_STUDENT, students, projects);

  const getStudent = (id: string) => students?.find((s: any) => s.id === id);
  const getPeer = (conn: any) =>
    getStudent(conn.student_a_id === DEMO_STUDENT ? conn.student_b_id : conn.student_a_id);
  const currentStudent = getStudent(DEMO_STUDENT);
  const currentProject = projects ? getPrimaryProject(projects, DEMO_STUDENT) : null;

  const suggestions =
    students && projects
      ? buildPeerSuggestions({
          currentStudentId: DEMO_STUDENT,
          students,
          projects,
          fields,
          thesisSimilarityByStudentId,
        })
      : [];
  const thesisSimilarityDebug = thesisSimilarityByStudentId?.__debug ?? null;
  const ollamaScores = Object.entries(thesisSimilarityByStudentId ?? {}).filter(
    ([studentId, value]) => studentId !== "__debug" && typeof value?.score === "number",
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
    hasPositiveOllamaScores: ollamaScores.some(([, value]) => value.score > 0),
    thesisSimilarityDebug,
    ollamaScoresByStudentId: Object.fromEntries(ollamaScores),
    topRecommendations: suggestions.slice(0, 3).map((suggestion) => ({
      studentId: suggestion.student.id,
      studentName: `${suggestion.student.first_name} ${suggestion.student.last_name}`,
      ollamaRawScore: formatPercent(
        thesisSimilarityByStudentId?.[suggestion.student.id]?.score ?? null,
      ),
      ollamaReason: thesisSimilarityByStudentId?.[suggestion.student.id]?.reason ?? null,
      rankingThesisScore: formatPercent(suggestion.thesisSimilarityScore),
      finalMatchScore: formatPercent(suggestion.score),
    })),
  };

  const isPageLoading =
    isLoading || !students || !projects || !fields || isThesisSimilarityLoading;
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
          thesisSimilarityScore: thesisSimilarityByStudentId?.[peerId]?.score ?? null,
          thesisSimilarityReason: thesisSimilarityByStudentId?.[peerId]?.reason ?? null,
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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="ds-title-lg tracking-tight">Network</h1>
        <p className="ds-body text-muted-foreground mt-1">
          Connect with peers and mentors around your thesis.
        </p>
      </div>

      <Card className="border border-amber-300 bg-amber-50 shadow-none">
        <CardContent className="pt-6">
          <p className="ds-label text-amber-900">Debug Ollama thesis scores</p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-amber-950">
            {JSON.stringify(debugPayload, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Colonne gauche : Peers */}
        <section className="space-y-4">
          <div>
            <h2 className="ds-title-sm tracking-tight">Peers</h2>
            <p className="ds-body text-muted-foreground mt-1">
              Connect with students working on similar topics.
            </p>
          </div>

          {isPageLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !connections?.length ? (
            suggestions.length ? (
              <div className="space-y-4">
                <Card className="border shadow-none bg-ai/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full border border-ai/30 bg-background p-2 text-ai">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="ds-label text-ai">AI peer matching active</p>
                        <p className="ds-small text-muted-foreground mt-1">
                          Suggested peers are ranked from shared thesis themes, skills,
                          objectives, and academic field overlap.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
            )
          ) : (
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

          <Card className="border shadow-none">
            <CardContent className="pt-6 text-center">
              <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="ds-body text-muted-foreground">
                Mentor section coming soon.
              </p>
              <div className="mt-4 p-4 rounded-lg border inline-block">
                <p className="ds-small text-muted-foreground">
                  This area will display supervisors and experts linked to the
                  student’s thesis projects.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

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
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="font-medium">Subject:</span>{" "}
                {emailDraft?.subject || "No subject generated."}
              </div>
              <Textarea value={emailDraft?.body || ""} readOnly className="min-h-[260px]" />
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
    </div>
  );
}
