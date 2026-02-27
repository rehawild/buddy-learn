

## Plan: Real-time Screen Share Presentation with 2-5 People

### Approach
Use **Supabase Realtime** (Broadcast channel) to sync presentation state across participants. One person presents (controls slides + answers buddy questions), and others watch the same content update in real-time. No WebRTC video/audio needed.

### How it works
1. **Presenter** creates a "room" → gets a shareable room code
2. **Viewers** enter the room code to join
3. Presenter's slide navigation, buddy questions, and answers broadcast to all viewers in real-time via Supabase Realtime Broadcast
4. Viewers see the presentation content update live (read-only view)

### Prerequisites
- Enable **Lovable Cloud** (for Supabase Realtime — no database tables needed, just Broadcast channels)

### Implementation steps

1. **Create a shared room system**
   - Generate random 6-char room codes
   - Add "Create room" and "Join room" flows to MeetHome/MeetLobby
   - Store room code + role (presenter/viewer) in route state

2. **Add a Realtime sync hook** (`src/hooks/useRealtimeRoom.ts`)
   - Connect to a Supabase Broadcast channel named by room code
   - Presenter broadcasts: `{ lessonIdx, sectionIdx, activeQuestion, feedback, buddyEnabled, difficulty }`
   - Viewers listen and mirror state locally

3. **Update MeetRoom.tsx**
   - If role = presenter: current behavior (controls slides, answers questions, broadcasts state changes)
   - If role = viewer: render presentation content in read-only mode, state driven by broadcast messages
   - Show participant count from Presence tracking

4. **Update MeetHome.tsx**
   - Add "Create room" button → generates code, navigates to `/lobby?room=ABC123&role=presenter`
   - Add "Join with code" input → navigates to `/lobby?room=ABC123&role=viewer`

5. **Update MeetLobby.tsx**
   - Show room code prominently so presenter can share it
   - "Join now" connects to the broadcast channel

6. **Viewer-specific UI**
   - Hide slide navigation controls (Next/Prev)
   - Show "Presenter is controlling" indicator
   - Buddy overlay visible but non-interactive (or optionally let viewers answer independently)

### No database tables needed
Supabase Broadcast is ephemeral — no persistence required for this MVP.

