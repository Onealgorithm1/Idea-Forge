import dotenv from 'dotenv';
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

  // Helper to remove any accidental quotes or whitespace from dashboard inputs
  const clean = (val?: string) => val ? val.replace(/^['"]|['"]$/g, '').trim() : '';

  // Railway's Neon integration often injects the un-pooled DATABASE_URL which rejects passwords.
  // This automatically upgrades the URL to the working pooler endpoint if needed.
  let dbUrl = clean(process.env.DATABASE_URL);
  if (dbUrl.includes('ep-icy-night-adzbcu6r.us-east-1.aws.neon.tech')) {
    dbUrl = dbUrl.replace('ep-icy-night-adzbcu6r.us-east-1.aws.neon.tech', 'ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech');
  }

  const env = {
    PORT: clean(process.env.PORT) || '5000',
    NODE_ENV: clean(process.env.NODE_ENV) || 'development',
    DATABASE_URL: dbUrl,
    JWT_SECRET: clean(process.env.JWT_SECRET),
    FRONTEND_URL: clean(process.env.FRONTEND_URL),
    SMTP_USER: clean(process.env.SMTP_USER),
    OAUTH_CLIENT_ID: clean(process.env.OAUTH_CLIENT_ID),
    OAUTH_CLIENT_SECRET: clean(process.env.OAUTH_CLIENT_SECRET),
    OAUTH_REFRESH_TOKEN: clean(process.env.OAUTH_REFRESH_TOKEN),
    RESEND_API_KEY: clean(process.env.RESEND_API_KEY),
    RESEND_FROM_EMAIL: clean(process.env.RESEND_FROM_EMAIL) || 'onboarding@resend.dev',
  };

  try {
    const maskedDb = env.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
    console.log(`🔍 [DIAGNOSTIC] Using DATABASE_URL starting with: ${maskedDb.substring(0, 50)}... and host: ${env.DATABASE_URL.split('@')[1]?.split('/')[0]}`);
  } catch (e) {}

  console.log('✅ Environment variables validated successfully.\n');
  
  return env;
}

export const env = validateEnv();
