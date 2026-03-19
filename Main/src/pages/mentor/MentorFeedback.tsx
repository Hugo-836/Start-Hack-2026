import { useState } from "react";
import { useFeedbackLoops, useStudents } from "@/hooks/useStudyondData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  CheckCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getMentorProfileBySupervisorId } from "@/lib/mentorProfiles";
import { useMentorSelection } from "@/contexts/MentorSelectionContext";

const statusConfig: Record<
  string,
  { icon: any; color: string; label: string; badgeClass: string }
> = {
  pending: {
    icon: Send,
    color: "text-muted-foreground",
    label: "Pending",
    badgeClass: "bg-muted text-muted-foreground",
  },
  submitted: {
    icon: MessageSquare,
    color: "text-blue-600",
    label: "Submitted",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  reviewed: {
    icon: CheckCheck,
    color: "text-emerald-600",
    label: "Reviewed",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  revised: {
    icon: RotateCcw,
    color: "text-amber-600",
    label: "Revised",
    badgeClass: "bg-amber-100 text-amber-800",
  },
};

export default function MentorFeedback() {
  const { data: feedbacks, isLoading } = useFeedbackLoops();
  const { data: students } = useStudents();
  const queryClient = useQueryClient();
  const { selectedSupervisorId } = useMentorSelection();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const mentorProfile = getMentorProfileBySupervisorId(selectedSupervisorId);
  const myFeedbacks =
    feedbacks?.filter(
      (feedback: any) =>
        feedback.reviewer_id === selectedSupervisorId && feedback.reviewer_type === "supervisor",
    ) || [];
  const getStudent = (id: string) => students?.find((student: any) => student.id === id);

  const handleSubmitFeedback = async (feedbackId: string) => {
    const text = feedbackText[feedbackId]?.trim();
    if (!text) return;

    setSubmitting(feedbackId);

    try {
      const { error } = await supabase
        .from("feedback_loops")
        .update({
          reviewer_feedback: text,
          status: "reviewed" as const,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", feedbackId);

      if (error) throw error;

      toast("Feedback sent", { description: "Your review has been recorded." });
      setFeedbackText((prev) => ({ ...prev, [feedbackId]: "" }));
      setExpandedId(null);
      queryClient.invalidateQueries({ queryKey: ["feedback_loops"] });
    } catch {
      toast("Error", { description: "Could not send feedback." });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className={`border shadow-none ${mentorProfile?.panelClassName ?? ""}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center ds-title-cards shrink-0 ${
                  mentorProfile?.avatarClassName ?? "bg-primary text-primary-foreground"
                }`}
              >
                {mentorProfile?.initials ?? "M"}
              </div>
              <div>
                <h1 className="ds-title-lg tracking-tight">Feedback</h1>
                <p className="ds-body text-muted-foreground mt-1">
                  Review submissions as {mentorProfile?.fullName ?? "this mentor"}.
                </p>
              </div>
            </div>

            {mentorProfile?.institution ? (
              <Badge variant="secondary" className="border-0 w-fit">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {mentorProfile.institution}
                </span>
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : myFeedbacks.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="ds-body text-muted-foreground">No feedback submissions yet.</p>
            <p className="ds-small text-muted-foreground mt-1">
              Your students can submit their work for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        myFeedbacks.map((feedback: any) => {
          const config = statusConfig[feedback.status] || statusConfig.pending;
          const Icon = config.icon;
          const student = getStudent(feedback.student_id);
          const isExpanded = expandedId === feedback.id;
          const canReview = feedback.status === "submitted" || feedback.status === "revised";

          return (
            <Card key={feedback.id} className="border shadow-none">
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                    <div>
                      <p className="ds-title-cards">{feedback.title}</p>
                      <p className="ds-caption text-muted-foreground mt-0.5">
                        From:{" "}
                        {student
                          ? `${student.first_name} ${student.last_name}`
                          : feedback.student_id}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${config.badgeClass} border-0`}>{config.label}</Badge>
                </div>

                {feedback.submission_text ? (
                  <div className="pl-8 p-3 rounded-lg bg-secondary">
                    <p className="ds-label mb-1">Submission</p>
                    <p className="ds-small text-muted-foreground">{feedback.submission_text}</p>
                  </div>
                ) : null}

                {feedback.reviewer_feedback ? (
                  <div className="pl-8">
                    <p className="ds-label mb-1">Your feedback</p>
                    <p className="ds-small text-muted-foreground">{feedback.reviewer_feedback}</p>
                  </div>
                ) : null}

                {feedback.ai_summary ? (
                  <div className="pl-8 p-3 rounded-lg border border-ai">
                    <p className="ds-label text-ai mb-1">AI Summary</p>
                    <p className="ds-small text-muted-foreground">{feedback.ai_summary}</p>
                  </div>
                ) : null}

                {canReview ? (
                  <div className="pl-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                      className="text-muted-foreground"
                    >
                      {isExpanded ? (
                        <>
                          Hide <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Give feedback <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {isExpanded ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          placeholder="Write your feedback here..."
                          value={feedbackText[feedback.id] || ""}
                          onChange={(event) =>
                            setFeedbackText((prev) => ({
                              ...prev,
                              [feedback.id]: event.target.value,
                            }))
                          }
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setExpandedId(null)}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitFeedback(feedback.id)}
                            disabled={!feedbackText[feedback.id]?.trim() || submitting === feedback.id}
                          >
                            {submitting === feedback.id ? "Sending..." : "Send feedback"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
