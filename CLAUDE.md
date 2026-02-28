# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
MAKE SURE TO ALWAYS USE SOLID PRINCIPLES WHEN MAKING CHANGES.

## Project

MIT Minds & Machines Hackathon — **Education Challenge: AI Classroom & Debate Coach**

Repository: https://github.com/rehawild/buddy-learn

## Product: StudyBuddy

An on-screen desktop pet (like Duolingo's bird) that sits on top of any lesson and keeps students engaged. It bridges both challenge directions — classroom engagement tool + AI coaching companion.

### Core Concept

The pet is an **emotional mirror of the student's engagement** and a **conversational tutor**. It has two modes:
- **Proactive:** Pet initiates micro-questions (6-10 seconds) when the student is passive
- **Reactive:** Student chats with the pet to ask for explanations about the current material

### MVP Features

1. **Micro-question loop** — Student selects a paragraph, pet highlights 1-2 key phrases via Azure Text Analytics, asks an A/B multiple choice question, gives instant feedback. One question format only (A/B) for MVP.
2. **Conversational AI agent** — Each pet is backed by an Azure OpenAI agent. Students can ask "explain this simpler." Pet keeps responses to 1-2 sentences and stays on-topic (current material only).
3. **Passive engagement detection (no webcam)** — Track mouse movement, scroll patterns, tab switches, idle time. Pet reacts in real-time: yawns when you zone out, taps screen, waves at you.
4. **Pet mood system** — Visible moods (happy, curious, sleepy, worried) driven by engagement signals + answer correctness. Students naturally want to keep their pet happy.
5. **Streak-based gamification** — No percentage scores. Correct answer streaks drive pet evolution (visual changes, accessories). Simple and addictive.
6. **Teacher dashboard** — Anonymous aggregate view: engagement over time, which paragraphs had lowest comprehension, when students disengaged. Gives teachers feedback on their teaching.
7. **End-of-session summary** — Simple "You answered 8/10, your buddy is happy!" with list of missed concepts.

### Design Constraints

- **Privacy-first:** No webcam, no screen recording. Engagement tracked via interaction signals only.
- **Pet stays focused:** Conversational agent only discusses current lesson material. Actively nudges student back on topic.
- **No OCR/screen capture:** Text selection input only for MVP.

### Azure Services

- **Azure OpenAI / AI Foundry** — Pet agent (question generation, conversational tutoring, feedback)
- **Azure Text Analytics** — Key phrase extraction from selected paragraphs
- **Azure AI Foundry endpoint:** `https://osvathrobert03-1965-resource.services.ai.azure.com/api/projects/osvathrobert03-1965`

## Judging Criteria

1. **Innovativeness** — Original approach or technology
2. **Impact / Value** — Practical usefulness
3. **Sustainability & Feasibility** — Viability and scalability
4. **Prototype Quality** — Functionality, UX, robustness (highly relevant for grand prize)
5. **Presentation** — Clarity and storytelling of demo (highly relevant for grand prize)

**Bonus points:** Effective Azure usage, real-time AI performance feedback, inclusive design for diverse learner profiles.

## Tech Stack

- **Framework:** React 18.3 + TypeScript 5.8 + Vite 5
- **Styling:** Tailwind CSS 3.4 + shadcn/ui (49 components) + CSS custom properties (dark theme, teal primary)
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage)
- **State:** React hooks (local), TanStack React Query (available), react-hook-form + zod (forms)
- **Charts:** recharts (installed, used in teacher dashboard)
- **Icons:** lucide-react
- **Fonts:** DM Sans (body) + JetBrains Mono (mono)

## Architecture

```
App.tsx (QueryClient + TooltipProvider + AuthProvider + Router)
├── /auth        → Auth.tsx (login/signup, role selection: teacher|student)
├── /            → MeetHome.tsx (teacher: upload & present, student: join by code) [ProtectedRoute]
├── /lobby       → MeetLobby.tsx (camera preview, access control checks) [ProtectedRoute]
├── /meet        → MeetRoom.tsx (the core: slides, buddy, real-time sync) [ProtectedRoute]
├── /recap       → Recap.tsx (session summary) [ProtectedRoute]
├── /profile     → Profile.tsx (avatar, name, history) [ProtectedRoute]
├── /dashboard   → TeacherDashboard.tsx (analytics, mock data) [TeacherRoute]
└── *            → NotFound
```

## Supabase Schema

**Tables:** `profiles`, `user_roles` (app_role enum: teacher|student), `presentations`, `presentation_slides`, `sessions` (room_code, status, teacher_id), `session_engagement`

**Storage buckets:** `presentations` (private), `slide-images` (public), `avatars` (public)

**Realtime channels:** `room:{code}` (state sync + presence), `chat:{code}` (messages), `reactions:{code}` (emoji)

**Auth:** Email/password with role-based access. RLS on all tables. `has_role()` function for policy checks.

## Key Components

| Component | Purpose |
|-----------|---------|
| `BuddyOverlay` | A/B + text questions overlay on slides (idle → question → feedback phases) |
| `SlideRenderer` | Renders slides at 1920x1080 scaled to fit (4 layouts, 5 themes) |
| `SlideThumbnail` | Left sidebar slide navigation |
| `SlideGridOverlay` | Full-screen slide grid for quick jump |
| `MeetSidebar` | Chat (realtime broadcast) + People (presence) |
| `MeetBottomBar` | All meeting controls (AV, presentation, buddy, emoji reactions) |
| `EmojiReactions` | Floating emoji reactions via realtime broadcast |
| `SpeakerNotes` | Collapsible notes panel for presenter |
| `ParticipantTile` | Video/avatar tile (defined but not actively used) |

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Auth context: user, session, role, signUp/signIn/signOut |
| `useRealtimeRoom` | Room state sync + presence via Supabase Realtime |
| `useSessionSlides` | Fetch uploaded presentation slides from Supabase |
| `useMediaStream` | Browser getUserMedia for camera/mic |

## Current State

### What works:
- **Auth:** Full login/signup with teacher and student roles
- **Presentation upload:** PDF/PPTX parsed client-side, slides stored in Supabase Storage
- **Session management:** Teacher creates session → generates room code → students join
- **Real-time sync:** Presenter broadcasts slide position + buddy state to viewers via Supabase Realtime
- **Real-time chat:** Messages broadcast via Supabase Realtime channel
- **Real-time presence:** Participant list tracked via Supabase Presence
- **Real camera/mic:** getUserMedia with toggle controls
- **Demo lessons:** 4 hardcoded lessons (24 slides, 25 questions) as fallback when no upload
- **BuddyOverlay:** A/B and text questions with feedback phases, auto-triggered after 4s per slide
- **Slide rendering:** 4 layout types (title, content, two-column, quote), 5 themes, keyboard navigation
- **Teacher dashboard:** Full UI with KPI cards, charts, student table — but using mock data
- **Profile:** Avatar upload, display name editing, session/presentation history
- **Emoji reactions:** Floating emoji broadcast to all participants

### What's NOT implemented (the StudyBuddy pet system):
- No AI integration (Azure OpenAI for question generation / conversational tutoring)
- No Azure Text Analytics (key phrase extraction)
- No engagement tracker (mouse, scroll, tab, idle monitoring)
- No pet mood system (happy, curious, sleepy, worried states)
- No animated pet sprite (just a static owl image in BuddyOverlay)
- No streak-based gamification or pet evolution
- No proactive question triggering based on engagement
- No conversational buddy chat
- No real data flowing to TeacherDashboard (all mock)
- No session engagement data persisted to Supabase

### Known issues:
- `pdfjs-dist` is imported in `parsePresentation.ts` but not in `package.json` (runtime failure for PDF upload)
