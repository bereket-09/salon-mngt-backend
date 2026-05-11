import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import {
  listPaymentMethods,
  getPaymentMethodLogo,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  upload,
} from '../controllers/paymentMethodsController.js';

const router = Router();

router.get('/', authRequired, listPaymentMethods);
router.get('/:id/logo', getPaymentMethodLogo);
router.post('/', authRequired, requireRole('admin'), upload.single('logo'), createPaymentMethod);
router.put('/:id', authRequired, requireRole('admin'), upload.single('logo'), updatePaymentMethod);
router.delete('/:id', authRequired, requireRole('admin'), deletePaymentMethod);

export default router;
