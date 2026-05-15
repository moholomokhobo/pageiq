import { requireUser } from "@/lib/ai-auth";
import { AnthropicError, callAnthropic, parseJsonFromModel } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export type PostingSlot = {
  day: string;
  times: string[];
  note: string;
};

export type PostingScheduleResponse = {
  schedule: PostingSlot[];
  tips: string[];
};

export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const niche = body.niche?.trim();

  if (!niche) {
    return NextResponse.json(
      { error: "Page niche is required." },
      { status: 400 }
    );
  }

  const prompt = `You are a Facebook posting strategist for PageIQ. Create a recommended weekly posting schedule for a Facebook page in this niche: ${niche}

Consider typical audience behavior on Facebook for this niche (when they browse, engage, and share). Use local-time-friendly labels like "9:00 AM" or "7:30 PM".

Provide:
- 5-7 days with specific best posting times (1-3 times per day listed)
- A short note per day explaining why those times work for this niche
- 3-4 general tips for this niche on Facebook

Respond with ONLY valid JSON in this exact shape:
{
  "schedule": [
    {"day": "Monday", "times": ["9:00 AM", "6:00 PM"], "note": "why these times work"}
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}`;

  try {
    const text = await callAnthropic(prompt, 1400);
    const parsed = parseJsonFromModel<PostingScheduleResponse>(text);

    if (!Array.isArray(parsed.schedule) || parsed.schedule.length === 0) {
      throw new AnthropicError("Invalid schedule format from AI.");
    }

    return NextResponse.json({
      schedule: parsed.schedule,
      tips: parsed.tips ?? [],
    });
  } catch (err) {
    const message =
      err instanceof AnthropicError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to generate posting schedule.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
