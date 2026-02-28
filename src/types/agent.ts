import type { Question } from "@/data/lessons";

// ── Question bank: questions mapped to slides ──

export interface SlideQuestionBank {
  slideIndex: number;
  slideTitle: string;
  keyPhrases: string[];
  questions: Question[];
}

// ── Coordinator → Student Realtime events ──

export interface QuestionDispatchEvent {
  slideIndex: number;
  question: Question;
  dispatchedAt: string;
}

export interface AgentInitEvent {
  lessonTitle: string;
  currentSlideIndex: number;
  difficulty: "easy" | "medium" | "hard";
}

// ── Student → Coordinator Realtime events ──

export interface StudentResponseEvent {
  studentId: string;
  studentName: string;
  slideIndex: number;
  questionText: string;
  answer: string;
  correct: boolean;
  responseTimeMs: number;
  answeredAt: string;
}

// ── Pending transcript question (teacher approval gate) ──

export interface PendingTranscriptQuestion {
  id: string;              // crypto.randomUUID()
  slideIndex: number;
  question: Question;
  generatedAt: string;
  expiresAt: number;       // Date.now() + 30_000
}

// ── Edge function request/response envelopes ──

export type AgentAction = "pre-generate" | "buddy-chat" | "transcript-questions" | "student-assessment";

export interface PreGeneratePayload {
  slides: { index: number; title: string; content: string }[];
  difficulty: "easy" | "medium" | "hard";
  lessonTitle: string;
}

export interface BuddyChatPayload {
  message: string;
  slideContent: string;
  slideTitle: string;
  lessonTitle: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

export interface AgentRequest {
  action: AgentAction;
  payload: PreGeneratePayload | BuddyChatPayload;
}

// ── Edge function responses ──

export interface PreGenerateResponse {
  questionBank: SlideQuestionBank[];
}

export interface BuddyChatResponse {
  reply: string;
}
