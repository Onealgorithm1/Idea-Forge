import express from 'express';
import { registerWorkspace } from '../controllers/tenantController.js';

const router = express.Router();

/**
 * @route POST /api/register/workspace
 * @desc Public route for new organization registration
 * @access Public
 */
router.post('/workspace', registerWorkspace);

export default router;
