import { useNavigate } from "react-router-dom";
import { ArrowRight, Upload, Users, Sparkles, MonitorPlay, MessageCircle, Brain, ChevronDown, BarChart3, Hand, Zap, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mascotImg from "@/assets/catchy.png";

function useInView() {
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.current?.observe(el);
    });

    return () => observer.current?.disconnect();
  }, []);

  return visible;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const visible = useInView();

  const sectionClass = (id: string) =>
    `transition-all duration-700 ${visible.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src={mascotImg} alt="Catchy" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-primary">Catchy</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-semibold px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden buddy-glow">
            <img src="/hero-anim.gif" alt="Catchy mascot" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Presentations that keep
              <br />
              classrooms <span className="text-primary">engaged</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Upload your slides, share a room code, and let Catchy keep students focused with real-time micro-interactions — no extra prep required.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" data-animate>
        <div className={`max-w-5xl mx-auto ${sectionClass("features")}`}>
          <div className="text-center mb-16 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need for interactive lessons
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MonitorPlay,
                title: "Live Presentations",
                desc: "Upload PDF or PPTX files and present slides in real-time. Every student sees the same slide, perfectly synced.",
              },
              {
                icon: MessageCircle,
                title: "Real-Time Engagement",
                desc: "Emoji reactions, live chat, hand raises, and presence tracking keep your classroom connected and responsive.",
              },
              {
                icon: Brain,
                title: "AI Micro-Interactions",
                desc: "Catchy pops up with contextual quiz questions during lessons — reinforcing key concepts as they're taught.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-card/50" data-animate>
        <div className={`max-w-4xl mx-auto ${sectionClass("how-it-works")}`}>
          <div className="text-center mb-16 space-y-3">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three steps to an engaged classroom
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload your slides",
                desc: "Drop in a PDF or PowerPoint file. We extract every slide automatically.",
              },
              {
                step: "02",
                icon: Users,
                title: "Share the room code",
                desc: "Students join with a simple 6-character code — no accounts or downloads needed.",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "Catchy does the rest",
                desc: "Our AI companion surfaces quick questions at the right moments, keeping attention high.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary border-2 border-border">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <p className="text-xs font-bold text-accent tracking-widest">{step}</p>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Teachers / Students */}
      <section id="roles" className="py-24 px-6" data-animate>
        <div className={`max-w-5xl mx-auto ${sectionClass("roles")}`}>
          <div className="text-center mb-16 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Built For</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Designed for both sides of the classroom
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Teachers */}
            <div className="p-8 rounded-2xl bg-card border border-border space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">For Teachers</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Upload presentations and present live",
                  "View real-time engagement dashboard",
                  "Track student progress and accuracy",
                  "Control slide pacing and Catchy interactions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Students */}
            <div className="p-8 rounded-2xl bg-card border border-border space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold">For Students</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Join sessions instantly with a room code",
                  "Answer quick questions to reinforce learning",
                  "React with emojis and chat in real-time",
                  "Stay focused with friendly AI nudges",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-card/50" data-animate id="cta">
        <div className={`max-w-2xl mx-auto text-center space-y-6 ${sectionClass("cta")}`}>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to engage your classroom?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Join teachers who are making lessons more interactive — no credit card required.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Sign Up Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Catchy
          </span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded overflow-hidden">
              <img src={mascotImg} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-muted-foreground">
              Built with <span className="text-primary">♥</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
