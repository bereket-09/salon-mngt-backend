import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { generateInvoiceForCustomer, markInvoicePaid, listInvoices, generateInvoiceForSession, listInvoicesForCustomer } from '../controllers/invoicesController.js';
const router = Router();
router.post('/generate/customer/:customerId', authRequired, generateInvoiceForCustomer);
router.post('/generate/:sessionId', authRequired, generateInvoiceForSession);
router.get('/get/:customerId', authRequired, listInvoicesForCustomer);
router.post('/:id/pay', authRequired, markInvoicePaid);
router.get('/', authRequired, listInvoices);


export default router;
