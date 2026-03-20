import { Router } from 'express';
import { listActiveSessions, getCustomerSessions, checkIn, completeSession, deleteSession } from '../controllers/sessionsController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/active', authRequired, listActiveSessions);
router.get('/customer/:customerId', authRequired, getCustomerSessions);
router.post('/check-in', authRequired, checkIn);
router.post('/:id/complete', authRequired, completeSession);
router.delete('/:id', authRequired, deleteSession);

export default router;
