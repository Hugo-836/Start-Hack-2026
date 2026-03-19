import { useFields, usePeerConnections, useStudents, useThesisProjects } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";
import { buildPeerSuggestions } from "@/lib/peerMatching";

const DEMO_STUDENT = "student-04";
const statusLabels: Record<string, string> = { suggested: "Suggested", accepted: "Accepted", declined: "Declined" };
const statusColors: Record<string, string> = { suggested: "bg-blue-100 text-blue-800", accepted: "bg-emerald-100 text-emerald-800", declined: "bg-muted text-muted-foreground" };

export default function StudentPeers() {
  const { data: connections, isLoading } = usePeerConnections(DEMO_STUDENT);
  const { data: students } = useStudents();
  const { data: projects } = useThesisProjects();
  const { data: fields } = useFields();
  const getStudent = (id: string) => students?.find((s: any) => s.id === id);
  const getPeer = (conn: any) => getStudent(conn.student_a_id === DEMO_STUDENT ? conn.student_b_id : conn.student_a_id);
  const suggestions = students && projects
    ? buildPeerSuggestions({
        currentStudentId: DEMO_STUDENT,
        students,
        projects,
        fields,
      })
    : [];
  const isPageLoading = isLoading || !students || !projects || !fields;

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">Peers</h1><p className="ds-body text-muted-foreground mt-1">Connect with students working on similar topics.</p></div>
      {isPageLoading ? <p className="text-muted-foreground">Loading...</p> : !connections?.length ? (
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
                      Suggested peers are ranked from shared thesis themes, skills, objectives, and academic field overlap.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid-3-col">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.student.id} className="border shadow-none hover:shadow-md transition-shadow duration-300">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label">
                        {suggestion.student.first_name[0]}{suggestion.student.last_name[0]}
                      </div>
                      <div>
                        <p className="ds-label">{suggestion.student.first_name} {suggestion.student.last_name}</p>
                        <p className="ds-caption text-muted-foreground capitalize">{suggestion.student.degree}</p>
                      </div>
                    </div>
                    <p className="ds-small text-muted-foreground">{suggestion.matchReason}</p>
                    {suggestion.sharedTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.sharedTopics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="ds-badge">{topic}</Badge>
                        ))}
                      </div>
                    )}
                    <Badge className="border-0 bg-ai/15 text-ai">Match score {suggestion.score}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border shadow-none"><CardContent className="pt-6 text-center"><Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="ds-body text-muted-foreground">No peer connections yet.</p><div className="mt-4 p-4 rounded-lg border border-ai inline-block"><div className="flex items-center gap-2 text-ai"><Sparkles className="h-4 w-4" /><span className="ds-label">No AI matches found yet</span></div><p className="ds-small text-muted-foreground mt-1">Add more thesis details and skills to generate stronger peer recommendations.</p></div></CardContent></Card>
        )
      ) : (
        <div className="grid-3-col">{connections.map((conn: any) => { const peer = getPeer(conn); if (!peer) return null; return (
          <Card key={conn.id} className="border shadow-none hover:shadow-md transition-shadow duration-300"><CardContent className="pt-6 space-y-3"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label">{peer.first_name[0]}{peer.last_name[0]}</div><div><p className="ds-label">{peer.first_name} {peer.last_name}</p><p className="ds-caption text-muted-foreground capitalize">{peer.degree}</p></div></div>{conn.match_reason && <p className="ds-small text-muted-foreground">{conn.match_reason}</p>}{conn.shared_topics?.length > 0 && <div className="flex flex-wrap gap-1.5">{conn.shared_topics.map((t: string) => <Badge key={t} variant="secondary" className="ds-badge">{t}</Badge>)}</div>}<Badge className={`${statusColors[conn.status]} border-0`}>{statusLabels[conn.status]}</Badge></CardContent></Card>
        ); })}</div>
      )}
    </div>
  );
}
