import { envConfig } from './env.js';

export const aiConfig = {
  gemini: {
    apiKey: envConfig.geminiApiKey,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1024,
  },
  
  groq: {
    apiKey: envConfig.groqApiKey,
    model: 'mixtral-8x7b-32768',
    temperature: 0.7,
    maxTokens: 1024,
  },
  
  huggingface: {
    apiKey: envConfig.huggingfaceApiKey,
    model: 'mistralai/Mistral-7B-Instruct-v0.1',
    temperature: 0.7,
    maxTokens: 1024,
  },
  
  // Fallback order: Gemini (Primary) -> Groq (Fast) -> HuggingFace (Backup)
  fallbackOrder: ['gemini', 'groq', 'huggingface'],
  
  // Timeout for each AI service (ms)
  timeout: 30000,
};
