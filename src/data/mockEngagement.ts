// Mock data representing student engagement collected via the Buddy mascot

export interface StudentEngagement {
  studentId: string;
  name: string;
  questionsAnswered: number;
  correctAnswers: number;
  avgResponseTime: number; // seconds
  reactionsCount: number;
  buddyInteractions: number;
  lastActive: string;
}

export interface LessonEngagement {
  lessonId: string;
  lessonTitle: string;
  icon: string;
  totalStudents: number;
  avgScore: number; // 0-100
  avgTimePerSlide: number; // seconds
  completionRate: number; // 0-100
  hardestQuestion: string;
  easiestQuestion: string;
}

export interface TimelinePoint {
  time: string;
  attention: number; // 0-100
  participation: number; // 0-100
}

export interface DifficultyBreakdown {
  difficulty: "easy" | "medium" | "hard";
  total: number;
  correct: number;
}

export interface ReactionSummary {
  emoji: string;
  label: string;
  count: number;
}

export const mockStudents: StudentEngagement[] = [
  { studentId: "s1", name: "Emma Wilson", questionsAnswered: 14, correctAnswers: 11, avgResponseTime: 4.2, reactionsCount: 8, buddyInteractions: 22, lastActive: "2 min ago" },
  { studentId: "s2", name: "Liam Johnson", questionsAnswered: 12, correctAnswers: 7, avgResponseTime: 6.8, reactionsCount: 15, buddyInteractions: 18, lastActive: "1 min ago" },
  { studentId: "s3", name: "Sophia Martinez", questionsAnswered: 14, correctAnswers: 13, avgResponseTime: 3.1, reactionsCount: 12, buddyInteractions: 28, lastActive: "just now" },
  { studentId: "s4", name: "Noah Brown", questionsAnswered: 10, correctAnswers: 6, avgResponseTime: 8.4, reactionsCount: 3, buddyInteractions: 9, lastActive: "5 min ago" },
  { studentId: "s5", name: "Olivia Davis", questionsAnswered: 13, correctAnswers: 10, avgResponseTime: 5.0, reactionsCount: 10, buddyInteractions: 20, lastActive: "just now" },
  { studentId: "s6", name: "James Garcia", questionsAnswered: 11, correctAnswers: 8, avgResponseTime: 5.5, reactionsCount: 7, buddyInteractions: 15, lastActive: "3 min ago" },
  { studentId: "s7", name: "Ava Rodriguez", questionsAnswered: 14, correctAnswers: 12, avgResponseTime: 3.8, reactionsCount: 20, buddyInteractions: 30, lastActive: "just now" },
  { studentId: "s8", name: "Lucas Lee", questionsAnswered: 9, correctAnswers: 4, avgResponseTime: 9.2, reactionsCount: 2, buddyInteractions: 6, lastActive: "8 min ago" },
];

export const mockLessonEngagement: LessonEngagement[] = [
  { lessonId: "photosynthesis", lessonTitle: "Photosynthesis", icon: "🌿", totalStudents: 8, avgScore: 72, avgTimePerSlide: 45, completionRate: 88, hardestQuestion: "Name one energy carrier produced in the light reactions.", easiestQuestion: "What pigment do plants use to absorb light?" },
  { lessonId: "renaissance", lessonTitle: "The Renaissance", icon: "🎨", totalStudents: 8, avgScore: 68, avgTimePerSlide: 52, completionRate: 75, hardestQuestion: "Which artist pioneered oil painting in the Northern Renaissance?", easiestQuestion: "What does 'Renaissance' mean?" },
  { lessonId: "gravity", lessonTitle: "Gravity & Motion", icon: "🍎", totalStudents: 7, avgScore: 61, avgTimePerSlide: 60, completionRate: 71, hardestQuestion: "Which force keeps the Moon in orbit?", easiestQuestion: "What property resists changes in motion?" },
  { lessonId: "french-rev", lessonTitle: "French Revolution", icon: "🏛️", totalStudents: 6, avgScore: 77, avgTimePerSlide: 48, completionRate: 83, hardestQuestion: "What radical group was led by Robespierre?", easiestQuestion: "What was the Bastille?" },
];

export const mockTimeline: TimelinePoint[] = [
  { time: "0:00", attention: 92, participation: 30 },
  { time: "2:00", attention: 88, participation: 45 },
  { time: "4:00", attention: 85, participation: 62 },
  { time: "6:00", attention: 78, participation: 70 },
  { time: "8:00", attention: 70, participation: 75 },
  { time: "10:00", attention: 65, participation: 80 },
  { time: "12:00", attention: 72, participation: 85 },
  { time: "14:00", attention: 80, participation: 78 },
  { time: "16:00", attention: 75, participation: 72 },
  { time: "18:00", attention: 68, participation: 65 },
  { time: "20:00", attention: 82, participation: 88 },
  { time: "22:00", attention: 78, participation: 82 },
];

export const mockDifficultyBreakdown: DifficultyBreakdown[] = [
  { difficulty: "easy", total: 32, correct: 28 },
  { difficulty: "medium", total: 40, correct: 25 },
  { difficulty: "hard", total: 25, correct: 10 },
];

export const mockReactions: ReactionSummary[] = [
  { emoji: "👍", label: "Thumbs Up", count: 34 },
  { emoji: "🔥", label: "Fire", count: 22 },
  { emoji: "❓", label: "Confused", count: 18 },
  { emoji: "💡", label: "Lightbulb", count: 15 },
  { emoji: "😂", label: "Funny", count: 9 },
  { emoji: "👏", label: "Clap", count: 12 },
];
