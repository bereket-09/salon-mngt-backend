import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    getOverviewStats,
    getRevenueReport,
    getPerformanceReport,
    getServiceAnalytics,
    getBranchReport,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/overview', authRequired, getOverviewStats);
router.get('/revenue', authRequired, getRevenueReport);
router.get('/performance', authRequired, getPerformanceReport);
router.get('/services', authRequired, getServiceAnalytics);
router.get('/branches', authRequired, getBranchReport);

export default router;
