import axios from 'axios';
import { aiConfig } from '../../config/ai.config.js';
import { logger } from '../../utils/logger.js';

/**
 * Groq Service - Fast LLM inference
 * Optimized for speed and cost-effectiveness
 */
export class GroqService {
  static async generateAnalysis(prompt) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: aiConfig.groq.model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant AI. Provide preliminary medical analysis based on patient information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: aiConfig.groq.temperature,
        max_tokens: aiConfig.groq.maxTokens,
      }, {
        headers: {
          'Authorization': `Bearer ${aiConfig.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Groq service error:', error.message);
      throw error;
    }
  }

  static async generateChatResponse(prompt) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: aiConfig.groq.model,
        messages: [
          {
            role: 'system',
            content: 'You are a supportive healthcare chatbot. Provide helpful and empathetic responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }, {
        headers: {
          'Authorization': `Bearer ${aiConfig.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Groq chat error:', error.message);
      throw error;
    }
  }

  static async isAvailable() {
    try {
      // Quick test to check if service is available
      await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: aiConfig.groq.model,
        messages: [
          {
            role: 'user',
            content: 'test',
          },
        ],
        max_tokens: 10,
      }, {
        headers: {
          'Authorization': `Bearer ${aiConfig.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
