import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FooterCTA = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-4xl md:text-6xl font-display font-600 tracking-tight leading-tight">
          Your thesis deserves
          <br />
          <span className="text-gradient-gold">a smarter start.</span>
        </h2>
        <p className="text-muted-foreground text-lg font-body max-w-lg mx-auto">
          Join students who are rethinking how the thesis journey works — with AI that adapts to them.
        </p>
        <Button size="lg" className="text-lg px-10 py-6 glow-shadow font-body">
          Get early access
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </section>
  );
};

export default FooterCTA;
