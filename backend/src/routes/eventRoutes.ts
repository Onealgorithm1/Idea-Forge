import express from 'express';
import { authenticateToken, extractTenant, isAdmin } from '../middleware/auth.js';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleAttendance,
  voteOnOption,
  addEventComment,
  deleteEventComment,
} from '../controllers/eventController.js';

const router = express.Router();

router.use(extractTenant);

// Public (read) — authenticated users only for personalized data
router.get('/', authenticateToken, getEvents);
router.get('/:id', authenticateToken, getEvent);

// CRUD — admin/tenant_admin create/update/delete
router.post('/', authenticateToken, isAdmin, createEvent);
router.patch('/:id', authenticateToken, isAdmin, updateEvent);
router.delete('/:id', authenticateToken, isAdmin, deleteEvent);

// User actions — any authenticated user
router.post('/:id/attend', authenticateToken, toggleAttendance);
router.post('/:id/vote/:optionId', authenticateToken, voteOnOption);
router.post('/:id/comments', authenticateToken, addEventComment);
router.delete('/comments/:commentId', authenticateToken, deleteEventComment);

export default router;
