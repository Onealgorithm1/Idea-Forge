import { Response } from 'express';
import { query } from '../config/db.js';
import { generateViewUrl } from './uploadController.js';

// ─── Events Controller ────────────────────────────────────────────────────────

export const getEvents = async (req: any, res: Response) => {
  const tenant_id = req.tenantId;
  const user_id = req.user?.id;

  try {
    const result = await query(`
      SELECT 
        e.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)::int as attendees_count,
        (SELECT COUNT(*) FROM event_comments WHERE event_id = e.id)::int as comments_count,
        ${user_id ? `(EXISTS (SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = $2)) as is_attending,` : `FALSE as is_attending,`}
        COALESCE(
          (SELECT json_agg(json_build_object('id', eo.id, 'text', eo.option_text, 'votes', eo.votes_count, 'order', eo.option_order) ORDER BY eo.option_order)
           FROM event_options eo WHERE eo.event_id = e.id),
          '[]'
        ) as options
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.id
      WHERE e.tenant_id = $1
      ORDER BY e.created_at DESC
    `, user_id ? [tenant_id, user_id] : [tenant_id]);
    const events = result.rows;

    // Sign image URLs for all events
    for (const event of events) {
      if (event.image) {
        event.image = await generateViewUrl(event.image);
      }
    }

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEvent = async (req: any, res: Response) => {
  const { id } = req.params;
  const tenant_id = req.tenantId;
  const user_id = req.user?.id;

  try {
    const result = await query(`
      SELECT 
        e.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)::int as attendees_count,
        ${user_id ? `(EXISTS (SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = $3)) as is_attending,` : `FALSE as is_attending,`}
        COALESCE(
          (SELECT json_agg(json_build_object('id', eo.id, 'text', eo.option_text, 'votes', eo.votes_count, 'order', eo.option_order, 
                           'user_voted', ${user_id ? `(EXISTS (SELECT 1 FROM event_votes ev WHERE ev.event_option_id = eo.id AND ev.user_id = $3))` : 'FALSE'}) ORDER BY eo.option_order)
           FROM event_options eo WHERE eo.event_id = e.id),
          '[]'
        ) as options,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ec.id, 
            'content', ec.content, 
            'author_name', cu.name, 
            'author_id', ec.user_id,
            'created_at', ec.created_at
          ) ORDER BY ec.created_at ASC)
           FROM event_comments ec JOIN users cu ON ec.user_id = cu.id WHERE ec.event_id = e.id),
          '[]'
        ) as comments_list
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.id
      WHERE e.id = $1 AND e.tenant_id = $2
    `, user_id ? [id, tenant_id, user_id] : [id, tenant_id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    
    const event = result.rows[0];
    if (event.image) {
      event.image = await generateViewUrl(event.image);
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createEvent = async (req: any, res: Response) => {
  const { title, description, type, status, image, ends_at, options } = req.body;
  const creator_id = req.user.id;
  const tenant_id = req.tenantId;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters long' });
  }
  if (!type || !['poll', 'challenge', 'hackathon', 'announcement'].includes(type)) {
    return res.status(400).json({ message: 'Invalid event type. Must be one of: poll, challenge, hackathon, announcement' });
  }

  try {
    const result = await query(
      `INSERT INTO events (title, description, type, status, image, ends_at, creator_id, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title.trim(), description || '', type, status || 'active', image || null, ends_at || null, creator_id, tenant_id]
    );
    const event = result.rows[0];

    // Insert poll options if provided
    if (options && Array.isArray(options) && options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        await query(
          'INSERT INTO event_options (event_id, option_text, option_order) VALUES ($1, $2, $3)',
          [event.id, options[i], i + 1]
        );
      }
    }

    // Sign image URL for response
    if (event.image) {
      event.image = await generateViewUrl(event.image);
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEvent = async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, description, status, image, ends_at, type, options } = req.body;
  const actor = req.user;
  const tenant_id = req.tenantId;

  try {
    const existing = await query('SELECT creator_id FROM events WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Event not found' });

    const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(actor.role);
    if (existing.rows[0].creator_id !== actor.id && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this event' });
    }

    const setParts: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let p = 1;

    if (title !== undefined) { setParts.push(`title = $${p}`); values.push(title.trim()); p++; }
    if (description !== undefined) { setParts.push(`description = $${p}`); values.push(description); p++; }
    if (status !== undefined) { setParts.push(`status = $${p}`); values.push(status); p++; }
    if (image !== undefined) { setParts.push(`image = $${p}`); values.push(image); p++; }
    if (ends_at !== undefined) { setParts.push(`ends_at = $${p}`); values.push(ends_at); p++; }
    if (type !== undefined) { setParts.push(`type = $${p}`); values.push(type); p++; }

    values.push(id, tenant_id);
    const result = await query(
      `UPDATE events SET ${setParts.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`,
      values
    );
    const event = result.rows[0];

    // Update poll options if provided
    if (options && Array.isArray(options)) {
      // Clear old options (this will also clear votes)
      await query('DELETE FROM event_votes WHERE event_option_id IN (SELECT id FROM event_options WHERE event_id = $1)', [id]);
      await query('DELETE FROM event_options WHERE event_id = $1', [id]);
      
      for (let i = 0; i < options.length; i++) {
        const optText = typeof options[i] === 'string' ? options[i] : options[i].text;
        if (optText && optText.trim()) {
          await query(
            'INSERT INTO event_options (event_id, option_text, option_order) VALUES ($1, $2, $3)',
            [id, optText.trim(), i + 1]
          );
        }
      }
    }

    // Sign image URL for response
    if (event.image) {
      event.image = await generateViewUrl(event.image);
    }

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEvent = async (req: any, res: Response) => {
  const { id } = req.params;
  const actor = req.user;
  const tenant_id = req.tenantId;

  try {
    const existing = await query('SELECT creator_id FROM events WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Event not found' });

    const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(actor.role);
    if (existing.rows[0].creator_id !== actor.id && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Cascade delete
    await query('DELETE FROM event_votes WHERE event_option_id IN (SELECT id FROM event_options WHERE event_id = $1)', [id]);
    await query('DELETE FROM event_options WHERE event_id = $1', [id]);
    await query('DELETE FROM event_comments WHERE event_id = $1', [id]);
    await query('DELETE FROM event_attendees WHERE event_id = $1', [id]);
    await query('DELETE FROM events WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleAttendance = async (req: any, res: Response) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const tenant_id = req.tenantId;

  try {
    const existing = await query('SELECT id FROM event_attendees WHERE event_id = $1 AND user_id = $2', [id, user_id]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2', [id, user_id]);
      const count = await query('SELECT COUNT(*)::int as total FROM event_attendees WHERE event_id = $1', [id]);
      await query('UPDATE events SET participants_count = $1 WHERE id = $2', [count.rows[0].total, id]);
      return res.json({ attending: false, attendees_count: count.rows[0].total });
    } else {
      await query('INSERT INTO event_attendees (event_id, user_id, tenant_id) VALUES ($1, $2, $3)', [id, user_id, tenant_id]);
      const count = await query('SELECT COUNT(*)::int as total FROM event_attendees WHERE event_id = $1', [id]);
      await query('UPDATE events SET participants_count = $1 WHERE id = $2', [count.rows[0].total, id]);
      return res.json({ attending: true, attendees_count: count.rows[0].total });
    }
  } catch (error) {
    console.error('Toggle attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const voteOnOption = async (req: any, res: Response) => {
  const { id, optionId } = req.params;
  const user_id = req.user.id;
  const tenant_id = req.tenantId;

  try {
    const event = await query('SELECT type FROM events WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
    if (event.rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    if (event.rows[0].type !== 'poll') return res.status(400).json({ message: 'Voting is only for poll events' });

    // Check for existing vote on any option in this event
    const existingVote = await query(
      'SELECT ev.id, ev.event_option_id FROM event_votes ev JOIN event_options eo ON ev.event_option_id = eo.id WHERE eo.event_id = $1 AND ev.user_id = $2',
      [id, user_id]
    );

    if (existingVote.rows.length > 0) {
      if (existingVote.rows[0].event_option_id === optionId) {
        // Toggle off
        await query('DELETE FROM event_votes WHERE id = $1', [existingVote.rows[0].id]);
        await query('UPDATE event_options SET votes_count = GREATEST(0, votes_count - 1) WHERE id = $1', [optionId]);
        await query('UPDATE events SET votes_count = GREATEST(0, votes_count - 1) WHERE id = $1', [id]);
        return res.json({ voted: false, optionId });
      } else {
        // Switch vote
        await query('UPDATE event_votes SET event_option_id = $1 WHERE id = $2', [optionId, existingVote.rows[0].id]);
        await query('UPDATE event_options SET votes_count = GREATEST(0, votes_count - 1) WHERE id = $1', [existingVote.rows[0].event_option_id]);
        await query('UPDATE event_options SET votes_count = votes_count + 1 WHERE id = $1', [optionId]);
        return res.json({ voted: true, optionId });
      }
    }

    // New vote
    await query('INSERT INTO event_votes (event_option_id, user_id, tenant_id) VALUES ($1, $2, $3)', [optionId, user_id, tenant_id]);
    await query('UPDATE event_options SET votes_count = votes_count + 1 WHERE id = $1', [optionId]);
    await query('UPDATE events SET votes_count = votes_count + 1 WHERE id = $1', [id]);
    res.json({ voted: true, optionId });
  } catch (error) {
    console.error('Vote on option error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addEventComment = async (req: any, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;
  const tenant_id = req.tenantId;

  if (!content || content.trim().length < 2) {
    return res.status(400).json({ message: 'Comment must be at least 2 characters' });
  }

  try {
    const result = await query(
      'INSERT INTO event_comments (event_id, user_id, content, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, user_id, content.trim(), tenant_id]
    );
    const author = await query('SELECT name FROM users WHERE id = $1', [user_id]);
    res.status(201).json({ ...result.rows[0], author_name: author.rows[0]?.name });
  } catch (error) {
    console.error('Add event comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEventComment = async (req: any, res: Response) => {
  const { commentId } = req.params;
  const user_id = req.user.id;
  const actor = req.user;

  try {
    const existing = await query('SELECT user_id FROM event_comments WHERE id = $1', [commentId]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

    const isAdmin = ['admin', 'tenant_admin', 'super_admin'].includes(actor.role);
    if (existing.rows[0].user_id !== user_id && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await query('DELETE FROM event_comments WHERE id = $1', [commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete event comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
