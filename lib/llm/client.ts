// ═══════════════════════════════════════════════
// CLAUDE API CLIENT — Wrapper for Anthropic SDK
// ═══════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
// Full analyses run ~15–25K output tokens; streaming lets us go high without HTTP timeouts.
const MAX_TOKENS = 64000;

/**
 * Call Claude with a prompt and return the text response.
 * Streams under the hood; `onProgress` receives the number of characters generated so far.
 */
export async function callClaude(
  prompt: string,
  apiKey: string,
  onProgress?: (chars: number) => void
): Promise<string> {
  const client = new Anthropic({ apiKey });

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "low" },
      // Re-run on a fallback model if a safety classifier declines the request
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: prompt }],
    });

    let chars = 0;
    stream.on("text", (delta) => {
      chars += delta.length;
      onProgress?.(chars);
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new Error("Claude declined to analyze this repository.");
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "The analysis was too long and got cut off. Try a smaller repository."
      );
    }

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    if (!text) {
      throw new Error("No text response from Claude");
    }

    return text;
  } catch (error: unknown) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error(
        "Invalid API key. Please check your Claude API key and try again."
      );
    }
    if (error instanceof Anthropic.PermissionDeniedError) {
      throw new Error(
        "This API key doesn't have access to the model. Check your Anthropic Console plan and credits."
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Rate limited. Please wait a moment and try again.");
    }
    if (error instanceof Anthropic.APIError) {
      if (error.status === 529) {
        throw new Error(
          "Claude is currently overloaded. Please try again in a few minutes."
        );
      }
      throw new Error(`Claude API error: ${error.message}`);
    }
    throw error;
  }
}
