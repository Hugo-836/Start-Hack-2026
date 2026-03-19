import { useFeedbackLoops, useSupervisors, useExperts } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, RotateCcw } from "lucide-react";
import { useState } from "react";

const DEMO_STUDENT = "student-04";
const statusConfig: Record<string, { icon: any; color: string; label: string; badgeClass: string }> = {
  pending: { icon: Send, color: "text-muted-foreground", label: "Pending", badgeClass: "bg-muted text-muted-foreground" },
  submitted: { icon: MessageSquare, color: "text-blue-600", label: "Submitted", badgeClass: "bg-blue-100 text-blue-800" },
  reviewed: { icon: CheckCheck, color: "text-emerald-600", label: "Reviewed", badgeClass: "bg-emerald-100 text-emerald-800" },
  revised: { icon: RotateCcw, color: "text-amber-600", label: "Revised", badgeClass: "bg-amber-100 text-amber-800" },
};

export default function StudentFeedback() {
  const { data: feedbacks, isLoading } = useFeedbackLoops(DEMO_STUDENT);
  const { data: supervisors } = useSupervisors();
  const { data: experts } = useExperts();
  const [file, setFile] = useState<File | null>(null);
  const getReviewer = (id: string, type: string) => type === "supervisor" ? supervisors?.find((s: any) => s.id === id) : experts?.find((e: any) => e.id === id);
  const [localFeedbacks, setLocalFeedbacks] = useState<any[]>([]);
  const allFeedbacks = [...(feedbacks || []), ...localFeedbacks];
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const handleSubmit = () => {
    const newFeedback = {
      id: Math.random(),
      title: title || "Untitled submission",
      submission_text: text,
      file_name: file?.name || null,
      reviewer_feedback: null,
      ai_summary: null,
      status: "submitted",
      reviewer_id: supervisors?.[0]?.id,
      reviewer_type: "supervisor",
    };
  
    setLocalFeedbacks([newFeedback, ...localFeedbacks]);
  
    // reset
    setTitle("");
    setText("");
    setFile(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">Feedback</h1><p className="ds-body text-muted-foreground mt-1">Submit your work to a supervisor or expert for structured feedback.</p></div>
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
  <label
    htmlFor="file-upload"
    className="bg-black text-white px-4 py-2 rounded cursor-pointer"
  >
    Choose file
  </label>

  <input
    id="file-upload"
    type="file"
    className="hidden"
    onChange={(e) => {
      if (e.target.files) {
        setFile(e.target.files[0]);
      }
    }}
  />

  <p className="text-sm text-muted-foreground">
    {file ? `Selected file: ${file.name}` : "No file selected"}
  </p>

  <button
    className="bg-black text-white px-4 py-2 rounded"
    onClick={handleSubmit}
  >
    Submit
  </button>
</div>

  </CardContent>
</Card>
<div className="space-y-4">
  {allFeedbacks.map((fb: any) => {
    const config = statusConfig[fb.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Card key={fb.id} className="border shadow-none">
        <CardContent className="py-5 space-y-3">

          {/* HEADER */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <div>
                <p className="ds-title-cards">{fb.title}</p>
              </div>
            </div>

            <Badge className={`${config.badgeClass} border-0`}>
              {config.label}
            </Badge>
          </div>

          {/* TEXTE ÉTUDIANT */}
          {fb.submission_text && (
            <p className="text-sm text-muted-foreground">
              💬 {fb.submission_text}
            </p>
          )}

          {/* FICHIER */}
          {fb.file_name && (
            <p className="text-sm text-muted-foreground">
              📎 {fb.file_name}
            </p>
          )}

          {/* FEEDBACK MENTOR */}
          {fb.reviewer_feedback && (
            <div className="p-3 bg-secondary rounded">
              <p className="font-semibold">Supervisor Feedback :</p>
              <p className="text-sm">{fb.reviewer_feedback}</p>
            </div>
          )}

          {/* IA */}
          {fb.ai_summary && (
            <div className="p-3 border border-ai rounded">
              <p className="font-semibold text-ai">AI Recap :</p>
              <p className="text-sm">{fb.ai_summary}</p>
            </div>
          )}

        </CardContent>
      </Card>
    );
  })}
</div>
{isLoading ? <p className="text-muted-foreground">Loading...</p> : !feedbacks?.length ? (
        <Card className="border shadow-none"><CardContent className="pt-6 text-center"><MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="ds-body text-muted-foreground">No feedback loops yet.</p><p className="ds-small text-muted-foreground mt-1">Submit your work to a supervisor or expert for structured feedback.</p></CardContent></Card>
      ) : allFeedbacks.map((fb: any) => {
        const config = statusConfig[fb.status] || statusConfig.pending; const Icon = config.icon; const reviewer = getReviewer(fb.reviewer_id, fb.reviewer_type);
        return (
          <Card key={fb.id} className="border shadow-none"><CardContent className="py-5 space-y-3">
            <div className="flex items-start justify-between"><div className="flex items-start gap-3"><Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} /><div><p className="ds-title-cards">{fb.title}</p>{reviewer && <p className="ds-caption text-muted-foreground mt-0.5">→ {reviewer.first_name} {reviewer.last_name} ({fb.reviewer_type === "supervisor" ? "Supervisor" : "Expert"})</p>}</div></div><Badge className={`${config.badgeClass} border-0`}>{config.label}</Badge></div>
            {fb.submission_text && <div className="pl-8"><p className="ds-small text-muted-foreground">{fb.submission_text}</p></div>}
            {fb.reviewer_feedback && <div className="pl-8 p-3 rounded-lg bg-secondary"><p className="ds-label mb-1">Reviewer feedback</p><p className="ds-small text-muted-foreground">{fb.reviewer_feedback}</p></div>}
            {fb.file_name && (<div className="pl-8"><p className="ds-small text-muted-foreground">📎 {fb.file_name}</p></div>)}
            {fb.ai_summary && <div className="pl-8 p-3 rounded-lg border border-ai"><p className="ds-label text-ai mb-1">AI Summary</p><p className="ds-small text-muted-foreground">{fb.ai_summary}</p></div>}
          </CardContent></Card>
        );
      })}
    </div>
  );
}
