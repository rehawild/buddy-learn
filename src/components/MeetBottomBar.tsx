import { useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff,
  Hand, PhoneOff, MessageSquare, Users, Maximize, Minimize,
  PanelLeftClose, PanelLeft, SmilePlus, LayoutGrid, BookOpen,
} from "lucide-react";
import EmojiReactions from "@/components/EmojiReactions";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface MeetBottomBarProps {
  micOn: boolean;
  onToggleMic: () => void;
  cameraOn: boolean;
  onToggleCamera: () => void;
  handRaised: boolean;
  onToggleHand: () => void;
  presenting: boolean;
  onTogglePresent: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showThumbnails: boolean;
  onToggleThumbnails: () => void;
  sidePanel: "chat" | "people" | "questions" | null;
  onToggleSidePanel: (panel: "chat" | "people" | "questions") => void;
  hasUploadedSlides?: boolean;
  buddyEnabled: boolean;
  onToggleBuddy: () => void;
  difficulty: "easy" | "medium" | "hard";
  onNextDifficulty: () => void;
  roomCode: string | null;
  isViewer: boolean;
  onLeave: () => void;
  onToggleGrid?: () => void;
  gridMode?: boolean;
  onReaction?: (emoji: string) => void;
  raisedHandCount?: number;
}

const diffColors = { easy: "text-correct", medium: "text-buddy-warm", hard: "text-incorrect" } as const;

export default function MeetBottomBar({
  micOn, onToggleMic,
  cameraOn, onToggleCamera,
  handRaised, onToggleHand,
  presenting, onTogglePresent,
  isFullscreen, onToggleFullscreen,
  showThumbnails, onToggleThumbnails,
  sidePanel, onToggleSidePanel,
  hasUploadedSlides,
  buddyEnabled, onToggleBuddy,
  difficulty, onNextDifficulty,
  roomCode, isViewer, onLeave,
  onToggleGrid, gridMode,
  onReaction,
  raisedHandCount = 0,
}: MeetBottomBarProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="h-16 bg-meet-bar border-t border-border flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 flex-shrink-0">
      {/* Group 1: AV controls */}
      <div className="flex items-center gap-1">
        <button onClick={onToggleMic} className={`p-2.5 md:p-3 rounded-full transition-colors ${micOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive text-destructive-foreground"}`}>
          {micOn ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        <button onClick={onToggleCamera} className={`p-2.5 md:p-3 rounded-full transition-colors ${cameraOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive text-destructive-foreground"}`}>
          {cameraOn ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        <button onClick={onToggleHand} className={`p-2.5 md:p-3 rounded-full transition-colors ${handRaised ? "bg-buddy-warm text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Hand className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="w-px h-8 bg-border mx-0.5 md:mx-1" />

      {/* Group 2: Presentation controls */}
      <div className="flex items-center gap-1">
        {!isViewer && (
          <button onClick={onTogglePresent} className={`p-2.5 md:p-3 rounded-full transition-colors ${presenting ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {presenting ? <MonitorOff className="w-4 h-4 md:w-5 md:h-5" /> : <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        )}
        {presenting && (
          <button onClick={onToggleFullscreen} className="p-2.5 md:p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        )}
        {presenting && !isViewer && (
          <>
            <button onClick={onToggleThumbnails} className="p-2.5 md:p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors hidden md:block">
              {showThumbnails ? <PanelLeftClose className="w-4 h-4 md:w-5 md:h-5" /> : <PanelLeft className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            {onToggleGrid && (
              <button onClick={onToggleGrid} className={`p-2.5 md:p-3 rounded-full transition-colors ${gridMode ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="w-px h-8 bg-border mx-0.5 md:mx-1" />

      {/* Group 3: Communication */}
      <div className="flex items-center gap-1">
        <button onClick={() => onToggleSidePanel("chat")} className={`p-2.5 md:p-3 rounded-full transition-colors ${sidePanel === "chat" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button onClick={() => onToggleSidePanel("people")} className={`relative p-2.5 md:p-3 rounded-full transition-colors ${sidePanel === "people" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Users className="w-4 h-4 md:w-5 md:h-5" />
          {raisedHandCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-buddy-warm text-[10px] font-bold text-white px-1">
              {raisedHandCount}
            </span>
          )}
        </button>

        {!isViewer && hasUploadedSlides && (
          <button onClick={() => onToggleSidePanel("questions")} className={`p-2.5 md:p-3 rounded-full transition-colors ${sidePanel === "questions" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}

        {/* Emoji popover */}
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <button className={`p-2.5 md:p-3 rounded-full transition-colors ${emojiOpen ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <SmilePlus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <EmojiReactions roomCode={roomCode} onReaction={onReaction} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Group 4: Buddy (presenter only) */}
      {presenting && !isViewer && (
        <>
          <div className="w-px h-8 bg-border mx-0.5 md:mx-1" />
          <div className="flex items-center gap-1">
            <button onClick={onToggleBuddy} className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-full text-[10px] md:text-xs font-semibold transition-colors ${buddyEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              🦉 {buddyEnabled ? "ON" : "OFF"}
            </button>
            <button onClick={onNextDifficulty} className={`px-2 py-1.5 md:px-2.5 md:py-2 rounded-full text-[10px] md:text-xs font-semibold bg-secondary transition-colors ${diffColors[difficulty]}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </button>
          </div>
        </>
      )}

      <div className="w-px h-8 bg-border mx-0.5 md:mx-1" />

      {/* Leave */}
      <button onClick={onLeave} className="p-2.5 md:p-3 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
        <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
}
