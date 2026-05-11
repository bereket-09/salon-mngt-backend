const { Router } = require('express')
const { authRequired } = require('../middleware/auth')
const { generateInvoiceForCustomer, markInvoicePaid, listInvoices, generateInvoiceForSession, listInvoicesForCustomer } = require('../controllers/invoicesController')
const router = Router();
router.post('/generate/customer/:customerId', authRequired, generateInvoiceForCustomer);
router.post('/generate/:sessionId', authRequired, generateInvoiceForSession);
router.get('/get/:customerId', authRequired, listInvoicesForCustomer);
router.post('/:id/pay', authRequired, markInvoicePaid);
router.get('/', authRequired, listInvoices);


module.exports = router;
