import { requireUser } from "@/lib/ai-auth";
import { AnthropicError, callAnthropic, parseJsonFromModel } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export type CaptionsResponse = {
  captions: string[];
};

export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const niche = body.niche?.trim();
  const topic = body.topic?.trim();

  if (!niche || !topic) {
    return NextResponse.json(
      { error: "Both niche and post topic are required." },
      { status: 400 }
    );
  }

  const prompt = `You are a Facebook content strategist for PageIQ. Generate exactly 5 distinct Facebook post captions optimized for engagement (comments, shares, saves).

Page niche: ${niche}
Post topic: ${topic}

Requirements for each caption:
- Match the niche tone and audience
- Use hooks, curiosity, or clear value in the first line
- Include a light call-to-action where appropriate
- Keep each caption under 280 characters unless the topic needs slightly more
- Vary styles (question, list tease, story hook, bold statement, community prompt)
- No hashtags unless highly relevant (max 2 per caption)

Respond with ONLY valid JSON in this exact shape:
{"captions":["caption 1","caption 2","caption 3","caption 4","caption 5"]}`;

  try {
    const text = await callAnthropic(prompt, 1200);
    const parsed = parseJsonFromModel<CaptionsResponse>(text);

    if (!Array.isArray(parsed.captions) || parsed.captions.length === 0) {
      throw new AnthropicError("Invalid captions format from AI.");
    }

    return NextResponse.json({
      captions: parsed.captions.slice(0, 5),
    });
  } catch (err) {
    const message =
      err instanceof AnthropicError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to generate captions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
