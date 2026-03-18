# Catchy — AI Classroom Engagement Pet

> MIT Minds & Machines Hackathon · Education Challenge: AI Classroom & Debate Coach

---

## What is Catchy?

Catchy is an on-screen AI pet that sits on top of live classroom presentations and keeps students engaged — like Duolingo's owl, but for any subject, in any classroom.

It has two modes:

- **Proactive** — Listens to the teacher via the Web Speech API, matches speech against slide content, and fires A/B micro-questions the moment a topic is covered. Not on a timer. On content.
- **Reactive** — Students chat with Catchy to ask "explain this simpler" and get short, slide-grounded answers via Azure OpenAI.

Engagement is inferred entirely from interaction signals — tab focus, answer accuracy, response time. No webcam. No screen recording.

---

## Features

### For Students
- **Buddy overlay** — A/B and open-text questions triggered mid-lesson
- **Instant feedback** — Reinforcement on correct answers, correction on wrong ones
- **Mood system** — Catchy's expression reflects your engagement (happy, curious, sleepy, worried)
- **Subtitles** — Live captions of the teacher's speech

### For Teachers
- **Live session management** — Upload a PDF/PPTX or pick a built-in course from the catalog, generate a room code, students join instantly
- **Coordinator agent** — Reads the live transcript, decides when a topic has been covered, queues a question for students
- **Approval queue** — Teacher reviews AI-generated questions before they go to students
- **Real-time presence** — See who's in the room, track attention scores per student
- **Teacher dashboard** — Per-slide accuracy breakdown, engagement over time, answered questions per student
- **Emoji reactions** — Students send live emoji reactions broadcast to all participants

### Course Catalog (`/learn`)
- Browse 5 built-in lessons: Photosynthesis, Renaissance, Newton's Laws, Financial Literacy 101, French Revolution
- One click to start a live session — no upload needed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript 5 · Vite 5 |
| Styling | Tailwind CSS 3 · shadcn/ui · CSS custom properties |
| Backend | Supabase (Auth · Postgres · Realtime · Storage) |
| AI | Azure OpenAI (GPT-4o) via Supabase Edge Functions |
| Speech | Web Speech API (live transcripts) |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | DM Sans · JetBrains Mono |

---

## Architecture

```
App.tsx
├── /landing     → LandingPage (public marketing page)
├── /learn       → Learn (public course catalog)
├── /auth        → Auth (login / signup, role: teacher | student)
├── /            → MeetHome (upload & present · join by code)
├── /lobby       → MeetLobby (camera preview, access checks)
├── /meet        → MeetRoom (slides · buddy · real-time sync)
├── /recap       → Recap (session summary)
├── /profile     → Profile (avatar, name, history)
└── /dashboard   → TeacherDashboard (analytics)
```

### Key Agents

| Agent | Role |
|---|---|
| **Coordinator** (`useCoordinatorAgent`) | Teacher-side. Watches live transcript, decides when a topic is covered, generates questions, sends to approval queue |
| **Student agent** (`useStudentAgent`) | Student-side. Manages question queue, sends answers to Azure OpenAI for feedback, updates buddy mood |

### Realtime Channels

| Channel | Purpose |
|---|---|
| `room:{code}` | Slide position sync + presence |
| `chat:{code}` | Live chat messages |
| `reactions:{code}` | Emoji reactions |

---

## Database Schema (Supabase)

**Tables:** `profiles` · `user_roles` · `presentations` · `presentation_slides` · `sessions` · `session_engagement`

**Storage:** `presentations` (private) · `slide-images` (public) · `avatars` (public)

**Auth:** Email/password with RLS on all tables. `has_role()` function for policy checks.

---

## Built-in Lessons

| Lesson | Subject | Slides | Questions |
|---|---|---|---|
| Photosynthesis: How Plants Make Food | STEM | 6 | 25+ |
| The Renaissance: A Rebirth of Ideas | Humanities | 6 | 25+ |
| Gravity & Motion: Newton's Laws | STEM | 6 | 25+ |
| Financial Literacy 101: Managing Your Money | Finance | 6 | 25+ |
| The French Revolution | Humanities | 6 | 25+ |

---

## Privacy

- No webcam access
- No screen recording
- No keystroke logging
- Engagement tracked only via: tab visibility, answer accuracy, response latency
- All data scoped to authenticated sessions with row-level security

---

## What's Next

- Buddy progression and visual evolution (streaks → accessories)
- Adaptive question difficulty per student
- Multi-language support
- LMS integrations (Canvas, Google Classroom)
- Long-term engagement analytics across sessions
