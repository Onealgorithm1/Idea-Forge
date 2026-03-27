import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

// ─── Audit log helper ─────────────────────────────────────────────────────────
async function logAudit(tenantId: string, actorUserId: string | null, entityType: string, entityId: string, action: string, oldValues?: any, newValues?: any) {
  try {
    await query(
      'INSERT INTO audit_logs (tenant_id, actor_user_id, entity_type, entity_id, action, old_values, new_values) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [tenantId, actorUserId, entityType, entityId, action, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null]
    );
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

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
      SELECT i.*, u.name as author, c.name as category, s.name as space_name,
             (SELECT json_agg(t.name) FROM tags t 
              JOIN idea_tags it ON t.id = it.tag_id 
              WHERE it.idea_id = i.id) as tags,
             EXISTS(SELECT 1 FROM votes WHERE idea_id = i.id AND user_id = $2) as has_voted
      FROM ideas i 
      LEFT JOIN users u ON i.author_id = u.id 
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
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

  if (!title || title.trim().length < 5) {
    return res.status(400).json({ message: 'Title must be at least 5 characters long' });
  }
  if (!category_id) {
    return res.status(400).json({ message: 'Category is required' });
  }

  try {
    // Check if category exists
    const categoryCheck = await query('SELECT id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)', [category_id, tenant_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Start a transaction block conceptually (though we use pool.query normally, we'll keep it simple but safe)
    const result = await query(
      'INSERT INTO ideas (title, description, author_id, category_id, tenant_id, idea_space_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, author_id, category_id, tenant_id, req.body.idea_space_id || null]
    );
    const idea = result.rows[0];

    // Handle tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        try {
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
        } catch (tagError) {
          console.error('Tag processing error (non-fatal):', tagError);
        }
      }
    }

    // Log Audit (Don't let it crash the response)
    logAudit(tenant_id, author_id, 'idea', idea.id, 'idea_created', null, { title: idea.title }).catch(e => console.error('Delayed audit log error:', e));

    // Send response AT THE END
    return res.status(201).json(idea);
  } catch (error) {
    console.error('Create idea error:', error);
    // Only send if headers not already sent
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const editIdea = async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, description, category_id, tags } = req.body;
  const user_id = req.user.id;
  const tenant_id = req.tenantId;

  if (title !== undefined && (!title || title.trim().length < 5)) {
    return res.status(400).json({ message: 'Title must be at least 5 characters long' });
  }

  try {
    // Verify idea belongs to this user and tenant
    const existing = await query('SELECT * FROM ideas WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Idea not found' });
    const idea = existing.rows[0];

    // If category is being updated, check if it exists
    if (category_id && category_id !== idea.category_id) {
      const categoryCheck = await query('SELECT id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)', [category_id, tenant_id]);
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }
    const isAdmin = req.user.role === 'admin';
    if (idea.author_id !== user_id && !isAdmin) return res.status(403).json({ message: 'Not authorized to edit this idea' });

    // --- LOCKING LOGIC ---
    // 1. Lock if status is 'In Development'
    if (idea.status === 'In Development') {
      return res.status(403).json({ message: 'Ideas in Development stage cannot be edited.' });
    }

    // 2. Lock if older than 24 hours
    const oneDay = 24 * 60 * 60 * 1000;
    const isOlderThan24h = (Date.now() - new Date(idea.created_at).getTime()) > oneDay;
    if (isOlderThan24h && !isAdmin) {
      return res.status(403).json({ message: 'Ideas cannot be edited after 24 hours of creation.' });
    }
    // ---------------------

    const updated = await query(
      'UPDATE ideas SET title = $1, description = $2, category_id = $3, idea_space_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND tenant_id = $6 RETURNING *',
      [title ?? idea.title, description ?? idea.description, category_id ?? idea.category_id, req.body.idea_space_id ?? idea.idea_space_id, id, tenant_id]
    );

    // Update tags: clear and re-add
    if (tags && Array.isArray(tags)) {
      await query('DELETE FROM idea_tags WHERE idea_id = $1 AND tenant_id = $2', [id, tenant_id]);
      for (const tagName of tags) {
        let tagResult = await query('SELECT id FROM tags WHERE name = $1 AND tenant_id = $2', [tagName, tenant_id]);
        let tagId;
        if (tagResult.rows.length === 0) {
          const newTag = await query('INSERT INTO tags (name, slug, tenant_id) VALUES ($1, $2, $3) RETURNING id', [tagName, tagName.toLowerCase().replace(/\s+/g, '-'), tenant_id]);
          tagId = newTag.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }
        await query('INSERT INTO idea_tags (idea_id, tag_id, tenant_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [id, tagId, tenant_id]);
      }
    }

    res.json(updated.rows[0]);
    await logAudit(tenant_id, user_id, 'idea', id, 'idea_updated', { title: idea.title }, { title });
  } catch (error) {
    console.error('Edit idea error:', error);
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

export const getIdeaSpaces = async (req: any, res: Response) => {
  const tenantId = req.tenantId;
  try {
    const result = await query('SELECT * FROM idea_spaces WHERE tenant_id = $1 ORDER BY name', [tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get idea spaces error:', error);
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
    await logAudit(req.tenantId, user_id, 'idea', id, 'vote_submitted', null, { type: 'up' });

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

  if (!content || content.trim().length < 2) {
    return res.status(400).json({ message: 'Comment must be at least 2 characters long' });
  }
  if (content.length > 500) {
    return res.status(400).json({ message: 'Comment is too long (max 500 characters)' });
  }

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

export const editComment = async (req: any, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;
  const is_admin = req.user.role === 'admin';

  if (!content || content.trim().length < 2) {
    return res.status(400).json({ message: 'Comment must be at least 2 characters long' });
  }

  try {
    const existing = await query('SELECT * FROM comments WHERE id = $1 AND tenant_id = $2', [commentId, req.tenantId]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

    if (existing.rows[0].user_id !== user_id && !is_admin) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    const result = await query(
      'UPDATE comments SET content = $1, is_edited = TRUE WHERE id = $2 RETURNING *',
      [content, commentId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteComment = async (req: any, res: Response) => {
  const { commentId } = req.params;
  const user_id = req.user.id;
  const is_admin = req.user.role === 'admin';

  try {
    const existing = await query('SELECT * FROM comments WHERE id = $1 AND tenant_id = $2', [commentId, req.tenantId]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

    if (existing.rows[0].user_id !== user_id && !is_admin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    const ideaId = existing.rows[0].idea_id;

    await query('DELETE FROM comments WHERE id = $1', [commentId]);

    // Update comments_count
    await query('UPDATE ideas SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1', [ideaId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
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
      SELECT i.*, u.name as author, c.name as category, s.name as space_name,
      (SELECT json_agg(t.name) FROM tags t 
       JOIN idea_tags it ON t.id = it.tag_id 
       WHERE it.idea_id = i.id) as tags,
      EXISTS(SELECT 1 FROM votes WHERE idea_id = i.id AND user_id = $1) as has_voted
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
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

  const validStatuses = ['Pending', 'Under Review', 'In Progress', 'In Development', 'QA', 'Shipped'];
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
    await logAudit(tenant_id, req.user?.id || null, 'idea', id, 'status_changed', { status: result.rows[0].status }, { status });
  } catch (error) {
    console.error('Update idea status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteIdea = async (req: any, res: Response) => {
  const { id } = req.params;
  const tenant_id = req.tenantId;
  const user_id = req.user.id;
  const user_role = req.user.role;

  try {
    // 1. Check if idea exists and user has permission
    const ideaResult = await query('SELECT author_id, title FROM ideas WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const idea = ideaResult.rows[0];
    if (idea.author_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this idea' });
    }

    // 2. Cascade delete related data
    await query('DELETE FROM idea_tags WHERE idea_id = $1', [id]);
    await query('DELETE FROM votes WHERE idea_id = $1', [id]);
    await query('DELETE FROM comments WHERE idea_id = $1', [id]);
    await query('DELETE FROM bookmarks WHERE idea_id = $1', [id]);
    await query('DELETE FROM idea_scores WHERE idea_id = $1', [id]);
    await query('DELETE FROM notifications WHERE reference_id = $1 AND type IN (\'vote\', \'comment\', \'idea\')', [id]);
    
    // Finally delete the idea
    await query('DELETE FROM ideas WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);

    res.json({ message: 'Idea deleted successfully' });
    await logAudit(tenant_id, user_id, 'idea', id, 'idea_deleted', { title: idea.title }, null);
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
