import express from 'express';
import { getAnalyticsSummary, getIdeaGrowth, getStatusDistribution, getCategoryDistribution, getTopIdeas } from '../controllers/analyticsController.js';
import { authenticateToken, extractTenant } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticateToken, extractTenant, getAnalyticsSummary);
router.get('/growth', authenticateToken, extractTenant, getIdeaGrowth);
router.get('/distribution/status', authenticateToken, extractTenant, getStatusDistribution);
router.get('/distribution/category', authenticateToken, extractTenant, getCategoryDistribution);
router.get('/top-ideas', authenticateToken, extractTenant, getTopIdeas);

export default router;
