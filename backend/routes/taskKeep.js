import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getAllDays,
  createDay,
  updateDay,
  deleteDay,
  addTask,
  updateTask,
  deleteTask,
  moveTask,
  generatePlan,
  executePlan,
} from '../controllers/taskKeepController.js';

const router = Router();

// Static routes MUST come before parameterized routes
router.get('/', getAllDays);
router.post('/', createDay);
router.post('/generate-plan', asyncHandler(generatePlan));
router.post('/execute-plan', asyncHandler(executePlan));

router.put('/:dayId', updateDay);
router.delete('/:dayId', deleteDay);
router.post('/:dayId/tasks', addTask);
router.put('/:dayId/tasks/:taskId', updateTask);
router.delete('/:dayId/tasks/:taskId', deleteTask);
router.post('/:dayId/tasks/:taskId/move', moveTask);

export default router;
