import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateSummary, downloadCsv, generateDescription, fillByAI, fillEntryByAI } from '../controllers/aiController.js';

const router = Router();

router.post('/generate-summary', asyncHandler(generateSummary));
router.post('/generate-description', asyncHandler(generateDescription));
router.post('/fill-by-ai', asyncHandler(fillByAI));
router.post('/fill-entry-by-ai', asyncHandler(fillEntryByAI));
router.post('/download-csv', downloadCsv);

export default router;
