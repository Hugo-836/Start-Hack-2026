import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { mentorExamples } from "../../mock-data/mentors";
import { seededProjectDocuments } from "../../mock-data/seedProjectDocuments";

export const DEMO_STUDENT = "student-26";
export const INTERACTIVE_MILESTONES_STORAGE_KEY = `studyond-interactive-milestones-${DEMO_STUDENT}`;
export const INTERACTIVE_MILESTONES_EVENT = "studyond:interactive-milestones-updated";
export const INTERACTIVE_WORKSPACE_STORAGE_KEY = `studyond-interactive-workspace-${DEMO_STUDENT}`;
export const INTERACTIVE_WORKSPACE_EVENT = "studyond:interactive-workspace-updated";
const INTERACTIVE_REMOTE_CACHE_KEY = "studyond-interactive-remote-cache";

type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type FieldRow = Database["public"]["Tables"]["fields"]["Row"];
type SupervisorRow = Database["public"]["Tables"]["supervisors"]["Row"];
type ExpertRow = Database["public"]["Tables"]["experts"]["Row"];
type ThesisProjectRow = Database["public"]["Tables"]["thesis_projects"]["Row"];
type FeedbackLoopRow = Database["public"]["Tables"]["feedback_loops"]["Row"];
type PeerConnectionRow = Database["public"]["Tables"]["peer_connections"]["Row"];
type ProgressMilestoneRow = Database["public"]["Tables"]["progress_milestones"]["Row"];
type UniversityRow = Database["public"]["Tables"]["universities"]["Row"];

export type MilestoneStatus = "upcoming" | "in_progress" | "completed" | "overdue";

export type MilestoneAttachment = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export type MilestoneItem = {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  isCustom?: boolean;
  attachment?: MilestoneAttachment | null;
};

export type PhaseDefinition = {
  key: string;
  label: string;
  intro: string;
  fallbackMilestones: MilestoneItem[];
  queuedMilestones: MilestoneItem[];
};

export type PhaseState = PhaseDefinition & {
  milestones: MilestoneItem[];
  hiddenMilestones: MilestoneItem[];
  isUsingFallback: boolean;
};

export type WorkspaceFeedback = {
  id: string;
  student_id: string;
  title: string;
  submission_text: string | null;
  file_name: string | null;
  reviewer_feedback: string | null;
  ai_summary: string | null;
  status: string;
  reviewer_id: string | null;
  reviewer_type: "supervisor" | "expert";
};

export type ProjectDocument = {
  id: string;
  project_id: string;
  name: string;
  display_title?: string | null;
  type: string;
  size: number;
  dataUrl: string;
  created_at: string;
};

export type SharedDocumentRequest = {
  id: string;
  student_id: string;
  title: string;
  theme: string | null;
  keywords: string[];
  description: string | null;
  created_at: string;
  matched_documents?: Array<{
    document_id: string;
    owner_name: string;
    project_title: string;
  }>;
};

type WorkspaceState = {
  customFeedbacks: WorkspaceFeedback[];
  projectDocuments: ProjectDocument[];
  sharedDocumentRequests: SharedDocumentRequest[];
};

function getAllProjectDocuments(workspaceState: WorkspaceState) {
  const byId = new Map<string, ProjectDocument>();

  for (const document of seededProjectDocuments) {
    byId.set(document.id, { ...document });
  }

  for (const document of workspaceState.projectDocuments) {
    byId.set(document.id, document);
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

type RemoteCache = {
  students: StudentRow[];
  fields: FieldRow[];
  supervisors: SupervisorRow[];
  experts: ExpertRow[];
  projects: ThesisProjectRow[];
  feedbacks: FeedbackLoopRow[];
  peerConnections: PeerConnectionRow[];
  progressMilestones: ProgressMilestoneRow[];
  universities: UniversityRow[];
};


const emptyRemoteCache: RemoteCache = {
  students: [],
  fields: [],
  supervisors: [],
  experts: [],
  projects: [],
  feedbacks: [],
  peerConnections: [],
  progressMilestones: [],
  universities: [],
};

let remoteCache: RemoteCache | null = null;
let remoteLoadPromise: Promise<void> | null = null;

function getDefaultRemoteCache(): RemoteCache {
  return {
    students: [],
    fields: [],
    supervisors: [],
    experts: [],
    projects: [],
    feedbacks: [],
    peerConnections: [],
    progressMilestones: [],
    universities: [],
  };
}

function readRemoteCacheFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawCache = window.localStorage.getItem(INTERACTIVE_REMOTE_CACHE_KEY);
  if (!rawCache) {
    return null;
  }

  try {
    const parsedCache = JSON.parse(rawCache) as Partial<RemoteCache>;
    return {
      ...emptyRemoteCache,
      ...parsedCache,
      students: Array.isArray(parsedCache?.students) ? parsedCache.students : [],
      fields: Array.isArray(parsedCache?.fields) ? parsedCache.fields : [],
      supervisors: Array.isArray(parsedCache?.supervisors) ? parsedCache.supervisors : [],
      experts: Array.isArray(parsedCache?.experts) ? parsedCache.experts : [],
      projects: Array.isArray(parsedCache?.projects) ? parsedCache.projects : [],
      feedbacks: Array.isArray(parsedCache?.feedbacks) ? parsedCache.feedbacks : [],
      peerConnections: Array.isArray(parsedCache?.peerConnections) ? parsedCache.peerConnections : [],
      progressMilestones: Array.isArray(parsedCache?.progressMilestones) ? parsedCache.progressMilestones : [],
      universities: Array.isArray(parsedCache?.universities) ? parsedCache.universities : [],
    } satisfies RemoteCache;
  } catch {
    return null;
  }
}

function writeRemoteCacheToStorage(cache: RemoteCache) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INTERACTIVE_REMOTE_CACHE_KEY, JSON.stringify(cache));
}

function getRemoteCache() {
  if (remoteCache) {
    return remoteCache;
  }

  remoteCache = readRemoteCacheFromStorage() || getDefaultRemoteCache();
  return remoteCache;
}

function getPreferredStudentId(studentId = DEMO_STUDENT) {
  const students = getRemoteCache().students;
  if (students.some((student) => student.id === studentId)) {
    return studentId;
  }

  return students[0]?.id || studentId;
}

async function loadRemoteCacheFromSupabase() {
  const [
    studentsResult,
    fieldsResult,
    supervisorsResult,
    expertsResult,
    projectsResult,
    feedbacksResult,
    peerConnectionsResult,
    progressMilestonesResult,
    universitiesResult,
  ] = await Promise.all([
    supabase.from("students").select("*"),
    supabase.from("fields").select("*"),
    supabase.from("supervisors").select("*"),
    supabase.from("experts").select("*"),
    supabase.from("thesis_projects").select("*"),
    supabase.from("feedback_loops").select("*"),
    supabase.from("peer_connections").select("*"),
    supabase.from("progress_milestones").select("*").order("due_date", { ascending: true }),
    supabase.from("universities").select("*"),
  ]);

  const error =
    studentsResult.error ||
    fieldsResult.error ||
    supervisorsResult.error ||
    expertsResult.error ||
    projectsResult.error ||
    feedbacksResult.error ||
    peerConnectionsResult.error ||
    progressMilestonesResult.error ||
    universitiesResult.error;

  if (error) {
    throw error;
  }

  const nextCache: RemoteCache = {
    students: studentsResult.data || [],
    fields: fieldsResult.data || [],
    supervisors: supervisorsResult.data || [],
    experts: expertsResult.data || [],
    projects: projectsResult.data || [],
    feedbacks: feedbacksResult.data || [],
    peerConnections: peerConnectionsResult.data || [],
    progressMilestones: progressMilestonesResult.data || [],
    universities: universitiesResult.data || [],
  };

  remoteCache = nextCache;
  writeRemoteCacheToStorage(nextCache);
}

function dispatchInteractiveRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(INTERACTIVE_MILESTONES_EVENT));
  window.dispatchEvent(new CustomEvent(INTERACTIVE_WORKSPACE_EVENT));
}

function ensureRemoteDataLoaded() {
  if (typeof window === "undefined") {
    return;
  }

  getRemoteCache();

  if (remoteLoadPromise) {
    return;
  }

  remoteLoadPromise = loadRemoteCacheFromSupabase()
    .then(() => {
      dispatchInteractiveRefresh();
    })
    .catch(() => {
      // Keep the UI usable with cached or fallback data if the remote load fails.
    })
    .finally(() => {
      remoteLoadPromise = null;
    });
}

function toWorkspaceFeedback(feedback: FeedbackLoopRow): WorkspaceFeedback {
  const fileName = feedback.submission_file_url
    ? feedback.submission_file_url.split("/").pop() || feedback.submission_file_url
    : null;

  return {
    id: feedback.id,
    student_id: feedback.student_id,
    title: feedback.title,
    submission_text: feedback.submission_text,
    file_name: fileName,
    reviewer_feedback: feedback.reviewer_feedback,
    ai_summary: feedback.ai_summary,
    status: feedback.status,
    reviewer_id: feedback.reviewer_id,
    reviewer_type:
      feedback.reviewer_type === "expert" ? "expert" : "supervisor",
  };
}

export const phases: PhaseDefinition[] = [
  {
    key: "orientation",
    label: "Orientation",
    intro: "Set your foundation and clarify the thesis journey.",
    fallbackMilestones: [
      { id: "orientation-1", title: "Understand thesis requirements", description: "Review the thesis format, evaluation criteria, and timeline.", status: "upcoming", due_date: null },
      { id: "orientation-2", title: "Meet your supervisor", description: "Schedule an introductory meeting to align expectations.", status: "upcoming", due_date: null },
      { id: "orientation-3", title: "Define your working routine", description: "Choose how often you will check in and track progress.", status: "upcoming", due_date: null },
    ],
    queuedMilestones: [
      { id: "orientation-4", title: "Set your success criteria", description: "Write down what a strong thesis outcome looks like for you.", status: "upcoming", due_date: null },
      { id: "orientation-5", title: "Create your thesis workspace", description: "Organize files, notes, and references in one place.", status: "upcoming", due_date: null },
    ],
  },
  {
    key: "topic_search",
    label: "Topic Search",
    intro: "Narrow your area of interest and validate a strong research topic.",
    fallbackMilestones: [
      { id: "topic-search-1", title: "Title and description ", description: "the problem statement or opportunity.", status: "upcoming", due_date: null },
      { id: "topic-search-2", title: "Type", description: "topic (thesis/research) or job (employment listing)", status: "upcoming", due_date: null },
      { id: "topic-search-3", title: "Employment status", description: "yes, no, or open (whether the topic can lead to a job)", status: "upcoming", due_date: null },
      { id: "topic-search-4", title: "Employment type", description: "topic (thesis/research) or job (employment listing)", status: "upcoming", due_date: null },
      { id: "topic-search-5", title: "Workplace type", description: "on_site, hybrid, or remote", status: "upcoming", due_date: null },
      { id: "topic-search-6", title: "Degree level", description: "Bachelor, Master, PhD (can target multiple)", status: "upcoming", due_date: null },
      { id: "topic-search-7", title: "Fields", description: "subject areas and disciplines (many-to-many relationship with [[Fields]])", status: "upcoming", due_date: null },
    ],
    queuedMilestones: [
      { id: "topic-search-8", title: "Validate topic with supervisor", description: "Confirm that the topic is relevant and academically viable.", status: "upcoming", due_date: null },
      { id: "topic-search-9", title: "Write topic summary", description: "Prepare a short paragraph summarizing the chosen topic and angle.", status: "upcoming", due_date: null },
    ],
  },
  {
    key: "planning",
    label: "Planning",
    intro: "Turn your idea into a concrete and realistic execution plan.",
    fallbackMilestones: [
      { id: "planning-1", title: "Write research question", description: "Draft a focused research question and related objectives.", status: "upcoming", due_date: null },
      { id: "planning-2", title: "Build thesis roadmap", description: "Break the work into phases, deadlines, and deliverables.", status: "upcoming", due_date: null },
      { id: "planning-3", title: "Validate methodology", description: "Confirm the research method and sources with your supervisor.", status: "upcoming", due_date: null },
    ],
    queuedMilestones: [
      { id: "planning-4", title: "Create detailed timeline", description: "Map your milestones week by week until submission.", status: "upcoming", due_date: null },
      { id: "planning-5", title: "Identify research risks", description: "List blockers and define backup options early.", status: "upcoming", due_date: null },
    ],
  },
  {
    key: "execution",
    label: "Execution",
    intro: "Carry out the research, collect evidence, and iterate with feedback.",
    fallbackMilestones: [
      { id: "execution-1", title: "Collect core material", description: "Gather sources, data, interviews, or case studies for your thesis.", status: "upcoming", due_date: null },
      { id: "execution-2", title: "Analyze findings", description: "Organize insights and connect them to your research question.", status: "upcoming", due_date: null },
      { id: "execution-3", title: "Share first results", description: "Present your early findings to your supervisor for feedback.", status: "upcoming", due_date: null },
    ],
    queuedMilestones: [
      { id: "execution-4", title: "Refine analysis", description: "Adjust your approach after the first round of feedback.", status: "upcoming", due_date: null },
      { id: "execution-5", title: "Document evidence clearly", description: "Prepare notes and references for the writing phase.", status: "upcoming", due_date: null },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    intro: "Transform the work into a structured final thesis document.",
    fallbackMilestones: [
      { id: "writing-1", title: "Draft chapter structure", description: "Prepare the outline for introduction, method, analysis, and conclusion.", status: "upcoming", due_date: null },
      { id: "writing-2", title: "Write first full draft", description: "Turn notes and findings into complete thesis sections.", status: "upcoming", due_date: null },
      { id: "writing-3", title: "Revise and finalize", description: "Integrate feedback, refine citations, and polish the final version.", status: "upcoming", due_date: null },
    ],
    queuedMilestones: [
      { id: "writing-4", title: "Proofread the manuscript", description: "Review clarity, grammar, and structure before submission.", status: "upcoming", due_date: null },
      { id: "writing-5", title: "Prepare final submission", description: "Check formatting rules and submit the final version.", status: "upcoming", due_date: null },
    ],
  },
];

function toMilestoneItem(milestone: any): MilestoneItem {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    status: milestone.status as MilestoneStatus,
    due_date: milestone.due_date,
    isCustom: milestone.isCustom === true,
    attachment: milestone.attachment ?? null,
  };
}

export function buildPhaseState(milestones: any[] | undefined): PhaseState[] {
  return phases.map((phase) => {
    const phaseMilestones = milestones?.filter((milestone) => milestone.phase === phase.key).map(toMilestoneItem) || [];
    const visibleMilestones = phaseMilestones.length > 0 ? phaseMilestones : phase.fallbackMilestones;
    const visibleIds = new Set(visibleMilestones.map((milestone) => milestone.id));
    const hiddenMilestones = phase.queuedMilestones.filter((milestone) => !visibleIds.has(milestone.id));

    return {
      ...phase,
      milestones: visibleMilestones,
      hiddenMilestones,
      isUsingFallback: phaseMilestones.length === 0,
    };
  });
}

export function loadInteractiveMilestones(milestones: any[] | undefined): PhaseState[] {
  const baseState = buildPhaseState(milestones);

  if (typeof window === "undefined") {
    return baseState;
  }

  const storedState = window.localStorage.getItem(INTERACTIVE_MILESTONES_STORAGE_KEY);
  if (!storedState) {
    return baseState;
  }

  try {
    const parsedState = JSON.parse(storedState) as PhaseState[];
    if (!Array.isArray(parsedState)) {
      return baseState;
    }

    const hiddenMilestoneIdsByPhase = new Map(
      parsedState.map((storedPhase) => {
        const basePhase = baseState.find((phase) => phase.key === storedPhase.key);
        const baseIds = new Set(basePhase?.milestones.map((milestone) => milestone.id) || []);
        const storedVisibleIds = new Set(storedPhase.milestones.map((milestone) => milestone.id));
        const hiddenIds = Array.from(baseIds).filter((id) => !storedVisibleIds.has(id));

        return [storedPhase.key, new Set(hiddenIds)] as const;
      }),
    );

    const customMilestonesByPhase = new Map(
      parsedState.map((phase) => {
        const baseIds = new Set([
          ...phase.fallbackMilestones.map((milestone) => milestone.id),
          ...phase.queuedMilestones.map((milestone) => milestone.id),
        ]);

        const customMilestones = phase.milestones
          .filter((milestone) => milestone.isCustom === true || !baseIds.has(milestone.id))
          .map((milestone) => toMilestoneItem({ ...milestone, isCustom: true }));

        return [phase.key, customMilestones] as const;
      }),
    );

    const storedStatusById = new Map(
      parsedState.flatMap((phase) => phase.milestones.map((milestone) => [milestone.id, milestone.status] as const)),
    );

    return baseState.map((phase) => ({
      ...phase,
      milestones: [
        ...phase.milestones
          .filter((milestone) => !hiddenMilestoneIdsByPhase.get(phase.key)?.has(milestone.id))
          .map((milestone) => ({
            ...milestone,
            status: storedStatusById.get(milestone.id) || milestone.status,
          })),
        ...(customMilestonesByPhase.get(phase.key) || []).map((milestone) => ({
          ...milestone,
          status: storedStatusById.get(milestone.id) || milestone.status,
          isCustom: true,
        })),
      ],
    }));
  } catch {
    return baseState;
  }
}

export function saveInteractiveMilestones(phaseState: PhaseState[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INTERACTIVE_MILESTONES_STORAGE_KEY, JSON.stringify(phaseState));
  window.dispatchEvent(new CustomEvent(INTERACTIVE_MILESTONES_EVENT));
}

export function getInteractivePhaseState() {
  ensureRemoteDataLoaded();
  const studentId = getPreferredStudentId();
  const milestones = getRemoteCache().progressMilestones.filter(
    (milestone) => milestone.student_id === studentId,
  );
  return loadInteractiveMilestones(milestones);
}

export function updateInteractiveMilestoneStatus(
  phaseState: PhaseState[],
  phaseKey: string,
  milestoneId: string,
  status: MilestoneStatus,
) {
  return phaseState.map((phase) => {
    if (phase.key !== phaseKey) return phase;

    return {
      ...phase,
      milestones: phase.milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, status } : milestone,
      ),
    };
  });
}

export function addInteractiveCustomMilestone(
  phaseState: PhaseState[],
  phaseKey: string,
  milestone: MilestoneItem,
) {
  return phaseState.map((phase) =>
    phase.key === phaseKey
      ? { ...phase, milestones: [...phase.milestones, milestone] }
      : phase,
  );
}

export function deleteInteractiveMilestone(
  phaseState: PhaseState[],
  phaseKey: string,
  milestoneId: string,
) {
  return phaseState.map((phase) =>
    phase.key === phaseKey
      ? {
          ...phase,
          milestones: phase.milestones.filter((milestone) => milestone.id !== milestoneId),
        }
      : phase,
  );
}

export function restoreInteractiveDefaultMilestones(phaseState: PhaseState[]) {
  return phaseState.map((phase) => {
    const phaseDefinition = phases.find((item) => item.key === phase.key);
    if (!phaseDefinition) return phase;

    const defaultMilestones = [
      ...phaseDefinition.fallbackMilestones,
      ...phaseDefinition.queuedMilestones,
    ];
    const existingIds = new Set(phase.milestones.map((milestone) => milestone.id));
    const restoredDefaults = defaultMilestones.filter((milestone) => !existingIds.has(milestone.id));

    if (restoredDefaults.length === 0) {
      return phase;
    }

    return {
      ...phase,
      milestones: [...phase.milestones, ...restoredDefaults],
      hiddenMilestones: phase.hiddenMilestones.filter(
        (milestone) => !restoredDefaults.some((restored) => restored.id === milestone.id),
      ),
    };
  });
}

export function attachInteractiveMilestoneFile(
  phaseState: PhaseState[],
  phaseKey: string,
  milestoneId: string,
  attachment: MilestoneAttachment,
) {
  return phaseState.map((phase) =>
    phase.key === phaseKey
      ? {
          ...phase,
          milestones: phase.milestones.map((milestone) =>
            milestone.id === milestoneId
              ? {
                  ...milestone,
                  attachment,
                  status: milestone.status === "upcoming" ? "in_progress" : milestone.status,
                }
              : milestone,
          ),
        }
      : phase,
  );
}

export function removeInteractiveMilestoneAttachment(
  phaseState: PhaseState[],
  phaseKey: string,
  milestoneId: string,
) {
  return phaseState.map((phase) =>
    phase.key === phaseKey
      ? {
          ...phase,
          milestones: phase.milestones.map((milestone) =>
            milestone.id === milestoneId ? { ...milestone, attachment: null } : milestone,
          ),
        }
      : phase,
  );
}

export function getInteractiveMilestoneCount(milestones: any[] | undefined) {
  ensureRemoteDataLoaded();
  const preferredStudentId = getPreferredStudentId();
  const sourceMilestones =
    milestones && milestones.length > 0
      ? milestones
      : getRemoteCache().progressMilestones.filter(
          (milestone) => milestone.student_id === preferredStudentId,
        );

  return loadInteractiveMilestones(sourceMilestones).reduce(
    (total, phase) => total + phase.milestones.filter((milestone) => milestone.status === "completed").length,
    0,
  );
}

function loadInteractiveWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return { customFeedbacks: [], projectDocuments: [], sharedDocumentRequests: [] };
  }

  const rawState = window.localStorage.getItem(INTERACTIVE_WORKSPACE_STORAGE_KEY);
  if (!rawState) {
    return { customFeedbacks: [], projectDocuments: [], sharedDocumentRequests: [] };
  }

  try {
    const parsedState = JSON.parse(rawState) as WorkspaceState;
    return {
      customFeedbacks: Array.isArray(parsedState?.customFeedbacks) ? parsedState.customFeedbacks : [],
      projectDocuments: Array.isArray(parsedState?.projectDocuments) ? parsedState.projectDocuments : [],
      sharedDocumentRequests: Array.isArray(parsedState?.sharedDocumentRequests) ? parsedState.sharedDocumentRequests : [],
    };
  } catch {
    return { customFeedbacks: [], projectDocuments: [], sharedDocumentRequests: [] };
  }
}

function saveInteractiveWorkspaceState(state: WorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INTERACTIVE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(INTERACTIVE_WORKSPACE_EVENT));
}

export function getInteractiveStudents() {
  ensureRemoteDataLoaded();
  return [...getRemoteCache().students];
}

export function getInteractiveFields() {
  ensureRemoteDataLoaded();
  return [...getRemoteCache().fields];
}

export function getInteractiveSupervisors() {
  ensureRemoteDataLoaded();
  return [...getRemoteCache().supervisors];
}

export function getInteractiveExperts() {
  ensureRemoteDataLoaded();
  return [...getRemoteCache().experts];
}

export function getInteractiveThesisProjects(studentId?: string) {
  ensureRemoteDataLoaded();
  const preferredStudentId = studentId ? getPreferredStudentId(studentId) : undefined;
  const projects = [...getRemoteCache().projects];
  return preferredStudentId
    ? projects.filter((project) => project.student_id === preferredStudentId)
    : projects;
}

export function getInteractiveFeedbacks(studentId?: string) {
  ensureRemoteDataLoaded();
  const workspaceState = loadInteractiveWorkspaceState();
  const preferredStudentId = studentId ? getPreferredStudentId(studentId) : undefined;
  const feedbacks = [
    ...getRemoteCache().feedbacks.map(toWorkspaceFeedback),
    ...workspaceState.customFeedbacks,
  ];
  return preferredStudentId
    ? feedbacks.filter((feedback) => feedback.student_id === preferredStudentId)
    : feedbacks;
}

export function addInteractiveFeedbackSubmission(feedback: WorkspaceFeedback) {
  const workspaceState = loadInteractiveWorkspaceState();
  saveInteractiveWorkspaceState({
    ...workspaceState,
    customFeedbacks: [feedback, ...workspaceState.customFeedbacks],
  });

  const activeProject = getInteractivePrimaryProject(feedback.student_id);
  const reviewerId = feedback.reviewer_id || activeProject?.supervisor_ids?.[0] || null;
  if (!activeProject || !reviewerId) {
    return;
  }

  void supabase.from("feedback_loops").insert({
    project_id: activeProject.id,
    student_id: feedback.student_id,
    title: feedback.title,
    submission_text: feedback.submission_text,
    submission_file_url: feedback.file_name,
    reviewer_feedback: feedback.reviewer_feedback,
    ai_summary: feedback.ai_summary,
    reviewer_id: reviewerId,
    reviewer_type: feedback.reviewer_type,
    status: (feedback.status || "submitted") as Database["public"]["Enums"]["feedback_status"],
    submitted_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) {
      return;
    }

    remoteLoadPromise = null;
    ensureRemoteDataLoaded();
  });
}

export function getInteractivePeerConnections(studentId?: string) {
  ensureRemoteDataLoaded();
  const preferredStudentId = studentId ? getPreferredStudentId(studentId) : undefined;
  const connections = [...getRemoteCache().peerConnections];
  return preferredStudentId
    ? connections.filter(
        (connection) =>
          connection.student_a_id === preferredStudentId ||
          connection.student_b_id === preferredStudentId,
      )
    : connections;
}

export function getInteractiveMockMentors() {
  return mentorExamples;
}

export function getInteractiveStudent(studentId = DEMO_STUDENT) {
  const preferredStudentId = getPreferredStudentId(studentId);
  return getInteractiveStudents().find((student) => student.id === preferredStudentId) || null;
}

export function getInteractivePrimaryProject(studentId = DEMO_STUDENT) {
  const projects = getInteractiveThesisProjects(getPreferredStudentId(studentId));
  return (
    projects.find((project) => project.state === "in_progress" || project.state === "agreed") ||
    projects[0] ||
    null
  );
}

export function getInteractiveStudentWorkspace(studentId = DEMO_STUDENT) {
  ensureRemoteDataLoaded();
  const preferredStudentId = getPreferredStudentId(studentId);
  const students = getInteractiveStudents();
  const projects = getInteractiveThesisProjects();
  const supervisors = getInteractiveSupervisors();
  const experts = getInteractiveExperts();
  const feedbacks = getInteractiveFeedbacks();
  const peerConnections = getInteractivePeerConnections();
  const fields = getInteractiveFields();
  const mockMentors = getInteractiveMockMentors();
  const universities = [...getRemoteCache().universities];

  const workspaceState = loadInteractiveWorkspaceState();
  const projectDocuments = getAllProjectDocuments(workspaceState);

  return {
    students,
    student: students.find((item) => item.id === preferredStudentId) || null,
    projects,
    studentProjects: projects.filter((item) => item.student_id === preferredStudentId),
    activeProject:
      projects.find(
        (item) =>
          item.student_id === preferredStudentId &&
          (item.state === "in_progress" || item.state === "agreed"),
      ) || projects.find((item) => item.student_id === preferredStudentId) || null,
    supervisors,
    experts,
    universities,
    feedbacks,
    studentFeedbacks: feedbacks.filter((item) => item.student_id === preferredStudentId),
    projectDocuments: projectDocuments.filter((item) =>
      projects.some((project) => project.student_id === preferredStudentId && project.id === item.project_id),
    ),
    peerConnections: peerConnections.filter(
      (item) => item.student_a_id === preferredStudentId || item.student_b_id === preferredStudentId,
    ),
    fields,
    mockMentors,
  };
}

export function getInteractiveProjectDocuments(studentId?: string) {
  ensureRemoteDataLoaded();
  const workspaceState = loadInteractiveWorkspaceState();
  const projectDocuments = getAllProjectDocuments(workspaceState);
  if (!studentId) {
    return projectDocuments;
  }

  const preferredStudentId = getPreferredStudentId(studentId);
  const projects = getInteractiveThesisProjects();

  return projectDocuments.filter((item) =>
    projects.some((project) => project.student_id === preferredStudentId && project.id === item.project_id),
  );
}

export function getInteractiveSharedDocumentRequests(studentId?: string) {
  ensureRemoteDataLoaded();
  const workspaceState = loadInteractiveWorkspaceState();
  if (!studentId) {
    return [...workspaceState.sharedDocumentRequests];
  }

  const preferredStudentId = getPreferredStudentId(studentId);
  return workspaceState.sharedDocumentRequests.filter((item) => item.student_id === preferredStudentId);
}

export function addInteractiveSharedDocumentRequest(request: SharedDocumentRequest) {
  const workspaceState = loadInteractiveWorkspaceState();
  saveInteractiveWorkspaceState({
    ...workspaceState,
    sharedDocumentRequests: [request, ...workspaceState.sharedDocumentRequests],
  });
}

export function upsertInteractiveSharedDocumentRequest(request: SharedDocumentRequest) {
  const workspaceState = loadInteractiveWorkspaceState();
  const existingIndex = workspaceState.sharedDocumentRequests.findIndex((item) => item.id === request.id);

  if (existingIndex === -1) {
    saveInteractiveWorkspaceState({
      ...workspaceState,
      sharedDocumentRequests: [request, ...workspaceState.sharedDocumentRequests],
    });
    return;
  }

  const nextRequests = [...workspaceState.sharedDocumentRequests];
  nextRequests[existingIndex] = request;
  saveInteractiveWorkspaceState({
    ...workspaceState,
    sharedDocumentRequests: nextRequests,
  });
}

export function deleteInteractiveSharedDocumentRequest(requestId: string) {
  const workspaceState = loadInteractiveWorkspaceState();
  saveInteractiveWorkspaceState({
    ...workspaceState,
    sharedDocumentRequests: workspaceState.sharedDocumentRequests.filter((item) => item.id !== requestId),
  });
}

export function addInteractiveProjectDocument(document: ProjectDocument) {
  const workspaceState = loadInteractiveWorkspaceState();
  saveInteractiveWorkspaceState({
    ...workspaceState,
    projectDocuments: [document, ...workspaceState.projectDocuments],
  });
}

export function deleteInteractiveProjectDocument(documentId: string) {
  const workspaceState = loadInteractiveWorkspaceState();
  saveInteractiveWorkspaceState({
    ...workspaceState,
    projectDocuments: workspaceState.projectDocuments.filter((item) => item.id !== documentId),
  });
}
