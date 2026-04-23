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
  updateUserRole,
  changeSuperAdminPassword,
  resetUserPassword
} from '../controllers/superAdminController.js';
import { authenticateToken, isSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// All super-admin routes require authentication
router.use(authenticateToken);

// Support submission is allowed for any authenticated user
router.post('/support', submitSupportRequest);

// All other super-admin routes require super admin role
router.use(isSuperAdmin);

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

// User management
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', updateUserRole);
router.post('/users/:userId/reset-password', resetUserPassword);
router.post('/change-password', changeSuperAdminPassword);

export default router;
