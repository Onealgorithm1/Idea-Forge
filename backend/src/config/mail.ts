import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter using Gmail OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
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
    console.log('Message sent successfully! Message ID: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Email send failed:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};
