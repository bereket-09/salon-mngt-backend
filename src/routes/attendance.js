import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { checkIn, checkOut, listAttendance, getStatus, toggleBreak, undoCheckout } from '../controllers/attendanceController.js';

const router = Router();

router.post('/check-in', authRequired, checkIn);
router.post('/check-out', authRequired, checkOut);
router.post('/undo-checkout', authRequired, undoCheckout);
router.post('/toggle-break', authRequired, toggleBreak);
router.get('/status/:userId', authRequired, getStatus);
router.get('/', authRequired, listAttendance);

export default router;
