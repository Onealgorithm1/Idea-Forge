import { Response } from 'express';
import { query } from '../config/db.js';

export const getAnalyticsSummary = async (req: any, res: Response) => {
  const tenant_id = req.tenantId;

  try {
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM ideas WHERE tenant_id = $1)::int as total_ideas,
        (SELECT COUNT(*) FROM votes WHERE tenant_id = $1)::int as total_votes,
        (SELECT COUNT(*) FROM comments WHERE tenant_id = $1)::int as total_comments,
        (SELECT COUNT(DISTINCT author_id) FROM ideas WHERE tenant_id = $1)::int as active_contributors
    `, [tenant_id]);

    res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getIdeaGrowth = async (req: any, res: Response) => {
  const tenant_id = req.tenantId;

  try {
    const result = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM ideas
      WHERE tenant_id = $1 AND created_at > CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date
    `, [tenant_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get idea growth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStatusDistribution = async (req: any, res: Response) => {
  const tenant_id = req.tenantId;

  try {
    const result = await query(`
      SELECT status as name, COUNT(*)::int as value
      FROM ideas
      WHERE tenant_id = $1
      GROUP BY status
    `, [tenant_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get status distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCategoryDistribution = async (req: any, res: Response) => {
  const tenant_id = req.tenantId;

  try {
    const result = await query(`
      SELECT c.name, COUNT(i.id)::int as value
      FROM ideas i
      JOIN categories c ON i.category_id = c.id
      WHERE i.tenant_id = $1
      GROUP BY c.name
    `, [tenant_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get category distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTopIdeas = async (req: any, res: Response) => {
    const tenant_id = req.tenantId;
  
    try {
      const result = await query(`
        SELECT title, votes_count, comments_count, (votes_count + comments_count) as total_engagement
        FROM ideas
        WHERE tenant_id = $1
        ORDER BY total_engagement DESC
        LIMIT 5
      `, [tenant_id]);
  
      res.json(result.rows);
    } catch (error) {
      console.error('Get top ideas error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
