import axios from 'axios';
import { aiConfig } from '../../config/ai.config.js';
import { logger } from '../../utils/logger.js';

/**
 * HuggingFace Service - Open-Source LLM Models
 * Final backup for reliable inference
 */
export class HuggingFaceService {
  static async generateAnalysis(prompt) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${aiConfig.huggingface.model}`,
        {
          inputs: prompt,
          parameters: {
            max_length: aiConfig.huggingface.maxTokens,
            temperature: aiConfig.huggingface.temperature,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${aiConfig.huggingface.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // HuggingFace returns an array
      if (Array.isArray(response.data)) {
        return response.data[0]?.generated_text || response.data[0]?.summary_text || '';
      }

      return response.data.generated_text || '';
    } catch (error) {
      logger.error('HuggingFace service error:', error.message);
      throw error;
    }
  }

  static async generateChatResponse(prompt) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${aiConfig.huggingface.model}`,
        {
          inputs: prompt,
          parameters: {
            max_length: 500,
            temperature: 0.7,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${aiConfig.huggingface.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (Array.isArray(response.data)) {
        return response.data[0]?.generated_text || response.data[0]?.summary_text || '';
      }

      return response.data.generated_text || '';
    } catch (error) {
      logger.error('HuggingFace chat error:', error.message);
      throw error;
    }
  }

  static async isAvailable() {
    try {
      // Quick test to check if service is available
      await axios.post(
        `https://api-inference.huggingface.co/models/${aiConfig.huggingface.model}`,
        {
          inputs: 'test',
        },
        {
          headers: {
            'Authorization': `Bearer ${aiConfig.huggingface.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch {
      return false;
    }
  }
}
