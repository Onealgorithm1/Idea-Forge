import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool, { query } from '../config/db.js';
import { sendEmail } from '../config/mail.js';
import { env } from '../config/env.js';

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


  try {
    const { role } = (req as any).user || { role: 'user' };
    const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(role);

    let baseQuery = `
      SELECT i.*, u.name as author_name, c.name as category, p.name as parent_name, s.name as space_name,
             (SELECT json_agg(t.name) FROM tags t 
              JOIN idea_tags it ON t.id = it.tag_id 
              WHERE it.idea_id = i.id) as tags,
             (SELECT type FROM votes WHERE idea_id = i.id AND user_id = $2 LIMIT 1) as vote_type,
             (EXISTS (SELECT 1 FROM bookmarks WHERE idea_id = i.id AND user_id = $2 AND tenant_id = $1)) as is_bookmarked
      FROM ideas i 
      LEFT JOIN users u ON i.author_id = u.id 
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
      WHERE i.tenant_id = $1
    `;

    const queryParams: any[] = [tenantId, userId || '00000000-0000-0000-0000-000000000000'];

    if (!isAdmin && userId) {
      baseQuery += ` AND (i.idea_space_id IS NULL OR i.idea_space_id IN (SELECT idea_space_id FROM user_idea_spaces WHERE user_id = $${queryParams.length + 1}))`;
      queryParams.push(userId);
    }

    baseQuery += ` ORDER BY i.created_at DESC`;

    const result = await query(baseQuery, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getIdea = async (req: any, res: Response) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  let userId = req.user?.id;

  // Extract user ID from token if not provided by middleware
  if (!userId) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.verify(token, env.JWT_SECRET as string);
        userId = decoded.id;
      } catch (e) { /* ignore */ }
    }
  }

  try {
    const result = await query(`
      SELECT i.*, u.name as author_name, c.name as category, p.name as parent_name, s.name as space_name,
             (SELECT json_agg(t.name) FROM tags t 
              JOIN idea_tags it ON t.id = it.tag_id 
              WHERE it.idea_id = i.id) as tags,
             (SELECT type FROM votes WHERE idea_id = i.id AND user_id = $2 LIMIT 1) as vote_type,
             (EXISTS (SELECT 1 FROM bookmarks WHERE idea_id = i.id AND user_id = $2 AND tenant_id = $1)) as is_bookmarked
      FROM ideas i 
      LEFT JOIN users u ON i.author_id = u.id 
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
      WHERE i.id = $3 AND i.tenant_id = $1
    `, [tenantId, userId || '00000000-0000-0000-0000-000000000000', id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get idea error:', error);
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
          // Atomic find-or-create tag
          const tagResult = await query(`
            INSERT INTO tags (name, slug, tenant_id) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name 
            RETURNING id
          `, [tagName, tagName.toLowerCase().replace(/\s+/g, '-'), tenant_id]);
          const tagId = tagResult.rows[0].id;
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
    const existing = await query(
      `SELECT i.*, c.manager_id as category_manager_id 
       FROM ideas i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = $1 AND i.tenant_id = $2`, 
      [id, tenant_id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Idea not found' });
    const idea = existing.rows[0];

    // If category is being updated, check if it exists
    if (category_id && category_id !== idea.category_id) {
      const categoryCheck = await query('SELECT id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)', [category_id, tenant_id]);
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }
    const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(req.user.role);
    const isCategoryManager = idea.category_manager_id === user_id;

    if (idea.author_id !== user_id && !isAdmin && !isCategoryManager) {
      return res.status(403).json({ message: 'Not authorized to edit this idea' });
    }

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
        // Atomic find-or-create tag
        const tagResult = await query(`
          INSERT INTO tags (name, slug, tenant_id) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name 
          RETURNING id
        `, [tagName, tagName.toLowerCase().replace(/\s+/g, '-'), tenant_id]);
        const tagId = tagResult.rows[0].id;
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
    const result = await query(
      'SELECT id, name, description, slug, is_default, tenant_id, manager_id, parent_id FROM categories WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_active = true ORDER BY name', 
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getIdeaSpaces = async (req: any, res: Response) => {
  const tenantId = req.tenantId;
  let userId = req.user?.id;
  let role = req.user?.role || 'user';

  const authHeader = req.headers['authorization'];
  console.log(`[getIdeaSpaces] X-Tenant-ID: ${req.headers['x-tenant-id']}, AuthHeader: ${authHeader ? 'Present' : 'Missing'}`);
  
  // If userId is not already set, try to get it from header
  if (!userId) {
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.verify(token, env.JWT_SECRET as string);
        userId = decoded.id;
        role = decoded.role || 'user';
        if (!tenantId) (req as any).tenantId = decoded.tenantId;
        console.log(`[getIdeaSpaces] Decoded Token: ID=${userId}, Role=${role}, Tenant=${decoded.tenantId}`);
      } catch (e: any) { 
        console.error(`[getIdeaSpaces] JWT Verify Failed: ${e.message}`);
      }
    }
  }

  // Refresh tenantId after token decoding if it was missing
  const finalTenantId = tenantId || (req as any).tenantId;
  const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(role);

  console.log(`[getIdeaSpaces] Final Context -> Tenant: ${finalTenantId}, User: ${userId}, Role: ${role}, isAdmin: ${isAdmin}`);

  try {
    let result;
    if (isAdmin) {
      // Admins see all spaces in the tenant
      result = await query('SELECT * FROM idea_spaces WHERE tenant_id = $1 ORDER BY name', [finalTenantId]);
    } else if (userId) {
      // Non-admins see only assigned spaces
      console.log(`[getIdeaSpaces] Querying assignments for User: ${userId} in Tenant: ${finalTenantId}`);
      result = await query(`
        SELECT s.* FROM idea_spaces s
        JOIN user_idea_spaces uis ON s.id = uis.idea_space_id
        WHERE s.tenant_id = $1 AND uis.user_id = $2::uuid
        ORDER BY s.name
      `, [finalTenantId, userId]);
    } else {
      // Non-logged in users see no spaces
      console.log(`[getIdeaSpaces] No User ID provided, returning empty.`);
      return res.json([]);
    }
    console.log(`[getIdeaSpaces] Found ${result.rows.length} spaces`);
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
  const tenant_id = req.tenantId;

  // ── Guard: valid vote type ─────────────────────────────────────────────────
  if (type !== 'up' && type !== 'down') {
    return res.status(400).json({ message: 'Invalid vote type. Must be "up" or "down".' });
  }

  // ── Guard: tenant_id must be present ──────────────────────────────────────
  if (!tenant_id) {
    return res.status(400).json({ message: 'Tenant context is missing. Please log in again.' });
  }

  const voteValue = type === 'up' ? 1 : -1;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Guard: idea must exist in this tenant ─────────────────────────────
    const ideaCheck = await client.query(
      'SELECT id, author_id, title FROM ideas WHERE id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );
    if (ideaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Idea not found.' });
    }

    // ── Guard: one vote per user — check existence ──────
    const existingVote = await client.query(
      'SELECT id, type FROM votes WHERE idea_id = $1 AND user_id = $2 AND tenant_id = $3 FOR UPDATE',
      [id, user_id, tenant_id]
    );
    
    if (existingVote.rows.length > 0) {
      if (existingVote.rows[0].type === type) {
        // Toggle off: If user clicks the same type again, delete it
        await client.query(
          'DELETE FROM votes WHERE id = $1',
          [existingVote.rows[0].id]
        );
      } else {
        // Update vote: User switched from up to down or vice-versa
        await client.query(
          'UPDATE votes SET type = $1, vote_value = $2 WHERE id = $3',
          [type, type === 'up' ? 1 : -1, existingVote.rows[0].id]
        );
      }
    } else {
      // New vote
      await client.query(
        'INSERT INTO votes (idea_id, user_id, type, vote_value, tenant_id) VALUES ($1, $2, $3, $4, $5)',
        [id, user_id, type, type === 'up' ? 1 : -1, tenant_id]
      );
    }

    // ── Recalculate votes_count from source of truth ──────────────────────
    const voteSum = await client.query(
      'SELECT COALESCE(SUM(vote_value), 0) as total FROM votes WHERE idea_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );
    const totalVotes = parseInt(voteSum.rows[0].total);

    await client.query(
      'UPDATE ideas SET votes_count = $1, current_score = $1 * 10 WHERE id = $2 AND tenant_id = $3',
      [totalVotes, id, tenant_id]
    );

    await client.query('COMMIT');

    // ── Post-transaction ──────────────────────────────────────────────────
    emitVoteUpdate(id, totalVotes);
    res.json({ message: 'Vote recorded', id, votes_count: totalVotes, vote_type: type });

    // Non-blocking audit + notification
    logAudit(tenant_id, user_id, 'idea', id, 'vote_submitted', null, { type })
      .catch(e => console.error('Audit log error:', e));

    if (type === 'up') {
      const idea = ideaCheck.rows[0];
      if (idea.author_id !== user_id) {
        query(
          'INSERT INTO notifications (user_id, type, reference_id, message, tenant_id) VALUES ($1, $2, $3, $4, $5)',
          [idea.author_id, 'vote', id, `Someone upvoted your idea: ${idea.title}`, tenant_id]
        ).catch(e => console.error('Notification error:', e));
      }
    }

  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Vote idea error:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};


export const addComment = async (req: any, res: Response) => {
  const { id } = req.params;
  const { content, parent_id } = req.body;
  const user_id = req.user.id;

  if (!content || content.trim().length < 2) {
    return res.status(400).json({ message: 'Comment must be at least 2 characters long' });
  }
  if (content.length > 500) {
    return res.status(400).json({ message: 'Comment is too long (max 500 characters)' });
  }

  try {
    const result = await query(
      'INSERT INTO comments (idea_id, user_id, content, tenant_id, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, user_id, content, req.tenantId, parent_id || null]
    );
    
    // Update comments_count
    await query('UPDATE ideas SET comments_count = comments_count + 1 WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);

    // ── Notify author and bookmarkers ──────────────────────────────────────
    const ideaInfo = await query('SELECT author_id, title, tenant_id FROM ideas WHERE id = $1', [id]);
    if (ideaInfo.rows.length > 0) {
      const idea = ideaInfo.rows[0];
      const commenter = await query('SELECT name FROM users WHERE id = $1', [user_id]);
      const commenterName = commenter.rows[0]?.name || 'Someone';

      // 1. Notify author (if not the commenter)
      if (idea.author_id !== user_id) {
         await query(
          'INSERT INTO notifications (user_id, type, reference_id, message, tenant_id) VALUES ($1, $2, $3, $4, $5)',
          [idea.author_id, 'comment', id, `${commenterName} commented on your idea: ${idea.title}`, idea.tenant_id]
        );

        const author = await query('SELECT email FROM users WHERE id = $1', [idea.author_id]);
        if (author.rows[0]?.email) {
          sendEmail(
            author.rows[0].email,
            `New Comment on: ${idea.title}`,
            `${commenterName} commented on your idea "${idea.title}":\n\n"${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
            `<h3>New Comment on Idea</h3>
             <p><strong>${commenterName}</strong> commented on your idea "<strong>${idea.title}</strong>":</p>
             <blockquote style="border-left: 4px solid #eee; padding-left: 10px; color: #666 italic;">${content}</blockquote>
             <p><a href="${env.FRONTEND_URL}/${req.tenantSlug || 'default'}/ideas/${id}">View on IdeaForge</a></p>`
          ).catch(e => console.error('Author email notification failed:', e));
        }
      }

      // 2. Notify bookmarkers
      const bookmarkers = await query(`
        SELECT u.email 
        FROM users u 
        JOIN bookmarks b ON u.id = b.user_id 
        WHERE b.idea_id = $1 AND b.user_id != $2 AND b.user_id != $3
      `, [id, user_id, idea.author_id]);

      bookmarkers.rows.forEach(b => {
        if (b.email) {
          sendEmail(
            b.email,
            `Activity on saved idea: ${idea.title}`,
            `${commenterName} commented on an idea you saved: "${idea.title}"`,
            `<h3>Discussion Activity</h3>
             <p><strong>${commenterName}</strong> commented on an idea you bookmarked: "<strong>${idea.title}</strong>":</p>
             <blockquote style="border-left: 4px solid #eee; padding-left: 10px; color: #666 italic;">${content}</blockquote>
             <p><a href="${env.FRONTEND_URL}/${req.tenantSlug || 'default'}/ideas/${id}">View Discussion</a></p>`
          ).catch(e => console.error('Bookmarker email notification failed:', e));
        }
      });

      // 3. If it's a reply, notify the author of the parent comment
      if (parent_id) {
        const parentInfo = await query('SELECT user_id FROM comments WHERE id = $1', [parent_id]);
        if (parentInfo.rows.length > 0 && parentInfo.rows[0].user_id !== user_id) {
          const parentAuthorId = parentInfo.rows[0].user_id;
          await query(
            'INSERT INTO notifications (user_id, type, reference_id, message, tenant_id) VALUES ($1, $2, $3, $4, $5)',
            [parentAuthorId, 'comment_reply', id, `${commenterName} replied to your comment on: ${idea.title}`, idea.tenant_id]
          );
        }
      }
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

export const getBookmarkedIdeas = async (req: any, res: Response) => {
  const user_id = req.user.id;
  const tenant_id = req.tenantId;
  try {
    const result = await query(`
      SELECT i.*, u.name as author, c.name as category, s.name as space_name,
      (SELECT json_agg(t.name) FROM tags t 
       JOIN idea_tags it ON t.id = it.tag_id 
       WHERE it.idea_id = i.id) as tags,
      (SELECT type FROM votes WHERE idea_id = i.id AND user_id = $1 LIMIT 1) as vote_type,
      TRUE as is_bookmarked
      FROM ideas i
      JOIN bookmarks b ON i.id = b.idea_id
      JOIN users u ON i.author_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
      WHERE b.user_id = $1 AND i.tenant_id = $2
      ORDER BY b.created_at DESC
    `, [user_id, tenant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get bookmarked ideas error:', error);
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
      (SELECT type FROM votes WHERE idea_id = i.id AND user_id = $1 LIMIT 1) as vote_type,
      (EXISTS (SELECT 1 FROM bookmarks WHERE idea_id = i.id AND user_id = $1 AND tenant_id = $2)) as is_bookmarked
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

    // ── Notify author and bookmarkers about status change ──────────────────
    const actorId = req.user?.id;
    const idea = result.rows[0];
    const author = await query('SELECT email FROM users WHERE id = $1', [idea.author_id]);
    
    // 1. Notify author (if not the person who changed it)
    if (idea.author_id !== actorId && author.rows[0]?.email) {
      sendEmail(
        author.rows[0].email,
        `Status Updated: ${idea.title}`,
        `Your idea "${idea.title}" is now "${status}".`,
        `<h3>Idea Status Update</h3>
         <p>Great news! Your idea "<strong>${idea.title}</strong>" has been updated to: <span style="font-weight: bold; color: #4f46e5;">${status}</span></p>
         <p><a href="${env.FRONTEND_URL}/${req.tenantSlug || 'default'}/ideas/${id}">Track Progress</a></p>`
      ).catch(e => console.error('Author status update email failed:', e));
    }

    // 2. Notify bookmarkers
    const bookmarkers = await query(`
      SELECT u.email 
      FROM users u 
      JOIN bookmarks b ON u.id = b.user_id 
      WHERE b.idea_id = $1 AND b.user_id != $2
    `, [id, actorId]);

    bookmarkers.rows.forEach(b => {
      if (b.email) {
        sendEmail(
          b.email,
          `Saved Idea Updated: ${idea.title}`,
          `An idea you saved, "${idea.title}", is now "${status}".`,
          `<h3>Followed Idea Status Update</h3>
           <p>An idea you bookmarked, "<strong>${idea.title}</strong>", has progressed to: <span style="font-weight: bold; color: #4f46e5;">${status}</span></p>
           <p><a href="${env.FRONTEND_URL}/${req.tenantSlug || 'default'}/ideas/${id}">View Idea</a></p>`
        ).catch(e => console.error('Bookmarker status update email failed:', e));
      }
    });

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
    const ideaResult = await query(
      `SELECT i.author_id, i.title, c.manager_id as category_manager_id 
       FROM ideas i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = $1 AND i.tenant_id = $2`, 
      [id, tenant_id]
    );
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const idea = ideaResult.rows[0];
    const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(user_role);
    const isCategoryManager = idea.category_manager_id === user_id;

    if (idea.author_id !== user_id && !isAdmin && !isCategoryManager) {
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

export const getSimilarIdeas = async (req: any, res: Response) => {
  const { q } = req.query as { q: string };
  const tenant_id = req.tenantId;

  if (!q || q.trim().length < 3) {
    return res.json([]);
  }

  try {
    // PostgreSQL full-text search: rank by relevance across title + description
    const ftsResult = await query(
      `SELECT
         i.id,
         i.title,
         i.status,
         i.votes_count,
         u.name AS author_name,
         c.name AS category,
         s.name AS space_name,
         ts_rank(
           to_tsvector('english', i.title || ' ' || COALESCE(i.description, '')),
           plainto_tsquery('english', $1)
         ) AS rank
       FROM ideas i
       LEFT JOIN users u ON i.author_id = u.id
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
       WHERE i.tenant_id = $2
         AND to_tsvector('english', i.title || ' ' || COALESCE(i.description, ''))
             @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT 5`,
      [q.trim(), tenant_id]
    );

    if (ftsResult.rows.length > 0) {
      return res.json(ftsResult.rows);
    }

    // Fallback: ILIKE prefix search on title when FTS returns nothing
    // (useful for very short or partial words that FTS tokenizes differently)
    const likeResult = await query(
      `SELECT
         i.id,
         i.title,
         i.status,
         i.votes_count,
         u.name AS author_name,
         c.name AS category,
         s.name AS space_name,
         0.0 AS rank
       FROM ideas i
       LEFT JOIN users u ON i.author_id = u.id
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN idea_spaces s ON i.idea_space_id = s.id
       WHERE i.tenant_id = $2
         AND i.title ILIKE $1
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [`%${q.trim()}%`, tenant_id]
    );

    return res.json(likeResult.rows);
  } catch (error) {
    console.error('Get similar ideas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
