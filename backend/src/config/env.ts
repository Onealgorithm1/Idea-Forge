import dotenv from 'dotenv';
import { z } from 'zod'; // If Zod is not available, I'll use a simple approach

// Initialize dotenv
dotenv.config();

/**
 * Validates that all required environment variables are present.
 * If any are missing, the process will exit with a clear error message.
 */
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ [CRITICAL] Missing required environment variables:\n');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nMake sure these are set in your .env file or your hosting provider dashboard (e.g. Railway).\n');
    process.exit(1);
  }

  // Handle Boolean/Numeric conversion and normalization if needed
  const env = {
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    SMTP_USER: process.env.SMTP_USER,
    // Add other vars here...
  };

  console.log('✅ Environment variables validated successfully.\n');
  
  return env;
}

export const env = validateEnv();
