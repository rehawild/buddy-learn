

## Plan: Full Google Meet-Style Presentation System

### Current State
- Hardcoded lesson data in `src/data/lessons.ts` (2 lessons, 3 sections each, plain text)
- Presentation renders as a simple text card inside `MeetRoom.tsx` — no real slide design
- Real-time sync via Supabase Broadcast already works (room codes, presenter/viewer roles, state sync)
- No actual slide layouts, no speaker notes, no fullscreen, no slide thumbnails, no progress indicators
- Participant tiles are fake avatars with colored circles
- Chat sidebar is local-only (not synced via broadcast)

### What We're Building
A proper presentation experience inside the Meet room — modeled after Google Meet's "present a tab" mode but with structured slide content.

### Implementation Steps

**1. Redesign the slide renderer** (`src/components/SlideRenderer.tsx`)
- Create a proper 16:9 slide component with scaled rendering (1920x1080 base, CSS transform scale to fit container)
- Support multiple slide layouts: Title slide, Content slide (title + bullets), Two-column, Image+text, Quote
- Each section in `lessons.ts` becomes a slide with a designated layout
- Typography scaled for presentation (large headings, readable body text)
- Smooth transitions between slides (fade/slide animation)

**2. Expand the lesson data model** (`src/data/lessons.ts`)
- Add `layout` field to each section: `"title" | "content" | "two-column" | "quote"`
- Add `bullets` array (optional) for bullet-point slides
- Add `speakerNotes` field per section
- Add `image` field (optional) for image slides (use placeholder URLs)
- First section of each lesson becomes a title slide automatically

**3. Add slide thumbnail sidebar** (`src/components/SlideThumbnail.tsx`)
- Left sidebar showing miniature versions of all slides (reusing SlideRenderer at small scale)
- Current slide highlighted with primary border
- Click to jump to slide (presenter only)
- Collapsible on mobile

**4. Add presenter toolbar overlay** (inside `MeetRoom.tsx`)
- Slide counter: "3 / 9"
- Timer showing elapsed presentation time
- Speaker notes toggle (bottom panel, only visible to presenter)
- Laser pointer cursor mode (CSS cursor change)

**5. Add fullscreen presentation mode**
- "Fullscreen" button in bottom bar
- Uses Fullscreen API to render slide at full viewport with black background
- Keyboard navigation: Arrow keys, Space, Escape to exit
- Auto-hide controls after 3s of inactivity
- Still broadcasts state changes to viewers

**6. Sync chat messages via Broadcast** (upgrade `MeetSidebar.tsx`)
- Add a `chat_message` broadcast event type alongside `state_sync`
- Messages broadcast to all participants in the room
- Show sender name and timestamp
- Messages are ephemeral (lost on disconnect, no DB)

**7. Add slide progress bar**
- Thin progress bar at top of slide area showing current position (section X of total)
- Animated transitions

**8. Update MeetRoom.tsx layout**
- Presenter mode: Left thumbnail sidebar + center slide + optional bottom speaker notes
- Viewer mode: Center slide only (no thumbnails, no notes)
- Filmstrip of participants moves to top-right overlay (smaller, floating)
- Clean up the bottom bar — group controls logically

### Files to Create
- `src/components/SlideRenderer.tsx` — scaled 16:9 slide component with layout variants
- `src/components/SlideThumbnail.tsx` — miniature slide preview for sidebar
- `src/components/SlideProgress.tsx` — progress bar component
- `src/components/SpeakerNotes.tsx` — collapsible notes panel for presenter

### Files to Modify
- `src/data/lessons.ts` — expand section data with layouts, bullets, notes
- `src/pages/MeetRoom.tsx` — new presentation layout with sidebar, fullscreen, timer
- `src/components/MeetSidebar.tsx` — broadcast chat messages
- `src/hooks/useRealtimeRoom.ts` — add `chat_message` event handling
- `src/index.css` — slide scaling CSS, fullscreen styles

### Technical Details
- Slide scaling: container measures its size, computes `scale = Math.min(containerW/1920, containerH/1080)`, applies via CSS transform
- Fullscreen: `document.documentElement.requestFullscreen()` with `fullscreenchange` listener
- Chat broadcast: same channel, new event `chat_message` with `{ sender, text, time }`
- No database tables needed — everything stays ephemeral via Broadcast

