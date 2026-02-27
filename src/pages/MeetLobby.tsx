import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Monitor, Copy, Check, Users, AlertTriangle } from "lucide-react";
import buddyImg from "@/assets/buddy-owl.png";
import { useAuth } from "@/hooks/useAuth";
import { useMediaStream } from "@/hooks/useMediaStream";
import { supabase } from "@/integrations/supabase/client";

export default function MeetLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room") || "";
  const { role, user } = useAuth();
  const isTeacher = role === "teacher";

  const { stream, videoEnabled, audioEnabled, toggleVideo, toggleAudio, error } = useMediaStream();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [checking, setChecking] = useState(true);

  // Server-side: verify access
  useEffect(() => {
    if (!roomCode || !user) return;

    const checkAccess = async () => {
      if (isTeacher) {
        // Teachers: verify they own the session
        const { data: session } = await supabase
          .from("sessions")
          .select("teacher_id")
          .eq("room_code", roomCode)
          .maybeSingle();

        if (session && session.teacher_id !== user.id) {
          setAccessDenied(true);
        }
      } else {
        // Students: verify an active session exists with this code
        const { data: session } = await supabase
          .from("sessions")
          .select("id")
          .eq("room_code", roomCode)
          .eq("status", "active")
          .maybeSingle();

        if (!session) {
          setSessionNotFound(true);
        }
      }
      setChecking(false);
    };

    checkAccess();
  }, [roomCode, user, isTeacher]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    // Don't stop tracks here — let the hook cleanup handle it on unmount
    navigate(`/meet?room=${roomCode}`);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Teachers can only present their own sessions. You cannot join another teacher's session.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-8">
        {/* Camera preview */}
        <div className="flex-1 w-full max-w-xl">
          <div className="aspect-video rounded-2xl bg-meet-surface border border-border overflow-hidden relative shadow-xl">
            {videoEnabled && stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-meet-bar">
                <VideoOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="absolute top-4 left-4 right-4 bg-destructive/90 text-destructive-foreground text-xs rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${audioEnabled ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${videoEnabled ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Join panel */}
        <div className="w-full lg:w-80 space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Ready to join?</h2>
            {roomCode && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Room code</p>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="text-xl font-bold font-mono tracking-[0.3em] text-foreground">{roomCode}</span>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="w-4 h-4 text-correct" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isTeacher && (
            <div className="flex items-center gap-2 justify-center lg:justify-start px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary font-medium">You'll be presenting</span>
            </div>
          )}

          {!isTeacher && (
            <div className="flex items-center gap-2 justify-center lg:justify-start px-3 py-2 rounded-lg bg-secondary border border-border">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Joining as viewer</span>
            </div>
          )}

          <div className="space-y-3">
            <button onClick={handleJoin} className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              Join now
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary">
              <img src={buddyImg} alt="Buddy" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-muted-foreground">Study Buddy will be active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
