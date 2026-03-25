import express from 'express';
import { getOrganizationDetails, updateOrganizationDetails } from '../controllers/organizationController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/details', getOrganizationDetails);
router.patch('/details', isAdmin, updateOrganizationDetails);

export default router;
