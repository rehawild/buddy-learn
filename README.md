# The AI Pet That Makes Financial Literacy Stick

> MIT Minds & Machines Hackathon · Education Challenge

---

## The Problem

Financial literacy is one of the most critical life skills — and one of the least taught effectively. Students sit through lessons on budgeting, credit, and compound interest, nod along, and forget 80% of it by the next morning. Passive learning doesn't work for content that actually changes lives.

---

## The Solution

An on-screen AI companion that sits on top of any financial literacy lesson and actively fights disengagement.

While the teacher explains the 50/30/20 rule or the cost of carrying credit card debt, the pet watches the lesson in real time. The moment a concept is covered, it fires a quick question — "Which bucket does rent go in?" — before the student's attention drifts. They answer, get instant feedback, and the idea anchors.

No webcam. No invasive monitoring. Engagement is inferred from interaction signals alone: tab focus, answer accuracy, response time.

---

## How It Works

### For Students
1. Teacher starts a session and shares a room code
2. Student joins — the pet appears as an overlay on the slides
3. As the teacher speaks, A/B and open-text questions pop up at exactly the right moment
4. The pet reacts: happy when you're on a streak, worried when you go quiet
5. At the end, a recap shows every concept covered and every question answered

### For Teachers
1. Upload your own slides or launch **Financial Literacy 101** from the course catalog in one click
2. The AI coordinator listens to your speech, matches it against slide content, and generates contextual questions
3. You approve or dismiss questions before they reach students
4. Watch live attention scores and answer accuracy per student
5. After the session, review a full breakdown — which slides had the lowest comprehension, which students struggled

---

## Built-in Course: Financial Literacy 101

A complete, ready-to-teach course on personal finance — no setup required.

| Section | Topic |
|---|---|
| 1 | The 50/30/20 Budgeting Rule |
| 2 | Building an Emergency Fund |
| 3 | Credit Scores & Debt Management |
| 4 | Compound Interest — The Eighth Wonder |
| 5 | Investing Basics |
| 6 | Your 30-Day Action Plan |

Launch it from the course catalog at `/learn`. One click creates a live session with a shareable room code.

---

## Features

- **Content-aware questions** — AI reads the live transcript and only asks about what was just taught
- **Instant feedback loop** — reinforcement on correct answers, correction with explanation on wrong ones
- **Pet mood system** — visual engagement mirror (happy → curious → sleepy → worried), no camera needed
- **Teacher approval queue** — every AI-generated question goes through teacher review first
- **Live presence tracking** — see who's in the room and their real-time attention score
- **Per-slide accuracy dashboard** — know exactly which concept lost the room
- **End-of-session recap** — full list of questions answered, concepts covered, and missed topics
- **Works with any slides** — upload a PDF or PPTX to use your own content

---

## Privacy

- No webcam
- No screen recording
- No keystroke logging
- Engagement inferred from: tab visibility · answer accuracy · response latency
- Row-level security on all data — students only see their own session

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| Backend | Supabase (Auth · Postgres · Realtime · Storage) |
| AI | Azure OpenAI (GPT-4o) via edge functions |
| Speech | Web Speech API (live teacher transcripts) |
| Realtime | Supabase Realtime (slide sync · chat · reactions) |

---

## Impact

The average American can't cover a $400 emergency. Two-thirds of adults fail a basic financial literacy quiz. The gap isn't intelligence — it's engagement. A 30-minute passive lecture on compound interest doesn't compete with TikTok. An AI pet that challenges you mid-lesson, tracks your streak, and shows your teacher where you're stuck — does.

---

## What's Next

- Adaptive question difficulty per student based on prior performance
- Buddy progression system — streaks unlock visual evolution
- Curriculum packs: debt payoff, investing, taxes, renting vs. buying
- LMS integrations (Canvas, Google Classroom)
- Multi-language support for underserved communities
