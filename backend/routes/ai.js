import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateSummary, downloadCsv, generateDescription } from '../controllers/aiController.js';

const router = Router();

router.post('/generate-summary', asyncHandler(generateSummary));
router.post('/generate-description', asyncHandler(generateDescription));
router.post('/download-csv', downloadCsv);

export default router;
