const { Router } = require('express')
const { listUsers, getMe, updateUser, deleteUser } = require('../controllers/usersController')
const { authRequired, requireRole } = require('../middleware/auth')
const { getCommissionSummary, getUserCommissionReport } = require('../controllers/commissionController')

const router = Router();

router.get('/', authRequired, listUsers);
router.get('/me', authRequired, getMe);
router.get('/commission-report/:userId', authRequired, getUserCommissionReport);
router.get('/commissions/summary', authRequired, getCommissionSummary);
router.get('/commissions/:userId', authRequired, getUserCommissionReport); // Alias for 404 fix
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateUser);
router.delete('/:id', authRequired, requireRole('admin'), deleteUser);

module.exports = router;
