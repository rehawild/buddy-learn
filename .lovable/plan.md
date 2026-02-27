## Plan: Full Google Meet-Style Presentation System

### ✅ Completed
- 16:9 slide renderer with 4 layouts (title, content, two-column, quote)
- Slide thumbnail sidebar with lesson switcher
- Slide progress bar and navigation controls
- Speaker notes panel (collapsible)
- Fullscreen mode with keyboard navigation
- Real-time sync via Supabase Broadcast (presenter/viewer roles)
- Real-time chat sidebar (broadcast)
- Room creation and join flow
- Buddy overlay with questions
- **Slide transition animations** (fade-slide CSS on key change)
- **Per-lesson slide themes** (default, dark, gradient, warm, ocean)
- **4 lessons** (Photosynthesis 6 slides, Renaissance 6 slides, Gravity 6 slides, French Revolution 6 slides)
- **Emoji reactions** via Broadcast (👍🔥❓👏😂💡 with floating animation)
- **Real Presence participants** in filmstrip and People sidebar
- **Phase 1: Database & Storage** — presentations, presentation_slides, sessions, session_engagement tables + storage buckets (presentations, slide-images, avatars)
- **Phase 2: Profile Page** — /profile with avatar upload, display name editing, role badge, session history
- **Phase 4: Presentation Upload** — Teacher upload PDF/PPTX on MeetHome, create session in Supabase
- **Phase 5: Role-Differentiated Meeting** — Auth-derived roles (teacher=presenter, student=viewer), role-based MeetHome/Lobby/Room
- **Phase 6: Real Camera & Mic** — getUserMedia in lobby with live video preview and toggle controls
- **Teacher Join Restriction** — Teachers can only present their own sessions (UI + server-side enforcement in lobby)
- **Client-side PDF/PPTX Parsing** — pdfjs-dist for PDF page rendering, JSZip for PPTX slide extraction, upload slide images to Supabase
- **Uploaded Slides in MeetRoom** — Fetch presentation_slides from Supabase, render as images with thumbnail sidebar

### Remaining (nice-to-haves)
- Phase 3: Dashboard improvements (real Supabase queries, session picker, presentations list)
- Save engagement data on session end
- Image/image-text slide layout
- Presenter laser pointer cursor broadcast
- Recording / export to PDF
