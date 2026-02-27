

# Make the Meeting Room a Real-Time Platform

## Current State
- MeetRoom heavily uses `fakeParticipants` and `fakeChatMessages` for filmstrip, grid view, sidebar, and participant count
- Camera/mic works via `useMediaStream` but only locally (no WebRTC peer connections — out of scope for now)
- Real-time sync exists via Supabase Broadcast (slide state, chat, emoji reactions, presence)
- Students can join with a code but the lobby doesn't validate the session exists
- No session validation for students (they can enter any code, even invalid ones)

## Plan

### 1. Remove all mock data usage from MeetRoom
- Remove `fakeParticipants` import and all references in MeetRoom (filmstrip fallback on line 386-388, grid view on line 489-493, participant count on line 254)
- Replace filmstrip with real `realtimeParticipants` only (no fallback to fakes)
- Replace grid view (non-presenting mode) with real participant tiles built from `realtimeParticipants`
- Fix participant count to use only `participantCount` from the realtime hook

### 2. Remove mock chat messages from MeetSidebar
- Remove `fakeChatMessages` import and stop seeding initial chat state with it
- Start with empty `messages` array — only show real broadcast messages
- Remove `fakeParticipants` fallback in the People tab — show only `realtimeParticipants`

### 3. Validate session exists before student joins
- In `MeetLobby`, for non-teacher users, query `sessions` table to confirm room code exists and status is `active`
- If no matching session, show "Session not found" error with a back button
- This prevents students from joining phantom rooms

### 4. Use real user display name in room
- In `MeetRoom`, fetch the user's `display_name` from `profiles` table
- Pass it to `useRealtimeRoom` as `userName` instead of hardcoded "Viewer"/"Presenter"
- Pass it to `MeetSidebar` so chat messages show the real name

### 5. Clean up unused mock files
- Remove `fakeParticipants` and `fakeChatMessages` exports from `src/data/participants.ts` (keep the `Participant` interface if still used)
- Keep `src/data/mockEngagement.ts` for now (used by TeacherDashboard)

### Files to modify
- `src/pages/MeetRoom.tsx` — remove mock imports, use real participants everywhere, fetch display name
- `src/components/MeetSidebar.tsx` — remove mock imports, empty initial chat, real people only
- `src/pages/MeetLobby.tsx` — add session existence check for students
- `src/data/participants.ts` — remove mock data, keep interface

