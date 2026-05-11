const { Router } = require('express')
const { createCustomer, listCustomers, checkIn, checkOut, listCustomerSessions } = require('../controllers/customersController')
const { authRequired } = require('../middleware/auth')
const router = Router();
router.post('/', authRequired, createCustomer);
router.get('/', authRequired, listCustomers);
router.get('/sessions/:id', authRequired, listCustomerSessions);
router.post('/:id/check-in', authRequired, checkIn);
router.post('/:customerId/check-out', authRequired, checkOut);
module.exports = router;
