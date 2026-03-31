import express from 'express';
import { authenticateToken, isAdmin, extractTenant } from '../middleware/auth.js';
import { getAllUsers, createUser, updateUserRole, deleteUser, updateUserPassword, getStats, getRecentActivity, getAdminCategories, createCategory, deleteCategory, getIdeaSpaces, createIdeaSpace, deleteIdeaSpace, getUserSpaces, assignUserSpaces } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(extractTenant, authenticateToken, isAdmin);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/password', updateUserPassword);
router.delete('/users/:id', deleteUser);
router.get('/users/:userId/spaces', getUserSpaces);
router.post('/users/:userId/spaces', assignUserSpaces);

// Categories
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Idea Spaces
router.get('/spaces', getIdeaSpaces);
router.post('/spaces', createIdeaSpace);
router.delete('/spaces/:id', deleteIdeaSpace);

export default router;
