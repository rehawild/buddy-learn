import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Brain, TrendingUp, Zap, Clock, Target, Award, AlertTriangle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import {
  mockStudents,
  mockLessonEngagement,
  mockTimeline,
  mockDifficultyBreakdown,
  mockReactions,
} from "@/data/mockEngagement";

const difficultyColors: Record<string, string> = {
  easy: "hsl(145, 60%, 45%)",
  medium: "hsl(28, 90%, 58%)",
  hard: "hsl(0, 72%, 55%)",
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [selectedLesson, setSelectedLesson] = useState(mockLessonEngagement[0].lessonId);

  const currentLesson = mockLessonEngagement.find((l) => l.lessonId === selectedLesson)!;
  const totalAnswered = mockStudents.reduce((s, st) => s + st.questionsAnswered, 0);
  const totalCorrect = mockStudents.reduce((s, st) => s + st.correctAnswers, 0);
  const classAvgAccuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const avgBuddyInteractions = Math.round(mockStudents.reduce((s, st) => s + st.buddyInteractions, 0) / mockStudents.length);

  const chartConfig = {
    attention: { label: "Attention", color: "hsl(168, 60%, 48%)" },
    participation: { label: "Participation", color: "hsl(28, 90%, 58%)" },
  };

  const barData = mockDifficultyBreakdown.map((d) => ({
    difficulty: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1),
    correct: d.correct,
    incorrect: d.total - d.correct,
    rate: Math.round((d.correct / d.total) * 100),
  }));

  const barConfig = {
    correct: { label: "Correct", color: "hsl(145, 60%, 45%)" },
    incorrect: { label: "Incorrect", color: "hsl(0, 72%, 55%)" },
  };

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
            {mockStudents.length} students
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard icon={<Users className="w-4 h-4" />} label="Active Students" value={mockStudents.length.toString()} sub="in session" accent="primary" />
          <KPICard icon={<Target className="w-4 h-4" />} label="Class Accuracy" value={`${classAvgAccuracy}%`} sub={`${totalCorrect}/${totalAnswered} correct`} accent="correct" />
          <KPICard icon={<Brain className="w-4 h-4" />} label="Buddy Interactions" value={avgBuddyInteractions.toString()} sub="avg per student" accent="accent" />
          <KPICard icon={<Zap className="w-4 h-4" />} label="Total Reactions" value={mockReactions.reduce((s, r) => s + r.count, 0).toString()} sub="across session" accent="primary" />
        </div>

        {/* Lesson Selector */}
        <Tabs value={selectedLesson} onValueChange={setSelectedLesson}>
          <TabsList className="w-full justify-start overflow-x-auto bg-secondary/50">
            {mockLessonEngagement.map((l) => (
              <TabsTrigger key={l.lessonId} value={l.lessonId} className="gap-1.5 text-xs sm:text-sm">
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.lessonTitle}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {mockLessonEngagement.map((lesson) => (
            <TabsContent key={lesson.lessonId} value={lesson.lessonId} className="space-y-6 mt-4">
              {/* Lesson Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Avg Score" value={`${lesson.avgScore}%`} />
                <MiniStat label="Completion" value={`${lesson.completionRate}%`} />
                <MiniStat label="Time/Slide" value={`${lesson.avgTimePerSlide}s`} />
                <MiniStat label="Students" value={lesson.totalStudents.toString()} />
              </div>

              {/* Hardest/Easiest */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Hardest Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground">{lesson.hardestQuestion}</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Easiest Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground">{lesson.easiestQuestion}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Attention & Participation Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attention & Participation Over Time</CardTitle>
              <CardDescription className="text-xs">Tracked via Buddy mascot interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <AreaChart data={mockTimeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="attention" stroke="var(--color-attention)" fill="var(--color-attention)" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="participation" stroke="var(--color-participation)" fill="var(--color-participation)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
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

        {/* Emoji Reactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Live Reactions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {mockReactions.map((r) => (
                <div key={r.emoji} className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-2">
                  <span className="text-xl">{r.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.count}</p>
                    <p className="text-[10px] text-muted-foreground">{r.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...mockStudents]
                  .sort((a, b) => (b.correctAnswers / b.questionsAnswered) - (a.correctAnswers / a.questionsAnswered))
                  .map((s) => {
                    const accuracy = Math.round((s.correctAnswers / s.questionsAnswered) * 100);
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
                        <TableCell className="text-right">
                          <Badge
                            variant={status === "needs-help" ? "destructive" : "secondary"}
                            className={`text-[10px] ${status === "excellent" ? "bg-primary/15 text-primary border-primary/30" : ""}`}
                          >
                            {status === "excellent" ? "⭐ Excellent" : status === "good" ? "✓ Good" : "⚠ Needs Help"}
                          </Badge>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded-lg px-3 py-2.5 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
