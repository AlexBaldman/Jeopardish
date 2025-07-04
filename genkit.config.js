import { defineConfig } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export default defineConfig({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      defaultModel: 'gemini-pro'
    })
  ]
});
