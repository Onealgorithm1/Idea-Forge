import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const getIdeas = async (req: any, res: Response) => {
  const tenantId = req.tenantId;
  let userId = req.user?.id;

  // If userId is not already set (e.g. via optional middleware), try to get it from header
  if (!userId) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        userId = decoded.id;
      } catch (e) { /* ignore */ }
    }
  }

  try {
    const result = await query(`
      SELECT i.*, u.name as author, c.name as category,
             (SELECT json_agg(t.name) FROM tags t 
              JOIN idea_tags it ON t.id = it.tag_id 
              WHERE it.idea_id = i.id) as tags,
             EXISTS(SELECT 1 FROM votes WHERE idea_id = i.id AND user_id = $2) as has_voted
      FROM ideas i 
      LEFT JOIN users u ON i.author_id = u.id 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.tenant_id = $1
      ORDER BY i.created_at DESC
    `, [tenantId, userId || '00000000-0000-0000-0000-000000000000']);
    res.json(result.rows);
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createIdea = async (req: any, res: Response) => {
  const { title, description, category_id, tags } = req.body;
  const author_id = req.user.id;
  const tenant_id = req.tenantId;

  try {
    const result = await query(
      'INSERT INTO ideas (title, description, author_id, category_id, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, author_id, category_id, tenant_id]
    );
    const idea = result.rows[0];

    // Handle tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        // Find or create tag WITHIN tenant
        let tagResult = await query('SELECT id FROM tags WHERE name = $1 AND tenant_id = $2', [tagName, tenant_id]);
        let tagId;
        if (tagResult.rows.length === 0) {
          const newTag = await query('INSERT INTO tags (name, slug, tenant_id) VALUES ($1, $2, $3) RETURNING id', [tagName, tagName.toLowerCase().replace(/\s+/g, '-'), tenant_id]);
          tagId = newTag.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }
        // Link to idea
        await query('INSERT INTO idea_tags (idea_id, tag_id, tenant_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [idea.id, tagId, tenant_id]);
      }
    }

    res.status(201).json(idea);
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCategories = async (req: any, res: Response) => {
  const tenantId = req.tenantId;
  try {
    const result = await query('SELECT * FROM categories WHERE tenant_id = $1 OR tenant_id IS NULL', [tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
import { emitVoteUpdate, emitStatusUpdate } from '../lib/socket.js';

export const voteIdea = async (req: any, res: Response) => {
  const { id } = req.params;
  const { type } = req.body; 
  const user_id = req.user.id;

  // Only 'up' votes are allowed in the new strict voting system
  if (type !== 'up') {
    return res.status(400).json({ message: 'Only upvoting is allowed' });
  }

  try {
    // Check if vote already exists
    const existingVote = await query('SELECT * FROM votes WHERE idea_id = $1 AND user_id = $2', [id, user_id]);
    
    if (existingVote.rows.length > 0) {
      return res.status(400).json({ message: 'You already have done that' });
    } else {
      // Create new 'up' vote
      await query('INSERT INTO votes (idea_id, user_id, type, tenant_id) VALUES ($1, $2, \'up\', $3)', [id, user_id, req.tenantId]);
    }

    // Update votes_count in ideas table - strictly count 'up' votes
    const voteCounts = await query('SELECT COUNT(*) as total FROM votes WHERE idea_id = $1 AND type = \'up\'', [id]);
    const totalVotes = parseInt(voteCounts.rows[0].total || 0);

    await query('UPDATE ideas SET votes_count = $1 WHERE id = $2', [totalVotes, id]);

    // Emit real-time update
    emitVoteUpdate(id, totalVotes);

    res.json({ message: 'Vote recorded', id, votes_count: totalVotes });

    // Trigger Notification for author - only for new votes
    if (existingVote.rows.length === 0) {
      const ideaInfo = await query('SELECT author_id, title, tenant_id FROM ideas WHERE id = $1', [id]);
      if (ideaInfo.rows.length > 0 && ideaInfo.rows[0].author_id !== user_id) {
        await query(
          'INSERT INTO notifications (user_id, type, reference_id, message, tenant_id) VALUES ($1, $2, $3, $4, $5)',
          [ideaInfo.rows[0].author_id, 'vote', id, `Someone upvoted your idea: ${ideaInfo.rows[0].title}`, ideaInfo.rows[0].tenant_id]
        );
      }
    }
  } catch (error) {
    console.error('Vote idea error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addComment = async (req: any, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;

  try {
    const result = await query(
      'INSERT INTO comments (idea_id, user_id, content, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, user_id, content, req.tenantId]
    );
    
    // Update comments_count
    await query('UPDATE ideas SET comments_count = comments_count + 1 WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);

    // Trigger Notification for author
    const ideaInfo = await query('SELECT author_id, title, tenant_id FROM ideas WHERE id = $1', [id]);
    if (ideaInfo.rows.length > 0 && ideaInfo.rows[0].author_id !== user_id) {
       await query(
        'INSERT INTO notifications (user_id, type, reference_id, message, tenant_id) VALUES ($1, $2, $3, $4, $5)',
        [ideaInfo.rows[0].author_id, 'comment', id, `Someone commented on your idea: ${ideaInfo.rows[0].title}`, ideaInfo.rows[0].tenant_id]
      );
    }
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getComments = async (req: any, res: Response) => {
  const { id } = req.params;
  const tenant_id = req.tenantId;

  try {
    const result = await query(`
      SELECT c.*, u.name as author 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.idea_id = $1 AND c.tenant_id = $2
      ORDER BY c.created_at ASC
    `, [id, tenant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const bookmarkIdea = async (req: any, res: Response) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const existing = await query('SELECT * FROM bookmarks WHERE user_id = $1 AND idea_id = $2 AND tenant_id = $3', [user_id, id, req.tenantId]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM bookmarks WHERE user_id = $1 AND idea_id = $2 AND tenant_id = $3', [user_id, id, req.tenantId]);
      res.json({ bookmarked: false });
    } else {
      await query('INSERT INTO bookmarks (user_id, idea_id, tenant_id) VALUES ($1, $2, $3)', [user_id, id, req.tenantId]);
      res.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTags = async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM tags WHERE tenant_id = $1', [req.tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getNotifications = async (req: any, res: Response) => {
  const user_id = req.user.id;
  const tenant_id = req.tenantId;
  try {
    const result = await query('SELECT * FROM notifications WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC', [user_id, tenant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markNotificationRead = async (req: any, res: Response) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const tenant_id = req.tenantId;
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 AND tenant_id = $3', [id, user_id, tenant_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserIdeas = async (req: any, res: Response) => {
  const user_id = req.user.id;
  const tenant_id = req.tenantId;
  try {
    const result = await query(`
      SELECT i.*, u.name as author, c.name as category,
      (SELECT json_agg(t.name) FROM tags t 
       JOIN idea_tags it ON t.id = it.tag_id 
       WHERE it.idea_id = i.id) as tags,
      EXISTS(SELECT 1 FROM votes WHERE idea_id = i.id AND user_id = $1) as has_voted
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.author_id = $1 AND i.tenant_id = $2
      ORDER BY i.created_at DESC
    `, [user_id, tenant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get user ideas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateIdeaStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenant_id = req.tenantId;

  const validStatuses = ['Pending', 'Under Review', 'In Progress', 'In Development', 'Shipped'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await query(
      'UPDATE ideas SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [status, id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Broadcast status update
    emitStatusUpdate(id as string, status);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update idea status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
