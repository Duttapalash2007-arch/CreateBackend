/**
 * Constants used across the application
 */

export const DISEASES = ['Cancer', 'Allergy', 'Malaria', 'Diabetes', 'HIV', 'AIDS'];
export const GENERAL_ANALYSIS_DISEASE = 'Analyze Any Disease & My Condition';
export const SUPPORTED_REPORT_DISEASES = [...DISEASES, GENERAL_ANALYSIS_DISEASE];

export const DISEASE_SPECIALTIES = {
  Cancer: ['Oncologist', 'Radiologist', 'Surgeon'],
  Allergy: ['Allergist', 'Dermatologist', 'Immunologist'],
  Malaria: ['Infectious Disease Specialist', 'General Physician'],
  Diabetes: ['Endocrinologist', 'General Physician', 'Nutritionist'],
  HIV: ['Infectious Disease Specialist', 'General Physician'],
  AIDS: ['Infectious Disease Specialist', 'General Physician', 'Immunologist'],
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  SOS_ALERT_NOT_FOUND: 'SOS alert not found',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this resource',
  INVALID_TOKEN: 'Invalid or expired token',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  DISEASE_NOT_FOUND: 'Disease not found',
  REPORT_NOT_FOUND: 'Report not found',
  AI_SERVICE_ERROR: 'AI service error. Please try again later',
  DATABASE_ERROR: 'Database error occurred',
  INTERNAL_ERROR: 'Internal server error',
};

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESSFUL: 'Login successful',
  REPORT_CREATED: 'Report created successfully',
  REPORT_UPDATED: 'Report updated successfully',
  REPORT_DELETED: 'Report deleted successfully',
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
};

export const AI_PROVIDER_NAMES = {
  GEMINI: 'gemini',
  GROQ: 'groq',
  HUGGINGFACE: 'huggingface',
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CHAT_MESSAGE: 'chatMessage',
  CHAT_RESPONSE: 'chatResponse',
  TYPING: 'typing',
  STOP_TYPING: 'stopTyping',
  ERROR: 'error',
};
