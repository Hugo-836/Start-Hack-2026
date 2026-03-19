import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ThesisProject = Database["public"]["Tables"]["thesis_projects"]["Row"];
type ThesisSimilarityResponse = {
  matches?: Array<{
    studentId: string;
    score: number;
    reason: string;
  }>;
};

function getPrimaryProject(projects: ThesisProject[], studentId: string) {
  const studentProjects = projects.filter((project) => project.student_id === studentId);
  return (
    studentProjects.find(
      (project) => project.state === "in_progress" || project.state === "agreed",
    ) || studentProjects[0]
  );
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSupervisors() {
  return useQuery({
    queryKey: ["supervisors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("supervisors").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useExperts() {
  return useQuery({
    queryKey: ["experts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("experts").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useThesisProjects() {
  return useQuery({
    queryKey: ["thesis_projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("thesis_projects").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useThesisProject(id: string) {
  return useQuery({
    queryKey: ["thesis_project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("thesis_projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useFeedbackLoops(studentId?: string) {
  return useQuery({
    queryKey: ["feedback_loops", studentId],
    queryFn: async () => {
      let query = supabase.from("feedback_loops").select("*");
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useProgressMilestones(studentId?: string) {
  return useQuery({
    queryKey: ["progress_milestones", studentId],
    queryFn: async () => {
      let query = supabase.from("progress_milestones").select("*");
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function usePeerConnections(studentId?: string) {
  return useQuery({
    queryKey: ["peer_connections", studentId],
    queryFn: async () => {
      let query = supabase.from("peer_connections").select("*");
      if (studentId) {
        query = query.or(`student_a_id.eq.${studentId},student_b_id.eq.${studentId}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("universities").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topics").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useFields() {
  return useQuery({
    queryKey: ["fields"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fields").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function usePeerThesisSimilarity(
  currentStudentId: string,
  students?: Student[],
  projects?: ThesisProject[],
) {
  const currentStudent = students?.find((student) => student.id === currentStudentId);
  const currentProject = projects ? getPrimaryProject(projects, currentStudentId) : null;
  const candidateStudents =
    students?.filter(
      (student) =>
        student.id !== currentStudentId && student.degree === currentStudent?.degree,
    ) || [];
  const candidateProjects =
    projects && candidateStudents.length
      ? candidateStudents
          .map((student) => {
            const project = getPrimaryProject(projects, student.id);
            if (!project) return null;
            return {
              studentId: student.id,
              studentName: `${student.first_name} ${student.last_name}`,
              degree: student.degree,
              universityId: student.university_id,
              thesis: {
                title: project.title,
                description: project.description,
                motivation: project.motivation,
              },
            };
          })
          .filter(Boolean)
      : [];

  console.log("usePeerThesisSimilarity currentStudent", currentStudent);
  console.log("usePeerThesisSimilarity currentProject", currentProject);
  console.log("usePeerThesisSimilarity candidateProjects", candidateProjects);

  return useQuery({
    queryKey: [
      "peer-thesis-similarity",
      currentStudentId,
      currentProject?.id || "no-project",
      candidateProjects.map((candidate) => candidate!.studentId).join(","),
      candidateProjects
        .map((candidate) => `${candidate!.studentId}:${candidate!.thesis.title}`)
        .join("|"),
    ],
    queryFn: async () => {
      if (!currentStudent || !currentProject || candidateProjects.length === 0) {
        console.log("usePeerThesisSimilarity skipped", {
          hasCurrentStudent: Boolean(currentStudent),
          hasCurrentProject: Boolean(currentProject),
          candidateProjectsCount: candidateProjects.length,
        });
        return {};
      }

      const { data, error } = await supabase.functions.invoke<ThesisSimilarityResponse>(
        "peer-thesis-similarity",
        {
          body: {
            currentStudent: {
              id: currentStudent.id,
              name: `${currentStudent.first_name} ${currentStudent.last_name}`,
              degree: currentStudent.degree,
              universityId: currentStudent.university_id,
              skills: currentStudent.skills,
              objectives: currentStudent.objectives,
              fieldIds: currentStudent.field_ids,
              about: currentStudent.about,
            },
            currentThesis: {
              title: currentProject.title,
              description: currentProject.description,
              motivation: currentProject.motivation,
            },
            candidates: candidateProjects,
          },
        },
      );

      if (error) {
        console.warn("peer-thesis-similarity invoke failed", error);
        return {};
      }

      console.log("peer-thesis-similarity raw data", data);

      return Object.fromEntries(
        (data?.matches || []).map((match) => [
          match.studentId,
          {
            score: match.score,
            reason: match.reason,
          },
        ]),
      );
    },
    enabled: Boolean(currentStudent && currentProject && candidateProjects.length > 0),
    staleTime: 1000 * 60 * 10,
  });
}
