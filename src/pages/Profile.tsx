import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, User, Award, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const navigate = useNavigate();
  const { user, role, displayName, avatarUrl, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => { setName(displayName ?? ""); }, [displayName]);

  useEffect(() => {
    if (!user) return;
    if (role === "teacher") {
      supabase.from("presentations").select("id, title, slide_count, created_at").eq("teacher_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setPresentations(data ?? []));
      supabase.from("sessions").select("id, room_code, status, started_at, ended_at").eq("teacher_id", user.id).order("started_at", { ascending: false }).then(({ data }) => setSessions(data ?? []));
    } else {
      supabase.from("session_engagement").select("id, session_id, questions_answered, correct_answers, created_at").eq("student_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setSessions(data ?? []));
    }
  }, [user, role]);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved!" }); refreshProfile(); }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    setAvatarPreview(URL.createObjectURL(file));

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    refreshProfile();
    toast({ title: "Avatar updated!" });
  };

  const currentAvatar = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar & Name */}
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 bg-secondary flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-foreground" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{role ?? "user"}</Badge>
              </div>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Display name"
                />
                <Button onClick={handleSave} disabled={saving || !name.trim()} size="sm">
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Teacher: Presentations */}
        {role === "teacher" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> My Presentations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {presentations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No presentations uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {presentations.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.slide_count} slides · {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> {role === "teacher" ? "My Sessions" : "Sessions Attended"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      {role === "teacher" ? (
                        <>
                          <p className="text-sm font-medium text-foreground">Room {s.room_code}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.status} · {new Date(s.started_at).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">{s.correct_answers}/{s.questions_answered} correct</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                        </>
                      )}
                    </div>
                    {role === "teacher" && (
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {s.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
