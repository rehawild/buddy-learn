import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Brain, Zap, Target, Loader2, Sparkles } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTeacherSessions } from "@/hooks/useTeacherSessions";
import { useSessionEngagement, type StudentRow, type QuestionDispatchStat, type SlideBreakdown } from "@/hooks/useSessionEngagement";
import { Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  mockStudents,
  mockTimeline,
  mockDifficultyBreakdown,
  mockReactions,
} from "@/data/mockEngagement";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Session selector
  const { sessions, loading: sessionsLoading } = useTeacherSessions();
  const selectedSessionId = searchParams.get("session") || "";
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const setSelectedSession = (id: string) => {
    if (id === "__mock__") {
      setSearchParams({});
    } else {
      setSearchParams({ session: id });
    }
  };

  // Default to the latest session when sessions load and none is selected
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && !searchParams.get("session")) {
      setSearchParams({ session: sessions[0].id });
    }
  }, [sessionsLoading, sessions, searchParams, setSearchParams]);

  // Real engagement data
  const isLive = selectedSession?.status === "active";
  const { students: realStudents, timeline: realTimeline, difficultyBreakdown: realDifficulty, reactions: realReactions, questionStats, slideBreakdown, loading: engagementLoading } =
    useSessionEngagement(selectedSessionId || null, isLive);

  // Use real data when available, fall back to mock
  const hasRealData = selectedSessionId && realStudents.length > 0;
  const students = hasRealData ? realStudents : mockStudents.map((s) => ({
    ...s,
    attentionScore: 0,
    tabSwitchCount: 0,
    idleCount: 0,
  }));
  const timeline = hasRealData ? realTimeline : mockTimeline;
  const difficultyBreakdown = hasRealData ? realDifficulty : mockDifficultyBreakdown;
  const reactions = hasRealData ? realReactions : mockReactions;

  // KPIs
  const totalAnswered = students.reduce((s, st) => s + st.questionsAnswered, 0);
  const totalCorrect = students.reduce((s, st) => s + st.correctAnswers, 0);
  const classAvgAccuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const avgBuddyInteractions = students.length
    ? Math.round(students.reduce((s, st) => s + st.buddyInteractions, 0) / students.length)
    : 0;

  // AI assessments cache
  const [assessments, setAssessments] = useState<Record<string, string>>({});
  const [assessmentLoading, setAssessmentLoading] = useState<Record<string, boolean>>({});

  const requestAssessment = async (student: StudentRow) => {
    if (assessments[student.studentId]) return;
    setAssessmentLoading((prev) => ({ ...prev, [student.studentId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("buddy-ai", {
        body: {
          action: "student-assessment",
          payload: {
            studentName: student.name,
            questionsAnswered: student.questionsAnswered,
            correctAnswers: student.correctAnswers,
            avgResponseTime: student.avgResponseTime,
            attentionScore: student.attentionScore,
            reactionsCount: student.reactionsCount,
            buddyInteractions: student.buddyInteractions,
            tabSwitchCount: student.tabSwitchCount,
            idleCount: student.idleCount,
          },
        },
      });

      if (error || data?.error) {
        setAssessments((prev) => ({ ...prev, [student.studentId]: "Assessment unavailable" }));
      } else {
        setAssessments((prev) => ({ ...prev, [student.studentId]: data.assessment }));
      }
    } catch {
      setAssessments((prev) => ({ ...prev, [student.studentId]: "Assessment unavailable" }));
    } finally {
      setAssessmentLoading((prev) => ({ ...prev, [student.studentId]: false }));
    }
  };

  // Chart configs
  const chartConfig = {
    attention: { label: "Attention", color: "hsl(168, 60%, 48%)" },
    participation: { label: "Participation", color: "hsl(28, 90%, 58%)" },
  };

  const barData = difficultyBreakdown.map((d) => ({
    difficulty: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1),
    correct: d.correct,
    incorrect: d.total - d.correct,
    rate: d.total ? Math.round((d.correct / d.total) * 100) : 0,
  }));

  const barConfig = {
    correct: { label: "Correct", color: "hsl(145, 60%, 45%)" },
    incorrect: { label: "Incorrect", color: "hsl(0, 72%, 55%)" },
  };

  // Per-slide accuracy chart data
  const slideBarData = slideBreakdown.map((s) => ({
    slide: `${s.slideIndex + 1}`,
    accuracy: s.accuracy,
    fill: s.accuracy >= 70 ? "hsl(145, 60%, 45%)" : s.accuracy >= 40 ? "hsl(38, 90%, 50%)" : "hsl(0, 72%, 55%)",
  }));
  const slideBarConfig = {
    accuracy: { label: "Accuracy %", color: "hsl(168, 60%, 48%)" },
  };

  const isLoading = sessionsLoading || engagementLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Student engagement analytics from Buddy mascot</p>
          </div>
          <Badge variant="outline" className="hidden sm:flex gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            {students.length} students
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Session Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-foreground flex-shrink-0">Session:</label>
              <Select value={selectedSessionId || "__mock__"} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Select a session..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__mock__">Demo data (no session selected)</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.presentation_title || "Untitled"} — {s.room_code} ({new Date(s.started_at).toLocaleDateString()})
                      {s.status === "active" ? " [Live]" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSession && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={selectedSession.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {selectedSession.status}
                  </Badge>
                  <span>{new Date(selectedSession.started_at).toLocaleString()}</span>
                </div>
              )}
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {!hasRealData && selectedSessionId && !engagementLoading && (
              <p className="mt-2 text-xs text-muted-foreground">No engagement data for this session yet. Showing demo data.</p>
            )}
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard icon={<Users className="w-4 h-4" />} label="Active Students" value={students.length.toString()} sub="in session" accent="primary" />
          <KPICard icon={<Target className="w-4 h-4" />} label="Class Accuracy" value={`${classAvgAccuracy}%`} sub={`${totalCorrect}/${totalAnswered} correct`} accent="correct" />
          <KPICard icon={<Brain className="w-4 h-4" />} label="Buddy Interactions" value={avgBuddyInteractions.toString()} sub="avg per student" accent="accent" />
          <KPICard icon={<Zap className="w-4 h-4" />} label="Total Reactions" value={reactions.reduce((s, r) => s + r.count, 0).toString()} sub="across session" accent="primary" />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Attention & Participation Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attention & Participation Over Time</CardTitle>
              <CardDescription className="text-xs">Tracked via Buddy mascot interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <AreaChart data={timeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="attention" stroke="var(--color-attention)" fill="var(--color-attention)" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="participation" stroke="var(--color-participation)" fill="var(--color-participation)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                  No timeline data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Difficulty Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Accuracy by Difficulty</CardTitle>
              <CardDescription className="text-xs">How students perform at each level</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barConfig} className="h-[240px] w-full">
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="correct" stackId="a" fill="var(--color-correct)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="incorrect" stackId="a" fill="var(--color-incorrect)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Per-Slide Accuracy */}
        {slideBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Accuracy by Slide</CardTitle>
              <CardDescription className="text-xs">Identify which slides had the lowest comprehension</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChartContainer config={slideBarConfig} className="h-[240px] w-full">
                <BarChart data={slideBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="slide" tick={{ fontSize: 11 }} className="fill-muted-foreground" label={{ value: "Slide", position: "insideBottom", offset: -2, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {slideBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Slide</TableHead>
                    <TableHead className="text-center w-24">Questions</TableHead>
                    <TableHead className="text-center w-24">Responses</TableHead>
                    <TableHead className="text-center w-24">Accuracy</TableHead>
                    <TableHead className="hidden sm:table-cell text-center w-28">Avg Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slideBreakdown.map((s) => (
                    <TableRow key={s.slideIndex}>
                      <TableCell className="font-mono text-xs">{s.slideIndex + 1}</TableCell>
                      <TableCell className="text-center text-xs font-mono">{s.totalQuestions}</TableCell>
                      <TableCell className="text-center text-xs font-mono">{s.totalResponses}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={s.accuracy} className="h-2 w-12" />
                          <span className={`text-xs font-mono ${s.accuracy >= 70 ? "text-[hsl(145,60%,45%)]" : s.accuracy >= 40 ? "text-[hsl(38,90%,50%)]" : "text-destructive"}`}>
                            {s.totalResponses > 0 ? `${s.accuracy}%` : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-xs font-mono">
                        {s.totalResponses > 0 ? `${(s.avgResponseTimeMs / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Emoji Reactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Live Reactions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {reactions.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {reactions.map((r) => (
                  <div key={r.emoji} className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-2">
                    <span className="text-xl">{r.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.count}</p>
                      <p className="text-[10px] text-muted-foreground">{r.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reactions recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Question Analysis */}
        {questionStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Analysis</CardTitle>
              <CardDescription className="text-xs">Per-question accuracy — sorted hardest first to spot trouble spots</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead className="text-center w-20">Slide</TableHead>
                    <TableHead className="text-center w-24">Difficulty</TableHead>
                    <TableHead className="text-center w-24">Accuracy</TableHead>
                    <TableHead className="hidden sm:table-cell text-center w-24">Responses</TableHead>
                    <TableHead className="hidden md:table-cell text-center w-20">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionStats.map((q, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[300px] truncate" title={q.questionText}>
                        {q.questionText}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono">
                        {q.slideIndex + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            q.difficulty === "hard"
                              ? "bg-destructive/15 text-destructive"
                              : q.difficulty === "easy"
                                ? "bg-primary/15 text-primary"
                                : ""
                          }`}
                        >
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={q.accuracy} className="h-2 w-12" />
                          <span className="text-xs font-mono text-muted-foreground w-8">
                            {q.responses.length > 0 ? `${q.accuracy}%` : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-xs font-mono">
                        {q.responses.length}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {q.source}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Student Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Individual Student Performance</CardTitle>
            <CardDescription className="text-xs">Sorted by accuracy — identify students needing support</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Avg Response</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Buddy Chats</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Reactions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">AI Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...students]
                  .sort((a, b) => {
                    const accA = a.questionsAnswered ? a.correctAnswers / a.questionsAnswered : 0;
                    const accB = b.questionsAnswered ? b.correctAnswers / b.questionsAnswered : 0;
                    return accB - accA;
                  })
                  .map((s) => {
                    const accuracy = s.questionsAnswered
                      ? Math.round((s.correctAnswers / s.questionsAnswered) * 100)
                      : 0;
                    const status = accuracy >= 80 ? "excellent" : accuracy >= 60 ? "good" : "needs-help";
                    return (
                      <TableRow key={s.studentId}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Progress value={accuracy} className="h-2 w-16" />
                            <span className="text-xs font-mono text-muted-foreground w-8">{accuracy}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          <span className="text-xs font-mono">{s.avgResponseTime.toFixed(1)}s</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center text-xs">{s.buddyInteractions}</TableCell>
                        <TableCell className="hidden md:table-cell text-center text-xs">{s.reactionsCount}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={status === "needs-help" ? "destructive" : "secondary"}
                            className={`text-[10px] ${status === "excellent" ? "bg-primary/15 text-primary border-primary/30" : ""}`}
                          >
                            {status === "excellent" ? "Excellent" : status === "good" ? "Good" : "Needs Help"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[250px]">
                          {assessments[s.studentId] ? (
                            <p className="text-xs text-muted-foreground">{assessments[s.studentId]}</p>
                          ) : assessmentLoading[s.studentId] ? (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-1"
                              onClick={() => requestAssessment(s as StudentRow)}
                            >
                              <Sparkles className="w-3 h-3" />
                              Assess
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function KPICard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
  const accentClasses: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent",
    correct: "text-[hsl(145,60%,45%)]",
  };
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${accentClasses[accent] || "text-foreground"}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
