import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateSummary, downloadCsv, generateDescription, fillByAI } from '../controllers/aiController.js';

const router = Router();

router.post('/generate-summary', asyncHandler(generateSummary));
router.post('/generate-description', asyncHandler(generateDescription));
router.post('/fill-by-ai', asyncHandler(fillByAI));
router.post('/download-csv', downloadCsv);

export default router;
