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
  family: 4, // Force IPv4
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_USER,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

// Verify connection configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email Transporter verification error:', error);
  } else {
    console.log('Email Transporter is ready');
  }
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
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
    console.error('Email send failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};
