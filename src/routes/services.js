import { Router } from 'express';
import { createService, listServices, updateService, deleteService } from '../controllers/servicesController.js';
import { authRequired, requireRole } from '../middleware/auth.js';
const router = Router();
router.post('/', authRequired, requireRole('admin', 'manager'), createService);
router.get('/', listServices); // public — needed by landing page booking form
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateService);
router.delete('/:id', authRequired, requireRole('admin', 'manager'), deleteService);
export default router;
