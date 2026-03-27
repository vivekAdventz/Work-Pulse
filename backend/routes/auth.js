import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { login, microsoftLogin, superadminLogin, manualLogin } from '../controllers/authController.js';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/auth/microsoft', asyncHandler(microsoftLogin));
router.post('/auth/superadmin-login', asyncHandler(superadminLogin));
router.post('/auth/manual-login', asyncHandler(manualLogin));

export default router;
