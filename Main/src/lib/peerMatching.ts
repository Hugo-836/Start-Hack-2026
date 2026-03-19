import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ThesisProject = Database["public"]["Tables"]["thesis_projects"]["Row"];
type Field = Database["public"]["Tables"]["fields"]["Row"];

export type PeerSuggestion = {
  student: Student;
  score: number;
  sharedTopics: string[];
  matchReason: string;
  thesisSimilarityScore: number;
  thesisSimilarityReason: string | null;
};

export type ThesisSimilarityMatch = {
  score: number;
  reason: string;
};

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

function formatFieldNames(fieldIds: string[], fieldMap: Map<string, string>) {
  return fieldIds
    .map((fieldId) => fieldMap.get(fieldId) || fieldId)
    .filter((fieldName): fieldName is string => Boolean(fieldName));
}

export function buildPeerSuggestions(args: {
  currentStudentId: string;
  students: Student[];
  projects: ThesisProject[];
  fields?: Field[];
  limit?: number;
  thesisSimilarityByStudentId?: Record<string, ThesisSimilarityMatch>;
}): PeerSuggestion[] {
  const {
    currentStudentId,
    students,
    projects: _projects,
    fields = [],
    limit = 3,
    thesisSimilarityByStudentId = {},
  } = args;
  const currentStudent = students.find((student) => student.id === currentStudentId);

  if (!currentStudent) {
    return [];
  }

  const fieldMap = new Map(fields.map((field) => [field.id, field.name]));
  const currentFieldNames = formatFieldNames(currentStudent.field_ids, fieldMap);

  return students
    .filter(
      (student) =>
        student.id !== currentStudentId && student.degree === currentStudent.degree,
    )
    .map((student) => {
      const sharedSkills = intersect(currentStudent.skills, student.skills);
      const sharedObjectives = intersect(currentStudent.objectives, student.objectives);
      const sharedFieldNames = intersect(
        currentFieldNames,
        formatFieldNames(student.field_ids, fieldMap),
      );
      const sameUniversity =
        Boolean(currentStudent.university_id) &&
        currentStudent.university_id === student.university_id;
      const thesisSimilarity = thesisSimilarityByStudentId[student.id];
      const thesisSimilarityScore = Math.min(
        90,
        Math.max(0, Math.round((thesisSimilarity?.score || 0) * 0.9)),
      );

      let score = 0;
      if (thesisSimilarityScore) score += thesisSimilarityScore;
      if (sharedFieldNames.length) score += Math.min(40, sharedFieldNames.length * 20);
      if (sharedSkills.length) score += Math.min(30, sharedSkills.length * 10);
      if (sharedObjectives.length) score += Math.min(20, sharedObjectives.length * 10);
      if (sameUniversity) score += 10;

      const sharedTopics = unique([
        ...sharedFieldNames,
        ...sharedSkills,
        ...sharedObjectives,
      ]).slice(0, 4);

      let matchReason = "Same degree with a partially overlapping academic profile.";
      if (thesisSimilarity?.reason && thesisSimilarityScore >= 55) {
        matchReason = `AI thesis match: ${thesisSimilarity.reason}`;
      } else if (sharedFieldNames.length && sharedSkills.length && sameUniversity) {
        matchReason = `Same degree, same university, and strong overlap in ${sharedFieldNames[0]} with shared skills like ${sharedSkills[0]}.`;
      } else if (sharedFieldNames.length) {
        matchReason = `Same degree and both of you work in ${sharedFieldNames.slice(0, 2).join(" / ")}.`;
      } else if (sharedSkills.length) {
        matchReason = `Same degree with strong skill overlap around ${sharedSkills.slice(0, 2).join(" and ")}.`;
      } else if (sharedObjectives.length) {
        matchReason = `Same degree and shared objectives such as ${sharedObjectives.slice(0, 2).join(" and ")}.`;
      } else if (sameUniversity) {
        matchReason = "Same degree and same university.";
      }

      return {
        student,
        score,
        sharedTopics,
        matchReason,
        thesisSimilarityScore,
        thesisSimilarityReason: thesisSimilarity?.reason || null,
      };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
