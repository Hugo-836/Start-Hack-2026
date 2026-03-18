import { describe, expect, it } from "vitest";
import { buildPeerSuggestions } from "@/lib/peerMatching";

describe("buildPeerSuggestions", () => {
  it("only suggests students with the same degree and scores university, skills, objectives and fields", () => {
    const suggestions = buildPeerSuggestions({
      currentStudentId: "student-1",
      students: [
        {
          id: "student-1",
          user_id: null,
          first_name: "Alice",
          last_name: "Meyer",
          email: "alice@example.com",
          degree: "msc",
          study_program_id: null,
          university_id: "unisg",
          skills: ["python", "nlp", "machine learning"],
          about: null,
          objectives: ["topic"],
          field_ids: ["field-ai"],
          created_at: "2026-03-18T00:00:00Z",
          updated_at: "2026-03-18T00:00:00Z",
        },
        {
          id: "student-2",
          user_id: null,
          first_name: "Ben",
          last_name: "Keller",
          email: "ben@example.com",
          degree: "msc",
          study_program_id: null,
          university_id: "unisg",
          skills: ["python", "data science"],
          about: null,
          objectives: ["topic"],
          field_ids: ["field-ai"],
          created_at: "2026-03-18T00:00:00Z",
          updated_at: "2026-03-18T00:00:00Z",
        },
        {
          id: "student-3",
          user_id: null,
          first_name: "Cara",
          last_name: "Frei",
          email: "cara@example.com",
          degree: "bsc",
          study_program_id: null,
          university_id: "unisg",
          skills: ["python", "nlp"],
          about: null,
          objectives: ["topic"],
          field_ids: ["field-ai"],
          created_at: "2026-03-18T00:00:00Z",
          updated_at: "2026-03-18T00:00:00Z",
        },
      ],
      projects: [
        {
          id: "project-1",
          title: "Natural language processing for healthcare",
          description: "Machine learning models for clinical text",
          motivation: null,
          state: "proposed",
          student_id: "student-1",
          topic_id: null,
          company_id: null,
          university_id: "unisg",
          supervisor_ids: [],
          expert_ids: [],
          created_at: "2026-03-18T00:00:00Z",
          updated_at: "2026-03-18T00:00:00Z",
        },
        {
          id: "project-2",
          title: "Healthcare data science",
          description: "Python workflows for clinical prediction",
          motivation: null,
          state: "proposed",
          student_id: "student-2",
          topic_id: null,
          company_id: null,
          university_id: "unisg",
          supervisor_ids: [],
          expert_ids: [],
          created_at: "2026-03-18T00:00:00Z",
          updated_at: "2026-03-18T00:00:00Z",
        },
      ],
      fields: [
        { id: "field-ai", name: "Artificial Intelligence", created_at: "2026-03-18T00:00:00Z" },
        { id: "field-business", name: "Business", created_at: "2026-03-18T00:00:00Z" },
      ],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].student.id).toBe("student-2");
    expect(suggestions[0].score).toBe(50);
    expect(suggestions[0].sharedTopics).toContain("artificial intelligence");
    expect(suggestions[0].matchReason).toContain("Same degree");
  });
});
