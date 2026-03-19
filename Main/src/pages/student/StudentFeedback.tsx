import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addInteractiveFeedbackSubmission,
  updateInteractiveFeedbackSubmission,
  clearInteractiveCustomFeedbacks,
  getInteractiveStudentWorkspace,
  INTERACTIVE_WORKSPACE_EVENT,
} from "@/lib/interactiveMilestones";
import { useDemoAuth } from "@/lib/demoAuth";

const statusConfig: Record<string, { icon: any; color: string; label: string; badgeClass: string }> = {
  pending: { icon: Send, color: "text-muted-foreground", label: "Pending", badgeClass: "bg-muted text-muted-foreground" },
  submitted: { icon: MessageSquare, color: "text-blue-600", label: "Submitted", badgeClass: "bg-blue-100 text-blue-800" },
  reviewed: { icon: CheckCheck, color: "text-emerald-600", label: "Reviewed", badgeClass: "bg-emerald-100 text-emerald-800" },
  revised: { icon: RotateCcw, color: "text-amber-600", label: "Revised", badgeClass: "bg-amber-100 text-amber-800" },
};

export default function StudentFeedback() {
  const { session } = useDemoAuth();
  const currentStudentId = session?.studentId;
  const [workspace, setWorkspace] = useState(() => getInteractiveStudentWorkspace(currentStudentId));
  const [file, setFile] = useState<File | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [aiFeedbackTypes, setAiFeedbackTypes] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const getReviewer = (id: string, type: string) =>
    type === "supervisor"
      ? workspace.supervisors.find((s: any) => s.id === id)
      : workspace.experts.find((e: any) => e.id === id);

  const allFeedbacks = workspace.studentFeedbacks;

  useEffect(() => {
    const syncWorkspace = () => setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
    window.addEventListener("storage", syncWorkspace);
    window.addEventListener("focus", syncWorkspace);
    return () => {
      window.removeEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
      window.removeEventListener("storage", syncWorkspace);
      window.removeEventListener("focus", syncWorkspace);
    };
  }, [currentStudentId]);

  const handleSubmit = () => {
    const newFeedback = {
      id: `feedback-custom-${Date.now()}`,
      student_id: currentStudentId || "",
      title: title || "Untitled submission",
      submission_text: text,
      file_name: file?.name || null,
      reviewer_feedback: null,
      ai_summary: null,
      status: "submitted",
      reviewer_id: workspace.supervisors[0]?.id || null,
      reviewer_type: "supervisor" as const,
    };
    addInteractiveFeedbackSubmission(newFeedback);
    setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    setTitle("");
    setText("");
    setFile(null);
  };

  const handleAIFeedback = async (fb: any) => {
    if (!fb.submission_text) return;
    setLoadingAI(fb.id);
    try {
      const response = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fb.title, submission_text: fb.submission_text }),
      });
      const data = await response.json();
      updateInteractiveFeedbackSubmission(currentStudentId || "", fb.id, {
        ai_summary: data.summary,
        status: fb.status === "submitted" ? "reviewed" : fb.status,
      });
      setAiFeedbackTypes((prev) => ({ ...prev, [fb.id]: data.feedback_type }));
      setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    } catch (error) {
      console.error("AI feedback error:", error);
    } finally {
      setLoadingAI(null);
    }
  };

  const handleClearAll = () => {
    if (!window.confirm("Delete all feedbacks? This cannot be undone.")) return;
    clearInteractiveCustomFeedbacks();
    setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ✅ HEADER avec le bouton Clear all */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ds-title-lg tracking-tight">Feedback</h1>
          <p className="ds-body text-muted-foreground mt-1">Submit your work to a supervisor for structured feedback.</p>
        </div>
        {allFeedbacks.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <Card className="border shadow-none">
        <CardContent className="pt-6 space-y-3">
          <p className="ds-title-cards">Submit your work</p>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Title of your submission..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded p-2"
            placeholder="Paste your thesis work here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <label htmlFor="file-upload" className="bg-black text-white px-4 py-2 rounded cursor-pointer">
              Choose file
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => { if (e.target.files) setFile(e.target.files[0]); }}
            />
            <p className="text-sm text-muted-foreground">
              {file ? `Selected file: ${file.name}` : "No file selected"}
            </p>
            <button className="bg-black text-white px-4 py-2 rounded" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!allFeedbacks.length ? (
          <Card className="border shadow-none">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="ds-body text-muted-foreground">No feedback loops yet.</p>
              <p className="ds-small text-muted-foreground mt-1">Submit your work to a supervisor for structured feedback.</p>
            </CardContent>
          </Card>
        ) : allFeedbacks.map((fb: any) => {
          const config = statusConfig[fb.status] || statusConfig.pending;
          const Icon = config.icon;
          const reviewer = getReviewer(fb.reviewer_id, fb.reviewer_type);
          const isLoadingThis = loadingAI === fb.id;

          return (
            <Card key={fb.id} className="border shadow-none">
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                    <div>
                      <p className="ds-title-cards">{fb.title}</p>
                      {reviewer && (
                        <p className="ds-caption text-muted-foreground mt-0.5">
                          → {reviewer.first_name} {reviewer.last_name} ({fb.reviewer_type === "supervisor" ? "Supervisor" : "Expert"})
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${config.badgeClass} border-0`}>{config.label}</Badge>
                </div>

                {fb.submission_text && (
                  <div className="pl-8">
                    <p className="ds-small text-muted-foreground">{fb.submission_text}</p>
                  </div>
                )}

                {fb.reviewer_feedback && (
                  <div className="pl-8 p-3 rounded-lg bg-secondary">
                    <p className="ds-label mb-1">Reviewer feedback</p>
                    <p className="ds-small text-muted-foreground">{fb.reviewer_feedback}</p>
                  </div>
                )}

                {fb.file_name && (
                  <div className="pl-8">
                    <p className="ds-small text-muted-foreground">📎 {fb.file_name}</p>
                  </div>
                )}

                {fb.ai_summary && (
                  <div className="pl-8 p-3 rounded-lg border border-ai">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="ds-label text-ai">AI Summary</p>
                      {aiFeedbackTypes[fb.id] && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ai/10 text-ai">
                          {aiFeedbackTypes[fb.id] === "structure" ? "📋 Structure" : "🎓 Academic"}
                        </span>
                      )}
                    </div>
                    <p className="ds-small text-muted-foreground whitespace-pre-wrap">{fb.ai_summary}</p>
                  </div>
                )}

                {fb.submission_text && !fb.ai_summary && (
                  <div className="pl-8">
                    <button
                      onClick={() => handleAIFeedback(fb)}
                      disabled={isLoadingThis}
                      className="flex items-center gap-2 text-sm border rounded px-3 py-1.5 hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {isLoadingThis
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                        : <><Sparkles className="h-4 w-4" /> Get AI Feedback</>
                      }
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
