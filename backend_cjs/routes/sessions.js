const { Router } = require('express')
const { listActiveSessions, getCustomerSessions, checkIn, completeSession, deleteSession } = require('../controllers/sessionsController')
const { authRequired } = require('../middleware/auth')

const router = Router();

router.get('/active', authRequired, listActiveSessions);
router.get('/customer/:customerId', authRequired, getCustomerSessions);
router.post('/check-in', authRequired, checkIn);
router.post('/:id/complete', authRequired, completeSession);
router.delete('/:id', authRequired, deleteSession);

module.exports = router;
