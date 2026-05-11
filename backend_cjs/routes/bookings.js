const { Router } = require('express')
const { authRequired } = require('../middleware/auth')
const {
    createBooking,
    listBookings,
    getBooking,
    updateBookingStatus,
    convertBookingToSession,
    getBookingStats,
} = require('../controllers/bookingsController')

const router = Router();

// Public route — landing page customers can submit bookings without auth
router.post('/', createBooking);

// Protected routes — admin, manager, receptionist
router.get('/', authRequired, listBookings);
router.get('/stats', authRequired, getBookingStats);
router.get('/:id', authRequired, getBooking);
router.put('/:id/status', authRequired, updateBookingStatus);
router.post('/:id/convert', authRequired, convertBookingToSession);

module.exports = router;
