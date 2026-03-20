import { Router } from 'express';
import { createBranch, listBranches, updateBranch, deleteBranch } from '../controllers/branchesController.js';
import { authRequired, requireRole } from '../middleware/auth.js';
const router = Router();

router.post('/', authRequired, requireRole('admin', 'manager'), createBranch);
router.get('/', listBranches); // Public — needed by landing page booking form
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateBranch);
router.delete('/:id', authRequired, requireRole('admin', 'manager'), deleteBranch);

export default router;

