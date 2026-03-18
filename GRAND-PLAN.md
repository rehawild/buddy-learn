# Phase 2: Flow & Polish — Grand Plan

## Overview

Wire MeetRoom to accept `?lesson=` for direct course launch from `/learn`, and optionally add finance-themed polish (Buddy prompts, theme, Recap copy).

---

## Part A: URL-Based Lesson Launch

### 1. MeetRoom: Read `?lesson=` and Set Initial Lesson

| Task | Details |
|------|---------|
| **Read URL param** | In MeetRoom, read `searchParams.get("lesson")` (e.g. `financial-literacy-101`). |
| **Resolve to index** | `lessons.findIndex(l => l.id === lessonId)`. Fallback to 0 if not found. |
| **Set initial state** | On mount, if valid `lesson` param and demo mode (no uploaded slides): set `lessonIdx` and `sectionIdx: 0`. |
| **Broadcast to viewers** | Presenter broadcasts `{ lessonIdx, sectionIdx: 0, ... }` on initial load so viewers sync. |
| **Only when demo** | Ignore `?lesson=` when `hasUploadedSlides` (use uploaded content). |

**Files:** `src/pages/MeetRoom.tsx`

---

### 2. Lobby: Pass `?lesson=` Through to MeetRoom

| Task | Details |
|------|---------|
| **Read lesson param** | Lobby reads `searchParams.get("lesson")`. |
| **Forward on join** | When navigating to `/meet`, append `&lesson=${lesson}` if present. |
| **Preserve room** | Room code stays primary; lesson is additive. |

**Files:** `src/pages/MeetLobby.tsx`

---

### 3. MeetHome: "Start Financial Literacy 101" Flow

| Task | Details |
|------|---------|
| **Add quick action** | Button/card: "Start Financial Literacy 101" (teachers only). |
| **Create session (no upload)** | Insert session with `presentation_id: null`, generate room code, navigate to `/lobby?room=${code}&lesson=financial-literacy-101`. |
| **Reuse existing logic** | Same `generateRoomCode` + Supabase insert; only differs by no file upload. |

**Files:** `src/pages/MeetHome.tsx`

---

### 4. Learn Page: CTA to Launch Lesson

| Task | Details |
|------|---------|
| **"Teach this course" button** | Links to `/` with `?start=financial-literacy-101` OR triggers MeetHome's FL101 flow. |
| **MeetHome integration** | When MeetHome sees `?start=financial-literacy-101`, surface "Start Financial Literacy 101" or auto-trigger. |

**Files:** `src/pages/Learn.tsx` (or equivalent), `src/pages/MeetHome.tsx`, `src/App.tsx` (if adding route)

---

### 5. Prerequisite: Financial Literacy 101 Lesson

| Task | Details |
|------|---------|
| **Add lesson** | Add `id: "financial-literacy-101"` to `lessons.ts` (or ensure Phase 1 adds it). |
| **Lesson type** | Extend `Lesson.subject` union to include `"Finance"` if needed. |

**Files:** `src/data/lessons.ts`

---

## Part B: Optional Polish

### 6. Buddy Prompts for Finance Context

| Task | Details |
|------|---------|
| **Pass finance flag** | When lesson is finance-related, pass `subject: "finance"` to buddy-ai. |
| **Tweak system prompts** | Add finance-specific hints (e.g. "focus on money concepts") to question-gen and chat prompts. |
| **Optional** | Can skip for MVP. |

**Files:** `supabase/functions/buddy-ai/index.ts`, caller hooks

---

### 7. Finance Theme

| Task | Details |
|------|---------|
| **Add theme** | `theme: "finance"` for FL101 lesson (or reuse `gradient`/`ocean`). |
| **Visual tweaks** | Green accents, money iconography if desired. |

**Files:** `src/data/lessons.ts`, `src/components/SlideRenderer.tsx` (if new theme)

---

### 8. Recap Copy for Finance

| Task | Details |
|------|---------|
| **Update Recap wording** | When lesson is finance, use "Money concepts covered" / "Financial skills" instead of generic. |
| **Detect finance** | Check `lesson?.subject === "Finance"` or `lesson?.id === "financial-literacy-101"`. |

**Files:** `src/pages/Recap.tsx`

---

## Suggested Order

1. Add `financial-literacy-101` lesson stub to `lessons.ts`.
2. MeetRoom: read `?lesson=` and set initial state.
3. Lobby: pass `lesson` param to MeetRoom.
4. MeetHome: "Start FL101" quick action.
5. Learn page: "Teach this course" CTA → MeetHome flow.
6. (Optional) Buddy prompts, theme, Recap copy.

---

## Flow Summary

```
/learn → "Teach this course" → MeetHome (?start=financial-literacy-101)
                                    ↓
              "Start Financial Literacy 101" → create session (no upload)
                                    ↓
                    Lobby (?room=ABC123&lesson=financial-literacy-101)
                                    ↓
                    MeetRoom (?room=ABC123&lesson=financial-literacy-101)
                                    ↓
              Presenter loads with lesson preselected; broadcasts to viewers
```
