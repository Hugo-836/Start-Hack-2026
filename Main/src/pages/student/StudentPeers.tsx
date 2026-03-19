import {
  useFields,
  usePeerConnections,
  usePeerThesisSimilarity,
  useStudents,
  useThesisProjects,
} from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles, GraduationCap, Brain } from "lucide-react";
import { buildPeerSuggestions } from "@/lib/peerMatching";

const DEMO_STUDENT = "student-03";

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

export default function StudentPeers() {
  console.log("StudentPeers render");
  const { data: connections, isLoading } = usePeerConnections(DEMO_STUDENT);
  const { data: students } = useStudents();
  const { data: projects } = useThesisProjects();
  const { data: fields } = useFields();
  const { data: thesisSimilarityByStudentId, isLoading: isThesisSimilarityLoading } =
    usePeerThesisSimilarity(DEMO_STUDENT, students, projects);

  const getStudent = (id: string) => students?.find((s: any) => s.id === id);
  const getPeer = (conn: any) =>
    getStudent(conn.student_a_id === DEMO_STUDENT ? conn.student_b_id : conn.student_a_id);

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

  console.log("StudentPeers thesisSimilarityByStudentId", thesisSimilarityByStudentId);
  console.log("StudentPeers suggestions", suggestions);

  const isPageLoading =
    isLoading || !students || !projects || !fields || isThesisSimilarityLoading;

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
                                AI thesis similarity {suggestion.thesisSimilarityScore}
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
                          Match score {suggestion.score}
                        </Badge>
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
    </div>
  );
}
