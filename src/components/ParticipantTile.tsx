import { useCallback } from "react";
import { MicOff, Hand, Pin, GraduationCap } from "lucide-react";
import type { Participant } from "@/data/participants";

interface ParticipantTileProps {
  participant: Participant;
  size?: "large" | "small" | "filmstrip";
  speaking?: boolean;
  stream?: MediaStream | null;
  handRaised?: boolean;
  role?: "presenter" | "viewer";
}

export default function ParticipantTile({ participant, size = "large", speaking = false, stream, handRaised, role }: ParticipantTileProps) {
  const videoCallbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el) {
        el.srcObject = stream ?? null;
      }
    },
    [stream],
  );

  const sizeClasses = {
    large: "min-h-[200px]",
    small: "min-h-[120px]",
    filmstrip: "w-[180px] h-[110px] flex-shrink-0",
  };

  const avatarSize = size === "filmstrip" ? 40 : size === "small" ? 48 : 72;
  const fontSize = size === "filmstrip" ? 14 : size === "small" ? 16 : 24;
  const showVideo = stream && !participant.isCameraOff;

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-meet-surface flex items-center justify-center ${sizeClasses[size]} ${
        speaking ? "ring-2 ring-primary" : ""
      }`}
    >
      <video
        ref={videoCallbackRef}
        autoPlay
        playsInline
        muted={participant.isSelf}
        className={`absolute inset-0 w-full h-full object-cover ${showVideo ? "" : "hidden"}`}
        style={participant.isSelf ? { transform: "scaleX(-1)" } : undefined}
      />
      {!showVideo && (
        <div
          className="rounded-full flex items-center justify-center text-foreground font-semibold select-none"
          style={{
            backgroundColor: participant.color,
            width: avatarSize,
            height: avatarSize,
            fontSize,
          }}
        >
          {participant.initials}
        </div>
      )}

      {/* Hand raised indicator */}
      {handRaised && (
        <div className="absolute top-2 left-2 p-1 rounded-full bg-yellow-500 text-white animate-bounce">
          <Hand className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Teacher badge */}
      {role === "presenter" && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold">
          <GraduationCap className="w-3 h-3" />
          <span>Teacher</span>
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-1.5">
          {participant.isMuted && <MicOff className="w-3 h-3 text-muted-foreground" />}
          <span className="text-xs text-foreground truncate">
            {participant.isSelf ? "You" : participant.name}
          </span>
        </div>
      </div>

      {/* Pin icon for large tiles */}
      {size === "large" && (
        <button className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 transition-opacity">
          <Pin className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
