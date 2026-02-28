import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Keyboard, Upload, FileText, User, Copy, Check, LayoutDashboard, LogOut } from "lucide-react";
import { generateRoomCode } from "@/lib/room";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parsePresentation, uploadSlides } from "@/lib/parsePresentation";

type UploadPhase = "idle" | "uploading" | "parsing" | "processing" | "done";

export default function MeetHome() {
  const navigate = useNavigate();
  const { role, signOut, user, avatarUrl } = useAuth();
  const { toast } = useToast();
  const [meetingCode, setMeetingCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTeacher = role === "teacher";

  // Keep existing handlers
  const handleNewMeeting = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20MB", variant: "destructive" });
      return;
    }

    try {
      setUploadPhase("uploading");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("presentations").upload(path, file);
      if (uploadError) throw new Error(uploadError.message);

      const title = file.name.replace(/\.[^.]+$/, "");
      const { data, error } = await supabase
        .from("presentations")
        .insert({ teacher_id: user.id, title, file_path: path, slide_count: 0 })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      const presentationId = data.id;
      setUploadedFile({ name: title, id: presentationId });

      setUploadPhase("parsing");
      const slides = await parsePresentation(file);

      setUploadPhase("processing");
      setUploadProgress({ current: 0, total: slides.length });
      await uploadSlides(presentationId, user.id, slides, (current, total) => {
        setUploadProgress({ current, total });
      });

      setUploadPhase("done");
      const code = generateRoomCode();
      setGeneratedCode(code);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setUploadPhase("idle");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartMeeting = async () => {
    if (!generatedCode || !user) return;
    await supabase.from("sessions").insert({
      teacher_id: user.id,
      presentation_id: uploadedFile?.id || null,
      room_code: generatedCode,
      status: "active",
    });
    navigate(`/lobby?room=${generatedCode}`);
  };

  const handleJoin = () => {
    const code = meetingCode.trim().toUpperCase();
    if (code) navigate(`/lobby?room=${code}`);
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isProcessing = uploadPhase !== "idle" && uploadPhase !== "done";

  const phaseLabel: Record<UploadPhase, string> = {
    idle: "",
    uploading: "Uploading file…",
    parsing: "Parsing slides…",
    processing: `Processing slide ${uploadProgress.current}/${uploadProgress.total}…`,
    done: "",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-primary" />
          {/* Changed "Study Meet" to "Catchy" */}
          <span className="text-lg font-semibold text-foreground">Catchy</span>
        </div>
        <div className="flex items-center gap-2">
          {isTeacher && (
            <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          <button onClick={async () => { await signOut(); navigate("/auth"); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12">
        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {isTeacher ? (
                <>Present & engage.<br /><span className="text-primary">With Catchy.</span></>
              ) : (
                <>Join & learn.<br /><span className="text-primary">With Catchy.</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {isTeacher
                ? "Upload your presentation, start a session, and engage students with AI-powered micro-interactions."
                : "Join a study session and stay engaged with quick micro-interactions during lessons."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isTeacher ? (
              <>
                <button onClick={handleNewMeeting} disabled={isProcessing} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isProcessing ? (
                    <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {isProcessing ? phaseLabel[uploadPhase] : "Upload & Present"}
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt" className="hidden" onChange={handleFileUpload} />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="Enter a code"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                  />
                </div>
                <button onClick={handleJoin} disabled={!meetingCode.trim()} className="px-5 py-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Join
                </button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <p className="text-sm text-muted-foreground">{phaseLabel[uploadPhase]}</p>
              {uploadPhase === "processing" && uploadProgress.total > 0 && (
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {generatedCode && uploadPhase === "done" && (
            <div className="p-4 rounded-xl bg-card border border-border shadow-lg space-y-3 fade-up">
              {uploadedFile && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate">{uploadedFile.name}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Share this code with your students:</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono tracking-[0.3em] text-foreground">{generatedCode}</span>
                <button onClick={handleCopy} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="w-4 h-4 text-correct" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={handleStartMeeting} className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm">
                Start meeting
              </button>
            </div>
          )}
        </div>

        <div className="relative w-full max-w-lg">
          <div className="aspect-[4/3] rounded-2xl bg-card border border-border overflow-hidden shadow-2xl">
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <img src="/hero-anim.gif" alt="Catchy" className="w-48 h-48 object-contain" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  {isTeacher ? "Upload & present" : "Enter the room code"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isTeacher
                    ? "Upload a PDF or PPTX to start presenting with Catchy active"
                    : "Enter the room code shared by your teacher to join the session"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
