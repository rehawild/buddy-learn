# StudyBuddy — Technical Specification

> Building the AI mascot pet on top of the existing Google Meet clone.

## 1. What Already Exists

The Lovable-generated app provides a solid UI shell:

- **Meeting flow:** MeetHome → MeetLobby → MeetRoom → Recap
- **Presentation mode:** Lesson slide viewer with section navigation inside MeetRoom
- **BuddyOverlay (v0):** Basic A/B and text questions from hardcoded `lessons.ts`, with idle/question/feedback phases
- **UI primitives:** Full shadcn/ui library, dark theme with teal accent, participant tiles, chat sidebar
- **Supabase:** Client connected but no schema or usage yet

**What is NOT real:** No WebRTC, no actual webcam/mic, no backend persistence, no AI integration, fake participants. This is fine — the demo focuses on the StudyBuddy experience, not on rebuilding Google Meet.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     MeetRoom                            │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │   Slide Surface      │  │   MeetSidebar           │  │
│  │   (lesson content)   │  │   (chat / people /      │  │
│  │                      │  │    buddy-chat)           │  │
│  │                      │  │                          │  │
│  │              ┌──────┐│  │                          │  │
│  │              │ Pet  ││  │                          │  │
│  │              │ Sprite││  │                          │  │
│  │              └──────┘│  │                          │  │
│  └──────────────────────┘  └─────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Bottom Bar (controls)                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Data flow:
  Engagement Tracker ──→ Mood Engine ──→ Pet Sprite (visual state)
                     └──→ Proactive Trigger ──→ Question Generator (Azure OpenAI)
  Text Selection ──→ Key Phrase Extraction (Azure Text Analytics) ──→ Question Generator
  Student Input ──→ Conversational Agent (Azure OpenAI) ──→ Buddy Chat Panel
  All interactions ──→ Session Tracker ──→ Recap + Teacher Dashboard (Supabase)
```

---

## 3. Component Specification

### 3.1 Pet Sprite (`PetSprite.tsx`)

The visual mascot that lives on the slide surface. Uses the existing `buddy-owl.png` asset.

**States & Animations:**
| Mood | Trigger | Visual |
|------|---------|--------|
| `happy` | Correct answers, active engagement | Bouncing, sparkle eyes |
| `curious` | New slide loaded, text selected | Head tilt, question mark |
| `sleepy` | Low engagement (idle > 30s) | Drooping eyes, yawn animation |
| `worried` | Wrong answer streak (3+) | Shaking, sweat drop |
| `excited` | Streak milestone hit | Jump + confetti burst |
| `waving` | Trying to get attention after idle | Arm wave animation |

**Behavior:**
- Default position: bottom-right of slide surface (where current BuddyOverlay sits)
- Draggable within the slide surface bounds so students can reposition
- Click on pet opens/closes the buddy chat panel in the sidebar
- Pet has a small speech bubble for micro-prompts ("Psst, try this question!")
- Smooth transitions between mood states (CSS transitions, no jarring swaps)

**Implementation approach:**
- CSS sprite sheet or SVG-based with CSS transforms for each mood
- Mood driven by a `petMood` state computed from engagement + answer signals
- Keep animations lightweight — no canvas/WebGL, pure CSS

### 3.2 Engagement Tracker (`useEngagementTracker.ts`)

A custom hook that monitors student engagement signals without any camera or screen capture.

**Tracked signals:**
| Signal | Method | Weight |
|--------|--------|--------|
| Mouse movement | `mousemove` event throttled to 1/sec | Low |
| Scroll activity | `scroll` event on slide surface | Low |
| Tab visibility | `visibilitychange` API | High |
| Idle time | No interaction for N seconds | High |
| Text selection | `selectionchange` event | Positive |
| Chat activity | Message sent in sidebar | Positive |
| Question interaction | Answered a buddy question | Positive |

**Output:**
- `engagementScore`: 0-100 rolling average (last 60 seconds window)
- `isIdle`: boolean (no interaction for > 20 seconds)
- `isTabAway`: boolean
- `lastInteractionTime`: timestamp

**Thresholds:**
- Score > 70 → `happy` mood
- Score 40-70 → `curious` mood
- Score < 40 → `sleepy` mood
- `isTabAway` → immediate `waving` mood override

### 3.3 Micro-Question System (enhanced `BuddyOverlay.tsx`)

Replaces the current hardcoded question system with AI-generated questions.

**Flow:**
1. Student enters presentation mode → pet appears in `curious` state
2. As slides advance or after a time interval (configurable, default 45s), pet proactively offers a question
3. If student selects text → immediate question generation from that text
4. Question appears as a speech bubble / card near the pet (current overlay position)
5. Student answers → instant feedback → mood update → streak update

**Question generation (Azure OpenAI):**
- Input: current slide text content + (optional) selected text + difficulty level
- Prompt: Generate one A/B multiple choice question testing comprehension of the key concept
- Output: `{ question, optionA, optionB, correctAnswer, reinforcement, correction, keyPhrase }`
- Difficulty ramps with streak: start easy, increase after 3 correct in a row

**Key phrase extraction (Azure Text Analytics):**
- Called on each new slide section to identify 1-2 key phrases
- These phrases are highlighted in the slide text (subtle underline or background)
- Also fed into the question generation prompt for better targeting

**Proactive trigger logic:**
- If engagement score drops below 50 AND no question in last 60 seconds → trigger question
- If student has been on same slide for > 90 seconds without interaction → trigger question
- Maximum 1 question per 30 seconds (prevent spam)
- Student can snooze buddy for 5 minutes via a button

### 3.4 Conversational Agent (Buddy Chat in `MeetSidebar.tsx`)

A new tab in the sidebar (alongside "Chat" and "People") for 1-on-1 conversation with the pet.

**Behavior:**
- Student types a question → sent to Azure OpenAI with current lesson context
- System prompt constrains responses to: current lesson material only, 1-2 sentence max, encouraging tone
- If student asks off-topic → pet gently redirects: "That's interesting, but let's focus on [current topic]!"
- Conversation history scoped to current session only (not persisted across sessions)
- Pet avatar shown next to its messages, student avatar next to theirs

**System prompt structure:**
```
You are StudyBuddy, a friendly owl tutor. You are helping a student understand:
[current lesson title]: [current section title]

Slide content: [current slide text]

Rules:
- Keep responses to 1-2 sentences maximum
- Only discuss the current lesson material
- If the student asks about something unrelated, gently redirect
- Use encouraging, warm language
- If the student seems confused, try explaining with a simple analogy
```

### 3.5 Mood Engine (`usePetMood.ts`)

Computes the pet's current mood from multiple signals.

**Inputs:**
- `engagementScore` from EngagementTracker
- `currentStreak` from session tracker
- `lastAnswerCorrect` from question system
- `consecutiveWrong` from session tracker

**Priority rules (highest first):**
1. `consecutiveWrong >= 3` → `worried`
2. `isTabAway` → `waving`
3. `isIdle` → `sleepy`
4. `lastAnswerCorrect && streak milestone` → `excited` (temporary, 5 seconds)
5. `lastAnswerCorrect` → `happy` (temporary boost, decays over 15 seconds)
6. `textSelected || newSlide` → `curious` (temporary, 10 seconds)
7. Default: derived from `engagementScore` thresholds

**Mood transitions:** Minimum 3 seconds between mood changes to avoid flickering.

### 3.6 Streak & Gamification System (`useSessionTracker.ts`)

**Tracked data:**
- `correctCount`, `totalCount`: raw answer counts
- `currentStreak`: consecutive correct answers (resets on wrong)
- `bestStreak`: session high
- `streakMilestones`: [3, 5, 10] — trigger `excited` mood + visual reward

**Pet evolution (visual only, no gameplay impact):**
- Streak 0-2: Base owl
- Streak 3-4: Owl gets a tiny graduation cap
- Streak 5-9: Owl gets sparkle effect
- Streak 10+: Owl gets golden glow + confetti on milestone

**Implementation:** CSS class changes on the pet sprite based on streak tier. Accessories are overlay elements positioned relative to the pet.

### 3.7 Recap Screen (enhanced `Recap.tsx`)

Enhance the existing Recap page with:
- Pet shown in final mood state with a message ("Great job!" / "Let's review next time!")
- Accuracy breakdown per section
- List of key concepts missed (from incorrect answers)
- Best streak achieved
- Simple engagement summary ("You were focused for 85% of the session")

### 3.8 Teacher Dashboard (`TeacherDashboard.tsx`, new page)

A new route `/dashboard` accessible from MeetHome.

**Views:**
- **Session list:** All completed sessions with date, lesson, student count, avg engagement
- **Session detail:** Timeline showing engagement dips, which slides had lowest comprehension, common wrong answers
- **Concept gaps:** Aggregated view of which key phrases students struggled with most

**Data source:** Supabase tables (see section 4).

**Privacy:** No student names or identifiable data. All data is anonymous aggregate. Dashboard shows "Student 1, Student 2..." or just totals.

---

## 4. Data Model (Supabase)

### Tables

```sql
-- Session record
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  correct_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  avg_engagement FLOAT DEFAULT 0
);

-- Individual question attempts
CREATE TABLE question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  slide_section INT NOT NULL,
  key_phrase TEXT,
  question TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  difficulty TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

-- Engagement snapshots (sampled every 30s)
CREATE TABLE engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  score FLOAT NOT NULL,
  is_idle BOOLEAN DEFAULT FALSE,
  is_tab_away BOOLEAN DEFAULT FALSE,
  slide_section INT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

No authentication for MVP. Sessions are anonymous.

---

## 5. Azure Integration

### 5.1 Azure OpenAI (via AI Foundry)

**Endpoint:** `https://osvathrobert03-1965-resource.services.ai.azure.com/api/projects/osvathrobert03-1965`

**Two agent personas:**
1. **Question Generator** — Takes slide text + key phrases, returns structured A/B question JSON
2. **Conversational Tutor** — Takes slide context + student message, returns 1-2 sentence response

**API calls are made from the client** (browser) for MVP simplicity. API key stored in environment variable (`VITE_AZURE_AI_KEY`). In production, this would go through a backend proxy.

### 5.2 Azure Text Analytics

**Used for:** Key phrase extraction from slide section text.

**Call pattern:** Once per slide section load. Cache results to avoid redundant calls.

**Fallback:** If the API is slow or fails, use the hardcoded `highlight` fields from `lessons.ts` as fallback key phrases.

---

## 6. State Management

No new state library. All state lives in React hooks, following the existing pattern:

| Hook | Responsibility |
|------|---------------|
| `useEngagementTracker()` | Mouse, scroll, tab, idle tracking → engagement score |
| `usePetMood(engagement, session)` | Mood computation from signals |
| `useSessionTracker()` | Correct/total/streak/milestone tracking |
| `useQuestionGenerator(slideText, keyPhrases)` | Azure OpenAI calls for question generation |
| `useBuddyChat(slideContext)` | Azure OpenAI calls for conversational agent |

State flows down from `MeetRoom.tsx` which orchestrates the hooks and passes data to child components.

---

## 7. File Changes Summary

### Modified files:
| File | Changes |
|------|---------|
| `App.tsx` | Add `/dashboard` route |
| `MeetRoom.tsx` | Wire up new hooks, replace inline buddy logic with `PetSprite` + enhanced `BuddyOverlay` |
| `BuddyOverlay.tsx` | Replace hardcoded questions with AI-generated ones, add proactive trigger |
| `MeetSidebar.tsx` | Add "Buddy" tab for conversational agent |
| `Recap.tsx` | Enhanced summary with pet mood, streaks, engagement |
| `MeetLobby.tsx` | Minor — show pet personality preview |
| `index.css` | Add pet animation keyframes, accessory styles |

### New files:
| File | Purpose |
|------|---------|
| `src/components/PetSprite.tsx` | Animated pet character with mood-driven visuals |
| `src/components/BuddyChat.tsx` | Chat interface for conversational agent (rendered in sidebar) |
| `src/hooks/useEngagementTracker.ts` | Engagement signal monitoring |
| `src/hooks/usePetMood.ts` | Mood computation engine |
| `src/hooks/useSessionTracker.ts` | Score, streak, milestone tracking |
| `src/hooks/useQuestionGenerator.ts` | Azure OpenAI question generation |
| `src/hooks/useBuddyChat.ts` | Azure OpenAI conversational agent |
| `src/hooks/useKeyPhraseExtraction.ts` | Azure Text Analytics integration |
| `src/lib/azure.ts` | Azure API client helpers |
| `src/pages/TeacherDashboard.tsx` | Teacher analytics page |

---

## 8. MVP Scope vs. Stretch

### MVP (hackathon demo):
- [x] Pet sprite with 4 moods (happy, curious, sleepy, worried) — CSS animations
- [x] Engagement tracker (mouse, idle, tab switch)
- [x] AI-generated A/B questions via Azure OpenAI
- [x] Key phrase extraction via Azure Text Analytics
- [x] Conversational buddy chat (sidebar tab)
- [x] Streak tracking with visual pet accessories
- [x] Enhanced recap screen
- [x] Proactive question triggering based on engagement

### Stretch (if time allows):
- [ ] Teacher dashboard with Supabase persistence
- [ ] Engagement snapshots stored to Supabase
- [ ] Pet draggable positioning
- [ ] Sound effects (subtle, togglable)
- [ ] Multiple pet characters to choose from
- [ ] Slide content parsed from uploaded PDF

---

## 9. Demo Script (suggested)

1. **Open MeetHome** — "This is our virtual classroom, built on a familiar meeting interface."
2. **Join a session** — Walk through lobby, join meeting room.
3. **Start presentation** — Show lesson slides. Pet appears in curious state.
4. **Passive moment** — Stop interacting for 20s. Pet yawns, then waves, then proactively asks a question.
5. **Answer correctly** — Pet goes happy. Streak counter appears. Answer 3 more correctly — pet gets graduation cap.
6. **Answer wrong** — Pet goes worried. Shows correction with encouragement.
7. **Select text** — Highlight a paragraph. Pet immediately generates a question from that specific text.
8. **Open buddy chat** — Ask "explain this simpler." Pet responds in 1-2 sentences, stays on topic.
9. **Try going off-topic** — Ask about weather. Pet redirects to lesson.
10. **Leave session** — Show recap with pet, streaks, missed concepts.
11. **(Stretch) Teacher dashboard** — Show aggregate engagement data.
