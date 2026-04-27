/**
 * Prompt Builder - Creates structured prompts for medical analysis
 */

const serializeAnswers = (answers = {}, questions = []) => {
  if (!Object.keys(answers).length) {
    return 'No questionnaire answers provided.';
  }

  const questionMap = new Map(
    questions.map((question) => [question._id?.toString?.() || String(question._id), question.question])
  );

  return Object.entries(answers)
    .map(([key, value], index) => {
      const questionText = questionMap.get(key) || `Question ${index + 1}`;
      return `- ${questionText}: ${value}`;
    })
    .join('\n');
};

const WEBSITE_CONTEXT = `
Website name: AI Health Report Generator.
Main capabilities:
- Home page explains the platform and overall report flow.
- Users can register, log in, and access a personal dashboard.
- Dashboard lets users choose a disease assessment or start the "Analyze any disease and my condition" flow.
- Assessment forms collect symptoms, questionnaire answers, personal details, and uploaded photos or medical documents.
- Processing page shows report generation progress.
- Report page shows score, risk level, summary, findings, recommendations, follow-up tests, and PDF download when available.
- History page gives access to previous reports.
- Floating chatbot helps with website questions, report interpretation, and general user questions.
- Admin users have separate login, dashboard, and reports management screens.
Supported disease-focused flows include Cancer, Allergy, Malaria, Diabetes, HIV, and AIDS.
`;

const formatConversationHistory = (conversationHistory = []) =>
  conversationHistory.length
    ? conversationHistory.map((entry) => `- ${entry.sender}: ${entry.message}`).join('\n')
    : 'No recent conversation history.';

export const buildReportChatContext = (report, overrides = {}) => {
  const previousAnalysisSummary = [
    `Disease: ${report.disease}`,
    `Score: ${report.aiAnalysis?.score ?? 'Unknown'}`,
    `Risk: ${report.aiAnalysis?.riskLevel || 'Unknown'}`,
    `Summary: ${report.aiAnalysis?.summary || 'Not available'}`,
    `Symptom analysis: ${report.aiAnalysis?.symptomAnalysis || report.symptoms || 'Not available'}`,
    `Medical advice: ${report.aiAnalysis?.medicalAdvice || 'Not available'}`,
    `Urgent care: ${report.aiAnalysis?.urgentCare || 'Not available'}`,
  ].join(', ');

  return {
    disease: report.disease,
    previousAnalysis: previousAnalysisSummary,
    riskLevel: report.aiAnalysis?.riskLevel,
    score: report.aiAnalysis?.score,
    recommendations: report.aiAnalysis?.recommendations || [],
    riskFactors: report.aiAnalysis?.riskFactors || [],
    keyFindings: report.aiAnalysis?.keyFindings || [],
    followUpTests: report.aiAnalysis?.followUpTests || [],
    medicalAdvice: report.aiAnalysis?.medicalAdvice || '',
    urgentCare: report.aiAnalysis?.urgentCare || '',
    symptomSummary: report.aiAnalysis?.symptomAnalysis || report.symptoms,
    conversationHistory: (report.chatHistory || []).slice(-6).map((entry) => ({
      sender: entry.sender === 'user' ? 'User' : 'Assistant',
      message: entry.message,
    })),
    ...overrides,
  };
};

export const buildMedicalAnalysisPrompt = ({
  disease,
  symptoms,
  answers,
  personalDetails,
  questions = [],
  documentAnalysis = '',
  analysisMode = 'disease-specific',
  baseScore,
  questionnaireScore,
  symptomScore,
}) => {
  return `
You are an expert clinical AI assistant creating a detailed preliminary health report.

Analyze the following patient information carefully:

DISEASE AREA:
${disease}

ANALYSIS MODE:
${analysisMode}

PATIENT SYMPTOMS:
${symptoms}

UPLOADED FILE CONTEXT:
${documentAnalysis || 'No uploaded file context provided.'}

PERSONAL DETAILS:
- Age: ${personalDetails.age || 'Not provided'}
- Gender: ${personalDetails.gender || 'Not provided'}
- Weight: ${personalDetails.weight || 'Not provided'}
- Height: ${personalDetails.height || 'Not provided'}
- Blood Type: ${personalDetails.bloodType || 'Not provided'}
- Medical History: ${personalDetails.medicalHistory || 'Not provided'}

QUESTIONNAIRE RESPONSES:
${serializeAnswers(answers, questions)}

RULE-BASED SCORING CONTEXT:
- Questionnaire Score: ${questionnaireScore}
- Symptom Score: ${symptomScore}
- Preliminary Base Score: ${baseScore}

Return ONLY valid JSON. Do not include markdown fences.
Use this exact structure:
{
  "score": 0,
  "riskLevel": "Low",
  "confidence": 0.0,
  "sentiment": 0.0,
  "summary": "2-4 sentence overview",
  "symptomAnalysis": "Detailed analysis of the symptom pattern and likely concern areas",
  "likelyCondition": "Most likely condition or disease area in cautious terms",
  "probableConditions": ["possible condition 1", "possible condition 2"],
  "documentAnalysis": "How the uploaded photo/report influenced the assessment",
  "riskFactors": ["factor 1", "factor 2"],
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "medicalAdvice": "Practical medical guidance and caution notes",
  "urgentCare": "Clear note on when urgent or immediate care is needed",
  "followUpTests": ["test 1", "test 2"],
  "suggestedMedicines": [
    {
      "name": "medicine name",
      "dosage": "dosage",
      "frequency": "frequency",
      "reason": "why it may help"
    }
  ]
}

Rules:
- Score must be an integer from 0 to 100.
- Risk level must match the score severity.
- Base the result on all submitted information, not on symptoms alone.
- Be medically cautious and avoid claiming a definitive diagnosis.
- If the analysis mode is "general-condition", identify the most likely condition area and list a few probable conditions based on the uploaded file context and symptoms.
- If the uploaded file is a photo or report, explain how it influenced the assessment inside "documentAnalysis".
- If medicine suggestions are uncertain, return an empty array instead of guessing.
`;
};

export const buildChatbotPrompt = ({
  disease,
  previousAnalysis,
  userMessage,
  riskLevel,
  score,
  recommendations = [],
  riskFactors = [],
  keyFindings = [],
  followUpTests = [],
  medicalAdvice = '',
  urgentCare = '',
  symptomSummary = '',
  imageSummary = '',
  conversationHistory = [],
}) => {
  return `
You are the live assistant inside the AI Health Report Generator website.

You help with three kinds of questions:
1. Website help: explain how to use pages, features, uploads, reports, history, login, dashboard, and admin areas.
2. Report help: explain the user's score, risk level, findings, image summary, recommendations, urgency, and next steps.
3. General user questions: answer normal informational questions helpfully even when they are not about the website.

WEBSITE CONTEXT:
${WEBSITE_CONTEXT.trim()}

Disease context: ${disease}
Previous analysis: ${previousAnalysis}
Risk level: ${riskLevel || 'Unknown'}
Score: ${score ?? 'Unknown'}
Symptoms summary: ${symptomSummary || 'Not provided'}
Risk factors: ${riskFactors.length ? riskFactors.join(', ') : 'Not provided'}
Key findings: ${keyFindings.length ? keyFindings.join(', ') : 'Not provided'}
Recommendations: ${recommendations.length ? recommendations.join(', ') : 'Not provided'}
Follow-up tests: ${followUpTests.length ? followUpTests.join(', ') : 'Not provided'}
Medical advice: ${medicalAdvice || 'Not provided'}
Urgent care guidance: ${urgentCare || 'Not provided'}
Image analysis summary: ${imageSummary || 'No uploaded image'}
Recent conversation:
${formatConversationHistory(conversationHistory)}

User question: ${userMessage}

Response rules:
- First identify whether the user is asking about the website, the health report, or a general question, then answer that directly.
- Use the report context when it is relevant. If no report context is available, say that clearly and continue with general help.
- For website questions, answer from the WEBSITE CONTEXT above and do not invent unsupported features.
- For general non-medical questions, answer normally in a concise and friendly way instead of refusing.
- For medical questions, stay cautious, avoid claiming a definitive diagnosis, and explain practical next steps.
- If the user asks about urgency, explain the current risk level and any warning signs clearly.
- If the user asks what the score means, break down symptoms, risk factors, findings, and likely next steps.
- If an uploaded image summary exists, include it when relevant.
- If the user asks for live/current web data that is not in the provided context, say you cannot verify live internet information from this app.
- Keep the answer concise, helpful, and empathetic. Use 2-5 short paragraphs or compact bullet points when useful.
- For serious medical concerns, remind the user to consult a healthcare professional or urgent care when appropriate.
`;
};

export const buildDoctorRecommendationPrompt = (disease, symptoms, score) => {
  return `
Based on the following medical information, recommend the type of doctors the patient should consult:

Disease: ${disease}
Symptoms: ${symptoms}
Health Score: ${score}

Recommend:
1. Primary specialist
2. Secondary specialists if needed
3. Urgency of consultation
`;
};
