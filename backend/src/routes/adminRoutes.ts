import express from 'express';
import { getAllUsers, updateUserRole, deleteUser, updateUserPassword, getStats, getRecentActivity } from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, isAdmin);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/password', updateUserPassword);
router.delete('/users/:id', deleteUser);

export default router;
