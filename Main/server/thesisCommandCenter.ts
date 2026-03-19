import { generateJsonWithClaude, parseClaudeJson } from "./claude";

type StudentProfile = {
  id: string;
  first_name: string;
  last_name: string;
  degree: string;
  skills?: string[] | null;
  objectives?: string[] | null;
  field_ids?: string[] | null;
  about?: string | null;
};

type ThesisProject = {
  id: string;
  title: string;
  description?: string | null;
  motivation?: string | null;
  state?: string | null;
};

type Milestone = {
  id: string;
  title: string;
  status?: string | null;
  due_date?: string | null;
};

type FeedbackLoop = {
  id: string;
  title: string;
  status?: string | null;
  reviewer_type?: string | null;
  ai_summary?: string | null;
  reviewer_feedback?: string | null;
};

type PeerSuggestion = {
  studentId: string;
  studentName: string;
  score: number;
  reason: string;
};

type MentorSuggestion = {
  mentorId: string;
  mentorName: string;
  score: number;
  reason: string;
};

type CommandCenterRequest = {
  currentStudent: StudentProfile;
  currentProject: ThesisProject | null;
  milestones: Milestone[];
  feedbackLoops: FeedbackLoop[];
  peerSuggestions: PeerSuggestion[];
  mentorSuggestions: MentorSuggestion[];
};

type CommandCenterResponse = {
  healthScore: number;
  riskLevel: "low" | "medium" | "high";
  momentum: string;
  nextBestAction: string;
  whyNow: string;
  blockers: string[];
  weeklySummary: string;
  recoveryPlan: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildFallback(payload: CommandCenterRequest): CommandCenterResponse {
  const completedMilestones = payload.milestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;
  const reviewedFeedbacks = payload.feedbackLoops.filter(
    (feedback) => feedback.status === "reviewed" || feedback.status === "revised",
  ).length;
  const topPeer = payload.peerSuggestions[0];
  const topMentor = payload.mentorSuggestions[0];

  let score = 35;
  if (payload.currentProject) score += 15;
  score += Math.min(20, completedMilestones * 5);
  score += Math.min(15, reviewedFeedbacks * 5);
  if (topPeer) score += 10;
  if (topMentor) score += 5;

  const healthScore = clamp(score, 0, 100);
  const riskLevel = healthScore >= 70 ? "low" : healthScore >= 45 ? "medium" : "high";

  const blockers: string[] = [];
  if (!payload.currentProject) blockers.push("No active thesis project is defined yet.");
  if (completedMilestones === 0) blockers.push("No completed milestones yet.");
  if (reviewedFeedbacks === 0) blockers.push("No reviewed feedback loop yet.");
  if (!topMentor) blockers.push("No mentor match has been activated yet.");

  return {
    healthScore,
    riskLevel,
    momentum:
      healthScore >= 70
        ? "Strong momentum"
        : healthScore >= 45
          ? "Progressing but fragile"
          : "At risk of stalling",
    nextBestAction:
      completedMilestones === 0
        ? "Complete your next milestone and turn the thesis into a concrete weekly plan."
        : reviewedFeedbacks === 0
          ? "Submit work for feedback to validate your direction before investing more effort."
          : topMentor
            ? `Reach out to ${topMentor.mentorName} for targeted mentor support.`
            : "Clarify the next deliverable and reduce uncertainty with one concrete action.",
    whyNow:
      completedMilestones === 0
        ? "Execution discipline is still weak, so structure matters more than additional exploration."
        : reviewedFeedbacks === 0
          ? "You need external validation before drifting further into the wrong direction."
          : "You already have momentum, so the best leverage is timely support.",
    blockers,
    weeklySummary: payload.currentProject
      ? `Your thesis "${payload.currentProject.title}" is active. The main opportunity now is to convert your current direction into steady progress with clearer checkpoints and faster feedback.`
      : "You still need a clearly active thesis project before the rest of the workflow can compound.",
    recoveryPlan: [
      "Define the next concrete deliverable for this week.",
      "Get one external validation point from a mentor or reviewer.",
      "Use the highest-match peer or mentor to unblock your biggest uncertainty.",
    ],
  };
}

function parseResponse(rawText: string): CommandCenterResponse | null {
  try {
    const parsed = parseClaudeJson<Partial<CommandCenterResponse>>(rawText);
    if (parsed && typeof parsed.healthScore === "number") {
      return {
        healthScore: clamp(Math.round(parsed.healthScore), 0, 100),
        riskLevel:
          parsed.riskLevel === "low" || parsed.riskLevel === "medium" || parsed.riskLevel === "high"
            ? parsed.riskLevel
            : "medium",
        momentum:
          typeof parsed.momentum === "string" ? parsed.momentum : "Progressing but fragile",
        nextBestAction:
          typeof parsed.nextBestAction === "string"
            ? parsed.nextBestAction
            : "Define the next best action for the thesis.",
        whyNow:
          typeof parsed.whyNow === "string"
            ? parsed.whyNow
            : "This is the highest leverage move based on the current thesis state.",
        blockers: Array.isArray(parsed.blockers)
          ? parsed.blockers.filter((value: unknown): value is string => typeof value === "string")
          : [],
        weeklySummary:
          typeof parsed.weeklySummary === "string"
            ? parsed.weeklySummary
            : "No summary returned.",
        recoveryPlan: Array.isArray(parsed.recoveryPlan)
          ? parsed.recoveryPlan.filter((value: unknown): value is string => typeof value === "string")
          : [],
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function buildThesisCommandCenter(
  payload: CommandCenterRequest,
  options?: { anthropicApiKey?: string; claudeModel?: string },
) {
  const fallback = buildFallback(payload);
  const model = options?.claudeModel || "claude-3-5-sonnet-latest";

  try {
    const raw = await generateJsonWithClaude(
      JSON.stringify({
        instructions: [
          "You are the thesis command center for a student thesis platform.",
          "Assess the current thesis state and return valid JSON only.",
          "Return keys: healthScore, riskLevel, momentum, nextBestAction, whyNow, blockers, weeklySummary, recoveryPlan.",
          "healthScore must be 0-100.",
          "riskLevel must be low, medium, or high.",
          "Keep the output concise, practical, and executive.",
        ],
        fallback,
        data: payload,
      }),
      {
        apiKey: options?.anthropicApiKey,
        model,
        maxTokens: 900,
      },
    );

    return parseResponse(raw) || fallback;
  } catch {
    return fallback;
  }
}
