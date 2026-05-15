const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "AnthropicError";
  }
}

export async function callAnthropic(
  prompt: string,
  maxTokens = 1500
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicError(
      "Anthropic API key is not configured. Add ANTHROPIC_API_KEY to .env.local."
    );
  }

  const model =
    process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };

  if (!response.ok) {
    throw new AnthropicError(
      data.error?.message ?? "Anthropic API request failed.",
      response.status
    );
  }

  const text = data.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new AnthropicError("Empty response from Anthropic API.");
  }

  return text;
}

export function parseJsonFromModel<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new AnthropicError("Could not parse AI response as JSON.");
  }
}
