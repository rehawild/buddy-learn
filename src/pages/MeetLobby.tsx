import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Monitor, Copy, Check, Users } from "lucide-react";
import buddyImg from "@/assets/buddy-owl.png";

export default function MeetLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room") || "";
  const role = (searchParams.get("role") as "presenter" | "viewer") || "viewer";

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    navigate(`/meet?room=${roomCode}&role=${role}`);
  };

  const handlePresent = () => {
    navigate(`/meet?room=${roomCode}&role=presenter`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-8">
        {/* Camera preview */}
        <div className="flex-1 w-full max-w-xl">
          <div className="aspect-video rounded-2xl bg-meet-surface border border-border overflow-hidden relative shadow-xl">
            {cameraOn ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-foreground" style={{ backgroundColor: "hsl(168 60% 48%)" }}>
                  YO
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-meet-bar">
                <VideoOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-full transition-colors ${micOn ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={`p-3 rounded-full transition-colors ${cameraOn ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}
              >
                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
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

          {role === "presenter" && (
            <div className="flex items-center gap-2 justify-center lg:justify-start px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary font-medium">You'll be presenting</span>
            </div>
          )}

          {role === "viewer" && (
            <div className="flex items-center gap-2 justify-center lg:justify-start px-3 py-2 rounded-lg bg-secondary border border-border">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Joining as viewer</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleJoin}
              className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Join now
            </button>
            {role === "viewer" && (
              <button
                onClick={handlePresent}
                className="w-full px-6 py-3 rounded-full bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Present instead
              </button>
            )}
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
