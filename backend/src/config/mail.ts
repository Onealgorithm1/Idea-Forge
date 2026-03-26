import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter using explicit Gmail SMTP settings
// Using port 465 for SSL (often more reliable in modern cloud environments)
// Forcing IPv4 to avoid ENETUNREACH errors sometimes seen with IPv6 in cloud environments
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
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
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to,
          subject,
          text,
          html: html || text.replace(/\n/g, '<br>')
        })
      });

      const data: any = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Resend API error');
      }

      console.log(`[Email] Sent successfully via Resend. ID: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error: any) {
      console.error('[Email] Resend API failed:', error.message);
      throw error;
    }
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
