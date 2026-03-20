import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    createAssignment,
    addServicesToAssignment,
    completeAssignment,
    getAssignment,
    getAssignmentsBySession,
    listAssignments,
    listActiveAssignments,
    updateAssignment,
    deleteAssignment,
} from '../controllers/assignmentsController.js';

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

export default router;
