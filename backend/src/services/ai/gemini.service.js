import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiConfig } from '../../config/ai.config.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey);

export class GeminiService {
  static async generateAnalysis(prompt) {
    try {
      const model = genAI.getGenerativeModel({ model: aiConfig.gemini.model });

      const result = await model.generateContent(prompt);
      const response = result.response;

      return response.text();
    } catch (error) {
      logger.error('Gemini service error:', error.message);
      throw error;
    }
  }

  static async generateChatResponse(prompt) {
    try {
      const model = genAI.getGenerativeModel({ model: aiConfig.gemini.model });

      const result = await model.generateContent(prompt);
      const response = result.response;

      return response.text();
    } catch (error) {
      logger.error('Gemini chat error:', error.message);
      throw error;
    }
  }

  static async analyzeImage({ prompt, imagePath, mimeType = 'image/jpeg' }) {
    try {
      const model = genAI.getGenerativeModel({ model: aiConfig.gemini.model });
      const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ]);

      return result.response.text();
    } catch (error) {
      logger.error('Gemini image analysis error:', error.message);
      throw error;
    }
  }

  static async isAvailable() {
    try {
      // Quick test to check if service is available
      const model = genAI.getGenerativeModel({ model: aiConfig.gemini.model });
      await model.generateContent('test');
      return true;
    } catch {
      return false;
    }
  }
}
