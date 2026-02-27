import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, Eye, Users, Loader2 } from "lucide-react";
import { useMediaStream } from "@/hooks/useMediaStream";
import { lessons, type Question } from "@/data/lessons";
import ParticipantTile from "@/components/ParticipantTile";
import MeetSidebar from "@/components/MeetSidebar";
import MeetBottomBar from "@/components/MeetBottomBar";
import BuddyOverlay from "@/components/BuddyOverlay";
import BuddyChatDialog from "@/components/BuddyChatDialog";
import SlideRenderer from "@/components/SlideRenderer";
import SlideThumbnail from "@/components/SlideThumbnail";
import SlideProgress from "@/components/SlideProgress";
import SpeakerNotes from "@/components/SpeakerNotes";
import SlideGridOverlay from "@/components/SlideGridOverlay";
import TeacherQuestionPanel from "@/components/TeacherQuestionPanel";
import { useRealtimeRoom, type RoomState } from "@/hooks/useRealtimeRoom";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useLiveTranscript } from "@/hooks/useLiveTranscript";
import { useAuth } from "@/hooks/useAuth";
import { useSessionSlides } from "@/hooks/useSessionSlides";
import { useCoordinatorAgent } from "@/hooks/useCoordinatorAgent";
import { useStudentAgent } from "@/hooks/useStudentAgent";
import { supabase } from "@/integrations/supabase/client";

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

export default function MeetRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");
  const { role: authRole, displayName } = useAuth();
  const isViewer = authRole !== "teacher";
  const userName = displayName || (isViewer ? "Student" : "Presenter");

  // Fetch uploaded slides for this session
  const { slides: uploadedSlides, loading: slidesLoading, presentationTitle } = useSessionSlides(roomCode);
  const hasUploadedSlides = uploadedSlides && uploadedSlides.length > 0;

  // Real camera & mic
  const { stream, videoEnabled, audioEnabled, toggleVideo, toggleAudio } = useMediaStream();
  const [presenting, setPresenting] = useState(!isViewer);
  const [sidePanel, setSidePanel] = useState<"chat" | "people" | "questions" | null>(null);
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
  const realtimeRole = isViewer ? "viewer" : "presenter";
  const { isConnected, remoteState, participants: realtimeParticipants, broadcast, participantCount, channel, localPeerId, updatePresence } = useRealtimeRoom(roomCode, realtimeRole, userName);

  // WebRTC peer-to-peer video/audio
  const { remoteStreams } = useWebRTC({
    localStream: stream,
    channel,
    localPeerId,
    participants: realtimeParticipants,
    enabled: isConnected,
  });

  // Live transcript (all participants)
  const {
    transcriptLines,
    localTranscript,
    isListening: transcriptIsListening,
  } = useLiveTranscript({
    channel,
    isConnected,
    localPeerId,
    speakerName: userName,
    audioEnabled,
  });

  // Session ID lookup (for engagement persistence)
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!roomCode) return;
    supabase
      .from("sessions")
      .select("id")
      .eq("room_code", roomCode)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSessionId(data.id);
      });
  }, [roomCode]);

  // ── AI Coordinator Agent (teacher with uploaded slides) ──
  const {
    questionBank,
    isPreGenerating,
    preGenerateError,
    currentTranscript,
    coveredSlides,
    isListening,
    dispatchAll,
    dispatchSingleQuestion,
    isQuestionDispatched,
    dispatchCount,
  } = useCoordinatorAgent({
    slides: uploadedSlides,
    channel,
    isConnected,
    lessonTitle: presentationTitle || "Presentation",
    difficulty,
    currentSlideIndex: sectionIdx,
    sessionId,
    enabled: !isViewer && hasUploadedSlides === true,
    transcriptText: localTranscript,
    transcriptListening: transcriptIsListening,
  });

  // ── AI Student Agent (students — always enabled for chat) ──
  const {
    activeQuestion: aiActiveQuestion,
    answerQuestion: aiAnswerQuestion,
    dismissQuestion: aiDismissQuestion,
    queueLength: aiQueueLength,
    chatHistory: aiChatHistory,
    isChatLoading: aiChatLoading,
    sendChatMessage: aiSendChatMessage,
  } = useStudentAgent({
    channel,
    isConnected,
    studentId: localPeerId,
    studentName: userName,
    currentSlideIndex: sectionIdx,
    enabled: isViewer,
    fallbackLessonTitle: hasUploadedSlides
      ? (presentationTitle || "Presentation")
      : (lessons[lessonIdx]?.title || "Study Session"),
  });

  // Viewer: sync state from presenter
  useEffect(() => {
    if (!isViewer) return;
    setLessonIdx(remoteState.lessonIdx);
    if (!freeBrowse) {
      setSectionIdx(remoteState.sectionIdx);
    }
    setBuddyEnabled(remoteState.buddyEnabled);
    setDifficulty(remoteState.difficulty);
    if (!hasUploadedSlides && remoteState.activeQuestionIdx !== null) {
      const lesson = lessons[remoteState.lessonIdx];
      const section = lesson?.sections[remoteState.sectionIdx];
      const q = section?.questions[remoteState.activeQuestionIdx];
      setActiveQuestion(q || null);
      setActiveQuestionIdx(remoteState.activeQuestionIdx);
    } else if (hasUploadedSlides) {
      setActiveQuestion(null);
      setActiveQuestionIdx(null);
    } else {
      setActiveQuestion(null);
      setActiveQuestionIdx(null);
    }
    setPresenting(true);
  }, [isViewer, remoteState, freeBrowse, hasUploadedSlides]);

  // Demo lesson data (only when no uploaded slides)
  const lesson = hasUploadedSlides ? null : lessons[lessonIdx];
  const totalSlides = hasUploadedSlides ? uploadedSlides!.length : (lesson?.sections.length ?? 0);
  const displayIdx = isViewer && freeBrowse ? localSectionIdx : sectionIdx;
  const section = hasUploadedSlides ? null : lesson?.sections[displayIdx] ?? null;
  const isLastSection = displayIdx >= totalSlides - 1;
  const presenterSlide = sectionIdx;

  const slideTitle = hasUploadedSlides
    ? (presentationTitle || "Presentation")
    : (lesson?.title || "Study Session");

  // Determine which question to show in BuddyOverlay
  // For uploaded slides: students get AI-dispatched questions, teachers see nothing (they dispatch)
  // For demo lessons: existing hardcoded question logic
  const effectiveQuestion = hasUploadedSlides
    ? (isViewer ? aiActiveQuestion : null)
    : activeQuestion;

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

  // Buddy trigger (only for demo lessons)
  useEffect(() => {
    if (isViewer || !presenting || !buddyEnabled || hasUploadedSlides) return;
    clearTimeout(timerRef.current);
    const currentSection = lesson?.sections[sectionIdx];
    if (!currentSection) return;
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
  }, [sectionIdx, lessonIdx, buddyEnabled, difficulty, presenting, isViewer, broadcastState, lesson?.sections, hasUploadedSlides]);

  const handleAnswer = useCallback((correct: boolean) => {
    setResults((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      concepts: [...new Set([...prev.concepts, section?.title || ""])].slice(-5),
    }));

    // If student agent is active, send response back to coordinator
    if (isViewer && hasUploadedSlides && aiActiveQuestion) {
      aiAnswerQuestion(correct, correct ? aiActiveQuestion.answer : "wrong");
    }
  }, [section?.title, isViewer, hasUploadedSlides, aiActiveQuestion, aiAnswerQuestion]);

  const handleDismiss = useCallback(() => {
    setActiveQuestion(null);
    setActiveQuestionIdx(null);
    if (isViewer && hasUploadedSlides) {
      aiDismissQuestion();
    }
    if (!isViewer) broadcastState({ activeQuestionIdx: null });
  }, [isViewer, broadcastState, hasUploadedSlides, aiDismissQuestion]);

  const handleBuddyChat = useCallback((message: string) => {
    const slideContent = hasUploadedSlides
      ? (uploadedSlides![displayIdx]?.contentText || `Slide ${displayIdx + 1}`)
      : (section?.content ?? "");
    const slideTitle = hasUploadedSlides
      ? (presentationTitle || "Presentation")
      : (section?.title ?? "");
    aiSendChatMessage(message, slideContent, slideTitle);
  }, [aiSendChatMessage, hasUploadedSlides, uploadedSlides, displayIdx, presentationTitle, section]);

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
          state: { lessonTitle: slideTitle, ...results, concepts: results.concepts.slice(0, 3) },
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
    if (hasUploadedSlides) return;
    setLessonIdx(i);
    setSectionIdx(0);
    setLocalSectionIdx(0);
    setActiveQuestion(null);
    setActiveQuestionIdx(null);
    setResults({ correct: 0, total: 0, concepts: [] });
    broadcastState({ lessonIdx: i, sectionIdx: 0, activeQuestionIdx: null });
  };

  const leaveCall = async () => {
    // If presenter, mark session as ended in Supabase
    if (!isViewer && roomCode) {
      await supabase
        .from("sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("room_code", roomCode);
    }

    if (presenting && results.total > 0) {
      navigate("/recap", { state: { lessonTitle: slideTitle, ...results, concepts: results.concepts.slice(0, 3) } });
    } else {
      navigate("/");
    }
  };

  const toggleSidePanel = (panel: "chat" | "people" | "questions") => {
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

  const totalParticipants = participantCount;

  if (slidesLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-14 bg-meet-bar border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{presenting ? slideTitle : "Study Session"}</h2>
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
        {/* Thumbnail sidebar (presenter only, demo lessons only) */}
        {presenting && showThumbnails && !isViewer && !hasUploadedSlides && (
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
                sections={lesson!.sections}
                currentIndex={displayIdx}
                onSelect={handleSlideSelect}
                lessonIcon={lesson!.icon}
              />
            </div>
          </div>
        )}

        {/* Uploaded slides thumbnail sidebar */}
        {presenting && showThumbnails && !isViewer && hasUploadedSlides && (
          <div className="w-48 lg:w-56 border-r border-border bg-meet-bar flex-shrink-0 hidden md:block overflow-y-auto">
            <div className="p-2 space-y-2">
              {uploadedSlides!.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => handleSlideSelect(i)}
                  className={`w-full rounded-lg overflow-hidden border-2 transition-colors ${
                    i === displayIdx ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <div className="aspect-video bg-meet-surface relative">
                    <img
                      src={slide.imagePath}
                      alt={`Slide ${slide.slideNumber}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-background/80 text-muted-foreground px-1 rounded">
                      {slide.slideNumber}
                    </span>
                  </div>
                </button>
              ))}
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
              {/* Participant filmstrip with video */}
              {presenting && (
                <div className="flex gap-2 px-4 pt-2 overflow-x-auto flex-shrink-0">
                  {realtimeParticipants.length > 0
                    ? realtimeParticipants.map((p) => {
                        const isSelf = p.id === localPeerId;
                        return (
                          <ParticipantTile
                            key={p.id}
                            participant={{
                              id: p.id,
                              name: p.name,
                              initials: p.name.slice(0, 2).toUpperCase(),
                              color: stringToColor(p.name),
                              isMuted: isSelf ? !audioEnabled : false,
                              isCameraOff: isSelf ? !videoEnabled : false,
                              isSelf,
                            }}
                            size="filmstrip"
                            stream={isSelf ? stream : (remoteStreams.get(p.id) ?? null)}
                            handRaised={p.handRaised}
                            role={p.role}
                          />
                        );
                      })
                    : (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground">
                        Waiting for participants…
                      </div>
                    )}
                </div>
              )}

              {/* AI Coordinator status (teacher with uploaded slides) */}
              {!isViewer && hasUploadedSlides && (
                <div className="mx-4 mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs">
                    {isPreGenerating ? (
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI analyzing presentation...</span>
                      </div>
                    ) : preGenerateError ? (
                      <div className="text-destructive">
                        AI error: {preGenerateError}
                      </div>
                    ) : questionBank ? (
                      <div className="flex items-center gap-3 text-muted-foreground flex-1 min-w-0">
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          AI Ready ({questionBank.length} slides)
                        </span>
                        {isListening && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Listening
                          </span>
                        )}
                        <span className="flex-shrink-0">{coveredSlides.size} covered</span>
                        <button
                          onClick={dispatchAll}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex-shrink-0 bg-secondary text-foreground hover:bg-secondary/80"
                        >
                          Send all questions
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Live transcript */}
                  {questionBank && isListening && (
                    <div className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-medium text-muted-foreground">Live transcript</span>
                      </div>
                      <p className="text-foreground/70 italic truncate">
                        {currentTranscript || "Speak to see your words here..."}
                      </p>
                    </div>
                  )}
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
                    {hasUploadedSlides ? (
                      /* Uploaded slide image */
                      <div className="w-full h-full flex items-center justify-center bg-background">
                        <img
                          key={displayIdx}
                          src={uploadedSlides![displayIdx]?.imagePath}
                          alt={`Slide ${displayIdx + 1}`}
                          className="max-w-full max-h-full object-contain slide-enter"
                        />
                      </div>
                    ) : (
                      /* Demo lesson slide */
                      <SlideRenderer
                        section={section!}
                        lessonTitle={lesson!.title}
                        lessonIcon={section!.layout === "title" ? lesson!.icon : undefined}
                        slideNumber={displayIdx + 1}
                        totalSlides={totalSlides}
                        theme={lesson!.theme || "default"}
                        slideKey={`${lessonIdx}-${displayIdx}`}
                      />
                    )}

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

                    {/* Buddy overlays (students only) */}
                    {isViewer && (
                      <>
                        <BuddyOverlay
                          question={effectiveQuestion}
                          difficulty={difficulty}
                          enabled={buddyEnabled}
                          onAnswer={handleAnswer}
                          onDismiss={handleDismiss}
                          readOnly={!hasUploadedSlides}
                          questionSource={effectiveQuestion?.source === "transcript" ? "transcript" : (effectiveQuestion && hasUploadedSlides ? "slides" : undefined)}
                        />
                        <BuddyChatDialog
                          chatHistory={aiChatHistory}
                          isChatLoading={aiChatLoading}
                          onSendChat={handleBuddyChat}
                        />
                      </>
                    )}

                    {/* Live transcript subtitle bar */}
                    {transcriptLines.length > 0 && (
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[80%] z-20">
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                          {transcriptLines.slice(-2).map((line, i) => (
                            <p key={line.peerId + i} className="text-sm text-white/90">
                              <span className="font-semibold text-primary-foreground/80">{line.speaker}: </span>
                              {line.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                    {realtimeParticipants.length > 0
                      ? realtimeParticipants.map((p) => {
                          const isSelf = p.id === localPeerId;
                          return (
                            <ParticipantTile
                              key={p.id}
                              participant={{
                                id: p.id,
                                name: p.name,
                                initials: p.name.slice(0, 2).toUpperCase(),
                                color: stringToColor(p.name),
                                isMuted: isSelf ? !audioEnabled : false,
                                isCameraOff: isSelf ? !videoEnabled : false,
                                isSelf,
                              }}
                              size="large"
                              stream={isSelf ? stream : (remoteStreams.get(p.id) ?? null)}
                              handRaised={p.handRaised}
                              role={p.role}
                            />
                          );
                        })
                      : (
                        <div className="col-span-full flex items-center justify-center text-muted-foreground">
                          No participants yet
                        </div>
                      )}
                  </div>
                )}
              </div>

              {presenting && !isViewer && !hasUploadedSlides && section && <SpeakerNotes notes={section.speakerNotes} />}
            </div>

            {sidePanel === "questions" ? (
              <TeacherQuestionPanel
                questionBank={questionBank}
                isPreGenerating={isPreGenerating}
                preGenerateError={preGenerateError}
                onDispatchSingle={dispatchSingleQuestion}
                onDispatchAll={dispatchAll}
                isQuestionDispatched={isQuestionDispatched}
                dispatchCount={dispatchCount}
                onClose={() => setSidePanel(null)}
              />
            ) : sidePanel ? (
              <MeetSidebar
                panel={sidePanel}
                onClose={() => setSidePanel(null)}
                roomCode={roomCode}
                userName={userName}
                realtimeParticipants={realtimeParticipants}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <MeetBottomBar
        micOn={audioEnabled}
        onToggleMic={toggleAudio}
        cameraOn={videoEnabled}
        onToggleCamera={toggleVideo}
        handRaised={handRaised}
        onToggleHand={() => {
          const next = !handRaised;
          setHandRaised(next);
          updatePresence({ handRaised: next });
        }}
        presenting={presenting}
        onTogglePresent={() => setPresenting((p) => !p)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => setShowThumbnails((p) => !p)}
        sidePanel={sidePanel}
        onToggleSidePanel={toggleSidePanel}
        hasUploadedSlides={hasUploadedSlides || false}
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

      {/* Slide grid overlay (demo lessons only) */}
      {gridMode && !hasUploadedSlides && lesson && (
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
