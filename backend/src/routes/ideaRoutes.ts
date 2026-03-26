import express from 'express';
import { getIdeas, createIdea, editIdea, getCategories, voteIdea, addComment, getComments, editComment, deleteComment, bookmarkIdea, getTags, getNotifications, markNotificationRead, getUserIdeas, updateIdeaStatus, deleteIdea, getIdeaSpaces } from '../controllers/ideaController.js';
import { authenticateToken, extractTenant, isAdminOrReviewer } from '../middleware/auth.js';

const router = express.Router();

// Apply extractTenant to all routes to handle X-Tenant-ID header
router.use(extractTenant);

// Specific routes first
router.get('/categories', getCategories);
router.get('/spaces', getIdeaSpaces);
router.get('/tags', getTags);
router.get('/notifications', authenticateToken, getNotifications);
router.get('/my-ideas', authenticateToken, getUserIdeas);

// Comment management (Specific)
router.patch('/comments/:commentId', authenticateToken, editComment);
router.delete('/comments/:commentId', authenticateToken, deleteComment);

// Idea routes
router.get('/', getIdeas);
router.post('/', authenticateToken, createIdea);
router.patch('/:id', authenticateToken, editIdea);
router.patch('/:id/status', authenticateToken, isAdminOrReviewer, updateIdeaStatus);
router.delete('/:id', authenticateToken, deleteIdea);

// Nested routes
router.post('/:id/vote', authenticateToken, voteIdea);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments);
router.post('/:id/bookmark', authenticateToken, bookmarkIdea);
router.post('/notifications/:id/read', authenticateToken, markNotificationRead);

export default router;
