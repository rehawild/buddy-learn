import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AZURE_ENDPOINT =
  "https://osvathrobert03-1965-resource.services.ai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── System prompts ──

const QUESTION_GEN_SYSTEM = `You are Catchy's question generator. Analyze all slides and generate up to 15 total multiple-choice (A/B) questions that test key concepts across the entire presentation.

Rules:
- Generate at most 15 questions TOTAL across all slides. Prioritize the most important concepts.
- Each question must have exactly 2 options (A/B format).
- Include a "highlight" (the key phrase being tested).
- Include a "topic" label (2-4 words) grouping questions by concept. Questions about similar concepts across different slides should share the same topic label.
- Include reinforcement text (shown when correct) and correction text (shown when wrong).
- Assign a difficulty level matching the requested difficulty.
- Extract 3-5 key phrases per slide for content matching (used for speech recognition coverage).
- Return valid JSON only, no markdown fences.

Output format (JSON array):
[
  {
    "slideIndex": 0,
    "slideTitle": "...",
    "keyPhrases": ["phrase1", "phrase2", "phrase3"],
    "questions": [
      {
        "highlight": "key concept",
        "question": "Question text?",
        "type": "choice",
        "options": ["Option A", "Option B"],
        "answer": "Option A",
        "reinforcement": "Why this is correct...",
        "correction": "Why the other is wrong...",
        "difficulty": "easy",
        "topic": "Key Concepts"
      }
    ]
  }
]`;

const TRANSCRIPT_QUESTION_SYSTEM = `You are Catchy's question generator. Given a teacher's spoken transcript and the current slide context, generate 1-3 multiple-choice (A/B) questions about concepts the teacher emphasized verbally.

Rules:
- Focus on concepts mentioned in the transcript that go BEYOND what's written on the slide.
- Each question must have exactly 2 options (A/B format).
- Include a "highlight" (the key phrase from the transcript being tested).
- Include reinforcement text and correction text.
- Keep questions concise and clear.
- Return valid JSON only, no markdown fences.

Output format (JSON array):
[
  {
    "highlight": "key concept from speech",
    "question": "Question text?",
    "type": "choice",
    "options": ["Option A", "Option B"],
    "answer": "Option A",
    "reinforcement": "Why this is correct...",
    "correction": "Why the other is wrong...",
    "difficulty": "easy",
    "topic": "Discussion Topic",
    "source": "transcript"
  }
]`;

const BUDDY_CHAT_SYSTEM = `You are StudyBuddy, a friendly animated owl companion that helps students learn. You are sitting on top of the student's lesson slides.

Rules:
- Only discuss the current lesson material provided in context.
- Keep responses to 1-2 sentences maximum.
- Be encouraging and use simple language.
- If the student asks about something off-topic, gently redirect them back to the lesson.
- Never give away quiz answers directly. If asked, give a hint instead.
- Match the energy of a helpful study partner, not a formal teacher.`;

// ── Azure OpenAI call ──

async function callAzure(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  temperature = 0.7,
  maxTokens = 2048,
): Promise<string> {
  const res = await fetch(AZURE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Azure API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Handlers ──

async function handlePreGenerate(
  payload: { slides: { index: number; title: string; content: string }[]; difficulty: string; lessonTitle: string },
  apiKey: string,
) {
  const slideDescriptions = payload.slides
    .map((s) => `--- Slide ${s.index + 1}: "${s.title}" ---\n${s.content}`)
    .join("\n\n");

  const userMessage = `Lesson: "${payload.lessonTitle}"
Difficulty: ${payload.difficulty}

Generate questions for these slides:

${slideDescriptions}`;

  const raw = await callAzure(QUESTION_GEN_SYSTEM, userMessage, apiKey, 0.4, 4096);

  // Parse JSON — handle potential markdown fences
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const questionBank = JSON.parse(cleaned);

  return { questionBank };
}

async function handleBuddyChat(
  payload: {
    message: string;
    slideContent: string;
    slideTitle: string;
    lessonTitle: string;
    conversationHistory: { role: string; content: string }[];
  },
  apiKey: string,
) {
  const context = `Current lesson: "${payload.lessonTitle}"
Current slide: "${payload.slideTitle}"
Slide content: ${payload.slideContent}`;

  // Build conversation with context
  const historyStr = payload.conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const userMessage = `${context}

Conversation so far:
${historyStr}

Student says: ${payload.message}`;

  const reply = await callAzure(BUDDY_CHAT_SYSTEM, userMessage, apiKey, 0.7, 256);

  return { reply };
}

async function handleTranscriptQuestions(
  payload: {
    transcript: string;
    slideContent: string;
    slideTitle: string;
    lessonTitle: string;
    slideIndex: number;
    difficulty: string;
  },
  apiKey: string,
) {
  const userMessage = `Lesson: "${payload.lessonTitle}"
Current slide (${payload.slideIndex + 1}): "${payload.slideTitle}"
Slide content: ${payload.slideContent}
Difficulty: ${payload.difficulty}

Teacher's spoken transcript:
${payload.transcript}

Generate 1-3 questions about concepts the teacher emphasized verbally that go beyond the slide text.`;

  const raw = await callAzure(TRANSCRIPT_QUESTION_SYSTEM, userMessage, apiKey, 0.5, 2048);
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const questions = JSON.parse(cleaned);

  return { questions };
}

const STUDENT_ASSESSMENT_SYSTEM = `You are StudyBuddy's teacher assistant. Given a student's engagement statistics from a lesson session, generate a brief 1-2 sentence assessment of their participation and learning.

Rules:
- Be constructive and specific — mention what went well AND areas for improvement.
- Reference the actual numbers (accuracy, response time, attention) naturally.
- Keep it to 1-2 sentences maximum.
- Use a supportive, professional tone appropriate for a teacher reading about their student.`;

async function handleStudentAssessment(
  payload: {
    studentName: string;
    questionsAnswered: number;
    correctAnswers: number;
    avgResponseTime: number;
    attentionScore: number;
    reactionsCount: number;
    buddyInteractions: number;
    tabSwitchCount: number;
    idleCount: number;
  },
  apiKey: string,
) {
  const accuracy = payload.questionsAnswered > 0
    ? Math.round((payload.correctAnswers / payload.questionsAnswered) * 100)
    : 0;

  const userMessage = `Student: ${payload.studentName}
Questions answered: ${payload.questionsAnswered} (${accuracy}% accuracy)
Average response time: ${payload.avgResponseTime.toFixed(1)}s
Attention score: ${payload.attentionScore}%
Emoji reactions: ${payload.reactionsCount}
Buddy chat interactions: ${payload.buddyInteractions}
Tab switches: ${payload.tabSwitchCount}
Idle periods: ${payload.idleCount}`;

  const assessment = await callAzure(STUDENT_ASSESSMENT_SYSTEM, userMessage, apiKey, 0.6, 256);
  return { assessment: assessment.trim() };
}

// ── Main handler ──

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AZURE_AI_KEY");
    if (!apiKey) {
      throw new Error("AZURE_AI_KEY not configured");
    }

    const body = await req.json();
    const { action, payload } = body;

    let result;
    switch (action) {
      case "pre-generate":
        result = await handlePreGenerate(payload, apiKey);
        break;
      case "buddy-chat":
        result = await handleBuddyChat(payload, apiKey);
        break;
      case "transcript-questions":
        result = await handleTranscriptQuestions(payload, apiKey);
        break;
      case "student-assessment":
        result = await handleStudentAssessment(payload, apiKey);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
