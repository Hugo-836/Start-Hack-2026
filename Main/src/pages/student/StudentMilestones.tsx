import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Clock, AlertTriangle, MessageSquare, Paperclip, Plus, Send, Sparkles, Trash2, Upload, X } from "lucide-react";
import {
  addInteractiveCustomMilestone,
  attachInteractiveMilestoneFile,
  deleteInteractiveMilestone,
  DEMO_STUDENT,
  getInteractivePhaseState,
  getInteractiveStudentWorkspace,
  INTERACTIVE_WORKSPACE_EVENT,
  type ProjectDocument,
  removeInteractiveMilestoneAttachment,
  restoreInteractiveDefaultMilestones,
  type MilestoneAttachment,
  type MilestoneItem,
  type MilestoneStatus,
  type PhaseState,
  phases,
  saveInteractiveMilestones,
  updateInteractiveMilestoneStatus,
} from "@/lib/interactiveMilestones";

const statusConfig: Record<MilestoneStatus, { icon: typeof Circle; color: string; label: string }> = {
  upcoming: { icon: Circle, color: "text-muted-foreground", label: "Upcoming" },
  in_progress: { icon: Clock, color: "text-blue-600", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-600", label: "Completed" },
  overdue: { icon: AlertTriangle, color: "text-red-600", label: "Overdue" },
};

const selectableStatuses: MilestoneStatus[] = ["upcoming", "in_progress", "completed"];
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const inspirationalQuotes = [
  "Progress is built one honest step at a time.",
  "Small consistent moves beat perfect plans left untouched.",
  "Your thesis does not need magic, it needs momentum.",
  "Every finished task makes the next one lighter.",
  "Clarity grows when you keep moving.",
];

type SuggestedTask = {
  title: string;
  description: string;
};

type TaskChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SuggestionContext = {
  phaseState: PhaseState[];
  student: any;
  projects: any[];
  feedbacks: any[];
  projectDocuments: ProjectDocument[];
};

function getContextDocuments(context: SuggestionContext) {
  return [
    ...context.phaseState.flatMap((phase) =>
      phase.milestones
        .filter((milestone) => milestone.attachment)
        .map((milestone) => ({
          phaseKey: phase.key,
          milestoneTitle: milestone.title,
          name: milestone.attachment?.name || "",
          type: milestone.attachment?.type || "",
        })),
    ),
    ...context.projectDocuments.map((document) => ({
      phaseKey: "project",
      milestoneTitle: "Project file",
      name: document.name,
      type: document.type || "",
    })),
  ];
}

function buildAiSuggestions(phaseKey: string, context: SuggestionContext): SuggestedTask[] {
  const { student, projects, feedbacks } = context;
  const attachments = getContextDocuments(context);

  const attachmentNames = attachments.map((attachment) => attachment.name.toLowerCase());
  const hasPdf = attachments.some((attachment) => attachment.type.includes("pdf") || attachment.name.toLowerCase().endsWith(".pdf"));
  const hasSpreadsheet = attachmentNames.some((name) => name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls"));
  const hasSlides = attachmentNames.some((name) => name.endsWith(".ppt") || name.endsWith(".pptx"));
  const hasInterviewNotes = attachmentNames.some((name) => name.includes("interview") || name.includes("notes") || name.includes("meeting"));
  const latestAttachment = attachments[attachments.length - 1];
  const activeProject = projects.find((project) => project.state === "in_progress" || project.state === "agreed") || projects[0];
  const latestFeedback = feedbacks.find((feedback) => feedback.reviewer_feedback);
  const topSkill = student?.skills?.[0];
  const aboutText = student?.about?.trim();
  const projectTitle = activeProject?.title?.trim();
  const projectDescription = activeProject?.description?.trim() || activeProject?.motivation?.trim();
  const feedbackText = latestFeedback?.reviewer_feedback?.trim();

  const suggestionsByPhase: Record<string, SuggestedTask[]> = {
    orientation: [
      {
        title: "Review your thesis context",
        description: latestAttachment
          ? `Read through ${latestAttachment.name}${projectTitle ? ` and connect it to ${projectTitle}` : ""} to extract the main constraints for your thesis setup.`
          : projectTitle
            ? `Review ${projectTitle} and extract the main constraints for your thesis setup.`
            : "Review your current thesis context in the site and extract the main constraints for your setup.",
      },
      {
        title: "Summarize initial requirements",
        description: aboutText
          ? `Use your profile and thesis context to write a short list of what ${aboutText.slice(0, 80)}${aboutText.length > 80 ? "..." : ""} implies for scope and deliverables.`
          : "Write a short list of what your profile, project details, and uploaded material imply for timeline, scope, and deliverables.",
      },
    ],
    topic_search: [
      {
        title: "Extract topic ideas from your site data",
        description: projectDescription
          ? `List research directions inspired by your project description: ${projectDescription.slice(0, 90)}${projectDescription.length > 90 ? "..." : ""}`
          : "List research directions inspired by your uploaded files, project details, and student profile.",
      },
      {
        title: hasPdf ? "Turn source PDFs into topic notes" : "Turn your thesis context into topic notes",
        description: topSkill
          ? `Capture the strongest concepts, keywords, and open questions around your ${topSkill} focus.`
          : "Capture the strongest concepts, keywords, and open questions from your documents and project context.",
      },
    ],
    planning: [
      {
        title: hasSpreadsheet ? "Build a plan from uploaded data" : "Build a plan from your site evidence",
        description: projectTitle
          ? `Use all current information around ${projectTitle} to define next milestones, dependencies, and deadlines.`
          : "Use your uploaded material, project details, and profile data to define next milestones, dependencies, and deadlines.",
      },
      {
        title: "Identify missing inputs",
        description: feedbackText
          ? `Check which pieces are still missing after this feedback: ${feedbackText.slice(0, 90)}${feedbackText.length > 90 ? "..." : ""}`
          : "Check which pieces are still missing across your profile, project details, and uploaded material before execution.",
      },
    ],
    execution: [
      {
        title: hasInterviewNotes ? "Analyze uploaded notes" : "Analyze your current work",
        description: latestFeedback
          ? "Review your attachments together with reviewer feedback and extract the next execution step."
          : "Review your attachments, project details, and current site data to extract key findings for execution.",
      },
      {
        title: hasSpreadsheet ? "Clean and validate your dataset" : "Validate your current evidence",
        description: "Make sure the material stored across the site is usable, complete, and ready for analysis.",
      },
    ],
    writing: [
      {
        title: hasSlides ? "Turn uploaded slides into writing points" : "Turn your site material into writing points",
        description: "Use your uploaded documents, project description, and feedback to prepare arguments, structure, and evidence for the draft.",
      },
      {
        title: "Add citations and references",
        description: "Review documents, project content, and feedback across the site and note what should be cited or referenced in the manuscript.",
      },
    ],
  };

  const fallbackSuggestions: SuggestedTask[] = [
    {
      title: "Review uploaded files",
      description: "Go through the files already uploaded in the site and note the next concrete action.",
    },
  ];

  return suggestionsByPhase[phaseKey] || fallbackSuggestions;
}

function buildTaskAdvice(milestone: MilestoneItem, context: SuggestionContext): string[] {
  const { student, projects, feedbacks } = context;
  const attachments = getContextDocuments(context).map((item) => item.name).filter(Boolean) as string[];
  const activeProject = projects.find((project) => project.state === "in_progress" || project.state === "agreed") || projects[0];
  const latestFeedback = feedbacks.find((feedback) => feedback.reviewer_feedback);

  const advice = [
    activeProject?.title
      ? `Keep this task aligned with your current project: ${activeProject.title}.`
      : "Tie this task to your current thesis objective before you start writing or researching.",
    latestFeedback?.reviewer_feedback
      ? `Use the latest feedback as a checklist: ${latestFeedback.reviewer_feedback.slice(0, 110)}${latestFeedback.reviewer_feedback.length > 110 ? "..." : ""}`
      : "Produce something concrete quickly so you can get feedback early.",
    attachments.length > 0
      ? `Reuse existing material first, especially ${attachments[attachments.length - 1]}.`
      : "Check whether you already have notes or material in the site before starting from zero.",
    student?.skills?.length
      ? `Lean on your strengths here, especially ${student.skills.slice(0, 2).join(" and ")}.`
      : "Break this into one small next action to keep momentum.",
  ];

  if (milestone.attachment) {
    advice.unshift(`You already attached ${milestone.attachment.name} to this task. Use it as your main reference.`);
  }

  return advice.slice(0, 4);
}

function buildTaskChatReply(question: string, milestone: MilestoneItem, context: SuggestionContext) {
  const { projects, feedbacks, student } = context;
  const activeProject = projects.find((project) => project.state === "in_progress" || project.state === "agreed") || projects[0];
  const latestFeedback = feedbacks.find((feedback) => feedback.reviewer_feedback);
  const latestDocument = getContextDocuments(context)[getContextDocuments(context).length - 1];
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("feedback")) {
    return latestFeedback?.reviewer_feedback
      ? `The most useful feedback to apply here is: "${latestFeedback.reviewer_feedback}". I’d turn that into a mini checklist for "${milestone.title}".`
      : `There is no strong feedback recorded yet, so I’d define one small deliverable for "${milestone.title}" and get it reviewed quickly.`;
  }

  if (lowerQuestion.includes("document") || lowerQuestion.includes("file") || lowerQuestion.includes("upload")) {
    return milestone.attachment
      ? `Start with ${milestone.attachment.name}. Extract 3 useful points from it, then use those points to move "${milestone.title}" forward.`
      : latestDocument
        ? `Start from ${latestDocument.name}, then connect it to "${milestone.title}" before creating new material.`
        : `Start from the documents already available in the site, then connect them to "${milestone.title}" before creating new material.`;
  }

  if (lowerQuestion.includes("start") || lowerQuestion.includes("how")) {
    return `For "${milestone.title}", I’d begin with one concrete next action tied to ${activeProject?.title || "your current thesis project"}, then use any existing feedback or uploaded material to shape the first version.`;
  }

  return [
    `For "${milestone.title}", keep the output useful for ${activeProject?.title || "your thesis project"}.`,
    latestFeedback?.reviewer_feedback
      ? `Also keep this feedback in mind: "${latestFeedback.reviewer_feedback.slice(0, 100)}${latestFeedback.reviewer_feedback.length > 100 ? "..." : ""}"`
      : "Try to produce something reviewable quickly instead of waiting for a perfect version.",
    student?.skills?.length ? `Use your strengths, especially ${student.skills.slice(0, 2).join(" and ")}.` : "Break the task into a small first step.",
  ].join(" ");
}

export default function StudentMilestones() {
  const [phaseState, setPhaseState] = useState<PhaseState[]>(() => getInteractivePhaseState());
  const [workspace, setWorkspace] = useState(() => getInteractiveStudentWorkspace(DEMO_STUDENT));
  const [selectedPhaseKey, setSelectedPhaseKey] = useState<string>(phases[0]?.key ?? "");
  const [activeTab, setActiveTab] = useState<"tasks" | "create">("tasks");
  const [newTaskPhaseKey, setNewTaskPhaseKey] = useState<string>(phases[0]?.key ?? "");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [quote, setQuote] = useState(inspirationalQuotes[0]);
  const [expandedSuggestionTitles, setExpandedSuggestionTitles] = useState<string[]>([]);
  const [expandedAdviceIds, setExpandedAdviceIds] = useState<string[]>([]);
  const [chatTask, setChatTask] = useState<{ phaseKey: string; milestoneId: string } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessagesByTask, setChatMessagesByTask] = useState<Record<string, TaskChatMessage[]>>({});
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [lockPromptOpen, setLockPromptOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    phaseKey: string;
    milestoneId: string;
    currentStatus: MilestoneStatus;
    nextStatus: MilestoneStatus;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const student = workspace.student;
  const studentProjects = workspace.studentProjects;
  const studentFeedbacks = workspace.studentFeedbacks;
  const connectedPeers = workspace.peerConnections
    .map((connection: any) =>
      workspace.students.find((item: any) =>
        item.id === (connection.student_a_id === DEMO_STUDENT ? connection.student_b_id : connection.student_a_id),
      ),
    )
    .filter(Boolean);
  const connectedMentors = Array.from(
    new Set(
      studentProjects.flatMap((project: any) => [
        ...(project.supervisor_ids || []).map((id: string) => {
          const supervisor = workspace.supervisors.find((item: any) => item.id === id);
          return supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : null;
        }),
        ...(project.expert_ids || []).map((id: string) => {
          const expert = workspace.experts.find((item: any) => item.id === id);
          return expert ? `${expert.first_name} ${expert.last_name}` : null;
        }),
      ]),
    ),
  ).filter(Boolean);
  const totalMilestones = phaseState.reduce((total, phase) => total + phase.milestones.length, 0);
  const aiSuggestions = buildAiSuggestions(newTaskPhaseKey, {
    phaseState,
    student,
    projects: studentProjects,
    feedbacks: studentFeedbacks,
    projectDocuments: workspace.projectDocuments,
  });
  const completedMilestones = phaseState.reduce(
    (total, phase) => total + phase.milestones.filter((milestone) => milestone.status === "completed").length,
    0,
  );
  const completionPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const completedPhases = new Set(
    phaseState
      .filter((phase) => phase.milestones.length > 0 && phase.milestones.every((milestone) => milestone.status === "completed"))
      .map((phase) => phase.key),
  );
  const activePhases = new Set(
    phaseState
      .filter(
        (phase) =>
          !completedPhases.has(phase.key) &&
          phase.milestones.some(
            (milestone) => milestone.status === "in_progress" || milestone.status === "completed",
          ),
      )
      .map((phase) => phase.key),
  );
  const isPhaseUnlocked = (phaseKey: string) => {
    const phaseIndex = phaseState.findIndex((phase) => phase.key === phaseKey);
    if (phaseIndex <= 0) return true;

    const previousPhase = phaseState[phaseIndex - 1];
    return previousPhase.milestones.length > 0 && previousPhase.milestones.every((milestone) => milestone.status === "completed");
  };
  const isStatusChangeBlocked = (phaseKey: string, currentStatus: MilestoneStatus, nextStatus: MilestoneStatus) =>
    !isPhaseUnlocked(phaseKey) && currentStatus === "upcoming" && nextStatus !== "upcoming";

  const getNextStatus = (status: MilestoneStatus) => {
    const currentIndex = selectableStatuses.indexOf(status);
    if (currentIndex === -1 || currentIndex === selectableStatuses.length - 1) {
      return selectableStatuses[0];
    }

    return selectableStatuses[currentIndex + 1];
  };

  useEffect(() => {
    setPhaseState(getInteractivePhaseState());
    setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
  }, []);

  useEffect(() => {
    setQuote(inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);
  }, []);

  useEffect(() => {
    const syncWorkspace = () => setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
    window.addEventListener("focus", syncWorkspace);
    return () => {
      window.removeEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
      window.removeEventListener("focus", syncWorkspace);
    };
  }, []);

  useEffect(() => {
    if (phaseState.length === 0) return;

    const selectedPhaseExists = phaseState.some((phase) => phase.key === selectedPhaseKey);
    if (!selectedPhaseExists) {
      setSelectedPhaseKey(phaseState[0].key);
    }

    const newTaskPhaseExists = phaseState.some((phase) => phase.key === newTaskPhaseKey);
    if (!newTaskPhaseExists) {
      setNewTaskPhaseKey(phaseState[0].key);
    }
  }, [newTaskPhaseKey, phaseState, selectedPhaseKey]);

  useEffect(() => {
    setNewTaskPhaseKey(selectedPhaseKey);
  }, [selectedPhaseKey]);

  const updateMilestoneStatus = (
    phaseKey: string,
    milestoneId: string,
    currentStatus: MilestoneStatus,
    nextStatus: MilestoneStatus,
    force = false,
  ) => {
    if (!force && isStatusChangeBlocked(phaseKey, currentStatus, nextStatus)) {
      setPendingStatusChange({ phaseKey, milestoneId, currentStatus, nextStatus });
      setLockPromptOpen(true);
      return;
    }

    setPhaseState((current) => {
      const nextState = updateInteractiveMilestoneStatus(current, phaseKey, milestoneId, nextStatus);

      const updatedPhaseIndex = nextState.findIndex((phase) => phase.key === phaseKey);
      const updatedPhase = updatedPhaseIndex >= 0 ? nextState[updatedPhaseIndex] : null;
      const isPhaseCompleted = updatedPhase ? updatedPhase.milestones.length > 0 && updatedPhase.milestones.every((milestone) => milestone.status === "completed") : false;

      if (nextStatus === "completed" && isPhaseCompleted) {
        const nextPhase = nextState[updatedPhaseIndex + 1];
        if (nextPhase) {
          setSelectedPhaseKey(nextPhase.key);
        }
      }

      saveInteractiveMilestones(nextState);
      return nextState;
    });
  };

  const handleAddCustomTask = () => {
    const title = newTaskTitle.trim();
    const description = newTaskDescription.trim();
    if (!title) return;

    const customMilestone: MilestoneItem = {
      id: `custom-${Date.now()}`,
      title,
      description: description || null,
      status: "upcoming",
      due_date: null,
      isCustom: true,
    };

    setPhaseState((current) => {
      const nextState = addInteractiveCustomMilestone(current, newTaskPhaseKey, customMilestone);
      saveInteractiveMilestones(nextState);
      return nextState;
    });

    setSelectedPhaseKey(newTaskPhaseKey);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setActiveTab("tasks");
  };

  const handleUseSuggestion = (suggestion: SuggestedTask) => {
    setNewTaskTitle(suggestion.title);
    setNewTaskDescription(suggestion.description);
  };

  const toggleSuggestionExpansion = (title: string) => {
    setExpandedSuggestionTitles((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  };

  const toggleAdviceExpansion = (milestoneId: string) => {
    setExpandedAdviceIds((current) =>
      current.includes(milestoneId)
        ? current.filter((item) => item !== milestoneId)
        : [...current, milestoneId],
    );
  };

  const openTaskChat = (phaseKey: string, milestoneId: string) => {
    setChatTask({ phaseKey, milestoneId });
    setChatInput("");
    setChatMessagesByTask((current) => ({
      ...current,
      [milestoneId]:
        current[milestoneId] && current[milestoneId].length > 0
          ? current[milestoneId]
          : [
              {
                role: "assistant",
                content: "Ask me for help on this task. I can use your project, feedback, profile, and uploaded documents.",
              },
            ],
    }));
  };

  const handleSendChatMessage = async () => {
    if (!chatTask || !chatInput.trim()) return;

    const phase = phaseState.find((item) => item.key === chatTask.phaseKey);
    const milestone = phase?.milestones.find((item) => item.id === chatTask.milestoneId);
    if (!milestone) return;

    const prompt = chatInput.trim();
    setChatMessagesByTask((current) => ({
      ...current,
      [chatTask.milestoneId]: [
        ...(current[chatTask.milestoneId] || []),
        { role: "user", content: prompt },
      ],
    }));
    setChatInput("");

    const fallbackReply = buildTaskChatReply(prompt, milestone, {
      phaseState,
      student,
      projects: studentProjects,
      feedbacks: studentFeedbacks,
      projectDocuments: workspace.projectDocuments,
    });

    try {
      setIsChatLoading(true);
      const response = await fetch("/api/task-ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            title: milestone.title,
            description: milestone.description,
            phaseKey: chatTask.phaseKey,
            status: milestone.status,
            attachmentName: milestone.attachment?.name || null,
          },
          context: {
            student: student
              ? {
                  first_name: student.first_name,
                  last_name: student.last_name,
                  degree: student.degree,
                  skills: student.skills,
                  about: student.about,
                }
              : null,
            projects: studentProjects.map((project: any) => ({
              title: project.title,
              description: project.description,
              motivation: project.motivation,
              state: project.state,
            })),
            feedbacks: studentFeedbacks.map((feedback: any) => ({
              title: feedback.title,
              reviewer_feedback: feedback.reviewer_feedback,
              ai_summary: feedback.ai_summary,
              status: feedback.status,
            })),
            attachments: getContextDocuments({
              phaseState,
              student,
              projects: studentProjects,
              feedbacks: studentFeedbacks,
              projectDocuments: workspace.projectDocuments,
            }).map((item) => item.name),
            peers: connectedPeers.map((peer: any) => ({
              first_name: peer.first_name,
              last_name: peer.last_name,
            })),
            mentors: connectedMentors,
          },
          messages: [
            ...(chatMessagesByTask[chatTask.milestoneId] || []),
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Task AI chat failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      const assistantReply = data.reply?.trim() || fallbackReply;

      setChatMessagesByTask((current) => ({
        ...current,
        [chatTask.milestoneId]: [
          ...(current[chatTask.milestoneId] || []),
          { role: "assistant", content: assistantReply },
        ],
      }));
    } catch {
      setChatMessagesByTask((current) => ({
        ...current,
        [chatTask.milestoneId]: [
          ...(current[chatTask.milestoneId] || []),
          { role: "assistant", content: fallbackReply },
        ],
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteTask = (phaseKey: string, milestoneId: string) => {
    setPhaseState((current) => {
      const nextState = deleteInteractiveMilestone(current, phaseKey, milestoneId);
      saveInteractiveMilestones(nextState);
      return nextState;
    });
  };

  const handleRestoreDefaultTasks = () => {
    setPhaseState((current) => {
      const nextState = restoreInteractiveDefaultMilestones(current);
      saveInteractiveMilestones(nextState);
      return nextState;
    });
  };

  const handleAttachFile = (phaseKey: string, milestoneId: string, file: File | null) => {
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setUploadError("Please choose a file smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setUploadError("This file could not be attached.");
        return;
      }

      const attachment: MilestoneAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      };

      setPhaseState((current) => {
        const nextState = attachInteractiveMilestoneFile(current, phaseKey, milestoneId, attachment);
        saveInteractiveMilestones(nextState);
        return nextState;
      });

      setUploadError(null);
    };

    reader.onerror = () => {
      setUploadError("This file could not be attached.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (phaseKey: string, milestoneId: string) => {
    setPhaseState((current) => {
      const nextState = removeInteractiveMilestoneAttachment(current, phaseKey, milestoneId);
      saveInteractiveMilestones(nextState);
      return nextState;
    });
  };

  const handleConfirmBlockedStatusChange = () => {
    if (!pendingStatusChange) return;

    updateMilestoneStatus(
      pendingStatusChange.phaseKey,
      pendingStatusChange.milestoneId,
      pendingStatusChange.currentStatus,
      pendingStatusChange.nextStatus,
      true,
    );
    setLockPromptOpen(false);
    setPendingStatusChange(null);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <Dialog open={Boolean(chatTask)} onOpenChange={(open) => !open && setChatTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ask AI About This Task</DialogTitle>
            <DialogDescription>
              Ask for help using your project context, feedback, profile, and uploaded documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-xl border bg-secondary/20 p-3">
              {(chatTask ? chatMessagesByTask[chatTask.milestoneId] : [])?.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    message.role === "assistant"
                      ? "bg-background text-foreground"
                      : "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                rows={4}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Example: How should I start this task with the feedback and documents I already have?"
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handleSendChatMessage} disabled={!chatInput.trim() || isChatLoading}>
                  <Send className="h-4 w-4" />
                  {isChatLoading ? "Thinking..." : "Ask AI"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={lockPromptOpen}
        onOpenChange={(open) => {
          setLockPromptOpen(open);
          if (!open) {
            setPendingStatusChange(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish the previous phase first?</AlertDialogTitle>
            <AlertDialogDescription>
              This task belongs to a phase that is still locked. You can go back and complete the previous phase first, or force this task anyway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ok, I&apos;ll finish the previous tasks</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBlockedStatusChange}>
              Mark it anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="ds-title-lg tracking-tight">Progress</h1>
          <p className="ds-body text-muted-foreground mt-1">Track your milestones across the 5 thesis phases and check them off as you go.</p>
          <p className="ds-small text-ai mt-2">{quote}</p>
          <Link to="/student/67" className="inline-block mt-2 text-[10px] text-transparent select-none hover:text-muted-foreground/40">
            67
          </Link>
        </div>
        <div className={`rounded-full px-4 py-2 text-left shrink-0 ${completionPercentage === 100 ? "bg-emerald-100" : "bg-secondary"}`}>
          <p className={`ds-caption ${completionPercentage === 100 ? "text-emerald-700" : "text-muted-foreground"}`}>Completed</p>
          <p className={`ds-title-cards leading-none mt-1 ${completionPercentage === 100 ? "text-emerald-800" : ""}`}>{completionPercentage}%</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tasks" | "create")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="create">Add task</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-8">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleRestoreDefaultTasks}>
              Restore default tasks
            </Button>
          </div>
          {uploadError && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 ds-small text-destructive">
              {uploadError}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-2">
        {phases.map((phase, i) => (
          <div key={phase.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedPhaseKey(phase.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                selectedPhaseKey === phase.key
                  ? completedPhases.has(phase.key)
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : activePhases.has(phase.key)
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-secondary border-border text-foreground"
                  : completedPhases.has(phase.key)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : activePhases.has(phase.key)
                      ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-background text-muted-foreground border-border"
              }`}
              aria-pressed={selectedPhaseKey === phase.key}
            >
              <span className={`ds-badge ${
                completedPhases.has(phase.key)
                  ? "text-emerald-700"
                  : activePhases.has(phase.key)
                    ? "text-blue-700"
                    : "text-muted-foreground"
              }`}>{i + 1}</span>
              <span className="ds-label">{phase.label}</span>
            </button>
            {i < phases.length - 1 && <div className="h-px w-6 bg-border shrink-0" />}
          </div>
        ))}
          </div>

          {phaseState
              .filter((group) => group.key === selectedPhaseKey)
              .map((group) => (
                <div key={group.key} className="space-y-3">
                  {(() => {
                    const isUnlocked = isPhaseUnlocked(group.key);
                    return (
                      <>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="ds-title-cards">{group.label}</h2>
                      {group.isUsingFallback && (
                        <Badge variant="outline" className="ds-badge">
                          Interactive plan
                        </Badge>
                      )}
                      {!isUnlocked && (
                        <Badge variant="outline" className="ds-badge">
                          Finish previous phase first
                        </Badge>
                      )}
                    </div>
                    <p className="ds-small text-muted-foreground">{group.intro}</p>
                  </div>

                  {group.milestones.map((milestone) => {
                    const config = statusConfig[milestone.status] || statusConfig.upcoming;
                    const Icon = config.icon;
                    const isCompleted = milestone.status === "completed";
                    const statusLocked = isStatusChangeBlocked(group.key, milestone.status, getNextStatus(milestone.status));
                    const taskAdvice = buildTaskAdvice(milestone, {
                      phaseState,
                      student,
                      projects: studentProjects,
                      feedbacks: studentFeedbacks,
                      projectDocuments: workspace.projectDocuments,
                    });
                    const isAdviceExpanded = expandedAdviceIds.includes(milestone.id);

                    return (
                      <Card key={milestone.id} className="border shadow-none">
                        <CardContent className="py-4 space-y-3">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => updateMilestoneStatus(group.key, milestone.id, milestone.status, getNextStatus(milestone.status))}
                              className={`shrink-0 rounded-full transition-opacity hover:opacity-80 ${statusLocked ? "opacity-50" : ""}`}
                              aria-label={`Change status for ${milestone.title}`}
                            >
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`ds-label truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{milestone.title}</p>
                                {milestone.isCustom && (
                                  <Badge variant="outline" className="ds-badge">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                              {milestone.description && (
                                <p className={`ds-caption truncate ${isCompleted ? "text-muted-foreground/70 line-through" : "text-muted-foreground"}`}>
                                  {milestone.description}
                                </p>
                              )}
                              {milestone.attachment && (
                                <div className="mt-2 flex items-center gap-2">
                                  <a
                                    href={milestone.attachment.dataUrl}
                                    download={milestone.attachment.name}
                                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-secondary px-2.5 py-1 ds-caption text-foreground hover:bg-secondary/80"
                                  >
                                    <Paperclip className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{milestone.attachment.name}</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(group.key, milestone.id)}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    aria-label={`Remove file from ${milestone.title}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div>
                                <input
                                  id={`attachment-${group.key}-${milestone.id}`}
                                  type="file"
                                  className="sr-only"
                                  onChange={(event) => {
                                    handleAttachFile(group.key, milestone.id, event.target.files?.[0] || null);
                                    event.currentTarget.value = "";
                                  }}
                                />
                                <label
                                  htmlFor={`attachment-${group.key}-${milestone.id}`}
                                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                  aria-label={`Attach file to ${milestone.title}`}
                                >
                                  <Upload className="h-4 w-4" />
                                </label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTask(group.key, milestone.id)}
                                aria-label={`Delete ${milestone.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {milestone.due_date && <span className="ds-caption text-muted-foreground">{new Date(milestone.due_date).toLocaleDateString("en-US")}</span>}
                              <button
                                type="button"
                                onClick={() => updateMilestoneStatus(group.key, milestone.id, milestone.status, getNextStatus(milestone.status))}
                                className={`inline-flex h-8 min-w-[132px] items-center justify-center rounded-md bg-secondary px-3 py-1 ds-badge transition-colors hover:bg-secondary/80 ${statusLocked ? "opacity-50" : ""} ${config.color}`}
                                aria-label={`Change status for ${milestone.title}`}
                              >
                                {config.label}
                              </button>
                            </div>
                          </div>

                          <div className="pl-9">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => toggleAdviceExpansion(milestone.id)}
                                className="inline-flex items-center gap-1 ds-caption text-ai hover:underline"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                {isAdviceExpanded ? "Hide AI tips" : "Show AI tips"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openTaskChat(group.key, milestone.id)}
                                className="inline-flex items-center gap-1 ds-caption text-ai hover:underline"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Ask AI
                              </button>
                            </div>

                            {isAdviceExpanded && (
                              <div className="mt-2 rounded-xl border border-ai/20 bg-ai/5 p-3 space-y-2">
                                <p className="ds-label text-ai">AI tips for this task</p>
                                {taskAdvice.map((tip) => (
                                  <p key={tip} className="ds-caption text-muted-foreground">
                                    {tip}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                      </>
                    );
                  })()}
                </div>
              ))
          }
        </TabsContent>

        <TabsContent value="create">
          <Card className="border shadow-none">
            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="space-y-4">
                  <div>
                    <h2 className="ds-title-cards">Add a personal task</h2>
                    <p className="ds-small text-muted-foreground mt-1">Create your own task and place it in the thesis phase you want.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="ds-label">Phase</label>
                    <Select value={newTaskPhaseKey} onValueChange={setNewTaskPhaseKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phases.map((phase) => (
                          <SelectItem key={phase.key} value={phase.key}>
                            {phase.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="ds-label">Task title</label>
                    <Input
                      value={newTaskTitle}
                      onChange={(event) => setNewTaskTitle(event.target.value)}
                      placeholder="Example: Send draft to my supervisor"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ds-label">Short description</label>
                    <Input
                      value={newTaskDescription}
                      onChange={(event) => setNewTaskDescription(event.target.value)}
                      placeholder="Optional details for this task"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleAddCustomTask} disabled={!newTaskTitle.trim()}>
                      <Plus className="h-4 w-4" />
                      Add task
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-ai/20 bg-ai/5 p-4 h-fit">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-ai p-2 shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="ds-label text-ai">AI task suggestions</p>
                      <p className="ds-small text-muted-foreground mt-1">
                        Suggestions are based on your project details, profile, feedback, and uploaded files across the site for the selected phase.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion) => (
                      <div key={suggestion.title} className="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-3">
                        <div className="min-w-0">
                          {(() => {
                            const isExpanded = expandedSuggestionTitles.includes(suggestion.title);
                            const shortDescription =
                              suggestion.description.length > 90
                                ? `${suggestion.description.slice(0, 90)}...`
                                : suggestion.description;

                            return (
                              <>
                          <p className="ds-label">{suggestion.title}</p>
                          <p className="ds-caption text-muted-foreground mt-1">
                            {isExpanded ? suggestion.description : shortDescription}
                          </p>
                          {suggestion.description.length > 90 && (
                            <button
                              type="button"
                              onClick={() => toggleSuggestionExpansion(suggestion.title)}
                              className="mt-1 ds-caption text-ai hover:underline"
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </button>
                          )}
                              </>
                            );
                          })()}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleUseSuggestion(suggestion)}>
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
