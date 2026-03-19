import { mentorExamples } from "../../mock-data/mentors";

const mentorAccentPairs = [
  {
    avatarClassName: "bg-sky-100 text-sky-700",
    panelClassName: "border-sky-200 bg-sky-50/70",
    badgeClassName: "bg-sky-100 text-sky-800",
  },
  {
    avatarClassName: "bg-emerald-100 text-emerald-700",
    panelClassName: "border-emerald-200 bg-emerald-50/70",
    badgeClassName: "bg-emerald-100 text-emerald-800",
  },
  {
    avatarClassName: "bg-amber-100 text-amber-700",
    panelClassName: "border-amber-200 bg-amber-50/70",
    badgeClassName: "bg-amber-100 text-amber-800",
  },
  {
    avatarClassName: "bg-rose-100 text-rose-700",
    panelClassName: "border-rose-200 bg-rose-50/70",
    badgeClassName: "bg-rose-100 text-rose-800",
  },
  {
    avatarClassName: "bg-violet-100 text-violet-700",
    panelClassName: "border-violet-200 bg-violet-50/70",
    badgeClassName: "bg-violet-100 text-violet-800",
  },
];

export type MentorProfile = {
  id: string;
  supervisorId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  initials: string;
  degree: string;
  email: string;
  institution: string | null;
  expertise: string[];
  bio: string | null;
  avatarClassName: string;
  panelClassName: string;
  badgeClassName: string;
};

export type MentorOption = {
  mentorId: string;
  supervisorId: string;
  label: string;
  institution: string | null;
};

function splitMentorName(fullName: string) {
  const normalized = fullName.replace(/^(Dr\.?|Prof\.?)\s+/i, "").trim();
  const [firstName = "", ...rest] = normalized.split(/\s+/);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function getDefaultSupervisorId() {
  return "supervisor-01";
}

export function getMentorOptions(): MentorOption[] {
  return mentorExamples.map((mentor, index) => ({
    mentorId: mentor.id,
    supervisorId: `supervisor-${String(index + 1).padStart(2, "0")}`,
    label: mentor.full_name,
    institution: mentor.institution,
  }));
}

export function getMentorProfileBySupervisorId(supervisorId: string): MentorProfile | null {
  const supervisorIndex = Number.parseInt(supervisorId.replace("supervisor-", ""), 10) - 1;
  const mentor = mentorExamples[supervisorIndex];

  if (!mentor) {
    return null;
  }

  const accents = mentorAccentPairs[supervisorIndex % mentorAccentPairs.length];
  const { firstName, lastName } = splitMentorName(mentor.full_name);

  return {
    id: mentor.id,
    supervisorId,
    fullName: mentor.full_name,
    firstName,
    lastName,
    initials: `${firstName[0] ?? "?"}${lastName[0] ?? "?"}`,
    degree: mentor.degree,
    email: mentor.email,
    institution: mentor.institution,
    expertise: mentor.expertise,
    bio: mentor.bio,
    avatarClassName: accents.avatarClassName,
    panelClassName: accents.panelClassName,
    badgeClassName: accents.badgeClassName,
  };
}
