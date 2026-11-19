import { NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedLevels = new Set(["AP Biology", "Biology Olympiad", "General biology"]);
const allowedDifficulties = new Set(["Foundational", "Intermediate", "Challenge"]);

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI drafting is not configured yet. Add OPENAI_API_KEY to .env.local and restart the app." }, { status: 503 });
  }

  let body: { topic?: unknown; level?: unknown; difficulty?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 100) : "";
  const level = typeof body.level === "string" ? body.level : "";
  const difficulty = typeof body.difficulty === "string" ? body.difficulty : "";
  if (!topic || !allowedLevels.has(level) || !allowedDifficulties.has(difficulty)) {
    return NextResponse.json({ error: "Provide a topic, supported track, and challenge level." }, { status: 400 });
  }

  const instructions = `Create one original biology multiple-choice practice question. It is an unverified draft, not an authoritative exam item. Target track: ${level}. Topic: ${topic}. Difficulty: ${difficulty}. Test conceptual reasoning or application rather than trivia. Use exactly four plausible choices and one unambiguously best answer. Do not quote or imitate a specific copyrighted exam question. Do not invent citations or claim the answer has been verified. Return only valid JSON with keys: prompt (string), choices (array of exactly four strings), correctAnswer (string containing the letter and full choice), explanation (string explaining the reasoning and any limitations), topic (string), difficulty (string), sourceNotes (string; say "Sources need to be researched and verified"), reviewer (empty string), status (the exact string "Needs review").`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You draft biology questions for later human review. Be careful, scientifically conservative, and return the requested JSON only." },
          { role: "user", content: instructions },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok) {
      const details = await upstream.json().catch(() => ({}));
      console.error("OpenAI draft request failed", upstream.status, details);
      return NextResponse.json({ error: "The AI provider could not generate a draft. Check your API configuration and try again." }, { status: 502 });
    }
    const result = await upstream.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Provider returned no content");
    const parsed = JSON.parse(content);
    if (typeof parsed.prompt !== "string" || !Array.isArray(parsed.choices) || parsed.choices.length !== 4 || typeof parsed.correctAnswer !== "string" || typeof parsed.explanation !== "string") {
      throw new Error("Generated question has an invalid shape");
    }
    const question = {
      prompt: parsed.prompt,
      choices: parsed.choices.map((choice: unknown) => String(choice)),
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
      topic,
      difficulty,
      status: "Needs review",
      sourceNotes: "Sources need to be researched and verified",
      reviewer: "",
    };
    return NextResponse.json({ question });
  } catch (error) {
    console.error("Question draft generation error", error);
    return NextResponse.json({ error: "Could not generate a valid question draft. Please try again." }, { status: 502 });
  }
}
