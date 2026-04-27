import path from 'path';
import { GeminiService } from './gemini.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Image analysis helper for uploaded health photos.
 * This provides a cautious observation summary, not a diagnosis.
 */
export class ImageToTextService {
  static async convertImageToText(imagePath, mimeType = 'image/jpeg') {
    try {
      logger.info(`Analyzing uploaded image: ${imagePath}`);

      const prompt = `
You are a cautious healthcare visual assistant.
Analyze the uploaded image and return a short plain-text observation summary for a patient support chatbot.

Rules:
- Do not diagnose with certainty.
- Mention visible patterns only if reasonably observable.
- Mention image limitations clearly.
- Suggest what type of clinician may be helpful if the image shows something concerning.
- Keep it concise but useful.
`;

      return await GeminiService.analyzeImage({ prompt, imagePath, mimeType });
    } catch (error) {
      logger.warn(`Image AI analysis failed: ${error.message}`);
      return this.buildFallbackObservation(imagePath);
    }
  }

  static buildFallbackObservation(imagePath) {
    const fileName = path.basename(imagePath).toLowerCase();

    if (fileName.includes('rash') || fileName.includes('skin')) {
      return 'The uploaded image may show a skin-related concern. A dermatologist or general physician can assess it more accurately in person.';
    }

    if (fileName.includes('eye')) {
      return 'The uploaded image appears related to the eye area. Consider an ophthalmologist or general physician if symptoms persist or worsen.';
    }

    return 'The uploaded image was received, but a reliable automated visual assessment was limited. Please share symptoms in text and consider a clinician review for accurate evaluation.';
  }

  static isImageFile(filePath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
  }
}
