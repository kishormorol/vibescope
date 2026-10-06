// ═══════════════════════════════════════════════
// CLAUDE API CLIENT — Wrapper for Anthropic SDK
// ═══════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

/**
 * Call Claude with a prompt and return the text response.
 */
export async function callClaude(
  prompt: string,
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return textBlock.text;
  } catch (error: unknown) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        throw new Error(
          "Invalid API key. Please check your Claude API key and try again."
        );
      }
      if (error.status === 429) {
        throw new Error(
          "Rate limited. Please wait a moment and try again."
        );
      }
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
