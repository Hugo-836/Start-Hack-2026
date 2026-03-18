import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 text-muted-foreground text-sm font-body">
          <Sparkles className="w-4 h-4 text-primary" />
          AI-powered thesis co-pilot
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-600 leading-[1.05] tracking-tight">
          From <em className="text-gradient-gold not-italic">"I'm starting"</em>
          <br />
          to <em className="text-gradient-gold not-italic">"I'm handing it in."</em>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-body font-light leading-relaxed">
          Your AI co-pilot that connects the dots across topics, supervisors, 
          companies, and experts — adapting to wherever you are in your thesis journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" className="text-lg px-8 py-6 glow-shadow font-body">
            Start your journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-body">
            See how it works
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
        <span className="text-xs font-body tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
