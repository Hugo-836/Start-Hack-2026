import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
