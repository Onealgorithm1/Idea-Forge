import express from 'express';
import {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantStats,
} from '../controllers/tenantController.js';
import { authenticateToken, isSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// All super-admin routes require auth + super admin role
router.use(authenticateToken, isSuperAdmin);

router.get('/tenants', listTenants);
router.get('/tenants/stats', getTenantStats);
router.get('/tenants/:id', getTenant);
router.post('/tenants', createTenant);
router.patch('/tenants/:id', updateTenant);
router.delete('/tenants/:id', deleteTenant);

export default router;
