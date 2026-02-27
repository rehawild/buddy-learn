

# Why the Camera Is Not Working

There are **three distinct issues** preventing the camera from functioning:

---

## Issue 1: Errors are silently swallowed

The `useMediaStream` hook captures errors (line 25) into an `error` state, but **MeetRoom never reads or displays this error**. When `getUserMedia` fails (permission denied, no device, or iframe sandbox restriction), the user sees "Camera off" with zero feedback about what went wrong.

## Issue 2: Lovable preview iframe blocks `getUserMedia`

The preview runs inside a sandboxed iframe. Browsers require the iframe to have `allow="camera;microphone"` permissions. If these are missing, `getUserMedia` rejects immediately. The lobby has the same issue. This is a **platform-level limitation** — the camera will work when the app is opened in its own tab/window (the published or preview URL directly), but not inside the embedded preview panel.

## Issue 3: Stream acquired in Lobby is destroyed before MeetRoom

In `MeetLobby.handleJoin()`, all tracks are stopped before navigating. Then `MeetRoom` creates a brand-new `useMediaStream` instance which calls `getUserMedia` again. This is technically correct but means the user gets a **second permission prompt** (or silent denial if the browser auto-blocks repeated requests in quick succession).

---

## Plan

### 1. Display camera/mic errors in MeetRoom
- Read the `error` value from `useMediaStream()` in MeetRoom
- Show an error banner in the self-view PIP area (similar to how the lobby shows errors)
- This gives immediate visibility into why the camera isn't working

### 2. Add a fallback UI and retry button
- When `stream` is null and `error` is set, show the error message + a "Retry" button in the PIP
- Add a `retry()` function to `useMediaStream` that re-calls `getUserMedia`
- This handles cases where the user initially denies permission but wants to grant it later

### 3. Show a clear message when in iframe sandbox
- Detect iframe context (`window.self !== window.top`)
- When in an iframe and camera fails, show a specific message: "Open in a new tab to use your camera"
- Add a button/link to open the preview URL in a new tab

### 4. Stop double-requesting in Lobby → Room transition
- In `MeetLobby.handleJoin()`, stop calling `stream.getTracks().forEach(stop)` — let the stream persist via a shared context or just let `useMediaStream` cleanup handle it on unmount
- Alternatively, accept the double-request but suppress any "already in use" errors gracefully

---

### Files to modify
- `src/hooks/useMediaStream.ts` — add `retry()` function, iframe detection
- `src/pages/MeetRoom.tsx` — display `error` from the hook, show retry/open-in-tab UI in the PIP area
- `src/pages/MeetLobby.tsx` — remove premature `stream.stop()` before navigation (let hook cleanup handle it)

