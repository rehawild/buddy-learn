import { useNavigate } from "react-router-dom";
import { ArrowRight, Upload, Users, Sparkles, MonitorPlay, MessageCircle, Brain, BarChart3, BookOpen, Zap, TrendingUp, Shield, Clock } from "lucide-react";
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
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.current?.observe(el);
    });
    return () => observer.current?.disconnect();
  }, []);

  return visible;
}

function TickerBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      {children}
    </span>
  );
}

function FinanceBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {children}
    </span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const visible = useInView();

  const sectionClass = (id: string) =>
    `transition-all duration-700 ${visible.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth overflow-x-hidden">

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(hsl(var(--border)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.3) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)",
      }} />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-primary/20">
              <img src={mascotImg} alt="Finny" className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-bold tracking-tight text-primary">Finny</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#course" className="hover:text-foreground transition-colors">FL101</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
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
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div className="space-y-8">
              <TickerBadge>Classroom AI · Now in Session</TickerBadge>

              <div className="space-y-5">
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.08]">
                  Teach money skills
                  <br />
                  <span className="text-primary">that actually</span>
                  <br />
                  <span className="italic font-light">stick.</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  Finny keeps classrooms engaged with AI-powered micro-questions. Launch the Financial Literacy 101 course in seconds — no slides to upload.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  Start Teaching Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#course"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/8 transition-colors"
                >
                  <span className="text-base">💰</span>
                  See FL101
                </a>
              </div>

              {/* Stats strip */}
              <div className="flex gap-8 pt-2 border-t border-border/50">
                {[
                  { value: "6", label: "Interactive modules" },
                  { value: "25+", label: "Quiz questions" },
                  { value: "0", label: "Setup required" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: featured course card + mascot */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 blur-3xl scale-110 pointer-events-none" />

              {/* Featured course card */}
              <div id="course" className="relative rounded-2xl border border-emerald-500/25 bg-card overflow-hidden shadow-2xl">
                {/* Card header */}
                <div className="px-6 py-4 border-b border-emerald-500/15 flex items-center justify-between bg-emerald-950/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-xs font-mono text-emerald-400/70 uppercase tracking-widest">Featured Course</p>
                      <h3 className="text-sm font-bold text-foreground">Financial Literacy 101</h3>
                    </div>
                  </div>
                  <FinanceBadge>Live Ready</FinanceBadge>
                </div>

                {/* Mascot */}
                <div className="px-6 py-5 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0 ring-1 ring-emerald-500/20">
                    <img src="/hero-anim.gif" alt="Finny" className="absolute top-1/2 left-1/2 w-[220%] max-w-none -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Budgeting · Credit scores · Compound interest · Emergency funds — taught with AI-driven micro-questions.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {["50/30/20 Rule", "Credit Score", "Compound Interest", "Debt Avalanche"].map((tag) => (
                        <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slide preview strip */}
                <div className="px-6 pb-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: "📊", title: "Budgeting" },
                    { icon: "🏦", title: "Saving" },
                    { icon: "📈", title: "Investing" },
                  ].map(({ icon, title }) => (
                    <div key={title} className="rounded-lg bg-emerald-950/40 border border-emerald-500/15 p-2.5 text-center">
                      <div className="text-lg">{icon}</div>
                      <div className="text-[10px] text-emerald-400/70 font-mono mt-0.5">{title}</div>
                    </div>
                  ))}
                </div>

                {/* Launch CTA */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Launch instantly — no upload needed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative z-10" data-animate>
        <div className={`max-w-5xl mx-auto ${sectionClass("features")}`}>
          <div className="text-center mb-14 space-y-3">
            <TickerBadge>Platform Features</TickerBadge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              Everything you need for active learning
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: TrendingUp,
                title: "Financial Literacy 101",
                desc: "A ready-to-go course on budgeting, credit, and investing. One click — no prep, no uploads, no lesson plans.",
                accent: "emerald",
              },
              {
                icon: Brain,
                title: "AI Micro-Questions",
                desc: "Finny surfaces contextual quiz questions at the right moments, reinforcing concepts as they're taught in real-time.",
                accent: "primary",
              },
              {
                icon: BarChart3,
                title: "Engagement Analytics",
                desc: "See which concepts students struggle with, attention scores, and accuracy breakdowns — all per slide.",
                accent: "primary",
              },
              {
                icon: MonitorPlay,
                title: "Live Presentations",
                desc: "Upload any PDF or PPTX and present with perfect sync. Every student sees exactly what you see.",
                accent: "primary",
              },
              {
                icon: MessageCircle,
                title: "Real-Time Interaction",
                desc: "Live chat, emoji reactions, hand raises, and presence tracking. A classroom that talks back.",
                accent: "primary",
              },
              {
                icon: Shield,
                title: "Privacy First",
                desc: "No webcams, no screen recording. Engagement signals come from interaction patterns only.",
                accent: "primary",
              },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className={`group p-6 rounded-2xl bg-card border transition-all duration-300 ${
                  accent === "emerald"
                    ? "border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-950/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  accent === "emerald"
                    ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                    : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  <Icon className={`w-5 h-5 ${accent === "emerald" ? "text-emerald-400" : "text-primary"}`} />
                </div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-card/40 border-y border-border/50 relative z-10" data-animate>
        <div className={`max-w-5xl mx-auto ${sectionClass("how-it-works")}`}>
          <div className="text-center mb-14 space-y-3">
            <FinanceBadge>FL101 Quick-Start</FinanceBadge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              From sign-up to first lesson in 60 seconds
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              No slides to prepare. No lesson plan needed. Finny has everything built in.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Create your account",
                  desc: "Sign up as a teacher — free, no credit card. Takes under a minute.",
                  color: "text-primary",
                  bg: "bg-primary/10 border-primary/20",
                },
                {
                  step: "02",
                  icon: Zap,
                  title: "Hit 'Financial Literacy 101'",
                  desc: "One button on your home screen. Finny generates a room code instantly.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  step: "03",
                  icon: Sparkles,
                  title: "Students join & learn",
                  desc: "Share the 6-digit code. Finny runs interactive questions automatically throughout.",
                  color: "text-primary",
                  bg: "bg-primary/10 border-primary/20",
                },
              ].map(({ step, icon: Icon, title, desc, color, bg }) => (
                <div key={step} className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border ${bg} relative`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                    <span className={`absolute -top-2 -right-2 text-[10px] font-mono font-bold ${color} bg-background border border-border rounded-full w-5 h-5 flex items-center justify-center`}>
                      {step.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers / Students */}
      <section id="roles" className="py-24 px-6 relative z-10" data-animate>
        <div className={`max-w-5xl mx-auto ${sectionClass("roles")}`}>
          <div className="text-center mb-14 space-y-3">
            <TickerBadge>Built For</TickerBadge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              Two roles. One seamless experience.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-card border border-border space-y-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Role</p>
                  <h3 className="text-lg font-bold">For Teachers</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Launch Financial Literacy 101 in one click",
                  "Upload your own slides for any subject",
                  "Real-time engagement and accuracy dashboard",
                  "AI generates quiz questions from your content",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-emerald-500/20 space-y-6 hover:border-emerald-500/35 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Role</p>
                  <h3 className="text-lg font-bold">For Students</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Join with a 6-character code — nothing to install",
                  "Answer quick questions to reinforce concepts",
                  "Chat with Finny for instant explanations",
                  "Track your accuracy and session progress",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 relative z-10 bg-card/40 border-t border-border/50" data-animate id="cta">
        <div className={`max-w-2xl mx-auto text-center space-y-6 ${sectionClass("cta")}`}>
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden relative ring-2 ring-primary/20 shadow-xl shadow-primary/10">
            <img src="/hero-anim.gif" alt="Finny" className="absolute top-1/2 left-1/2 w-[220%] max-w-none -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to teach financial literacy?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Financial Literacy 101 is free, fully built, and ready to run. Sign up and launch your first session today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              First session in under 2 minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-mono">
            © {new Date().getFullYear()} Finny
          </span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded overflow-hidden opacity-70">
              <img src={mascotImg} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-muted-foreground">
              Made with <span className="text-primary">♥</span> for educators
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
