import { Response } from 'express';
import { query } from '../config/db.js';

export const getScorecards = async (req: any, res: Response) => {
  const tenant_id = req.tenantId;
  try {
    const cards = await query(`
      SELECT s.*, json_agg(json_build_object('id', sc.id, 'name', sc.name, 'weight', sc.weight, 'min_score', sc.min_score, 'max_score', sc.max_score, 'display_order', sc.display_order)
        ORDER BY sc.display_order) AS criteria
      FROM scorecards s
      LEFT JOIN scorecard_criteria sc ON sc.scorecard_id = s.id
      WHERE s.tenant_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [tenant_id]);

    if (cards.rows.length === 0) {
      // Return a default scorecard for MVP
      return res.json([{
        id: 'default',
        name: 'Default Scorecard',
        criteria: [
          { id: 'impact', name: 'Business Impact', weight: 1, min_score: 0, max_score: 10, display_order: 1 },
          { id: 'feasibility', name: 'Feasibility', weight: 1, min_score: 0, max_score: 10, display_order: 2 },
          { id: 'innovation', name: 'Innovation', weight: 1, min_score: 0, max_score: 10, display_order: 3 },
        ]
      }]);
    }

    res.json(cards.rows);
  } catch (error) {
    console.error('Get scorecards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getIdeaScores = async (req: any, res: Response) => {
  const { id } = req.params;
  const tenant_id = req.tenantId;

  try {
    const scores = await query(`
      SELECT is2.*, u.name AS scorer_name, sc.name AS criterion_name
      FROM idea_scores is2
      JOIN users u ON u.id = is2.scored_by
      JOIN scorecard_criteria sc ON sc.id = is2.criterion_id
      WHERE is2.idea_id = $1 AND is2.tenant_id = $2
      ORDER BY is2.created_at DESC
    `, [id, tenant_id]);

    // Compute averages per criterion
    const avgResult = await query(`
      SELECT criterion_id, sc.name AS criterion_name, AVG(score)::numeric(5,2) AS avg_score, COUNT(*) AS count
      FROM idea_scores is2
      JOIN scorecard_criteria sc ON sc.id = is2.criterion_id
      WHERE is2.idea_id = $1 AND is2.tenant_id = $2
      GROUP BY criterion_id, sc.name
    `, [id, tenant_id]);

    const overallAvg = await query(`
      SELECT AVG(score)::numeric(5,2) AS overall_avg FROM idea_scores WHERE idea_id = $1 AND tenant_id = $2
    `, [id, tenant_id]);

    res.json({
      scores: scores.rows,
      averages: avgResult.rows,
      overall_avg: overallAvg.rows[0]?.overall_avg || 0,
    });
  } catch (error) {
    console.error('Get idea scores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitScore = async (req: any, res: Response) => {
  const { id } = req.params;
  const { scorecard_id, criterion_id, score, notes } = req.body;
  const user_id = req.user.id;
  const tenant_id = req.tenantId;

  if (score === undefined || score === null) {
    return res.status(400).json({ message: 'Score is required' });
  }
  
  const scoreNum = Number(score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
    return res.status(400).json({ message: 'Score must be a number between 0 and 10' });
  }

  if (!criterion_id) {
    return res.status(400).json({ message: 'Criterion ID is required' });
  }

  try {
    // Upsert: if already scored this criterion, update it
    const existing = await query(
      'SELECT id FROM idea_scores WHERE idea_id = $1 AND criterion_id = $2 AND scored_by = $3 AND tenant_id = $4',
      [id, criterion_id, user_id, tenant_id]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        'UPDATE idea_scores SET score = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [score, notes, existing.rows[0].id]
      );
    } else {
      result = await query(
        'INSERT INTO idea_scores (tenant_id, idea_id, scorecard_id, criterion_id, scored_by, score, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [tenant_id, id, scorecard_id || 'default', criterion_id, user_id, score, notes]
      );
    }

    // Update idea's current_score with overall avg
    const avg = await query(
      'SELECT AVG(score)::numeric(5,2) AS avg FROM idea_scores WHERE idea_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );
    await query('UPDATE ideas SET current_score = $1 WHERE id = $2', [avg.rows[0].avg, id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
