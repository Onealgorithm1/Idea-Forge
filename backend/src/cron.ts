import cron from 'node-cron';
import { query } from './config/db.js';
import { sendEmail } from './config/mail.js';
import { env } from './config/env.js';

export const startCronJobs = () => {
  // Daily Summary (08:00 AM everyday)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily summary...');
    await sendSummaryEmail('daily', 1);
  });

  // Weekly Summary (08:00 AM every Monday)
  cron.schedule('0 8 * * 1', async () => {
    console.log('[Cron] Running weekly summary...');
    await sendSummaryEmail('weekly', 7);
  });
  
  console.log('[Cron] Cron jobs scheduled successfully.');
};

export const sendSummaryEmail = async (type: 'daily' | 'weekly', days: number) => {
  try {
    // Get all users who have email enabled
    const usersRes = await query(`
      SELECT u.id, u.email, u.name, u.tenant_id 
      FROM users u
      LEFT JOIN notification_settings ns ON u.id = ns.user_id
      WHERE (ns.email_enabled = TRUE OR ns.email_enabled IS NULL) AND u.status = 'active'
    `);
    const users = usersRes.rows;

    for (const user of users) {
      // Find ideas owned by this user
      const ideasRes = await query(`SELECT id, title FROM ideas WHERE author_id = $1`, [user.id]);
      if (ideasRes.rows.length === 0) continue;

      const ideaIds = ideasRes.rows.map(i => i.id);

      // Get recent votes
      const votesRes = await query(`
        SELECT COUNT(*) as vote_count 
        FROM votes 
        WHERE idea_id = ANY($1) 
          AND created_at >= NOW() - INTERVAL '${days} days'
          AND user_id != $2
      `, [ideaIds, user.id]);

      // Get recent comments
      const commentsRes = await query(`
        SELECT COUNT(*) as comment_count 
        FROM comments 
        WHERE idea_id = ANY($1) 
          AND created_at >= NOW() - INTERVAL '${days} days'
          AND user_id != $2
      `, [ideaIds, user.id]);

      const voteCount = parseInt(votesRes.rows[0].vote_count);
      const commentCount = parseInt(commentsRes.rows[0].comment_count);

      if (voteCount === 0 && commentCount === 0) continue;

      const timeFrame = type === 'daily' ? 'Yesterday' : 'Last week';
      
      const subject = `Your IdeaForge ${type.charAt(0).toUpperCase() + type.slice(1)} Summary`;
      const text = `Hi ${user.name},\n\nHere is your summary of interactions on your ideas for ${timeFrame}:\n\n- New Votes: ${voteCount}\n- New Comments: ${commentCount}\n\nLog in to see the details.`;
      const html = `
        <h3>Your IdeaForge ${type.charAt(0).toUpperCase() + type.slice(1)} Summary</h3>
        <p>Hi ${user.name},</p>
        <p>Here is your summary of interactions on your ideas for ${timeFrame}:</p>
        <ul>
          <li><strong>New Votes:</strong> ${voteCount}</li>
          <li><strong>New Comments:</strong> ${commentCount}</li>
        </ul>
        <p><a href="${env.FRONTEND_URL}">Log in to IdeaForge to see more details</a></p>
      `;

      await sendEmail(user.email, subject, text, html);
    }
  } catch (error) {
    console.error(`[Cron] Error running ${type} summary:`, error);
  }
};
