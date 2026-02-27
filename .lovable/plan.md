

# Landing Page Plan

## What to build
A public landing page at `/landing` that explains Study Buddy — the real-time classroom presentation platform with AI-powered micro-interactions. Minimalistic, elegant, same dark teal/orange color theme.

## Structure (single-page, scroll sections)

### 1. Hero
- Buddy owl mascot with glow effect
- "Study Buddy" headline + one-liner tagline: "Real-time presentations that keep classrooms engaged"
- Two CTAs: "Get Started" → `/auth` (signup), "Learn More" → scroll to features

### 2. Features (3-column grid)
- **Live Presentations** — Upload PDF/PPTX, present in real-time with synced slides
- **Real-Time Engagement** — Emoji reactions, live chat, hand raises, presence tracking
- **AI Micro-Interactions** — Buddy owl pops up with contextual quiz questions during lessons

### 3. How It Works (3-step horizontal flow)
- Step 1: Teacher uploads a presentation
- Step 2: Students join with a 6-character room code
- Step 3: Buddy keeps everyone engaged with quick questions

### 4. For Teachers / For Students (two-column split)
- Teachers: upload, present, view engagement dashboard, track progress
- Students: join sessions, answer questions, react, stay focused

### 5. Footer CTA
- "Ready to engage your classroom?" + "Sign Up Free" button → `/auth`
- Minimal footer with product name

## Files to create/modify
- **Create `src/pages/LandingPage.tsx`** — full landing page component
- **Update `src/App.tsx`** — add `/landing` route (public, no auth required), change `"/"` for logged-out users to redirect to `/landing` instead of `/auth`
- **Update `src/pages/Landing.tsx`** — remove or redirect to new landing page
- **Update `src/pages/Index.tsx`** — point to new landing page

## Technical notes
- No new dependencies — uses existing Lucide icons, tailwind classes, buddy-glow utility
- Smooth scroll via `id` anchors and `scroll-behavior: smooth`
- Reuse existing color variables (`primary`, `accent`, `muted`, `card`, `buddy-glow`)
- fade-up animation on scroll sections using intersection observer or CSS-only approach

