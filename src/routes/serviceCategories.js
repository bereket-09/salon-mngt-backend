import { Router } from 'express';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/serviceCategoriesController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', listCategories); // public — needed by service form & landing booking page
router.post('/', authRequired, requireRole('admin', 'manager'), createCategory);
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateCategory);
router.delete('/:id', authRequired, requireRole('admin', 'manager'), deleteCategory);
export default router;
