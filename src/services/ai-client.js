import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { config } from '../config.js';

const provider = createOpenAICompatible({
  name: 'llama-cpp',
  baseURL: config.llamaBaseUrl,
  apiKey: config.llamaApiKey,
});

export async function generateReply(message) {
  const { text } = await generateText({
    model: provider.chatModel(config.llamaModel),
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
