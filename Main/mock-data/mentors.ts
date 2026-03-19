export interface MentorParams {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  institution: string | null;
  expertise: string[];
  bio: string | null;
  max_students?: number;
  created_at?: string;
  updated_at?: string;
}

export class Mentor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  institution: string | null;
  expertise: string[];
  bio: string | null;
  max_students: number;
  created_at: string;
  updated_at: string;

  constructor(params: MentorParams) {
    this.id = params.id;
    this.user_id = params.user_id;
    this.full_name = params.full_name;
    this.email = params.email;
    this.institution = params.institution;
    this.expertise = params.expertise;
    this.bio = params.bio;
    this.max_students = params.max_students ?? 5;
    this.created_at = params.created_at ?? new Date().toISOString();
    this.updated_at = params.updated_at ?? this.created_at;
  }
}

export const mentorExamples = [
  new Mentor({
    id: "mentor-01",
    user_id: "user-mentor-01",
    full_name: "Dr. Elena Rossi",
    email: "elena.rossi@epfl.ch",
    institution: "EPFL",
    expertise: ["Human-Computer Interaction", "AI Ethics", "Qualitative Research"],
    bio: "Research mentor focused on user-centered AI systems and thesis framing.",
    max_students: 6,
    created_at: "2026-03-01T09:00:00.000Z",
    updated_at: "2026-03-01T09:00:00.000Z",
  }),
  new Mentor({
    id: "mentor-02",
    user_id: "user-mentor-02",
    full_name: "Marc Dubois",
    email: "marc.dubois@unil.ch",
    institution: "UNIL",
    expertise: ["Machine Learning", "Data Visualization", "Statistics"],
    bio: "Supports students who need help structuring experiments and communicating results.",
    max_students: 4,
    created_at: "2026-03-02T10:30:00.000Z",
    updated_at: "2026-03-02T10:30:00.000Z",
  }),
  new Mentor({
    id: "mentor-03",
    user_id: "user-mentor-03",
    full_name: "Sofia Meyer",
    email: "sofia.meyer@idiap.ch",
    institution: "Idiap Research Institute",
    expertise: ["Natural Language Processing", "Academic Writing", "Literature Review"],
    bio: "Helps students turn scattered ideas into a clear research question and writing plan.",
    max_students: 5,
    created_at: "2026-03-03T14:15:00.000Z",
    updated_at: "2026-03-03T14:15:00.000Z",
  }),
];

