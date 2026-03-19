import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedbackLoops, useStudents, useThesisProjects } from "@/hooks/useStudyondData";
import { useMentorSelection } from "@/contexts/MentorSelectionContext";
import { getMentorProfileBySupervisorId } from "@/lib/mentorProfiles";
import { getInteractivePeerRequests, getInteractiveSharedDocumentRequests } from "@/lib/interactiveMilestones";
import { Building2, FileSearch, MessageCircleMore, MessagesSquare, Users } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MentorRequests() {
  const { selectedSupervisorId } = useMentorSelection();
  const mentorProfile = getMentorProfileBySupervisorId(selectedSupervisorId);
  const { data: projects } = useThesisProjects();
  const { data: students } = useStudents();
  const { data: feedbacks } = useFeedbackLoops();

  const supervisedProjects = useMemo(
    () => projects?.filter((project: any) => project.supervisor_ids?.includes(selectedSupervisorId)) || [],
    [projects, selectedSupervisorId],
  );
  const supervisedStudentIds = useMemo(
    () => new Set(supervisedProjects.map((project: any) => project.student_id)),
    [supervisedProjects],
  );
  const getStudent = (studentId: string) =>
    students?.find((student: any) => student.id === studentId) || null;

  const pendingFeedbacks = useMemo(
    () =>
      (feedbacks || []).filter(
        (feedback: any) =>
          feedback.reviewer_id === selectedSupervisorId &&
          feedback.reviewer_type === "supervisor" &&
          (feedback.status === "submitted" || feedback.status === "revised"),
      ),
    [feedbacks, selectedSupervisorId],
  );

  const peerRequests = useMemo(
    () =>
      getInteractivePeerRequests().filter(
        (request) =>
          supervisedStudentIds.has(request.requester_student_id) ||
          supervisedStudentIds.has(request.recipient_student_id),
      ),
    [supervisedStudentIds],
  );

  const documentRequests = useMemo(
    () =>
      getInteractiveSharedDocumentRequests().filter((request) =>
        supervisedStudentIds.has(request.student_id),
      ),
    [supervisedStudentIds],
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <Card className={`border shadow-none ${mentorProfile?.panelClassName ?? ""}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ds-title-cards shrink-0 ${mentorProfile?.avatarClassName ?? "bg-primary text-primary-foreground"}`}>
                {mentorProfile?.initials ?? "M"}
              </div>
              <div>
                <h1 className="ds-title-lg tracking-tight">Student Requests</h1>
                <p className="ds-body text-muted-foreground mt-1">
                  Monitor what your students are asking for and what still needs a mentor response.
                </p>
              </div>
            </div>
            {mentorProfile?.institution ? (
              <Badge variant="secondary" className="border-0 w-fit">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {mentorProfile.institution}
                </span>
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <MessageCircleMore className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="ds-caption text-muted-foreground">Pending mentor replies</p>
                <p className="ds-title-cards">{pendingFeedbacks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <Users className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="ds-caption text-muted-foreground">Peer requests in cohort</p>
                <p className="ds-title-cards">{peerRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <FileSearch className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="ds-caption text-muted-foreground">Document requests</p>
                <p className="ds-title-cards">{documentRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="feedback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feedback">Mentor replies</TabsTrigger>
          <TabsTrigger value="peers">Peer requests</TabsTrigger>
          <TabsTrigger value="documents">Document requests</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-3">
          {pendingFeedbacks.length === 0 ? (
            <Card className="border shadow-none">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending feedback request for this mentor.
              </CardContent>
            </Card>
          ) : (
            pendingFeedbacks.map((feedback: any) => {
              const student = getStudent(feedback.student_id);
              return (
                <Card key={feedback.id} className="border shadow-none">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ds-title-cards">{feedback.title}</p>
                        <p className="ds-small text-muted-foreground mt-1">
                          Submitted by {student ? `${student.first_name} ${student.last_name}` : feedback.student_id}
                        </p>
                      </div>
                      <Badge className="border-0 bg-amber-100 text-amber-800">
                        {feedback.status === "revised" ? "Revised" : "Needs review"}
                      </Badge>
                    </div>
                    {feedback.submission_text ? (
                      <p className="ds-body text-muted-foreground">{feedback.submission_text}</p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <p className="ds-caption text-muted-foreground">
                        Open the feedback page to reply and record your review.
                      </p>
                      <Link to="/mentor/feedback" className="ds-label text-foreground hover:underline">
                        Open feedback
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="peers" className="space-y-3">
          {peerRequests.length === 0 ? (
            <Card className="border shadow-none">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No peer request involving your supervised students.
              </CardContent>
            </Card>
          ) : (
            peerRequests.map((request) => {
              const requester = getStudent(request.requester_student_id);
              const recipient = getStudent(request.recipient_student_id);
              return (
                <Card key={request.id} className="border shadow-none">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ds-title-cards">
                          {requester ? `${requester.first_name} ${requester.last_name}` : request.requester_student_id}
                          {" "}
                          asked to connect with
                          {" "}
                          {recipient ? `${recipient.first_name} ${recipient.last_name}` : request.recipient_student_id}
                        </p>
                        <p className="ds-small text-muted-foreground mt-1">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="border-0">
                        Peer networking
                      </Badge>
                    </div>
                    {request.message ? (
                      <p className="ds-body text-muted-foreground">{request.message}</p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3">
          {documentRequests.length === 0 ? (
            <Card className="border shadow-none">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No document request created by your students yet.
              </CardContent>
            </Card>
          ) : (
            documentRequests.map((request) => {
              const student = getStudent(request.student_id);
              return (
                <Card key={request.id} className="border shadow-none">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ds-title-cards">{request.title}</p>
                        <p className="ds-small text-muted-foreground mt-1">
                          Posted by {student ? `${student.first_name} ${student.last_name}` : request.student_id}
                        </p>
                      </div>
                      <Badge className="border-0 bg-blue-100 text-blue-800">
                        {request.matched_documents?.length || 0} selected docs
                      </Badge>
                    </div>
                    {request.description ? (
                      <p className="ds-body text-muted-foreground">{request.description}</p>
                    ) : null}
                    {request.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {request.keywords.map((keyword) => (
                          <Badge key={`${request.id}-${keyword}`} variant="secondary" className="ds-badge">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <p className="ds-caption text-muted-foreground">
                        Shared document search stays available on the student side.
                      </p>
                      <Link to="/mentor/students" className="ds-label text-foreground hover:underline">
                        View students
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <Card className="border shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-secondary p-2">
              <MessagesSquare className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="ds-label">How to use this page</p>
              <p className="ds-body text-muted-foreground mt-1">
                Switch mentor in the header to review another mentor front, then use this page to spot student needs before jumping into feedback or cohort follow-up.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
