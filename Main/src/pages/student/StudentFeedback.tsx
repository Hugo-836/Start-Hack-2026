import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addInteractiveFeedbackSubmission,
  DEMO_STUDENT,
  getInteractiveStudentWorkspace,
  INTERACTIVE_WORKSPACE_EVENT,
} from "@/lib/interactiveMilestones";

const statusConfig: Record<string, { icon: any; color: string; label: string; badgeClass: string }> = {
  pending: { icon: Send, color: "text-muted-foreground", label: "Pending", badgeClass: "bg-muted text-muted-foreground" },
  submitted: { icon: MessageSquare, color: "text-blue-600", label: "Submitted", badgeClass: "bg-blue-100 text-blue-800" },
  reviewed: { icon: CheckCheck, color: "text-emerald-600", label: "Reviewed", badgeClass: "bg-emerald-100 text-emerald-800" },
  revised: { icon: RotateCcw, color: "text-amber-600", label: "Revised", badgeClass: "bg-amber-100 text-amber-800" },
};

export default function StudentFeedback() {
  const [workspace, setWorkspace] = useState(() => getInteractiveStudentWorkspace(DEMO_STUDENT));
  const [file, setFile] = useState<File | null>(null);
  const getReviewer = (id: string, type: string) => type === "supervisor" ? workspace.supervisors.find((s: any) => s.id === id) : workspace.experts.find((e: any) => e.id === id);
  const allFeedbacks = workspace.studentFeedbacks;
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const syncWorkspace = () => setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
    window.addEventListener("focus", syncWorkspace);
    return () => {
      window.removeEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
      window.removeEventListener("focus", syncWorkspace);
    };
  }, []);

  const handleSubmit = () => {
    const newFeedback = {
      id: `feedback-custom-${Date.now()}`,
      student_id: DEMO_STUDENT,
      title: title || "Untitled submission",
      submission_text: text,
      file_name: file?.name || null,
      reviewer_feedback: null,
      ai_summary: null,
      status: "submitted",
      reviewer_id: workspace.supervisors[0]?.id || null,
      reviewer_type: "supervisor",
    };

    addInteractiveFeedbackSubmission(newFeedback);
    setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
    setTitle("");
    setText("");
    setFile(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="ds-title-lg tracking-tight">Feedback</h1>
        <p className="ds-body text-muted-foreground mt-1">Submit your work to a supervisor or expert for structured feedback.</p>
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
              <p className="ds-small text-muted-foreground mt-1">Submit your work to a supervisor or expert for structured feedback.</p>
            </CardContent>
          </Card>
        ) : allFeedbacks.map((fb: any) => {
          const config = statusConfig[fb.status] || statusConfig.pending;
          const Icon = config.icon;
          const reviewer = getReviewer(fb.reviewer_id, fb.reviewer_type);
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
                    <p className="ds-label text-ai mb-1">AI Summary</p>
                    <p className="ds-small text-muted-foreground">{fb.ai_summary}</p>
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