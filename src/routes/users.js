import { Router } from 'express';
import { listUsers, getMe, updateUser, deleteUser, listPublicSpecialists } from '../controllers/usersController.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { getCommissionSummary, getUserCommissionReport } from '../controllers/commissionController.js';

const router = Router();

router.get('/specialists', listPublicSpecialists); // public — booking page specialist picker
router.get('/', authRequired, listUsers);
router.get('/me', authRequired, getMe);
router.get('/commission-report/:userId', authRequired, getUserCommissionReport);
router.get('/commissions/summary', authRequired, getCommissionSummary);
router.get('/commissions/:userId', authRequired, getUserCommissionReport); // Alias for 404 fix
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateUser);
router.delete('/:id', authRequired, requireRole('admin'), deleteUser);

export default router;
