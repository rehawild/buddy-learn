

## Plan: Real-time Room System with Supabase Broadcast

### Implementation Steps

**1. Create `useRealtimeRoom` hook** (`src/hooks/useRealtimeRoom.ts`)
- Connect to Supabase Broadcast channel named `room:{code}`
- Use Presence to track connected users (name, role)
- Presenter broadcasts state: `{ lessonIdx, sectionIdx, activeQuestion, feedback, buddyEnabled, difficulty }`
- Viewers subscribe and mirror state locally
- Return: `{ broadcast, state, participants, isConnected, role }`

**2. Create room utility** (`src/lib/room.ts`)
- `generateRoomCode()` → random 6-char alphanumeric code
- Room code passed via URL search params: `?room=ABC123&role=presenter`

**3. Update MeetHome.tsx**
- "New meeting" generates a room code, navigates to `/lobby?room=ABC123&role=presenter`
- "Enter a code" input + "Join" navigates to `/lobby?room={code}&role=viewer`

**4. Update MeetLobby.tsx**
- Read `room` and `role` from search params
- If presenter: show room code prominently with copy button ("Share this code")
- If viewer: show "Joining room {code}..."
- "Join now" navigates to `/meet?room={code}&role=viewer`
- "Present" navigates to `/meet?room={code}&role=presenter`

**5. Update MeetRoom.tsx**
- Read `room` and `role` from search params
- Connect to `useRealtimeRoom(roomCode, role)`
- **Presenter**: existing behavior + broadcast every state change (lessonIdx, sectionIdx, activeQuestion, buddyEnabled, difficulty)
- **Viewer**: receive broadcast state, render presentation read-only (hide slide nav buttons, hide buddy answer inputs), show "Presenter is controlling" badge
- Show real participant count from Presence instead of fake count
- Mix real presence participants with fake ones for visual fullness

**6. Viewer-specific UI in MeetRoom**
- Hide Previous/Next/Finish buttons
- BuddyOverlay shows question + feedback but answer buttons disabled (view-only)
- Replace "Presenting" badge with "Viewing — {presenterName} is presenting"
- Hide buddy ON/OFF and difficulty controls from bottom bar

### Technical Details
- Supabase Broadcast is ephemeral — no DB tables needed
- Channel name: `room:{code}` 
- Broadcast event types: `state_sync` (full state), `presence_sync` (join/leave)
- Presenter sends state on every change via `channel.send({ type: 'broadcast', event: 'state_sync', payload: {...} })`
- Viewer listens: `channel.on('broadcast', { event: 'state_sync' }, callback)`

