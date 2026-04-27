import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { envConfig } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');
const shouldWriteLogsToFile = !process.env.VERCEL;

// Ensure logs directory exists
if (shouldWriteLogsToFile && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const getLogLevel = () => logLevels[envConfig.logLevel] || logLevels.info;

const formatTimestamp = () => new Date().toISOString();

const logToFile = (level, message, data = null) => {
  if (!shouldWriteLogsToFile) {
    return;
  }

  const timestamp = formatTimestamp();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
  const logFile = path.join(logsDir, `${level}.log`);
  
  fs.appendFileSync(logFile, logMessage);
};

export const logger = {
  error: (message, data) => {
    if (logLevels.error <= getLogLevel()) {
      console.error(`[ERROR] ${message}`, data || '');
      logToFile('error', message, data);
    }
  },

  warn: (message, data) => {
    if (logLevels.warn <= getLogLevel()) {
      console.warn(`[WARN] ${message}`, data || '');
      logToFile('warn', message, data);
    }
  },

  info: (message, data) => {
    if (logLevels.info <= getLogLevel()) {
      console.log(`[INFO] ${message}`, data || '');
      logToFile('info', message, data);
    }
  },

  debug: (message, data) => {
    if (logLevels.debug <= getLogLevel()) {
      console.log(`[DEBUG] ${message}`, data || '');
      logToFile('debug', message, data);
    }
  },
};
