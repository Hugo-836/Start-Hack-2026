export const DEMO_STUDENT = "student-04";
export const INTERACTIVE_MILESTONES_STORAGE_KEY = `studyond-interactive-milestones-${DEMO_STUDENT}`;
export const INTERACTIVE_MILESTONES_EVENT = "studyond:interactive-milestones-updated";

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

export function getInteractiveMilestoneCount(milestones: any[] | undefined) {
  return loadInteractiveMilestones(milestones).reduce(
    (total, phase) => total + phase.milestones.filter((milestone) => milestone.status === "completed").length,
    0,
  );
}
