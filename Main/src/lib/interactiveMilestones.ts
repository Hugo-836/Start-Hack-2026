export const DEMO_STUDENT = "student-11";
export const INTERACTIVE_MILESTONES_STORAGE_KEY = `studyond-interactive-milestones-${DEMO_STUDENT}`;
export const INTERACTIVE_MILESTONES_EVENT = "studyond:interactive-milestones-updated";
export const INTERACTIVE_WORKSPACE_STORAGE_KEY = `studyond-interactive-workspace-${DEMO_STUDENT}`;
export const INTERACTIVE_WORKSPACE_EVENT = "studyond:interactive-workspace-updated";

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
  type: string;
  size: number;
  dataUrl: string;
  created_at: string;
};

type WorkspaceState = {
  customFeedbacks: WorkspaceFeedback[];
  projectDocuments: ProjectDocument[];
};

const baseStudents = [
  {
    id: "student-11",
    first_name: "Jules",
    last_name: "Mangin",
    degree: "master",
    university_id: "epfl",
    skills: ["UX Research", "Prototyping", "Data Analysis"],
    objectives: ["Write a strong thesis", "Find an applied research topic"],
    field_ids: ["field-hci", "field-ai-ethics"],
    about: "Curious student interested in product design, human-centered AI, and useful research outputs.",
  },
  {
    id: "student-12",
    first_name: "Nora",
    last_name: "Favre",
    degree: "master",
    university_id: "epfl",
    skills: ["Qualitative Research", "Interview Analysis", "Writing"],
    objectives: ["Improve research methods", "Collaborate with peers"],
    field_ids: ["field-hci", "field-writing"],
    about: "Works on participatory design and academic writing.",
  },
  {
    id: "student-13",
    first_name: "Adam",
    last_name: "Roux",
    degree: "master",
    university_id: "unil",
    skills: ["Machine Learning", "Statistics", "Data Visualization"],
    objectives: ["Structure experiments", "Explore AI applications"],
    field_ids: ["field-ml", "field-dataviz"],
    about: "Interested in applied ML and clear communication of results.",
  },
] as const;

const baseFields = [
  { id: "field-hci", name: "Human-Computer Interaction" },
  { id: "field-ai-ethics", name: "AI Ethics" },
  { id: "field-writing", name: "Academic Writing" },
  { id: "field-ml", name: "Machine Learning" },
  { id: "field-dataviz", name: "Data Visualization" },
] as const;

const baseSupervisors = [
  {
    id: "supervisor-01",
    first_name: "Elena",
    last_name: "Rossi",
    title: "Prof.",
    email: "elena.rossi@epfl.ch",
  },
  {
    id: "supervisor-02",
    first_name: "Marc",
    last_name: "Dubois",
    title: "Dr.",
    email: "marc.dubois@unil.ch",
  },
] as const;

const baseExperts = [
  {
    id: "expert-01",
    first_name: "Sofia",
    last_name: "Meyer",
    title: "Academic Writing Coach",
    email: "sofia.meyer@idiap.ch",
  },
  {
    id: "expert-02",
    first_name: "Luca",
    last_name: "Bernard",
    title: "Research Methods Specialist",
    email: "luca.bernard@epfl.ch",
  },
] as const;

const baseProjects = [
  {
    id: "project-11",
    student_id: "student-11",
    title: "Designing AI Progress Tools for Thesis Students",
    description:
      "Explore how guided progress tracking, contextual suggestions, and mentor feedback can support thesis momentum.",
    motivation:
      "I want to build a student-facing interface that makes the thesis process less opaque and more actionable.",
    state: "in_progress",
    supervisor_ids: ["supervisor-01"],
    expert_ids: ["expert-01", "expert-02"],
    created_at: "2026-02-15T09:00:00.000Z",
    updated_at: "2026-03-18T16:30:00.000Z",
  },
  {
    id: "project-12",
    student_id: "student-12",
    title: "Improving Thesis Writing Support Through Peer Review",
    description:
      "Study how structured peer review can improve writing confidence and research clarity in student theses.",
    motivation: "I want to create better support loops for writing-intensive thesis work.",
    state: "agreed",
    supervisor_ids: ["supervisor-01"],
    expert_ids: ["expert-01"],
    created_at: "2026-02-12T10:00:00.000Z",
    updated_at: "2026-03-12T11:00:00.000Z",
  },
  {
    id: "project-13",
    student_id: "student-13",
    title: "Visual Analytics for Student Research Dashboards",
    description:
      "Investigate visual ways to help students interpret research progress and experimental evidence.",
    motivation: "I enjoy turning complex data into interfaces that are easy to reason about.",
    state: "in_progress",
    supervisor_ids: ["supervisor-02"],
    expert_ids: ["expert-02"],
    created_at: "2026-02-20T13:00:00.000Z",
    updated_at: "2026-03-16T14:00:00.000Z",
  },
] as const;

const baseFeedbacks: WorkspaceFeedback[] = [
  {
    id: "feedback-01",
    student_id: "student-11",
    title: "Initial topic framing",
    submission_text: "I drafted the first framing for the thesis scope and research opportunity.",
    file_name: "topic-framing.pdf",
    reviewer_feedback:
      "The framing is promising. Narrow the target user group and make the research question more explicit.",
    ai_summary:
      "Clarify the user segment, tighten the research question, and connect the scope more directly to your evaluation plan.",
    status: "reviewed",
    reviewer_id: "supervisor-01",
    reviewer_type: "supervisor",
  },
  {
    id: "feedback-02",
    student_id: "student-11",
    title: "Interview guide draft",
    submission_text: "I prepared a first version of the interview questions for students and mentors.",
    file_name: "interview-guide.docx",
    reviewer_feedback: null,
    ai_summary: null,
    status: "submitted",
    reviewer_id: "expert-02",
    reviewer_type: "expert",
  },
];

const basePeerConnections = [
  {
    id: "peer-connection-01",
    student_a_id: "student-11",
    student_b_id: "student-12",
    status: "accepted",
  },
] as const;

const baseMockMentors = [
  {
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
  },
  {
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
  },
  {
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
  },
] as const;

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
  return loadInteractiveMilestones(undefined);
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
  return loadInteractiveMilestones(milestones).reduce(
    (total, phase) => total + phase.milestones.filter((milestone) => milestone.status === "completed").length,
    0,
  );
}

function loadInteractiveWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return { customFeedbacks: [], projectDocuments: [] };
  }

  const rawState = window.localStorage.getItem(INTERACTIVE_WORKSPACE_STORAGE_KEY);
  if (!rawState) {
    return { customFeedbacks: [], projectDocuments: [] };
  }

  try {
    const parsedState = JSON.parse(rawState) as WorkspaceState;
    return {
      customFeedbacks: Array.isArray(parsedState?.customFeedbacks) ? parsedState.customFeedbacks : [],
      projectDocuments: Array.isArray(parsedState?.projectDocuments) ? parsedState.projectDocuments : [],
    };
  } catch {
    return { customFeedbacks: [], projectDocuments: [] };
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
  return [...baseStudents];
}

export function getInteractiveFields() {
  return [...baseFields];
}

export function getInteractiveSupervisors() {
  return [...baseSupervisors];
}

export function getInteractiveExperts() {
  return [...baseExperts];
}

export function getInteractiveThesisProjects(studentId?: string) {
  const projects = [...baseProjects];
  return studentId ? projects.filter((project) => project.student_id === studentId) : projects;
}

export function getInteractiveFeedbacks(studentId?: string) {
  const workspaceState = loadInteractiveWorkspaceState();
  const feedbacks = [...baseFeedbacks, ...workspaceState.customFeedbacks];
  return studentId ? feedbacks.filter((feedback) => feedback.student_id === studentId) : feedbacks;
}

export function addInteractiveFeedbackSubmission(feedback: WorkspaceFeedback) {
  const workspaceState = loadInteractiveWorkspaceState();
  saveInteractiveWorkspaceState({
    ...workspaceState,
    customFeedbacks: [feedback, ...workspaceState.customFeedbacks],
  });
}

export function getInteractivePeerConnections(studentId?: string) {
  const connections = [...basePeerConnections];
  return studentId
    ? connections.filter(
        (connection) =>
          connection.student_a_id === studentId || connection.student_b_id === studentId,
      )
    : connections;
}

export function getInteractiveMockMentors() {
  return [...baseMockMentors];
}

export function getInteractiveStudent(studentId = DEMO_STUDENT) {
  return getInteractiveStudents().find((student) => student.id === studentId) || null;
}

export function getInteractivePrimaryProject(studentId = DEMO_STUDENT) {
  const projects = getInteractiveThesisProjects(studentId);
  return (
    projects.find((project) => project.state === "in_progress" || project.state === "agreed") ||
    projects[0] ||
    null
  );
}

export function getInteractiveStudentWorkspace(studentId = DEMO_STUDENT) {
  const students = getInteractiveStudents();
  const projects = getInteractiveThesisProjects();
  const supervisors = getInteractiveSupervisors();
  const experts = getInteractiveExperts();
  const feedbacks = getInteractiveFeedbacks();
  const peerConnections = getInteractivePeerConnections();
  const fields = getInteractiveFields();
  const mockMentors = getInteractiveMockMentors();

  const workspaceState = loadInteractiveWorkspaceState();

  return {
    students,
    student: students.find((item) => item.id === studentId) || null,
    projects,
    studentProjects: projects.filter((item) => item.student_id === studentId),
    activeProject:
      projects.find(
        (item) =>
          item.student_id === studentId &&
          (item.state === "in_progress" || item.state === "agreed"),
      ) || projects.find((item) => item.student_id === studentId) || null,
    supervisors,
    experts,
    feedbacks,
    studentFeedbacks: feedbacks.filter((item) => item.student_id === studentId),
    projectDocuments: workspaceState.projectDocuments.filter((item) =>
      projects.some((project) => project.student_id === studentId && project.id === item.project_id),
    ),
    peerConnections: peerConnections.filter(
      (item) => item.student_a_id === studentId || item.student_b_id === studentId,
    ),
    fields,
    mockMentors,
  };
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
