import { useFeedbackLoops, useSupervisors, useExperts } from "@/hooks/useStudyondData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, RotateCcw } from "lucide-react";

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
  const getReviewer = (id: string, type: string) => type === "supervisor" ? supervisors?.find((s: any) => s.id === id) : experts?.find((e: any) => e.id === id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">Feedback</h1><p className="ds-body text-muted-foreground mt-1">Submit your work and receive structured feedback.</p></div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : !feedbacks?.length ? (
        <Card className="border shadow-none"><CardContent className="pt-6 text-center"><MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="ds-body text-muted-foreground">No feedback loops yet.</p><p className="ds-small text-muted-foreground mt-1">Submit your work to a supervisor or expert for structured feedback.</p></CardContent></Card>
      ) : feedbacks.map((fb: any) => {
        const config = statusConfig[fb.status] || statusConfig.pending; const Icon = config.icon; const reviewer = getReviewer(fb.reviewer_id, fb.reviewer_type);
        return (
          <Card key={fb.id} className="border shadow-none"><CardContent className="py-5 space-y-3">
            <div className="flex items-start justify-between"><div className="flex items-start gap-3"><Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} /><div><p className="ds-title-cards">{fb.title}</p>{reviewer && <p className="ds-caption text-muted-foreground mt-0.5">→ {reviewer.first_name} {reviewer.last_name} ({fb.reviewer_type === "supervisor" ? "Supervisor" : "Expert"})</p>}</div></div><Badge className={`${config.badgeClass} border-0`}>{config.label}</Badge></div>
            {fb.submission_text && <div className="pl-8"><p className="ds-small text-muted-foreground">{fb.submission_text}</p></div>}
            {fb.reviewer_feedback && <div className="pl-8 p-3 rounded-lg bg-secondary"><p className="ds-label mb-1">Reviewer feedback</p><p className="ds-small text-muted-foreground">{fb.reviewer_feedback}</p></div>}
            {fb.ai_summary && <div className="pl-8 p-3 rounded-lg border border-ai"><p className="ds-label text-ai mb-1">AI Summary</p><p className="ds-small text-muted-foreground">{fb.ai_summary}</p></div>}
          </CardContent></Card>
        );
      })}
    </div>
  );
}
