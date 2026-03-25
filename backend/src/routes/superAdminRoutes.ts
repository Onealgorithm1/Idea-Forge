import express from 'express';
import {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantStats,
} from '../controllers/tenantController.js';
import {
  getTenantDetail,
  createTenantAdmin,
  updateTenantMaxUsers,
  submitSupportRequest,
  listSupportRequests,
  updateUserStatus,
  updateUserRole
} from '../controllers/superAdminController.js';
import { authenticateToken, isSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// All super-admin routes require auth + super admin role
router.use(authenticateToken, isSuperAdmin);

router.get('/tenants', listTenants);
router.get('/tenants/stats', getTenantStats);
router.get('/tenants/:id', getTenant);
router.get('/tenants/:id/detail', getTenantDetail);
router.post('/tenants', createTenant);
router.patch('/tenants/:id', updateTenant);
router.delete('/tenants/:id', deleteTenant);

// New management routes
router.post('/tenants/:id/admins', createTenantAdmin);
router.patch('/tenants/:id/license', updateTenantMaxUsers);
router.get('/support', listSupportRequests);
router.post('/support', submitSupportRequest);

// User management
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', updateUserRole);

export default router;
