const { Router } = require('express')
const { authRequired } = require('../middleware/auth')
const {
    createAssignment,
    addServicesToAssignment,
    completeAssignment,
    getAssignment,
    getAssignmentsBySession,
    listAssignments,
    listActiveAssignments,
    updateAssignment,
    deleteAssignment,
} = require('../controllers/assignmentsController')

const router = Router();

// Must come BEFORE /:id to avoid route conflicts
router.get('/active', authRequired, listActiveAssignments);
router.get('/session/:sessionId', authRequired, getAssignmentsBySession);

router.post('/', authRequired, createAssignment);
router.post('/:id/services', authRequired, addServicesToAssignment);
router.post('/:id/complete', authRequired, completeAssignment);
router.get('/:id', authRequired, getAssignment);
router.get('/', authRequired, listAssignments);
router.put('/:id', authRequired, updateAssignment);
router.delete('/:id', authRequired, deleteAssignment);

module.exports = router;
