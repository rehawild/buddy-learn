import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Eye, Users,
} from "lucide-react";
import { fakeParticipants } from "@/data/participants";
import { lessons, type Question } from "@/data/lessons";
import ParticipantTile from "@/components/ParticipantTile";
import MeetSidebar from "@/components/MeetSidebar";
import MeetBottomBar from "@/components/MeetBottomBar";
import BuddyOverlay from "@/components/BuddyOverlay";
import SlideRenderer from "@/components/SlideRenderer";
import SlideThumbnail from "@/components/SlideThumbnail";
import SlideProgress from "@/components/SlideProgress";
import SpeakerNotes from "@/components/SpeakerNotes";
import SlideGridOverlay from "@/components/SlideGridOverlay";
import { useRealtimeRoom, type RoomState } from "@/hooks/useRealtimeRoom";

export default function MeetRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");
  const role = (searchParams.get("role") as "presenter" | "viewer") || "presenter";
  const isViewer = role === "viewer";

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [presenting, setPresenting] = useState(!isViewer);
  const [sidePanel, setSidePanel] = useState<"chat" | "people" | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(!isViewer);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridMode, setGridMode] = useState(false);

  // Viewer free-browse
  const [freeBrowse, setFreeBrowse] = useState(false);
  const [localSectionIdx, setLocalSectionIdx] = useState(0);

  // Presentation state
  const [lessonIdx, setLessonIdx] = useState(0);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [buddyEnabled, setBuddyEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);
  const [results, setResults] = useState({ correct: 0, total: 0, concepts: [] as string[] });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Elapsed timer
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState("0:00");
  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(s / 60);
      setElapsed(`${m}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  // Realtime room
  const { isConnected, remoteState, participants: realtimeParticipants, broadcast, participantCount } = useRealtimeRoom(roomCode, role);

  // Viewer: sync state from presenter
  useEffect(() => {
    if (!isViewer) return;
    setLessonIdx(remoteState.lessonIdx);
    if (!freeBrowse) {
      setSectionIdx(remoteState.sectionIdx);
    }
    setBuddyEnabled(remoteState.buddyEnabled);
    setDifficulty(remoteState.difficulty);
    if (remoteState.activeQuestionIdx !== null) {
      const lesson = lessons[remoteState.lessonIdx];
      const section = lesson?.sections[remoteState.sectionIdx];
      const q = section?.questions[remoteState.activeQuestionIdx];
      setActiveQuestion(q || null);
      setActiveQuestionIdx(remoteState.activeQuestionIdx);
    } else {
      setActiveQuestion(null);
      setActiveQuestionIdx(null);
    }
    setPresenting(true);
  }, [isViewer, remoteState, freeBrowse]);

  const lesson = lessons[lessonIdx];
  const displayIdx = isViewer && freeBrowse ? localSectionIdx : sectionIdx;
  const section = lesson.sections[displayIdx];
  const totalSlides = lesson.sections.length;
  const isLastSection = displayIdx >= totalSlides - 1;
  const presenterSlide = sectionIdx; // for viewer indicator

  // Broadcast helper
  const broadcastState = useCallback((overrides: Partial<RoomState> = {}) => {
    if (isViewer) return;
    broadcast({
      lessonIdx, sectionIdx, activeQuestionIdx, buddyEnabled, difficulty,
      feedbackPhase: "idle", ...overrides,
    });
  }, [isViewer, broadcast, lessonIdx, sectionIdx, activeQuestionIdx, buddyEnabled, difficulty]);

  // Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Buddy trigger
  useEffect(() => {
    if (isViewer || !presenting || !buddyEnabled) return;
    clearTimeout(timerRef.current);
    const currentSection = lesson.sections[sectionIdx];
    timerRef.current = setTimeout(() => {
      const matching = currentSection.questions.filter((q) => q.difficulty === difficulty);
      const q = matching.length > 0 ? matching[0] : currentSection.questions[0];
      if (q) {
        const idx = currentSection.questions.indexOf(q);
        setActiveQuestion(q);
        setActiveQuestionIdx(idx);
        broadcastState({ activeQuestionIdx: idx });
      }
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [sectionIdx, lessonIdx, buddyEnabled, difficulty, presenting, isViewer, broadcastState, lesson.sections]);

  const handleAnswer = useCallback((correct: boolean) => {
    setResults((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      concepts: [...new Set([...prev.concepts, section.title])].slice(-5),
    }));
  }, [section.title]);

  const handleDismiss = useCallback(() => {
    setActiveQuestion(null);
    setActiveQuestionIdx(null);
    if (!isViewer) broadcastState({ activeQuestionIdx: null });
  }, [isViewer, broadcastState]);

  const navigateSlide = (newIdx: number) => {
    if (isViewer && freeBrowse) {
      setLocalSectionIdx(newIdx);
    } else if (!isViewer) {
      setSectionIdx(newIdx);
      setActiveQuestion(null);
      setActiveQuestionIdx(null);
      broadcastState({ sectionIdx: newIdx, activeQuestionIdx: null });
    }
  };

  const nextSection = () => {
    if (isLastSection) {
      if (!isViewer) {
        navigate("/recap", {
          state: { lessonTitle: lesson.title, ...results, concepts: [...new Set([...results.concepts, section.title])].slice(0, 3) },
        });
      }
    } else {
      navigateSlide(displayIdx + 1);
    }
  };

  const prevSection = () => {
    if (displayIdx > 0) navigateSlide(displayIdx - 1);
  };

  const handleSlideSelect = (i: number) => navigateSlide(i);

  const handleLessonChange = (i: number) => {
    setLessonIdx(i);
    setSectionIdx(0);
    setLocalSectionIdx(0);
    setActiveQuestion(null);
    setActiveQuestionIdx(null);
    setResults({ correct: 0, total: 0, concepts: [] });
    broadcastState({ lessonIdx: i, sectionIdx: 0, activeQuestionIdx: null });
  };

  const leaveCall = () => {
    if (presenting && results.total > 0) {
      navigate("/recap", { state: { lessonTitle: lesson.title, ...results, concepts: results.concepts.slice(0, 3) } });
    } else {
      navigate("/");
    }
  };

  const toggleSidePanel = (panel: "chat" | "people") => {
    setSidePanel((prev) => (prev === panel ? null : panel));
  };

  const nextDiff = () => {
    const order: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    const newDiff = order[(order.indexOf(difficulty) + 1) % 3];
    setDifficulty(newDiff);
    broadcastState({ difficulty: newDiff });
  };

  const toggleBuddy = () => {
    const newVal = !buddyEnabled;
    setBuddyEnabled(newVal);
    broadcastState({ buddyEnabled: newVal });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") { e.preventDefault(); if (!isViewer) setGridMode((p) => !p); }
      if (e.key === "Escape" && gridMode) { e.preventDefault(); setGridMode(false); return; }
      if (isViewer && !freeBrowse) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); nextSection(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prevSection(); }
      if (e.key === "Escape" && isFullscreen) document.exitFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const totalParticipants = Math.max(fakeParticipants.length, participantCount + fakeParticipants.length - 1);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-14 bg-meet-bar border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{presenting ? lesson.title : "Study Session"}</h2>
          <p className="text-xs text-muted-foreground">
            {roomCode ? `Room: ${roomCode}` : "study-session-demo"} · {elapsed}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="hidden sm:flex items-center gap-1">
            <Users className="w-3 h-3" /> {totalParticipants}
          </span>
        </div>
        {presenting && !isViewer && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Presenting · {displayIdx + 1}/{totalSlides}
          </div>
        )}
        {isViewer && presenting && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
              <Eye className="w-3 h-3" /> {freeBrowse ? "Browsing" : "Viewing"}
            </div>
            <button
              onClick={() => { setFreeBrowse((p) => !p); setLocalSectionIdx(sectionIdx); }}
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${freeBrowse ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {freeBrowse ? "Return to presenter" : "Browse freely"}
            </button>
          </div>
        )}
        {roomCode && !isConnected && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
            Connecting…
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnail sidebar (presenter only) */}
        {presenting && showThumbnails && !isViewer && (
          <div className="w-48 lg:w-56 border-r border-border bg-meet-bar flex-shrink-0 hidden md:block">
            <div className="h-full flex flex-col">
              <div className="flex gap-1 p-2 border-b border-border">
                {lessons.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => handleLessonChange(i)}
                    className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors truncate ${
                      i === lessonIdx ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.icon} {l.subject}
                  </button>
                ))}
              </div>
              <SlideThumbnail
                sections={lesson.sections}
                currentIndex={displayIdx}
                onSelect={handleSlideSelect}
                lessonIcon={lesson.icon}
              />
            </div>
          </div>
        )}

        {/* Center + sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {presenting && (
            <div className="px-4 pt-2 flex-shrink-0">
              <SlideProgress current={displayIdx} total={totalSlides} />
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Participant filmstrip */}
              {presenting && (
                <div className="flex gap-2 px-4 pt-2 overflow-x-auto flex-shrink-0">
                  {realtimeParticipants.length > 0
                    ? realtimeParticipants.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs text-foreground">
                          <span className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                          {p.name} <span className="text-muted-foreground capitalize">({p.role})</span>
                        </div>
                      ))
                    : fakeParticipants.filter((p) => !p.isSelf).slice(0, 4).map((p) => (
                        <ParticipantTile key={p.id} participant={p} size="filmstrip" />
                      ))}
                </div>
              )}

              {/* Viewer: presenter position indicator */}
              {isViewer && freeBrowse && displayIdx !== presenterSlide && (
                <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Presenter is on slide {presenterSlide + 1}
                  <button
                    onClick={() => { setLocalSectionIdx(presenterSlide); setFreeBrowse(false); }}
                    className="ml-auto px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90"
                  >
                    Jump back
                  </button>
                </div>
              )}

              {/* Slide area */}
              <div className="flex-1 p-2 md:p-4 overflow-hidden">
                {presenting ? (
                  <div className="h-full relative rounded-xl overflow-hidden shadow-2xl border border-border">
                    <SlideRenderer
                      section={section}
                      lessonTitle={lesson.title}
                      lessonIcon={section.layout === "title" ? lesson.icon : undefined}
                      slideNumber={displayIdx + 1}
                      totalSlides={totalSlides}
                      theme={lesson.theme || "default"}
                      slideKey={`${lessonIdx}-${displayIdx}`}
                    />

                    {/* Slide nav */}
                    {(!isViewer || freeBrowse) && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-border">
                        <button onClick={prevSection} disabled={displayIdx === 0} className="p-1.5 rounded-full hover:bg-secondary transition-colors disabled:opacity-30 text-foreground">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-muted-foreground px-2">{displayIdx + 1} / {totalSlides}</span>
                        <button onClick={nextSection} disabled={isViewer && isLastSection} className="p-1.5 rounded-full hover:bg-secondary transition-colors disabled:opacity-30 text-foreground">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <BuddyOverlay
                      question={activeQuestion}
                      difficulty={difficulty}
                      enabled={buddyEnabled}
                      onAnswer={handleAnswer}
                      onDismiss={handleDismiss}
                      readOnly={isViewer}
                    />
                  </div>
                ) : (
                  <div className="h-full grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                    {fakeParticipants.map((p) => (
                      <ParticipantTile key={p.id} participant={{ ...p, ...(p.isSelf ? { isCameraOff: !cameraOn, isMuted: !micOn } : {}) }} size="large" speaking={p.id === "p4"} />
                    ))}
                  </div>
                )}
              </div>

              {presenting && !isViewer && <SpeakerNotes notes={section.speakerNotes} />}
            </div>

            {sidePanel && (
              <MeetSidebar
                panel={sidePanel}
                onClose={() => setSidePanel(null)}
                roomCode={roomCode}
                userName={isViewer ? "Viewer" : "Presenter"}
                realtimeParticipants={realtimeParticipants}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <MeetBottomBar
        micOn={micOn}
        onToggleMic={() => setMicOn((p) => !p)}
        cameraOn={cameraOn}
        onToggleCamera={() => setCameraOn((p) => !p)}
        handRaised={handRaised}
        onToggleHand={() => setHandRaised((p) => !p)}
        presenting={presenting}
        onTogglePresent={() => setPresenting((p) => !p)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => setShowThumbnails((p) => !p)}
        sidePanel={sidePanel}
        onToggleSidePanel={toggleSidePanel}
        buddyEnabled={buddyEnabled}
        onToggleBuddy={toggleBuddy}
        difficulty={difficulty}
        onNextDifficulty={nextDiff}
        roomCode={roomCode}
        isViewer={isViewer}
        onLeave={leaveCall}
        gridMode={gridMode}
        onToggleGrid={() => setGridMode((p) => !p)}
      />

      {/* Slide grid overlay */}
      {gridMode && (
        <SlideGridOverlay
          sections={lesson.sections}
          currentIndex={displayIdx}
          onSelect={handleSlideSelect}
          onClose={() => setGridMode(false)}
          lessonIcon={lesson.icon}
          theme={lesson.theme || "default"}
        />
      )}
    </div>
  );
}
