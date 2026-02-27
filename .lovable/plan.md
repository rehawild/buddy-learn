

# Grand Plan: Study Meet Feature Expansion

This plan covers 6 workstreams. They should be implemented in the order listed, as later features depend on earlier ones.

---

## Phase 1: Database & Storage Foundation

**Migration: New tables and storage bucket**

```text
Tables:
┌─────────────────────┐     ┌──────────────────────────┐
│ presentations       │     │ presentation_slides      │
├─────────────────────┤     ├──────────────────────────┤
│ id (uuid, PK)       │◄────│ presentation_id (FK)     │
│ teacher_id (uuid)   │     │ id (uuid, PK)            │
│ title (text)        │     │ slide_number (int)       │
│ file_path (text)    │     │ image_path (text)        │
│ slide_count (int)   │     │ content_text (text)      │
│ created_at          │     └──────────────────────────┘
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐     ┌──────────────────────────┐
│ sessions            │     │ session_engagement       │
├─────────────────────┤     ├──────────────────────────┤
│ id (uuid, PK)       │◄────│ session_id (FK)          │
│ teacher_id (uuid)   │     │ student_id (uuid)        │
│ presentation_id(FK) │     │ questions_answered (int) │
│ room_code (text)    │     │ correct_answers (int)    │
│ started_at          │     │ avg_response_time (float)│
│ ended_at            │     │ reactions_count (int)    │
│ status (text)       │     │ buddy_interactions (int) │
└─────────────────────┘     └──────────────────────────┘
```

- Storage bucket `presentations` (private) for uploaded PDF/PPT files
- Storage bucket `slide-images` (public) for rendered slide page images
- RLS: teachers CRUD own presentations/sessions; students read sessions they participated in; engagement rows owned by student

---

## Phase 2: Profile Page

**New route `/profile`** accessible to all authenticated users.

- Display and edit: display name, avatar (upload to a new `avatars` public storage bucket)
- Show role badge (teacher/student) — read-only
- For teachers: list of past presentations and sessions with links
- For students: list of sessions attended with scores
- Add profile link to the header nav (avatar click → profile page)

---

## Phase 3: Teacher Dashboard Improvements

Replace mock data with real Supabase queries:

- Query `sessions` + `session_engagement` tables for real analytics
- Add a **session picker** dropdown (instead of lesson tabs) to filter by past sessions
- Add a **"My Presentations"** section: list uploaded presentations with thumbnail, title, date, slide count
- Allow re-using a presentation to start a new session
- Keep the existing chart components (AreaChart, BarChart) but feed them real data

---

## Phase 4: Presentation Upload & Processing

**Teacher flow on MeetHome:**
- When a teacher clicks "New meeting", show an **upload step** before generating the room code
- Accept PDF and PPTX files (max 20MB)
- Upload file to `presentations` storage bucket
- Create an **edge function `process-presentation`** that:
  - Receives the file path
  - Uses `pdf-lib` or similar to extract page count
  - Stores metadata in the `presentations` table
  - For each page, generates a slide image (or stores page references)
- The slides are then used in the meeting room instead of hardcoded lesson data

**Student flow on MeetHome:**
- Students only see "Enter a code" + "Join" — no "New meeting" or upload
- Joining navigates to lobby as viewer

---

## Phase 5: Role-Differentiated Meeting Room

**Lobby changes:**
- Teacher lobby: shows presentation title, slide count, upload summary, "Start presenting" button
- Student lobby: shows room code, "Join as viewer" — no present option
- Both: real camera/mic preview (Phase 6)

**MeetRoom changes:**
- **Teacher view**: presenter controls (slide nav, buddy toggle, difficulty), thumbnail sidebar, speaker notes, end session button that saves engagement data to Supabase
- **Student view**: slide viewer only, free-browse toggle, buddy Q&A interaction, emoji reactions — no presenter controls, no lesson switcher, no speaker notes
- Remove the `role=presenter/viewer` URL param hack; derive role from `useAuth().role`
- On session end (teacher clicks "End"), save all engagement data to `session_engagement` table

---

## Phase 6: Real Camera & Microphone

- Use `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` in the lobby for live preview
- Pass the media stream into MeetRoom
- Display the local video feed in a self-view tile (small pip in corner or filmstrip)
- Mic toggle mutes the audio track; camera toggle stops the video track
- Show a volume indicator (audio level meter) on the mic button
- Note: this is local-only (no WebRTC peer connection) — the camera feed is only shown to the user themselves as a self-view

---

## Technical Details

### Edge function: `process-presentation`
- Accepts `{ presentationId, filePath }` 
- Downloads file from storage using service role key
- Extracts page count and basic metadata
- Updates `presentations` row with slide count
- Returns success

### Auth-derived roles in MeetRoom
Current code uses `?role=presenter` URL param. Replace with:
```text
const { role } = useAuth();
const isTeacher = role === "teacher";
```
Teacher = presenter controls. Student = viewer. Remove URL role param.

### Data flow for dashboard
```text
Teacher ends session
  → Save session row (teacher_id, presentation_id, room_code, timestamps)
  → Save engagement rows per student
  → Dashboard queries these tables
```

### File count estimate
- ~3 new pages (Profile, updated Dashboard, updated MeetRoom logic)
- ~2 new edge functions (process-presentation, save-session)
- ~1 migration with all new tables + storage buckets + RLS
- Updates to: MeetHome, MeetLobby, MeetRoom, App.tsx (new routes)

