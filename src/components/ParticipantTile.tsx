import { MicOff, VideoOff, Pin } from "lucide-react";
import type { Participant } from "@/data/participants";

interface ParticipantTileProps {
  participant: Participant;
  size?: "large" | "small" | "filmstrip";
  speaking?: boolean;
}

export default function ParticipantTile({ participant, size = "large", speaking = false }: ParticipantTileProps) {
  const sizeClasses = {
    large: "min-h-[200px]",
    small: "min-h-[120px]",
    filmstrip: "w-[180px] h-[110px] flex-shrink-0",
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-meet-surface flex items-center justify-center ${sizeClasses[size]} ${
        speaking ? "ring-2 ring-primary" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className="rounded-full flex items-center justify-center text-foreground font-semibold select-none"
        style={{
          backgroundColor: participant.color,
          width: size === "filmstrip" ? 40 : size === "small" ? 48 : 72,
          height: size === "filmstrip" ? 40 : size === "small" ? 48 : 72,
          fontSize: size === "filmstrip" ? 14 : size === "small" ? 16 : 24,
        }}
      >
        {participant.initials}
      </div>

      {/* Camera off overlay */}
      {participant.isCameraOff && (
        <div className="absolute inset-0 bg-meet-surface/80 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center text-foreground font-semibold"
            style={{
              backgroundColor: participant.color,
              width: size === "filmstrip" ? 40 : size === "small" ? 48 : 72,
              height: size === "filmstrip" ? 40 : size === "small" ? 48 : 72,
              fontSize: size === "filmstrip" ? 14 : size === "small" ? 16 : 24,
            }}
          >
            {participant.initials}
          </div>
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
