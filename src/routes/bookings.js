import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    createBooking,
    listBookings,
    getBooking,
    updateBookingStatus,
    convertBookingToSession,
    getBookingStats,
} from '../controllers/bookingsController.js';

const router = Router();

// Public route — landing page customers can submit bookings without auth
router.post('/', createBooking);

// Protected routes — admin, manager, receptionist
router.get('/', authRequired, listBookings);
router.get('/stats', authRequired, getBookingStats);
router.get('/:id', authRequired, getBooking);
router.put('/:id/status', authRequired, updateBookingStatus);
router.post('/:id/convert', authRequired, convertBookingToSession);

export default router;
