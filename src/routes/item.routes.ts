import { Router } from 'express';
import * as itemController from '../controllers/item.controller';
import { protect } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createItemSchema, updateItemSchema } from './schemas/item.schema';

const router = Router();

// All item routes require authentication
router.use(protect);

/**
 * @route   GET  /api/v1/items   — List (paginated)
 * @route   POST /api/v1/items   — Create
 * @access  Private
 */
router
  .route('/')
  .get(itemController.getAllItems)
  .post(validate(createItemSchema), itemController.createItem);

/**
 * @route   GET    /api/v1/items/:id  — Get one
 * @route   PUT    /api/v1/items/:id  — Update
 * @route   DELETE /api/v1/items/:id  — Delete
 * @access  Private
 */
router
  .route('/:id')
  .get(itemController.getItemById)
  .put(validate(updateItemSchema), itemController.updateItem)
  .delete(itemController.deleteItem);

export default router;
