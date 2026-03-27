import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as crud from '../controllers/crudController.js';

/**
 * Creates a standard CRUD router for any Mongoose model.
 * Usage: app.use('/api/companies', createCrudRouter(Company))
 */
export function createCrudRouter(Model) {
  const router = Router();

  router.get('/', asyncHandler(crud.getAll(Model)));
  router.post('/', asyncHandler(crud.create(Model)));
  router.put('/:id', asyncHandler(crud.update(Model)));
  router.delete('/:id', asyncHandler(crud.remove(Model)));

  return router;
}
