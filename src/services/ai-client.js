import { generateText, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { config } from "../config.js";

const provider = createOpenAICompatible({
  name: "docker-model-runner",
  baseURL: config.modelBaseUrl,
});

const modelParams = (message) => ({
  model: provider.chatModel(config.modelId),
  system: config.systemInstruction,
  messages: [{ role: "user", content: message }],
});

export async function generateReply(message) {
  const { text } = await generateText(modelParams(message));
  return text;
}

export function streamReply(message) {
  const { textStream } = streamText(modelParams(message));
  return textStream;
}
