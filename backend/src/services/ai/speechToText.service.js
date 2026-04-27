import axios from 'axios';
import { logger } from '../../utils/logger.js';

/**
 * Speech to Text Service
 * Converts audio/voice input to text
 */
export class SpeechToTextService {
  /**
   * Convert speech to text using external API
   * You can integrate with Google Cloud Speech-to-Text, Azure, or similar services
   */
  static async convertAudioToText(audioPath) {
    try {
      // This is a placeholder implementation
      // In production, integrate with a real speech-to-text service
      logger.info(`Converting audio file: ${audioPath}`);

      // Example: Using AssemblyAI or similar service
      // const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
      //   audio_url: audioPath,
      // }, {
      //   headers: {
      //     'Authorization': process.env.ASSEMBLYAI_API_KEY
      //   }
      // });

      // Placeholder response
      return 'Transcribed text from audio file';
    } catch (error) {
      logger.error('Speech to text conversion failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if input is audio file
   */
  static isAudioFile(filePath) {
    const audioExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac'];
    return audioExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
  }
}
