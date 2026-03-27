import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAll, create, update, remove, getHierarchy } from '../controllers/userController.js';

const router = Router();

router.get('/', asyncHandler(getAll));
router.get('/:id/hierarchy', asyncHandler(getHierarchy));
router.post('/', asyncHandler(create));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

export default router;
