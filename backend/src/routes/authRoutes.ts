import express from 'express';
import { register, login, superAdminLogin, seedSuperAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/super-admin/login', superAdminLogin);
router.post('/super-admin/seed', seedSuperAdmin); // One-time setup, disable after use

export default router;
