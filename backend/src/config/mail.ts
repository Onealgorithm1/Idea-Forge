import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

const oauth2Client = new OAuth2Client(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Sends an email using the Gmail API (Port 443 / HTTPS)
 * This is the official Google way to send emails from cloud servers like Railway
 * where standard SMTP ports (465/587) are often blocked.
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  // Gmail API requires a RFC 2822 formatted base64url encoded string
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: "IdeaForge Support" <${process.env.SMTP_USER}>`,
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    '',
    html || text.replace(/\n/g, '<br>')
  ];
  const message = messageParts.join('\n');

  // The body needs to be base64url encoded
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log('[Email] Sent successfully via Gmail API. ID:', res.data.id);
    return { success: true, messageId: res.data.id };
  } catch (error: any) {
    console.error('Gmail API Email send failed:', error.message);
    if (error.response?.data?.error) {
       console.error('Gmail API detail:', JSON.stringify(error.response.data.error, null, 2));
    }
    throw error;
  }
};
