import express from 'express';
import { getIdeas, createIdea, getCategories, voteIdea, addComment, getComments, bookmarkIdea, getTags, getNotifications, markNotificationRead, getUserIdeas, updateIdeaStatus } from '../controllers/ideaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getIdeas);
router.post('/', authenticateToken, createIdea);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/notifications', authenticateToken, getNotifications);
router.post('/notifications/:id/read', authenticateToken, markNotificationRead);
router.get('/my-ideas', authenticateToken, getUserIdeas);
router.patch('/:id/status', authenticateToken, updateIdeaStatus);
router.post('/:id/vote', authenticateToken, voteIdea);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments);
router.post('/:id/bookmark', authenticateToken, bookmarkIdea);

export default router;
