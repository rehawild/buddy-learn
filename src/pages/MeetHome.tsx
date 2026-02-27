import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Keyboard, Plus, Calendar, Users } from "lucide-react";
import buddyImg from "@/assets/buddy-owl.png";

export default function MeetHome() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Study Meet</span>
        </div>
        <div className="flex items-center gap-3">
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
              onClick={() => navigate("/lobby")}
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
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter a code or link"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={() => meetingCode.trim() && navigate("/lobby")}
                disabled={!meetingCode.trim()}
                className="px-5 py-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate("/lobby")}>
                Learn more
              </span>{" "}
              about Study Meet
            </p>
          </div>
        </div>

        {/* Right side - carousel / illustration */}
        <div className="relative w-full max-w-lg">
          <div className="aspect-[4/3] rounded-2xl bg-card border border-border overflow-hidden shadow-2xl">
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden buddy-glow">
                <img src={buddyImg} alt="Study Buddy" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Get a link you can share</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Click <span className="font-semibold text-foreground">New meeting</span> to get a link you can send to people you want to study with
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
