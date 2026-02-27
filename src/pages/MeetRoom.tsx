import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff,
  Captions, Hand, SmilePlus, MoreVertical, PhoneOff,
  MessageSquare, Users, LayoutGrid, ChevronRight, ChevronLeft,
} from "lucide-react";
import { fakeParticipants } from "@/data/participants";
import { lessons, type Question } from "@/data/lessons";
import ParticipantTile from "@/components/ParticipantTile";
import MeetSidebar from "@/components/MeetSidebar";
import BuddyOverlay from "@/components/BuddyOverlay";

export default function MeetRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [presenting, setPresenting] = useState(searchParams.get("present") === "true");
  const [gridView, setGridView] = useState(true);
  const [sidePanel, setSidePanel] = useState<"chat" | "people" | null>(null);
  const [handRaised, setHandRaised] = useState(false);

  // Presentation state
  const [lessonIdx, setLessonIdx] = useState(0);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [buddyEnabled, setBuddyEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [results, setResults] = useState({ correct: 0, total: 0, concepts: [] as string[] });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const lesson = lessons[lessonIdx];
  const section = lesson.sections[sectionIdx];
  const isLastSection = sectionIdx >= lesson.sections.length - 1;

  // Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Buddy trigger
  useEffect(() => {
    if (!presenting || !buddyEnabled) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const matching = section.questions.filter((q) => q.difficulty === difficulty);
      const q = matching.length > 0 ? matching[0] : section.questions[0];
      if (q) setActiveQuestion(q);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [sectionIdx, lessonIdx, buddyEnabled, difficulty, presenting, section.questions]);

  const handleAnswer = useCallback((correct: boolean) => {
    setResults((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      concepts: [...new Set([...prev.concepts, section.title])].slice(-5),
    }));
  }, [section.title]);

  const handleDismiss = useCallback(() => setActiveQuestion(null), []);

  const nextSection = () => {
    if (isLastSection) {
      navigate("/recap", {
        state: { lessonTitle: lesson.title, ...results, concepts: [...new Set([...results.concepts, section.title])].slice(0, 3) },
      });
    } else {
      setSectionIdx((i) => i + 1);
      setActiveQuestion(null);
    }
  };

  const prevSection = () => {
    if (sectionIdx > 0) {
      setSectionIdx((i) => i - 1);
      setActiveQuestion(null);
    }
  };

  const startPresenting = () => {
    setPresenting(true);
    setGridView(false);
  };

  const stopPresenting = () => {
    setPresenting(false);
    setGridView(true);
    setActiveQuestion(null);
  };

  const leaveCall = () => {
    if (presenting && results.total > 0) {
      navigate("/recap", {
        state: { lessonTitle: lesson.title, ...results, concepts: results.concepts.slice(0, 3) },
      });
    } else {
      navigate("/");
    }
  };

  const toggleSidePanel = (panel: "chat" | "people") => {
    setSidePanel((prev) => (prev === panel ? null : panel));
  };

  const nextDiff = () => {
    const order: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    setDifficulty(order[(order.indexOf(difficulty) + 1) % 3]);
  };

  const diffColors = { easy: "text-correct", medium: "text-buddy-warm", hard: "text-incorrect" };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-14 bg-meet-bar border-b border-border flex items-center px-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{presenting ? lesson.title : "Study Session"}</h2>
          <p className="text-xs text-muted-foreground">study-session-demo</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="hidden sm:block">|</span>
          <span className="hidden sm:flex items-center gap-1">
            <Users className="w-3 h-3" /> {fakeParticipants.length}
          </span>
        </div>
        {presenting && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Presenting
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-2 md:p-4 overflow-hidden">
            {presenting ? (
              /* Presentation layout */
              <div className="h-full flex flex-col gap-2">
                {/* Filmstrip */}
                <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
                  {fakeParticipants.filter((p) => !p.isSelf).map((p) => (
                    <ParticipantTile key={p.id} participant={p} size="filmstrip" />
                  ))}
                </div>

                {/* Presented content */}
                <div className="flex-1 relative rounded-xl overflow-hidden shadow-2xl border border-border slide-surface">
                  <div className="absolute inset-0 p-6 md:p-10 overflow-y-auto">
                    {/* Lesson switcher */}
                    <div className="flex items-center gap-2 mb-5">
                      {lessons.map((l, i) => (
                        <button
                          key={l.id}
                          onClick={() => { setLessonIdx(i); setSectionIdx(0); setActiveQuestion(null); setResults({ correct: 0, total: 0, concepts: [] }); }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            i === lessonIdx ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {l.icon} {l.subject}
                        </button>
                      ))}
                    </div>

                    <div className="fade-up" key={`${lessonIdx}-${sectionIdx}`}>
                      <div className="text-xs text-muted-foreground mb-2 font-mono">
                        Section {sectionIdx + 1} of {lesson.sections.length}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slide-fg mb-4">{section.title}</h2>
                      <p className="text-base md:text-lg leading-relaxed text-slide-fg/80">{section.content}</p>
                    </div>

                    {/* Slide nav */}
                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
                      <button onClick={prevSection} disabled={sectionIdx === 0} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 bg-secondary/50 text-slide-fg hover:bg-secondary">
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <button onClick={nextSection} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                        {isLastSection ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Buddy overlay */}
                  <BuddyOverlay
                    question={activeQuestion}
                    difficulty={difficulty}
                    enabled={buddyEnabled}
                    onAnswer={handleAnswer}
                    onDismiss={handleDismiss}
                  />
                </div>
              </div>
            ) : (
              /* Grid / Speaker view */
              <div className={`h-full ${gridView ? "grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3" : "flex flex-col gap-2"}`}>
                {gridView
                  ? fakeParticipants.map((p) => (
                      <ParticipantTile key={p.id} participant={{ ...p, ...(p.isSelf ? { isCameraOff: !cameraOn, isMuted: !micOn } : {}) }} size="large" speaking={p.id === "p4"} />
                    ))
                  : (
                    <>
                      <div className="flex-1">
                        <ParticipantTile participant={fakeParticipants[4]} size="large" speaking />
                      </div>
                      <div className="flex gap-2 overflow-x-auto flex-shrink-0">
                        {fakeParticipants.filter((_, i) => i < 4).map((p) => (
                          <ParticipantTile key={p.id} participant={{ ...p, ...(p.isSelf ? { isCameraOff: !cameraOn, isMuted: !micOn } : {}) }} size="filmstrip" />
                        ))}
                      </div>
                    </>
                  )}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="h-16 bg-meet-bar border-t border-border flex items-center justify-center gap-1.5 md:gap-2 px-3">
            {/* Mic */}
            <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full transition-colors ${micOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive text-destructive-foreground"}`}>
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            {/* Camera */}
            <button onClick={() => setCameraOn(!cameraOn)} className={`p-3 rounded-full transition-colors ${cameraOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive text-destructive-foreground"}`}>
              {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            {/* Captions */}
            <button className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <Captions className="w-5 h-5" />
            </button>
            {/* Reactions */}
            <button className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <SmilePlus className="w-5 h-5" />
            </button>
            {/* Screen share */}
            <button
              onClick={presenting ? stopPresenting : startPresenting}
              className={`p-3 rounded-full transition-colors ${presenting ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {presenting ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
            </button>
            {/* Raise hand */}
            <button onClick={() => setHandRaised(!handRaised)} className={`p-3 rounded-full transition-colors ${handRaised ? "bg-buddy-warm text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Hand className="w-5 h-5" />
            </button>
            {/* More */}
            <button className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors hidden md:block">
              <MoreVertical className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Chat */}
            <button onClick={() => toggleSidePanel("chat")} className={`p-3 rounded-full transition-colors ${sidePanel === "chat" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <MessageSquare className="w-5 h-5" />
            </button>
            {/* People */}
            <button onClick={() => toggleSidePanel("people")} className={`p-3 rounded-full transition-colors ${sidePanel === "people" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Users className="w-5 h-5" />
            </button>
            {/* Grid toggle */}
            {!presenting && (
              <button onClick={() => setGridView(!gridView)} className={`p-3 rounded-full transition-colors ${gridView ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="w-5 h-5" />
              </button>
            )}

            {/* Buddy controls (when presenting) */}
            {presenting && (
              <>
                <div className="w-px h-8 bg-border mx-1" />
                <button
                  onClick={() => setBuddyEnabled(!buddyEnabled)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold transition-colors ${buddyEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  🦉 {buddyEnabled ? "ON" : "OFF"}
                </button>
                <button onClick={nextDiff} className={`px-2.5 py-2 rounded-full text-xs font-semibold bg-secondary transition-colors ${diffColors[difficulty]}`}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </button>
              </>
            )}

            <div className="w-px h-8 bg-border mx-1" />

            {/* Leave */}
            <button onClick={leaveCall} className="p-3 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side panel */}
        {sidePanel && <MeetSidebar panel={sidePanel} onClose={() => setSidePanel(null)} />}
      </div>
    </div>
  );
}
