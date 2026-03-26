import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter using explicit Gmail SMTP settings
// Using port 465 for SSL (often more reliable in modern cloud environments)
// Forcing IPv4 to avoid ENETUNREACH errors sometimes seen with IPv6 in cloud environments
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 443,
  secure: true, 
  family: 4, 
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_USER,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
} as any);

import https from 'https';

// Verify connection configuration (only if not using Resend)
if (!process.env.RESEND_API_KEY) {
  transporter.verify(function (error, success) {
    if (error) {
      console.warn('SMTP Transporter verification warning:', error.message);
    } else {
      console.log('SMTP Transporter is ready');
    }
  });
}

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    console.log(`[Email] Sending via Resend API to ${to}...`);
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>')
      });

      const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(responseBody);
            console.log(`[Email] Sent successfully via Resend. ID: ${parsed.id}`);
            resolve({ success: true, messageId: parsed.id });
          } else {
            console.error('[Email] Resend API Error Response:', responseBody);
            reject(new Error(`Resend API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (e) => {
        console.error('[Email] Resend HTTPS Request failed:', e.message);
        reject(e);
      });

      req.write(data);
      req.end();
    });
  }

  // Fallback to SMTP
  try {
    const info = await transporter.sendMail({
      from: `"IdeaForge Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: (info as any).messageId };
  } catch (error: any) {
    console.error('SMTP Email send failed:', error.message);
    throw error;
  }
};
