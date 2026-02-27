import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Keyboard, Plus, Calendar, Users, Copy, Check, LayoutDashboard, LogOut } from "lucide-react";
import buddyImg from "@/assets/buddy-owl.png";
import { generateRoomCode } from "@/lib/room";
import { useAuth } from "@/hooks/useAuth";

export default function MeetHome() {
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const [meetingCode, setMeetingCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNewMeeting = () => {
    const code = generateRoomCode();
    setGeneratedCode(code);
  };

  const handleStartMeeting = () => {
    if (generatedCode) {
      navigate(`/lobby?room=${generatedCode}&role=presenter`);
    }
  };

  const handleJoin = () => {
    const code = meetingCode.trim().toUpperCase();
    if (code) {
      navigate(`/lobby?room=${code}&role=viewer`);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Study Meet</span>
        </div>
        <div className="flex items-center gap-2">
          {role === "teacher" && (
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary">
            <img src={buddyImg} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12">
        {/* Left side - actions */}
        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Premium video meetings.<br />
              <span className="text-primary">Now with Study Buddy.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A meeting platform with an AI study buddy that keeps you engaged with quick micro-interactions during lessons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleNewMeeting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              New meeting
            </button>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="Enter a code"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!meetingCode.trim()}
                className="px-5 py-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>

          {/* Generated code popup */}
          {generatedCode && (
            <div className="p-4 rounded-xl bg-card border border-border shadow-lg space-y-3 fade-up">
              <p className="text-sm text-muted-foreground">Here's your meeting code. Share it with others:</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono tracking-[0.3em] text-foreground">{generatedCode}</span>
                <button onClick={handleCopy} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="w-4 h-4 text-correct" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleStartMeeting}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Start meeting
              </button>
            </div>
          )}

          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate("/lobby")}>
                Learn more
              </span>{" "}
              about Study Meet
            </p>
          </div>
        </div>

        {/* Right side - illustration */}
        <div className="relative w-full max-w-lg">
          <div className="aspect-[4/3] rounded-2xl bg-card border border-border overflow-hidden shadow-2xl">
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden buddy-glow">
                <img src={buddyImg} alt="Study Buddy" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Get a link you can share</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Click <span className="font-semibold text-foreground">New meeting</span> to get a code you can send to people you want to study with
                </p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-3 gap-3 w-full pt-4">
                {[
                  { icon: Calendar, label: "Schedule" },
                  { icon: Users, label: "Study group" },
                  { icon: Video, label: "Present" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-default">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
