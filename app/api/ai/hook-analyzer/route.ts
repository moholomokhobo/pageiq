import { requireUser } from "@/lib/ai-auth";
import { AnthropicError, callAnthropic, parseJsonFromModel } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export type HookAnalyzerResponse = {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const caption = body.caption?.trim();

  if (!caption) {
    return NextResponse.json(
      { error: "A post caption is required." },
      { status: 400 }
    );
  }

  const prompt = `You are a Facebook engagement analyst for PageIQ. Analyze this Facebook post caption for predicted performance.

Caption to analyze:
"""
${caption}
"""

Evaluate: hook strength, clarity, emotional pull, curiosity gap, CTA, length, scroll-stopping power, and share/comment potential on Facebook.

Respond with ONLY valid JSON in this exact shape:
{
  "score": <number 0-100>,
  "verdict": "<one sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<actionable improvement 1>", "<actionable improvement 2>", "<actionable improvement 3>"]
}`;

  try {
    const text = await callAnthropic(prompt, 1200);
    const parsed = parseJsonFromModel<HookAnalyzerResponse>(text);

    const score = Math.min(100, Math.max(0, Number(parsed.score)));
    if (Number.isNaN(score)) {
      throw new AnthropicError("Invalid score from AI.");
    }

    return NextResponse.json({
      score,
      verdict: parsed.verdict ?? "",
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      suggestions: parsed.suggestions ?? [],
    });
  } catch (err) {
    const message =
      err instanceof AnthropicError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to analyze caption.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
