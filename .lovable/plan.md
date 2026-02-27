

## Plan: Build a Google Meet Clone UI

The current app jumps straight to a presentation view. The user wants a proper Google Meet-style experience as the foundation, with the study buddy layered on top.

### New screens and flow

1. **Landing page** — redesign as a Google Meet-style home page (meeting code input, "New meeting" / "Join" buttons, Google Meet branding style)

2. **Meeting Lobby** (`/lobby`) — "Ready to join?" screen with:
   - Fake camera preview (dark placeholder with user avatar/initials)
   - Mic/camera toggle buttons
   - "Join now" / "Present" buttons
   - Meeting title display

3. **Meeting Room** (`/meet`) — the core Google Meet clone:
   - **Main view**: Large center area showing participant video tiles (fake/placeholder webcam feeds — dark cards with initials/avatars)
   - **Self-view**: Small pip camera tile in corner
   - **Top bar**: Meeting title, clock/timer, participant count, meeting code
   - **Bottom bar**: Mic, Camera, Captions, Reactions, Raise hand, Screen share, More, Leave call (red button) — all functional-looking but cosmetic except "Present" which starts the lesson
   - **Side panel toggle**: Chat panel or People panel (can be stubs)
   - Layout: Speaker view (1 big tile + small strip) or Grid view toggle

4. **Presentation mode** — when user clicks "Present", transition to the current presentation view but **inside the meeting room**:
   - The slide/lesson content takes over the main tile area
   - Other "participants" shrink to a filmstrip at the top or side
   - "You are presenting" banner appears
   - Buddy overlay activates on the presented content
   - "Stop presenting" button to go back to meeting view

5. **Recap** — stays mostly the same, triggered when lesson finishes

### Fake participants
- Generate 3-4 fake participant tiles with names, initials, and colored backgrounds (no real video needed)
- Show "muted" indicators, random avatar colors

### Components to create
- `MeetHome.tsx` — new landing/home page
- `MeetLobby.tsx` — pre-join lobby
- `MeetRoom.tsx` — main meeting room
- `ParticipantTile.tsx` — reusable video tile component
- `MeetSidebar.tsx` — chat/people side panel stub
- Update `MeetBottomBar.tsx` — full Meet-style control bar with all icons
- Update `MeetTopBar.tsx` — meeting info bar

### Route changes
- `/` → MeetHome
- `/lobby` → MeetLobby  
- `/meet` → MeetRoom (with presentation mode as a state within it)
- `/recap` → Recap (unchanged)

### Technical details
- Fake participants stored as a simple array of `{ name, initials, color }` objects
- Meeting room uses CSS grid for tile layout (speaker view vs grid view)
- Presentation mode is a boolean state in MeetRoom that swaps the main tile for lesson content
- Buddy overlay remains positioned over the presentation content area
- Bottom bar gets a red "Leave call" button that navigates to recap or home
- Use existing dark theme colors (`meet-bar`, `meet-surface`, `background`)

