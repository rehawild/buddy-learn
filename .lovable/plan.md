

## Fix: Wire up broken routes and verify real-time sync works

### Problem
- User is on `/present` which doesn't exist in the router — it's a 404
- `Landing.tsx` and `Recap.tsx` navigate to `/present` instead of valid routes
- The real-time sync code is already fully implemented but untested

### Changes

**1. Fix broken route references**
- `src/pages/Landing.tsx`: Change `navigate("/present")` → `navigate("/")`
- `src/pages/Recap.tsx`: Change `navigate("/present")` → `navigate("/")`

**2. Add `/present` as an alias route (optional alternative)**
- In `App.tsx`, add `<Route path="/present" element={<MeetHome />} />` so `/present` lands on the home page

**3. No other changes needed**
The Supabase Realtime Broadcast sync is already implemented:
- Presenter broadcasts `{ lessonIdx, sectionIdx, activeQuestionIdx, buddyEnabled, difficulty }` on every state change
- Viewer listens and mirrors state in real-time
- Presence tracks connected participants

### How to test
1. Open two browser tabs
2. Tab 1: Go to `/` → click "New meeting" → copy code → "Start meeting" → "Join now"
3. Tab 2: Go to `/` → paste code → "Join" → "Join now"
4. Tab 1 (presenter): Navigate slides — Tab 2 (viewer) should update in real-time

