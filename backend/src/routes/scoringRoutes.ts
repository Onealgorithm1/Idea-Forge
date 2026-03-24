import express from 'express';
import { authenticateToken, extractTenant, isAdmin } from '../middleware/auth.js';
import { getScorecards, getIdeaScores, submitScore } from '../controllers/scoringController.js';

const router = express.Router();
router.use(extractTenant);

router.get('/scorecards', getScorecards);
router.get('/ideas/:id/scores', getIdeaScores);
router.post('/ideas/:id/scores', authenticateToken, isAdmin, submitScore);

export default router;
