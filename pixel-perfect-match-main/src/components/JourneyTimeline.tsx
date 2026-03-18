import { Compass, Target, Search, PenTool, Send } from "lucide-react";

const phases = [
  {
    icon: Compass,
    title: "Explore",
    subtitle: "Find your direction",
    description: "Discover trending topics, browse past theses, and get AI-generated topic suggestions based on your interests.",
  },
  {
    icon: Target,
    title: "Define",
    subtitle: "Lock in your scope",
    description: "Refine your research question, find the right supervisor match, and build a structured proposal with AI guidance.",
  },
  {
    icon: Search,
    title: "Research",
    subtitle: "Go deep",
    description: "Find interview partners, connect with industry experts, and let AI surface the most relevant papers and sources.",
  },
  {
    icon: PenTool,
    title: "Write",
    subtitle: "Bring it together",
    description: "Structure your chapters, get real-time writing feedback, and maintain academic rigor with citation assistance.",
  },
  {
    icon: Send,
    title: "Submit",
    subtitle: "Cross the finish line",
    description: "Final formatting checks, plagiarism review, and a polished thesis ready for submission.",
  },
];

const JourneyTimeline = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-600 tracking-tight">
            Your thesis, <span className="text-gradient-gold">phase by phase</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body max-w-xl mx-auto">
            The journey adapts to where you are — jump in at any stage.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />

          <div className="space-y-16 md:space-y-24">
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={phase.title}
                  className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}>
                    <div className="space-y-3">
                      <p className="text-primary text-sm font-body font-medium tracking-widest uppercase">
                        Phase {index + 1}
                      </p>
                      <h3 className="text-3xl font-display font-600">{phase.title}</h3>
                      <p className="text-foreground/70 text-sm font-body italic">
                        {phase.subtitle}
                      </p>
                      <p className="text-muted-foreground font-body leading-relaxed max-w-md inline-block">
                        {phase.description}
                      </p>
                    </div>
                  </div>

                  {/* Icon node */}
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center glow-shadow">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyTimeline;
