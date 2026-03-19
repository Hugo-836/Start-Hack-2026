// src/components/StudentMentors.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, Briefcase } from "lucide-react";
import { getInteractiveStudentWorkspace } from "@/lib/interactiveMilestones";
import { useDemoAuth } from "@/lib/demoAuth";

type MentorItem = {
  id: string;
  type: "supervisor" | "expert";
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  relatedProjects: string[];
};

export default function StudentMentors() {
  const { session } = useDemoAuth();
  const { studentProjects, supervisors, experts } = getInteractiveStudentWorkspace(session?.studentId);

  const mentorsMap = new Map<string, MentorItem>();

  for (const project of studentProjects) {
    for (const supervisorId of project.supervisor_ids ?? []) {
      const supervisor = supervisors.find((s: any) => s.id === supervisorId);
      if (!supervisor) continue;

      const key = `supervisor-${supervisor.id}`;
      const existing = mentorsMap.get(key);

      if (existing) {
        existing.relatedProjects.push(project.title ?? "Untitled project");
      } else {
        mentorsMap.set(key, {
          id: supervisor.id,
          type: "supervisor",
          first_name: supervisor.first_name,
          last_name: supervisor.last_name,
          title: supervisor.title,
          email: supervisor.email,
          relatedProjects: [project.title ?? "Untitled project"],
        });
      }
    }

    for (const expertId of project.expert_ids ?? []) {
      const expert = experts.find((e: any) => e.id === expertId);
      if (!expert) continue;

      const key = `expert-${expert.id}`;
      const existing = mentorsMap.get(key);

      if (existing) {
        existing.relatedProjects.push(project.title ?? "Untitled project");
      } else {
        mentorsMap.set(key, {
          id: expert.id,
          type: "expert",
          first_name: expert.first_name,
          last_name: expert.last_name,
          title: expert.title,
          email: expert.email,
          relatedProjects: [project.title ?? "Untitled project"],
        });
      }
    }
  }

  const mentors = Array.from(mentorsMap.values());

  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] ?? "?"}${lastName?.[0] ?? "?"}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="ds-title-lg tracking-tight">Mentors</h1>
        <p className="ds-body text-muted-foreground mt-1">
          Meet the supervisors and experts linked to your thesis projects.
        </p>
      </div>

      {mentors.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="pt-6 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="ds-body text-muted-foreground">
              No mentors found for this student yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid-3-col">
          {mentors.map((mentor) => (
            <Card
              key={`${mentor.type}-${mentor.id}`}
              className="border shadow-none hover:shadow-md transition-shadow duration-300"
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-label">
                    {getInitials(mentor.first_name, mentor.last_name)}
                  </div>

                  <div>
                    <p className="ds-label">
                      {mentor.title ? `${mentor.title} ` : ""}
                      {mentor.first_name ?? ""} {mentor.last_name ?? ""}
                    </p>
                    <p className="ds-caption text-muted-foreground">
                      {mentor.email ?? "No email"}
                    </p>
                  </div>
                </div>

                <Badge
                  className={`border-0 ${
                    mentor.type === "supervisor"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {mentor.type === "supervisor" ? (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Supervisor
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      Expert
                    </span>
                  )}
                </Badge>

                <div>
                  <p className="ds-small text-muted-foreground mb-2">
                    Related projects
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.relatedProjects.map((projectTitle, index) => (
                      <Badge
                        key={`${mentor.id}-${index}`}
                        variant="secondary"
                        className="ds-badge"
                      >
                        {projectTitle}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
