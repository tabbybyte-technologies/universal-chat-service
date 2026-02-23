import { generateText, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { config } from "../config.js";

const provider = createOpenAICompatible({
  name: "docker-model-runner",
  baseURL: config.modelBaseUrl,
});

/**
 * Build model params from a history array (already includes the latest user message).
 * @param {Array<{role: string, content: string}>} messages
 */
const modelParams = (messages) => ({
  model: provider.chatModel(config.modelId),
  system: config.systemInstruction,
  messages,
});

/**
 * @param {Array<{role: string, content: string}>} messages
 */
export async function generateReply(messages) {
  const { text } = await generateText(modelParams(messages));
  return text;
}

/**
 * @param {Array<{role: string, content: string}>} messages
 */
export function streamReply(messages) {
  const { textStream } = streamText(modelParams(messages));
  return textStream;
}
