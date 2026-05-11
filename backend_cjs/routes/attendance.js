const { Router } = require('express')
const { authRequired } = require('../middleware/auth')
const { checkIn, checkOut, listAttendance, getStatus, toggleBreak, undoCheckout } = require('../controllers/attendanceController')

const router = Router();

router.post('/check-in', authRequired, checkIn);
router.post('/check-out', authRequired, checkOut);
router.post('/undo-checkout', authRequired, undoCheckout);
router.post('/toggle-break', authRequired, toggleBreak);
router.get('/status/:userId', authRequired, getStatus);
router.get('/', authRequired, listAttendance);

module.exports = router;
