import { useThesisProjects, useStudents } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, MessageSquare, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getMentorProfileBySupervisorId } from "@/lib/mentorProfiles";
import { useMentorSelection } from "@/contexts/MentorSelectionContext";

const stateLabels: Record<string, string> = {
  proposed: "Proposed",
  applied: "Applied",
  agreed: "Agreed",
  in_progress: "In Progress",
  completed: "Completed",
  withdrawn: "Withdrawn",
  rejected: "Rejected",
  canceled: "Canceled",
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

export default function MentorDashboard() {
  const { data: projects } = useThesisProjects();
  const { data: students } = useStudents();
  const { selectedSupervisorId } = useMentorSelection();

  const mentorProfile = getMentorProfileBySupervisorId(selectedSupervisorId);
  const myProjects =
    projects?.filter((project: any) => project.supervisor_ids?.includes(selectedSupervisorId)) || [];
  const activeProjects = myProjects.filter(
    (project: any) => project.state === "in_progress" || project.state === "agreed",
  );
  const uniqueStudentIds = new Set(myProjects.map((project: any) => project.student_id));
  const getStudent = (id: string) => students?.find((student: any) => student.id === id);

  return (
    <div className="space-y-8 max-w-5xl">
      <Card className={`border shadow-none ${mentorProfile?.panelClassName ?? ""}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center ds-title-cards shrink-0 ${
                  mentorProfile?.avatarClassName ?? "bg-primary text-primary-foreground"
                }`}
              >
                {mentorProfile?.initials ?? "M"}
              </div>

              <div className="space-y-2">
                <div>
                  <h1 className="ds-title-lg tracking-tight">
                    {mentorProfile?.fullName ?? "Mentor Dashboard"}
                  </h1>
                  <p className="ds-body text-muted-foreground mt-1">
                    {mentorProfile?.bio || "Overview of your students and their projects."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mentorProfile?.degree ? (
                    <Badge className={`${mentorProfile.badgeClassName} border-0`}>
                      {mentorProfile.degree}
                    </Badge>
                  ) : null}
                  {mentorProfile?.institution ? (
                    <Badge variant="secondary" className="border-0">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {mentorProfile.institution}
                      </span>
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2 lg:max-w-sm">
              <p className="ds-caption text-muted-foreground">Expertise</p>
              <div className="flex flex-wrap gap-2">
                {(mentorProfile?.expertise || []).slice(0, 3).map((item) => (
                  <Badge key={item} variant="secondary" className="border-0">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <GraduationCap className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="ds-caption text-muted-foreground">Students</p>
                <p className="ds-title-cards">{uniqueStudentIds.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <BookOpen className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="ds-caption text-muted-foreground">Active Projects</p>
                <p className="ds-title-cards">{activeProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <MessageSquare className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="ds-caption text-muted-foreground">Pending Feedback</p>
                <p className="ds-title-cards">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="ds-title-sm">Active Projects</h2>
          <Link
            to="/mentor/students"
            className="ds-label text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <Card className="border shadow-none">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No active projects at the moment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeProjects.map((project: any) => {
              const student = getStudent(project.student_id);

              return (
                <Card
                  key={project.id}
                  className="border shadow-none hover:shadow-md transition-shadow duration-300"
                >
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label shrink-0">
                      {student ? `${student.first_name[0]}${student.last_name[0]}` : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="ds-label truncate">{project.title}</p>
                      <p className="ds-caption text-muted-foreground">
                        {student ? `${student.first_name} ${student.last_name}` : project.student_id}
                      </p>
                    </div>
                    <Badge className={`${stateColors[project.state]} border-0 shrink-0`}>
                      {stateLabels[project.state]}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
