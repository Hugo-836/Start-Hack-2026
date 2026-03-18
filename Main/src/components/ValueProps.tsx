import { Brain, Users, Zap } from "lucide-react";

const props = [
  {
    icon: Brain,
    title: "Context-aware AI",
    description:
      "It doesn't just answer questions — it understands your thesis stage, your field, and your goals to give relevant guidance.",
  },
  {
    icon: Users,
    title: "People connector",
    description:
      "Matched with supervisors, industry experts, and interview partners who align with your research area.",
  },
  {
    icon: Zap,
    title: "Adaptive journey",
    description:
      "Whether you're exploring or submitting, the experience reshapes itself around your current needs.",
  },
];

const ValueProps = () => {
  return (
    <section className="py-32 px-6" style={{ background: "var(--gradient-subtle)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-600 tracking-tight">
            Not just another <span className="text-gradient-gold">writing tool</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body max-w-lg mx-auto">
            A co-pilot that connects the dots you didn't know existed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {props.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.title}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-600 mb-3">{prop.title}</h3>
                <p className="text-muted-foreground font-body leading-relaxed text-sm">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
