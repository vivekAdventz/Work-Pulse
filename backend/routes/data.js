import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAllData } from '../controllers/dataController.js';

const router = Router();

router.get('/all-data', asyncHandler(getAllData));

export default router;
