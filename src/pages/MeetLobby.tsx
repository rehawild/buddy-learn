import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";
import buddyImg from "@/assets/buddy-owl.png";

export default function MeetLobby() {
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

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
        <div className="w-full lg:w-72 space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Ready to join?</h2>
            <p className="text-sm text-muted-foreground">study-session-demo</p>
          </div>

          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <div className="flex -space-x-2">
              {["SC", "AR", "JP", "PW"].map((init, i) => (
                <div
                  key={init}
                  className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-semibold text-foreground"
                  style={{ backgroundColor: ["hsl(280 60% 55%)", "hsl(28 90% 58%)", "hsl(200 70% 50%)", "hsl(340 65% 50%)"][i], zIndex: 4 - i }}
                >
                  {init}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">4 others are here</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/meet")}
              className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Join now
            </button>
            <button
              onClick={() => navigate("/meet?present=true")}
              className="w-full px-6 py-3 rounded-full bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              Present
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
