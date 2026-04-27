/**
 * Risk Level Classifier
 */

export const getRiskLevel = (score) => {
  if (score < 40) {
    return {
      level: 'Low',
      color: 'green',
      recommendation: 'Continue monitoring your health. Maintain healthy lifestyle.',
    };
  } else if (score < 70) {
    return {
      level: 'Medium',
      color: 'orange',
      recommendation: 'Consult a healthcare professional for proper evaluation.',
    };
  } else {
    return {
      level: 'High',
      color: 'red',
      recommendation: 'Seek immediate medical attention. Contact a doctor urgently.',
    };
  }
};

export const isHighRisk = (score) => {
  return score > 70;
};

export const getRecommendationLevel = (score) => {
  if (score < 40) return 'Basic';
  if (score < 70) return 'Moderate';
  return 'Severe';
};
