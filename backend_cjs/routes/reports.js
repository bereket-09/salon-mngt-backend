const { Router } = require('express')
const { authRequired } = require('../middleware/auth')
const {
    getOverviewStats,
    getRevenueReport,
    getPerformanceReport,
    getServiceAnalytics,
    getBranchReport,
} = require('../controllers/reportsController')

const router = Router();

router.get('/overview', authRequired, getOverviewStats);
router.get('/revenue', authRequired, getRevenueReport);
router.get('/performance', authRequired, getPerformanceReport);
router.get('/services', authRequired, getServiceAnalytics);
router.get('/branches', authRequired, getBranchReport);

module.exports = router;
