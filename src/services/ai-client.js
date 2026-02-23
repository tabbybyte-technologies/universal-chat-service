import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { config } from '../config.js';

const provider = createOpenAICompatible({
  name: 'docker-model-runner',
  baseURL: config.modelBaseUrl,
});

export async function generateReply(message) {
  const { text } = await generateText({
    model: provider.chatModel(config.modelId),
    system: config.systemInstruction,
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
  });

  return text;
}
