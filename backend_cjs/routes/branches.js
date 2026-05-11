const { Router } = require('express')
const { createBranch, listBranches, updateBranch, deleteBranch } = require('../controllers/branchesController')
const { authRequired, requireRole } = require('../middleware/auth')
const router = Router();

router.post('/', authRequired, requireRole('admin', 'manager'), createBranch);
router.get('/', listBranches); // Public — needed by landing page booking form
router.put('/:id', authRequired, requireRole('admin', 'manager'), updateBranch);
router.delete('/:id', authRequired, requireRole('admin', 'manager'), deleteBranch);

module.exports = router;

