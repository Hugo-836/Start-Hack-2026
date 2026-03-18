import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, MessageSquare, Users, Milestone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="container flex h-14 items-center justify-between">
          <img src="/studyond.svg" alt="Studyond" className="h-7" />
          <Button size="sm" className="rounded-full" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="container pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="ds-label text-muted-foreground mb-4">AI-Powered Thesis Journey</p>
          <h1 className="header-xl text-foreground">
            Your thesis, guided
            <br />
            <span className="text-muted-foreground">from start to finish.</span>
          </h1>
          <p className="ds-body text-muted-foreground mt-6 max-w-xl">
            Studyond connects students, supervisors and industry experts around thesis projects. Our AI structures the
            journey, from day one to submission.
          </p>
          <div className="flex gap-3 mt-8">
            <Button size="lg" className="rounded-full" asChild>
              <Link to="/auth">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid-3-col">
          <FeatureCard
            icon={<Milestone className="h-5 w-5" />}
            title="Progress Tracking"
            description="Visual timeline across 5 thesis phases with custom milestones and AI-powered nudges."
          />
          <FeatureCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="Structured Feedback"
            description="Feedback loops between students and supervisors with AI-generated summaries."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Peer Connections"
            description="AI-powered matching with students working on similar topics."
          />
          <FeatureCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Project-first"
            description="Your thesis project evolves over time — topic, supervisor and experts are added progressively."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="AI Intelligence"
            description="Personalized suggestions, contextual nudges and automatic summaries at every stage."
            isAi
          />
          <FeatureCard
            icon={<ArrowRight className="h-5 w-5" />}
            title="Mentor Dashboard"
            description="Consolidated view of supervised students, their progress and pending feedback."
          />
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-8 flex items-center justify-between">
          <img src="/studyond.svg" alt="Studyond" className="h-6 opacity-50" />
          <p className="ds-caption text-muted-foreground">START Hack 2026 · Structured Mentor Access</p>
        </div>
      </footer>
    </main>
  );
};

function FeatureCard({
  icon,
  title,
  description,
  isAi,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isAi?: boolean;
}) {
  return (
    <div className={`p-6 rounded-lg border ${isAi ? "border-ai" : ""} hover:shadow-md transition-shadow duration-300`}>
      <div className={`mb-3 ${isAi ? "text-ai-solid" : "text-foreground"}`}>{icon}</div>
      <h3 className={`ds-title-cards mb-2 ${isAi ? "text-ai" : ""}`}>{title}</h3>
      <p className="ds-small text-muted-foreground">{description}</p>
    </div>
  );
}

export default Index;
