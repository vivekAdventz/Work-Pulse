import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAll, create, update, remove } from '../controllers/timeEntryController.js';

const router = Router();

router.get('/', asyncHandler(getAll));
router.post('/', asyncHandler(create));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

export default router;
