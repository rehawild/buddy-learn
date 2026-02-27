

## Assessment: What's Done vs. What's Missing

### Done
- 16:9 slide renderer with 4 layouts (title, content, two-column, quote)
- Slide thumbnail sidebar with lesson switcher
- Slide progress bar and navigation controls
- Speaker notes panel (collapsible)
- Fullscreen mode with keyboard navigation
- Real-time sync via Supabase Broadcast (presenter/viewer roles)
- Real-time chat sidebar
- Participant filmstrip with fake avatars
- Buddy overlay with questions
- Room creation and join flow

### Missing — Worth Building Next

**1. Slide transition animations**
- Currently slides swap instantly with no animation
- Add CSS fade or slide-left transitions between slides using `key` + CSS animation

**2. Slide theme / background variety**
- All slides have the same plain white background
- Add per-slide or per-lesson color themes (dark slide, gradient, accent-colored header bar)

**3. More content in lessons**
- Only 2 lessons with 4 slides each — feels like a demo
- Add at least 2 more lessons (e.g. Math, History) with 6-8 slides each and varied layouts

**4. Image support in slides**
- `image` field exists in the data model but no layout uses it
- Add an `image` or `image-text` layout that renders an image alongside text

**5. Presenter cursor / pointer indicator**
- No way for viewers to see what the presenter is pointing at
- Broadcast mouse position so viewers see a laser-dot overlay

**6. Reactions (emoji reactions from viewers)**
- Viewers have no way to give quick feedback during presentation
- Add floating emoji reactions (👍🔥❓) that broadcast and animate on all screens

**7. Recording / export**
- No way to save the presentation session or export slides
- Could export slides as images or generate a PDF

**8. Participant names from Presence**
- People sidebar still shows hardcoded fake participants
- Wire real Presence data into the sidebar so actual connected users appear

### Recommended Priority Order
1. Slide transitions (quick polish win)
2. More lesson content + image layout (makes the demo feel real)
3. Participant names from Presence (makes multiplayer feel real)
4. Emoji reactions (engagement feature)
5. Presenter cursor broadcast (nice-to-have)

