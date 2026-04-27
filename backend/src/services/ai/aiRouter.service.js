import { GeminiService } from './gemini.service.js';
import { GroqService } from './groq.service.js';
import { HuggingFaceService } from './huggingface.service.js';
import { ImageToTextService } from './imageToText.service.js';
import { aiConfig } from '../../config/ai.config.js';
import { logger } from '../../utils/logger.js';

const AI_PROVIDERS = {
  gemini: GeminiService,
  groq: GroqService,
  huggingface: HuggingFaceService,
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export class AIRouter {
  static async route(prompt, type = 'analysis') {
    const fallbackOrder = aiConfig.fallbackOrder;

    for (const providerName of fallbackOrder) {
      try {
        const provider = AI_PROVIDERS[providerName];
        if (!provider) {
          logger.warn(`Unknown AI provider: ${providerName}`);
          continue;
        }

        logger.debug(`Trying AI provider: ${providerName}`);

        const method = type === 'analysis' ? 'generateAnalysis' : 'generateChatResponse';
        const response = await Promise.race([
          provider[method](prompt),
          this._timeout(aiConfig.timeout),
        ]);

        logger.info(`Successfully used AI provider: ${providerName}`);
        return response;
      } catch (error) {
        logger.warn(`${providerName} failed: ${error.message}`);
      }
    }

    logger.warn('All AI providers failed. Using local fallback response.');
    return this._buildLocalFallback(prompt, type);
  }

  static async generateMedicalAnalysis(prompt) {
    return this.route(prompt, 'analysis');
  }

  static async generateChatResponse(prompt) {
    return this.route(prompt, 'chat');
  }

  static async analyzeUploadedImage({ imagePath, mimeType }) {
    return ImageToTextService.convertImageToText(imagePath, mimeType);
  }

  static parseAnalysisResponse(aiResponse) {
    try {
      const parsedJson = this._extractJson(aiResponse);
      const normalized = this._normalizeAnalysis(parsedJson || this._extractAnalysisFromText(aiResponse));
      return normalized;
    } catch (error) {
      logger.error('Error parsing AI response:', error.message);
      return this._normalizeAnalysis({
        score: 50,
        riskLevel: 'Medium',
        confidence: 0.45,
      summary: aiResponse,
      symptomAnalysis: 'The AI response could not be parsed cleanly, so a fallback summary was stored.',
      likelyCondition: '',
      probableConditions: [],
      documentAnalysis: '',
      riskFactors: [],
      keyFindings: [],
      recommendations: ['Consult a healthcare professional.'],
        medicalAdvice: 'Please consult a healthcare professional.',
        urgentCare: 'Seek urgent care if symptoms worsen suddenly.',
        followUpTests: [],
        suggestedMedicines: [],
        sentiment: 0,
      });
    }
  }

  static _extractJson(text) {
    if (!text) return null;

    const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    const rawJson = fencedMatch?.[1] || text.match(/\{[\s\S]*\}/)?.[0];

    if (!rawJson) {
      return null;
    }

    return JSON.parse(rawJson);
  }

  static _extractAnalysisFromText(text) {
    return {
      score: this._extractNumber(text, /score[:\s]*(\d+)/i),
      riskLevel: this._extractRiskLevel(text),
      confidence: this._extractDecimal(text, /confidence[:\s]*(0?\.\d+|1(?:\.0+)?)/i, 0.5),
      summary: this._extractSection(text, /summary[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      symptomAnalysis: this._extractSection(text, /symptom analysis[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      likelyCondition: this._extractSection(text, /likely condition[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      probableConditions: this._extractBulletList(text, /probable conditions[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      documentAnalysis: this._extractSection(text, /document analysis[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      riskFactors: this._extractBulletList(text, /risk factors[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      keyFindings: this._extractBulletList(text, /key findings[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      recommendations: this._extractBulletList(text, /recommendations[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      medicalAdvice: this._extractSection(text, /medical advice[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      urgentCare: this._extractSection(text, /urgent care[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      followUpTests: this._extractBulletList(text, /follow[- ]?up tests[:\s]*([\s\S]*?)(?=\n\s*[A-Z][a-zA-Z ]+:|$)/i),
      suggestedMedicines: this._extractMedicines(text),
      sentiment: this._extractDecimal(text, /sentiment[:\s]*(-?\d+(?:\.\d+)?)/i, 0),
    };
  }

  static _normalizeAnalysis(data = {}) {
    const normalizedScore = clamp(Number.isFinite(Number(data.score)) ? Number(data.score) : 50);
    const normalizedRiskLevel = ['Low', 'Medium', 'High'].includes(data.riskLevel)
      ? data.riskLevel
      : this._extractRiskLevel(`${data.riskLevel || ''} ${normalizedScore >= 70 ? 'high risk' : normalizedScore >= 40 ? 'medium risk' : 'low risk'}`);

    return {
      score: Math.round(normalizedScore),
      riskLevel: normalizedRiskLevel,
      confidence: clamp(Number(data.confidence ?? 0.6), 0, 1),
      summary: String(data.summary || '').trim(),
      symptomAnalysis: String(data.symptomAnalysis || '').trim(),
      likelyCondition: String(data.likelyCondition || '').trim(),
      probableConditions: this._normalizeArray(data.probableConditions),
      documentAnalysis: String(data.documentAnalysis || '').trim(),
      riskFactors: this._normalizeArray(data.riskFactors),
      keyFindings: this._normalizeArray(data.keyFindings),
      recommendations: this._normalizeArray(data.recommendations),
      medicalAdvice: String(data.medicalAdvice || '').trim(),
      urgentCare: String(data.urgentCare || '').trim(),
      followUpTests: this._normalizeArray(data.followUpTests),
      suggestedMedicines: this._normalizeMedicines(data.suggestedMedicines),
      sentiment: clamp(Number(data.sentiment ?? 0), -1, 1),
    };
  }

  static _normalizeArray(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/\n|,|;/)
        .map((item) => item.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  static _normalizeMedicines(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((medicine) => ({
        name: String(medicine?.name || '').trim(),
        dosage: String(medicine?.dosage || '').trim(),
        frequency: String(medicine?.frequency || '').trim(),
        reason: String(medicine?.reason || '').trim(),
      }))
      .filter((medicine) => medicine.name);
  }

  static _extractNumber(text, regex) {
    const match = text?.match(regex);
    return match ? parseInt(match[1], 10) : 50;
  }

  static _extractDecimal(text, regex, fallback = 0) {
    const match = text?.match(regex);
    return match ? Number(match[1]) : fallback;
  }

  static _extractRiskLevel(text) {
    if ((text || '').match(/high\s+risk/i)) return 'High';
    if ((text || '').match(/medium\s+risk|moderate/i)) return 'Medium';
    return 'Low';
  }

  static _extractSection(text, regex) {
    const match = text?.match(regex);
    return match ? match[1].trim() : '';
  }

  static _extractBulletList(text, regex) {
    const section = this._extractSection(text, regex);
    return this._normalizeArray(section);
  }

  static _extractMedicines(text) {
    const medicines = [];
    const medicineRegex = /(?:medicine|medication|drug)[:\s]*([^\n]+)/gi;
    let match;
    while ((match = medicineRegex.exec(text || '')) !== null) {
      medicines.push({
        name: match[1].trim(),
        dosage: 'As prescribed',
        frequency: 'As directed',
        reason: 'Mentioned in the generated analysis',
      });
    }
    return medicines;
  }

  static _timeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
  }

  static _buildLocalFallback(prompt, type) {
    return type === 'analysis'
      ? JSON.stringify(this._buildLocalAnalysis(prompt))
      : this._buildLocalChat(prompt);
  }

  static _buildLocalAnalysis(prompt) {
    const loweredPrompt = (prompt || '').toLowerCase();
    const severeMatches = HIGH_IMPACT_TERMS.filter((keyword) => loweredPrompt.includes(keyword)).length;
    const moderateMatches = MODERATE_IMPACT_TERMS.filter((keyword) => loweredPrompt.includes(keyword)).length;
    const score = clamp(18 + severeMatches * 14 + moderateMatches * 6, 0, 94);
    const riskLevel = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';

    return {
      score,
      riskLevel,
      confidence: 0.58,
      sentiment: riskLevel === 'High' ? -0.7 : riskLevel === 'Medium' ? -0.35 : 0.15,
      summary:
        'A fallback analysis was generated because no external AI provider returned a usable result. The report still considers the submitted symptoms and assessment details.',
      symptomAnalysis:
        'The symptom description and form answers suggest that follow-up medical review is appropriate. Severity increases when multiple persistent or urgent warning signs appear together.',
      likelyCondition: 'A general clinical review is recommended before naming a likely condition.',
      probableConditions: [],
      documentAnalysis: 'The uploaded file context was limited in the fallback analysis, so the summary relies mainly on the symptom description and form details.',
      riskFactors: this._fallbackList(loweredPrompt),
      keyFindings: [
        'Symptom text and questionnaire responses were both considered.',
        'Risk level was estimated from urgency-related keywords and patient context.',
        'Professional medical review is still recommended.'
      ],
      recommendations: riskLevel === 'High'
        ? [
            'Seek urgent medical care as soon as possible.',
            'Do not delay evaluation if symptoms worsen.',
            'Bring previous reports or uploaded documents to the consultation.'
          ]
        : [
            'Arrange a doctor consultation for a full clinical review.',
            'Monitor symptoms and note any worsening patterns.',
            'Stay hydrated and avoid self-medicating without guidance.'
          ],
      medicalAdvice:
        riskLevel === 'High'
          ? 'This report suggests significant concern. Immediate or urgent medical attention is recommended.'
          : 'This report suggests a non-emergency but important need for medical follow-up and symptom monitoring.',
      urgentCare:
        'Go to urgent care or the emergency department if breathing becomes difficult, severe pain starts, bleeding occurs, or consciousness changes.',
      followUpTests: ['Doctor evaluation', 'Laboratory review if clinically indicated'],
      suggestedMedicines: [],
    };
  }

  static _fallbackList(text) {
    const terms = [...HIGH_IMPACT_TERMS, ...MODERATE_IMPACT_TERMS]
      .filter((keyword) => text.includes(keyword))
      .slice(0, 5);

    return terms.length ? terms : ['reported symptom pattern', 'questionnaire response pattern'];
  }

  static _buildLocalChat(prompt) {
    const loweredPrompt = (prompt || '').toLowerCase();
    const noReportContext = loweredPrompt.includes('no prior report available');
    const riskLevelMatch = prompt?.match(/Risk level:\s*([A-Za-z]+)/i);
    const riskLevel = riskLevelMatch?.[1] || 'Unknown';
    const diseaseMatch = prompt?.match(/Disease context:\s*(.+)/i);
    const disease = diseaseMatch?.[1]?.split('\n')?.[0]?.trim() || 'general health';
    const recommendationsMatch = prompt?.match(/Recommendations:\s*(.+)/i);
    const recommendations = recommendationsMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const riskFactorsMatch = prompt?.match(/Risk factors:\s*(.+)/i);
    const riskFactors = riskFactorsMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const keyFindingsMatch = prompt?.match(/Key findings:\s*(.+)/i);
    const keyFindings = keyFindingsMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const followUpTestsMatch = prompt?.match(/Follow-up tests:\s*(.+)/i);
    const followUpTests = followUpTestsMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const medicalAdviceMatch = prompt?.match(/Medical advice:\s*(.+)/i);
    const medicalAdvice = medicalAdviceMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const urgentCareMatch = prompt?.match(/Urgent care guidance:\s*(.+)/i);
    const urgentCare = urgentCareMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const symptomSummaryMatch = prompt?.match(/Symptoms summary:\s*([\s\S]*?)\nRisk factors:/i);
    const symptomSummary = symptomSummaryMatch?.[1]?.trim() || '';
    const imageSummaryMatch = prompt?.match(/Image analysis summary:\s*(.+)/i);
    const imageSummary = imageSummaryMatch?.[1]?.split('\n')?.[0]?.trim() || '';
    const userQuestionMatch = prompt?.match(/User question:\s*([\s\S]*?)$/i);
    const userQuestion = userQuestionMatch?.[1]?.trim() || '';

    if (
      loweredPrompt.includes('how do i use this website') ||
      loweredPrompt.includes('dashboard') ||
      loweredPrompt.includes('history page') ||
      loweredPrompt.includes('assessment') ||
      loweredPrompt.includes('upload') ||
      loweredPrompt.includes('pdf') ||
      loweredPrompt.includes('login') ||
      loweredPrompt.includes('register') ||
      loweredPrompt.includes('website help')
    ) {
      return 'You can use this website in a simple flow: register or log in, open the dashboard, choose a disease or the general analysis option, fill in symptoms and personal details, upload a photo or document if needed, then wait for the report page. After that, you can review your score, risk level, recommendations, and history, and use the chatbot for follow-up questions.';
    }

    if (loweredPrompt.includes('emergency') || loweredPrompt.includes('difficulty breathing') || loweredPrompt.includes('chest pain')) {
      return 'Those symptoms can be urgent. Please seek immediate medical care or contact emergency services right away.';
    }

    if (loweredPrompt.includes('risk level') || loweredPrompt.includes('how urgent')) {
      return `Your current report indicates a ${riskLevel} risk level for ${disease}. That means the submitted symptoms and answers should be interpreted with care.${riskLevel === 'High' ? ' The report suggests urgent medical review if symptoms are worsening.' : ' The report suggests timely medical follow-up rather than ignoring the symptoms.'}\n\nMain drivers in the report: ${riskFactors || keyFindings || symptomSummary || 'the submitted symptoms and questionnaire responses'}.\n\nRecommended next steps: ${recommendations || medicalAdvice || 'Please consult a healthcare professional for proper evaluation.'}`;
    }

    if (loweredPrompt.includes('score') || loweredPrompt.includes('why') || loweredPrompt.includes('what does this mean')) {
      return `The score reflects the overall concern level estimated from your symptoms, questionnaire answers, and any additional report context. It is not a final diagnosis, but it helps describe how much caution is needed.\n\nFor ${disease}, the report highlights: ${keyFindings || riskFactors || symptomSummary || 'the pattern of symptoms you submitted'}.\n\nSuggested next actions: ${recommendations || medicalAdvice || 'Review the report carefully and discuss it with a licensed healthcare professional.'}${followUpTests && followUpTests !== 'Not provided' ? `\n\nPossible follow-up checks mentioned in the report: ${followUpTests}.` : ''}`;
    }

    if (loweredPrompt.includes('medicine') || loweredPrompt.includes('treatment') || loweredPrompt.includes('what should i do')) {
      return `Based on the report context for ${disease}, the safest next step is to follow the care advice already identified: ${medicalAdvice || recommendations || 'arrange a professional medical evaluation.'}\n\nIf symptoms are getting worse, use the urgent-care guidance from the report: ${urgentCare || 'seek urgent medical attention if severe symptoms develop.'}\n\nPlease avoid treating this as a confirmed diagnosis without a licensed clinician.`;
    }

    if (imageSummary && imageSummary !== 'No uploaded image' && (loweredPrompt.includes('photo') || loweredPrompt.includes('image') || loweredPrompt.includes('upload'))) {
      return `From the uploaded image, this is the cautious observation available: ${imageSummary} This is not a diagnosis, so please consult a healthcare professional if the area is painful, worsening, or persistent.`;
    }

    if (noReportContext) {
      return `I can help with website guidance, health-report questions, and general informational questions. About your question${userQuestion ? ` "${userQuestion}"` : ''}, I do not have a saved report loaded right now, so I am answering in general guidance mode. If you want report-specific help, open a saved report first or ask about how to use the website flow.`;
    }

    return `Here is a report-based answer to your question${userQuestion ? `: "${userQuestion}"` : ''}.\n\nFor ${disease}, the current report suggests: ${symptomSummary || 'a symptom review is needed.'}\nImportant findings: ${keyFindings || riskFactors || 'the report identified symptom and questionnaire patterns that need attention.'}\nRecommended next steps: ${recommendations || medicalAdvice || 'consult a healthcare professional for tailored guidance.'}\n\nUrgent-care note: ${urgentCare || 'Seek urgent medical support if symptoms suddenly worsen.'}\n\nIf you want, you can ask more follow-up questions about the score, symptoms, treatment guidance, warnings, or image findings, and I will keep answering from the report context.`;
  }
}

const HIGH_IMPACT_TERMS = [
  'chest pain',
  'difficulty breathing',
  'fainting',
  'bleeding',
  'tumor',
  'lump',
  'persistent fever',
  'unexplained weight loss',
  'rapid weight loss',
  'severe pain'
];

const MODERATE_IMPACT_TERMS = [
  'fever',
  'rash',
  'vomiting',
  'fatigue',
  'infection',
  'dizziness',
  'swelling',
  'pain',
  'allergy',
  'weakness'
];
