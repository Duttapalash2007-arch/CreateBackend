import dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-assistant',
  dbName: process.env.DB_NAME || 'healthcare-assistant',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // AI Service Keys
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
  
  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  
  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  
  // Email
  emailService: process.env.EMAIL_SERVICE,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  
  // Admin
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(','),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
};
