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

const MAX_THESIS_SIMILARITY_SCORE = 90;
const MAX_FIELD_SCORE = 40;
const MAX_SKILL_SCORE = 30;
const MAX_OBJECTIVE_SCORE = 20;
const SAME_UNIVERSITY_SCORE = 10;
const MAX_TOTAL_SCORE =
  MAX_THESIS_SIMILARITY_SCORE +
  MAX_FIELD_SCORE +
  MAX_SKILL_SCORE +
  MAX_OBJECTIVE_SCORE +
  SAME_UNIVERSITY_SCORE;

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
        MAX_THESIS_SIMILARITY_SCORE,
        Math.max(0, Math.round((thesisSimilarity?.score || 0) * 0.9)),
      );

      let rawScore = 0;
      if (thesisSimilarityScore) rawScore += thesisSimilarityScore;
      if (sharedFieldNames.length) rawScore += Math.min(MAX_FIELD_SCORE, sharedFieldNames.length * 20);
      if (sharedSkills.length) rawScore += Math.min(MAX_SKILL_SCORE, sharedSkills.length * 10);
      if (sharedObjectives.length) rawScore += Math.min(MAX_OBJECTIVE_SCORE, sharedObjectives.length * 10);
      if (sameUniversity) rawScore += SAME_UNIVERSITY_SCORE;
      const score = Math.round((rawScore / MAX_TOTAL_SCORE) * 100);

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
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
