const { Router } = require('express')
const { createService, listServices, updateService, deleteService } = require('../controllers/servicesController')
const { authRequired, requireRole } = require('../middleware/auth')
const router = Router();
router.post('/', authRequired, requireRole('admin', 'manager'), createService);
router.get('/', listServices); // public — needed by landing page booking form
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateService);
router.delete('/:id', authRequired, requireRole('admin', 'manager'), deleteService);
module.exports = router;
