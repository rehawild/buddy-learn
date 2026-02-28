

# Rebrand to "Catchy" + New Mascot + Fix Build Errors

## 1. Copy mascot image to project
- Copy `user-uploads://catchy.png` to `src/assets/catchy.png`
- The old `src/assets/buddy-owl.png` can remain (no conflict) but all imports switch to `catchy.png`

## 2. Rebrand all "Study Buddy" / "StudyBuddy" references to "Catchy"

### Files to update:

| File | Changes |
|------|---------|
| `index.html` | Title → "Catchy", meta descriptions → "Catchy — Real-time classroom engagement" |
| `src/pages/LandingPage.tsx` | Import `catchy.png`, replace all "Study Buddy" text with "Catchy", update alt texts, footer copyright |
| `src/pages/MeetHome.tsx` | Import `catchy.png`, "With Study Buddy." → "With Catchy.", alt texts |
| `src/pages/MeetLobby.tsx` | Import `catchy.png`, "Study Buddy will be active" → "Catchy will be active" |
| `src/components/BuddyOverlay.tsx` | Remove `MASCOT_VIDEO`, import `catchy.png`, replace `<video>` tags with `<img>` tags, "Study Buddy" → "Catchy" |
| `src/components/BuddyChatDialog.tsx` | Remove `MASCOT_VIDEO`, import `catchy.png`, replace `<video>` with `<img>`, "Ask Buddy" → "Ask Catchy" |
| `supabase/functions/buddy-ai/index.ts` | "StudyBuddy" → "Catchy" in all system prompts |

## 3. Fix build errors

| File | Error | Fix |
|------|-------|-----|
| `src/hooks/useEngagementTracker.ts:115` | `Record<string, unknown>` not assignable to `Json` | Cast payload `as Json` |
| `src/hooks/useLiveTranscript.ts:145` | `.off()` doesn't exist on `RealtimeChannel` | Use `channel.unsubscribe()` in cleanup, or remove the `.off()` call (Supabase JS v2 doesn't have `.off()`) |
| `src/hooks/useWebRTC.ts:190-193` | Same `.off()` issue | Same fix — remove `.off()` calls, unsubscribe channel instead |
| `src/pages/MeetRoom.tsx:256` | Same `.off()` issue | Same fix |
| `src/lib/parsePresentation.ts:26` | Missing `canvas` property in render params | Add `canvas` property to the render call |

