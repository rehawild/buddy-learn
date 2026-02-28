## Inspiration

Students often look attentive while mentally drifting away. Most ed-tech tools frame engagement as a teacher dashboard problem. We flipped that by giving students a companion that senses disengagement and pulls them back in, without webcams or invasive monitoring. Engagement is inferred only from interaction signals.

## What it does

Catchy is an AI on-screen pet agent that sits on top of live presentations.

Proactive: It listens to the teacher, matches speech with slide content, and triggers A/B questions when a topic is actually covered, not on a timer.
Reactive: Students can ask for simpler explanations and get short, slide-grounded answers.
Emotional mirror: Catchy’s mood reflects student engagement using tab focus, answer accuracy and response time. No camera.

Teachers get live per-student engagement analytics and AI-generated assessments. Everything runs in real time over WebRTC with Supabase Realtime for sync and events.

## How we built it

React, TypeScript, Vite, Tailwind, shadcn/ui on the frontend.
Supabase for auth, database, realtime, and storage.
Azure OpenAI via edge functions for questions, chat, transcripts, and assessment.
Web Speech API for live transcripts.
WebRTC for live audio and video.
Lightweight engagement tracking batched every 30 seconds.
A teacher-side coordinator triggers questions based on transcript coverage, while a student-side agent manages the buddy and queue.

## Challenges

WebRTC glare and signaling races.
Deciding when content was sufficiently covered.
Noisy engagement signals causing mood flicker.
Keeping teachers in control of AI-generated questions.

## What we’re proud of

Content-aware question timing.
Privacy-first engagement tracking.
A mood system that meaningfully affects behavior.
A fully live end-to-end pipeline.
Actionable AI feedback for teachers.

## What we learned

Realtime infrastructure matters more than model size.
Simple interaction signals are enough to estimate engagement.
AI works best in classrooms when teachers stay in control.

## What’s next

Buddy progression and rewards.
Multi-language support.
Adaptive difficulty per student.
LMS integrations.
Long-term engagement analytics.
