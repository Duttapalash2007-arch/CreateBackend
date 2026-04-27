/**
 * Score Calculator
 * Builds a more reliable 0-100 score from questionnaire answers, symptom text,
 * personal details, and AI output.
 */

const HIGH_RISK_PHRASES = [
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'fainting',
  'loss of consciousness',
  'seizure',
  'bleeding',
  'blood in stool',
  'blood in urine',
  'rapid weight loss',
  'unexplained weight loss',
  'persistent fever',
  'high fever',
  'severe pain',
  'vision loss',
  'paralysis',
  'confusion',
  'lump',
  'tumor',
  'ulcer',
  'night sweats'
];

const MODERATE_RISK_PHRASES = [
  'fever',
  'fatigue',
  'vomiting',
  'nausea',
  'dizziness',
  'rash',
  'swelling',
  'infection',
  'cough',
  'headache',
  'weight loss',
  'frequent urination',
  'thirst',
  'blurred vision',
  'weakness',
  'pain',
  'itching',
  'allergy',
  'chills'
];

const LOW_RISK_ANSWER_TERMS = ['no', 'none', 'never', 'mild', 'rarely', 'normal'];
const HIGH_RISK_ANSWER_TERMS = ['yes', 'severe', 'frequent', 'persistent', 'often', 'positive', 'high'];

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value);
const normalize = (value) => String(value || '').trim().toLowerCase();

const severityBase = (severity = 'medium') => {
  if (severity === 'high') return 22;
  if (severity === 'low') return 10;
  return 16;
};

const inferAnswerRisk = (answer, severity = 'medium') => {
  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer) return 0;

  const base = severityBase(severity);

  if (HIGH_RISK_ANSWER_TERMS.some((term) => normalizedAnswer.includes(term))) {
    return base;
  }

  if (LOW_RISK_ANSWER_TERMS.some((term) => normalizedAnswer.includes(term))) {
    return round(base * 0.2);
  }

  return round(base * 0.55);
};

const buildContributingFactors = ({ symptoms, personalDetails, answers }) => {
  const factors = [];
  const normalizedSymptoms = normalize(symptoms);

  HIGH_RISK_PHRASES.forEach((phrase) => {
    if (normalizedSymptoms.includes(phrase) && !factors.includes(phrase)) {
      factors.push(phrase);
    }
  });

  if (personalDetails?.age >= 60 || personalDetails?.age <= 5) {
    factors.push(`age-related risk (${personalDetails.age})`);
  }

  if (personalDetails?.medicalHistory) {
    factors.push('medical history provided');
  }

  Object.values(answers || {}).forEach((answer) => {
    const normalizedAnswer = normalize(answer);
    if (HIGH_RISK_ANSWER_TERMS.some((term) => normalizedAnswer.includes(term))) {
      factors.push(`questionnaire response: ${answer}`);
    }
  });

  return [...new Set(factors)].slice(0, 6);
};

export const calculateQuestionnaireScore = (answers = {}, questions = []) => {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let answeredQuestions = 0;

  if (questions.length) {
    questions.forEach((question) => {
      const answer =
        answers[question._id?.toString?.()] ??
        answers[question._id] ??
        answers[question.question] ??
        answers[`fallback-${question.questionNumber}`];

      if (!answer) {
        return;
      }

      answeredQuestions += 1;

      const options = Array.isArray(question.options) ? question.options : [];
      if (options.length) {
        const selectedOption = options.find((option) => normalize(option.text) === normalize(answer));
        const questionMax = Math.max(...options.map((option) => option.score || 0), severityBase(question.severity));

        totalScore += selectedOption ? selectedOption.score || 0 : inferAnswerRisk(answer, question.severity);
        maxPossibleScore += questionMax;
      } else {
        totalScore += inferAnswerRisk(answer, question.severity);
        maxPossibleScore += severityBase(question.severity);
      }
    });
  }

  if (!answeredQuestions) {
    const answersList = Object.values(answers || {}).filter(Boolean);
    answersList.forEach((answer) => {
      totalScore += inferAnswerRisk(answer, 'medium');
      maxPossibleScore += severityBase('medium');
    });
    answeredQuestions = answersList.length;
  }

  const score = maxPossibleScore > 0 ? round((totalScore / maxPossibleScore) * 100) : 0;

  return {
    score: clamp(score),
    answeredQuestions,
  };
};

export const calculateSymptomScore = (symptoms = '', personalDetails = {}, answers = {}) => {
  const normalizedSymptoms = normalize(symptoms);
  if (!normalizedSymptoms) {
    return {
      score: 0,
      contributingFactors: [],
    };
  }

  let score = 14;

  HIGH_RISK_PHRASES.forEach((phrase) => {
    if (normalizedSymptoms.includes(phrase)) {
      score += 12;
    }
  });

  MODERATE_RISK_PHRASES.forEach((phrase) => {
    if (normalizedSymptoms.includes(phrase)) {
      score += 5;
    }
  });

  const symptomSentenceCount = symptoms
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean).length;

  score += Math.min(12, symptomSentenceCount * 2);

  if (personalDetails?.age >= 60 || personalDetails?.age <= 5) {
    score += 8;
  }

  if (personalDetails?.medicalHistory) {
    score += 6;
  }

  if (personalDetails?.weight && personalDetails?.height) {
    const bmi = personalDetails.weight / ((personalDetails.height / 100) ** 2);
    if (Number.isFinite(bmi) && (bmi >= 30 || bmi < 18.5)) {
      score += 5;
    }
  }

  const highRiskAnswersCount = Object.values(answers || {}).filter((answer) =>
    HIGH_RISK_ANSWER_TERMS.some((term) => normalize(answer).includes(term))
  ).length;

  score += Math.min(12, highRiskAnswersCount * 3);

  return {
    score: clamp(score),
    contributingFactors: buildContributingFactors({ symptoms, personalDetails, answers }),
  };
};

export const calculateAssessmentScore = ({
  answers = {},
  questions = [],
  symptoms = '',
  personalDetails = {},
}) => {
  const questionnaire = calculateQuestionnaireScore(answers, questions);
  const symptom = calculateSymptomScore(symptoms, personalDetails, answers);

  let baseScore = 0;

  if (questionnaire.answeredQuestions > 0 && symptom.score > 0) {
    baseScore = round(questionnaire.score * 0.48 + symptom.score * 0.52);
  } else if (questionnaire.answeredQuestions > 0) {
    baseScore = questionnaire.score;
  } else {
    baseScore = symptom.score;
  }

  return {
    baseScore: clamp(baseScore),
    questionnaireScore: questionnaire.score,
    symptomScore: symptom.score,
    answeredQuestions: questionnaire.answeredQuestions,
    contributingFactors: symptom.contributingFactors,
  };
};

export const finalizeAssessmentScore = ({
  baseScore = 0,
  questionnaireScore = 0,
  symptomScore = 0,
  aiScore,
  aiSentiment = 0,
}) => {
  const hasAiScore = Number.isFinite(aiScore);
  let weightedScore = baseScore;

  if (hasAiScore) {
    weightedScore = round(
      questionnaireScore * 0.3 +
      symptomScore * 0.35 +
      aiScore * 0.35
    );
  }

  if (!hasAiScore && baseScore === 0 && symptomScore > 0) {
    weightedScore = symptomScore;
  }

  if (aiSentiment < 0) {
    weightedScore += round(Math.abs(aiSentiment) * 8);
  } else if (aiSentiment > 0) {
    weightedScore -= round(aiSentiment * 4);
  }

  return clamp(weightedScore);
};

export const normalizeScore = (score) => clamp(score);
