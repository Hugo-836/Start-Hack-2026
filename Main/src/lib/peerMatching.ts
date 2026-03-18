import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ThesisProject = Database["public"]["Tables"]["thesis_projects"]["Row"];
type Field = Database["public"]["Tables"]["fields"]["Row"];

export type PeerSuggestion = {
  student: Student;
  score: number;
  sharedTopics: string[];
  matchReason: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "with",
]);

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function intersect(valuesA: string[] = [], valuesB: string[] = []) {
  const right = new Set(valuesB.map(normalize).filter(Boolean));
  return unique(valuesA.map(normalize).filter((value) => right.has(value)));
}

function extractKeywords(text?: string | null) {
  return unique(
    normalize(text)
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function getProjectsForStudent(projects: ThesisProject[], studentId: string) {
  return projects.filter((project) => project.student_id === studentId);
}

function formatFieldNames(fieldIds: string[], fieldMap: Map<string, string>) {
  return fieldIds
    .map((fieldId) => fieldMap.get(fieldId))
    .filter((fieldName): fieldName is string => Boolean(fieldName));
}

export function buildPeerSuggestions(args: {
  currentStudentId: string;
  students: Student[];
  projects: ThesisProject[];
  fields?: Field[];
  limit?: number;
}): PeerSuggestion[] {
  const { currentStudentId, students, projects, fields = [], limit = 3 } = args;
  const currentStudent = students.find((student) => student.id === currentStudentId);

  if (!currentStudent) {
    return [];
  }

  const fieldMap = new Map(fields.map((field) => [field.id, field.name]));
  const currentProjects = getProjectsForStudent(projects, currentStudentId);
  const currentFieldNames = formatFieldNames(currentStudent.field_ids, fieldMap);
  const currentProjectKeywords = unique(
    currentProjects.flatMap((project) => extractKeywords(`${project.title} ${project.description || ""}`)),
  );

  return students
    .filter((student) => student.id !== currentStudentId)
    .map((student) => {
      const candidateProjects = getProjectsForStudent(projects, student.id);
      const sharedSkills = intersect(currentStudent.skills, student.skills);
      const sharedObjectives = intersect(currentStudent.objectives, student.objectives);
      const sharedFieldNames = intersect(
        currentFieldNames,
        formatFieldNames(student.field_ids, fieldMap),
      );
      const candidateProjectKeywords = unique(
        candidateProjects.flatMap((project) => extractKeywords(`${project.title} ${project.description || ""}`)),
      );
      const sharedProjectKeywords = intersect(currentProjectKeywords, candidateProjectKeywords);

      let score = 0;
      if (sharedFieldNames.length) score += 35;
      if (sharedSkills.length) score += Math.min(25, sharedSkills.length * 8);
      if (sharedObjectives.length) score += Math.min(15, sharedObjectives.length * 7);
      if (sharedProjectKeywords.length) score += Math.min(20, sharedProjectKeywords.length * 5);
      if (currentStudent.degree === student.degree) score += 5;
      if (currentStudent.university_id && currentStudent.university_id === student.university_id) score += 5;

      const sharedTopics = unique([
        ...sharedFieldNames,
        ...sharedSkills,
        ...sharedProjectKeywords,
      ]).slice(0, 4);

      let matchReason = "Complementary academic profile.";
      if (sharedFieldNames.length && sharedProjectKeywords.length) {
        matchReason = `Shared field focus in ${sharedFieldNames[0]} and overlapping thesis keywords like ${sharedProjectKeywords[0]}.`;
      } else if (sharedFieldNames.length) {
        matchReason = `Both of you work in ${sharedFieldNames.slice(0, 2).join(" / ")}.`;
      } else if (sharedSkills.length) {
        matchReason = `Strong skill overlap around ${sharedSkills.slice(0, 2).join(" and ")}.`;
      } else if (sharedObjectives.length) {
        matchReason = `You share the same thesis objectives: ${sharedObjectives.slice(0, 2).join(" and ")}.`;
      } else if (sharedProjectKeywords.length) {
        matchReason = `Your thesis descriptions use similar themes such as ${sharedProjectKeywords.slice(0, 2).join(" and ")}.`;
      }

      return {
        student,
        score,
        sharedTopics,
        matchReason,
      };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
