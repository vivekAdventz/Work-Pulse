import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { login, microsoftLogin, superadminLogin, manualLogin, verifyOtp, resendOtp, setPassword, forgotPassword } from '../controllers/authController.js';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/auth/microsoft', asyncHandler(microsoftLogin));
router.post('/auth/superadmin-login', asyncHandler(superadminLogin));
router.post('/auth/manual-login', asyncHandler(manualLogin));
router.post('/auth/verify-otp', asyncHandler(verifyOtp));
router.post('/auth/resend-otp', asyncHandler(resendOtp));
router.post('/auth/set-password', asyncHandler(setPassword));
router.post('/auth/forgot-password', asyncHandler(forgotPassword));

export default router;
