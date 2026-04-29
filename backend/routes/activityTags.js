import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireSuperadmin } from '../middleware/requireSuperadmin.js';
import * as ctrl from '../controllers/activityTagController.js';

const router = Router();

router.get('/', asyncHandler(ctrl.list));
router.post('/', requireSuperadmin, asyncHandler(ctrl.create));
router.put('/:id', requireSuperadmin, asyncHandler(ctrl.update));
router.delete('/:id', requireSuperadmin, asyncHandler(ctrl.remove));

export default router;
