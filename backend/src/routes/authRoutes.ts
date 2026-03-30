import express from 'express';
import { register, login, superAdminLogin, seedSuperAdmin, forgotPassword } from '../controllers/authController.js';

const router = express.Router();

// router.post('/register', register); // Disabled: No signup page for tenants or super admins
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/super-admin/login', superAdminLogin);
router.post('/super-admin/seed', seedSuperAdmin); // One-time setup, disable after use

export default router;
