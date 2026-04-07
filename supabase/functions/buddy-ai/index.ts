import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── System prompts ──

const QUESTION_GEN_SYSTEM = `You are Finny's question generator. Analyze all slides and generate up to 15 total multiple-choice (A/B) questions that test key concepts across the entire presentation.

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

const TRANSCRIPT_QUESTION_SYSTEM = `You are Finny's question generator. Given a teacher's spoken transcript and the current slide context, generate 1-3 multiple-choice (A/B) questions about concepts the teacher emphasized verbally.

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

const BUDDY_CHAT_SYSTEM = `You are Finny, a friendly animated companion that helps students learn. You are sitting on top of the student's lesson slides.

Rules:
- Only discuss the current lesson material provided in context.
- Keep responses to 1-2 sentences maximum.
- Be encouraging and use simple language.
- If the student asks about something off-topic, gently redirect them back to the lesson.
- Never give away quiz answers directly. If asked, give a hint instead.
- Match the energy of a helpful study partner, not a formal teacher.`;

const BUDDY_CHAT_FINANCE_SYSTEM = `You are Finny, a financial literacy tutor helping students build real money skills. You sit on top of their lesson slides and give sharp, practical guidance.

Your identity:
- You are a knowledgeable friend who understands money — not a bank advisor, not a textbook.
- You make finance feel approachable and immediately relevant to young people's lives.
- You are direct, warm, and never condescending.

Rules:
- Only discuss personal finance concepts from the current slide.
- Keep every response to 1-2 sentences — punchy and memorable.
- Always ground concepts in real decisions students will face: first paycheque, rent, student debt, credit cards, first savings account.
- Use concrete numbers: "If you put £50/month away at 7%..." not "compound interest grows over time."
- Never use financial jargon without immediately explaining it in plain terms.
- If asked something off-topic: redirect with energy — "Love the curiosity, but let's keep our money hats on! [redirect to current concept]."
- Never give away quiz answers. Give a practical hint instead: "Think about what costs you can't skip no matter what."
- Reinforce the mindset: small consistent habits beat big windfalls every time.`;

// ── Groq API call (OpenAI-compatible) ──

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

async function callGroq(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  temperature = 0.7,
  maxTokens = 2048,
): Promise<string> {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
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
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Handlers ──

const MAX_SLIDES_PER_BATCH = 8;  // keep total tokens under Groq free-tier TPM
const MAX_SLIDE_CONTENT_CHARS = 300; // ~75 tokens per slide
const MAX_TRANSCRIPT_CHARS = 1200;   // ~300 tokens

async function handlePreGenerate(
  payload: { slides: { index: number; title: string; content: string }[]; difficulty: string; lessonTitle: string; subject?: string },
  apiKey: string,
) {
  // Truncate slide content and limit batch size to stay within TPM
  const slidesToProcess = payload.slides.slice(0, MAX_SLIDES_PER_BATCH);
  const slideDescriptions = slidesToProcess
    .map((s) => {
      const content = (s.content || "").slice(0, MAX_SLIDE_CONTENT_CHARS);
      return `--- Slide ${s.index + 1}: "${s.title}" ---\n${content}`;
    })
    .join("\n\n");

  const financeHint = payload.subject === "Finance"
    ? "\nFinance context: Focus questions on practical money decisions, real numbers, and concepts students will use in everyday life (budgeting, credit, saving, investing). Avoid abstract theory."
    : "";

  const userMessage = `Lesson: "${payload.lessonTitle}"
Difficulty: ${payload.difficulty}${financeHint}

Generate questions for these slides:

${slideDescriptions}`;

  const raw = await callGroq(QUESTION_GEN_SYSTEM, userMessage, apiKey, 0.4, 2048);

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
    subject?: string;
  },
  apiKey: string,
) {
  const systemPrompt = payload.subject === "Finance"
    ? BUDDY_CHAT_FINANCE_SYSTEM
    : BUDDY_CHAT_SYSTEM;

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

  const reply = await callGroq(systemPrompt, userMessage, apiKey, 0.7, 256);

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
    subject?: string;
  },
  apiKey: string,
) {
  const financeHint = payload.subject === "Finance"
    ? "\nFinance context: Focus on practical money decisions and real-world examples the teacher mentioned. Ground questions in everyday financial scenarios."
    : "";

  // Truncate transcript to avoid TPM overflow
  const truncatedTranscript = (payload.transcript || "").slice(-MAX_TRANSCRIPT_CHARS);
  const truncatedSlideContent = (payload.slideContent || "").slice(0, MAX_SLIDE_CONTENT_CHARS);

  const userMessage = `Lesson: "${payload.lessonTitle}"
Current slide (${payload.slideIndex + 1}): "${payload.slideTitle}"
Slide content: ${truncatedSlideContent}
Difficulty: ${payload.difficulty}${financeHint}

Teacher's spoken transcript (recent):
${truncatedTranscript}

Generate 1-3 questions about concepts the teacher emphasized verbally that go beyond the slide text.`;

  const raw = await callGroq(TRANSCRIPT_QUESTION_SYSTEM, userMessage, apiKey, 0.5, 2048);
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const questions = JSON.parse(cleaned);

  return { questions };
}

const STUDENT_ASSESSMENT_SYSTEM = `You are Finny's teacher assistant. Given a student's engagement statistics from a lesson session, generate a brief 1-2 sentence assessment of their participation and learning.

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

  const assessment = await callGroq(STUDENT_ASSESSMENT_SYSTEM, userMessage, apiKey, 0.6, 256);
  return { assessment: assessment.trim() };
}

// ── Main handler ──

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      throw new Error("GROQ_API_KEY must be set in Edge Function secrets");
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
