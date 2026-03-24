import express from 'express';
import { getIdeas, createIdea, editIdea, getCategories, voteIdea, addComment, getComments, bookmarkIdea, getTags, getNotifications, markNotificationRead, getUserIdeas, updateIdeaStatus, deleteIdea } from '../controllers/ideaController.js';
import { authenticateToken, extractTenant, isAdminOrReviewer } from '../middleware/auth.js';

const router = express.Router();

// Apply extractTenant to all routes to handle X-Tenant-ID header
router.use(extractTenant);

router.get('/', getIdeas);
router.post('/', authenticateToken, createIdea);
router.patch('/:id', authenticateToken, editIdea);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/notifications', authenticateToken, getNotifications);
router.post('/notifications/:id/read', authenticateToken, markNotificationRead);
router.get('/my-ideas', authenticateToken, getUserIdeas);
router.patch('/:id/status', authenticateToken, isAdminOrReviewer, updateIdeaStatus);
router.delete('/:id', authenticateToken, deleteIdea);
router.post('/:id/vote', authenticateToken, voteIdea);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments);
router.post('/:id/bookmark', authenticateToken, bookmarkIdea);

export default router;
