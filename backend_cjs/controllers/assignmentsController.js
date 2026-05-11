const { sequelize, Assignment, Customer, User, Service, AssignmentService, Commission, CustomerSession } = require('../models/index')

function toDecimal(n) { return Number.parseFloat(n).toFixed(2); }

// Create a new assignment
exports.createAssignment = async function createAssignment(req, res) {
  try {
    const { sessionId, employeeId, status = 'assigned', notes, serviceIds } = req.body;
    if (!sessionId || !employeeId) return res.status(400).json({ error: 'sessionId and employeeId required' });

    const session = await CustomerSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const a = await Assignment.create({
      CustomerId: session.CustomerId,
      CustomerSessionId: session.id,
      employeeId,
      status,
      notes
    });

    if (serviceIds && Array.isArray(serviceIds)) {
      const services = await Service.findAll({ where: { id: serviceIds } });
      for (const s of services) {
        await AssignmentService.create({
          AssignmentId: a.id,
          ServiceId: s.id,
          priceAtTime: s.price
        });
      }
    }

    const created = await Assignment.findByPk(a.id, { include: [Service, { model: User, as: 'Employee' }] });
    res.json(created);
  } catch (err) {
    console.error('createAssignment error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
}

// Add services to an assignment
exports.addServicesToAssignment = async function addServicesToAssignment(req, res) {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body; // array of service IDs

    const assignment = await Assignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const services = await Service.findAll({ where: { id: serviceIds } });

    for (const s of services) {
      const exists = await AssignmentService.findOne({
        where: { AssignmentId: assignment.id, ServiceId: s.id }
      });
      if (!exists) {
        await AssignmentService.create({
          AssignmentId: assignment.id,
          ServiceId: s.id,
          priceAtTime: s.price
        });
      }
    }

    const withServices = await Assignment.findByPk(id, { include: [Service] });
    res.json(withServices);
  } catch (err) {
    console.error('addServicesToAssignment error:', err);
    res.status(500).json({ error: 'Failed to add services' });
  }
}

// Complete an assignment (existing quick action)
exports.completeAssignment = async function completeAssignment(req, res) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id, { include: [Service, { model: User, as: 'Employee' }] });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    assignment.status = 'completed';
    assignment.completedAt = new Date();
    await assignment.save();

    // Calculate commission per service
    let totalCommission = 0;
    const assignmentServices = await AssignmentService.findAll({
      where: { AssignmentId: id },
      include: [Service]
    });

    for (const as of assignmentServices) {
      if (as.Service && as.Service.commissionEnabled) {
        const sRate = parseFloat(as.Service.commissionRate || '0') / 100;
        totalCommission += parseFloat(as.priceAtTime) * sRate;
      }
    }
    const commissionAmount = totalCommission.toFixed(2);
    await Commission.create({ assignmentId: assignment.id, employeeId: assignment.employeeId, amount: commissionAmount });

    res.json({ assignment, commissionAmount });
  } catch (err) {
    console.error('completeAssignment error:', err);
    res.status(500).json({ error: 'Failed to complete assignment' });
  }
}

// NEW: Update assignment details (employee, status, services, notes)
exports.updateAssignment = async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { employeeId, status, serviceIds, notes } = req.body;

    const assignment = await Assignment.findByPk(id, { include: [Service] });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    if (employeeId) {
      const user = await User.findByPk(employeeId);
      if (!user) return res.status(404).json({ error: 'Employee not found' });
      assignment.employeeId = employeeId;
    }

    if (status) assignment.status = status;
    if (notes !== undefined) assignment.notes = notes;

    await assignment.save();

    // Update services if provided
    if (serviceIds && Array.isArray(serviceIds)) {
      // Remove old services not in new list
      const currentServiceIds = assignment.Services.map(s => s.id);
      const toRemove = currentServiceIds.filter(sid => !serviceIds.includes(sid));
      await AssignmentService.destroy({ where: { AssignmentId: id, ServiceId: toRemove } });

      // Add new services
      const newServices = await Service.findAll({ where: { id: serviceIds } });
      for (const s of newServices) {
        const exists = await AssignmentService.findOne({ where: { AssignmentId: id, ServiceId: s.id } });
        if (!exists) {
          await AssignmentService.create({ AssignmentId: id, ServiceId: s.id, priceAtTime: s.price });
        }
      }
    }

    const updatedAssignment = await Assignment.findByPk(id, { include: [Service, { model: User, as: 'Employee' }] });
    res.json(updatedAssignment);
  } catch (err) {
    console.error('updateAssignment error:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
}

// Get a single assignment by its own ID
exports.getAssignment = async function getAssignment(req, res) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id, {
      include: [
        { model: Service },
        { model: User, as: 'Employee' },
        { model: CustomerSession, include: [Customer] },
      ],
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
}

// Get assignments by session ID
exports.getAssignmentsBySession = async function getAssignmentsBySession(req, res) {
  try {
    const { sessionId } = req.params;
    const assignments = await Assignment.findAll({
      where: { CustomerSessionId: sessionId },
      include: [
        { model: Service },
        { model: User, as: 'Employee' },
        { model: CustomerSession, include: [Customer] },
      ],
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session assignments' });
  }
}

// List all active (non-completed) assignments
exports.listActiveAssignments = async function listActiveAssignments(req, res) {
  try {
    const { Op } = await import('sequelize');
    const list = await Assignment.findAll({
      where: {
        status: { [Op.notIn]: ['completed', 'rejected'] },
      },
      include: [
        { model: Service },
        { model: User, as: 'Employee' },
        { model: CustomerSession, include: [Customer] },
      ],
      order: [['assignedAt', 'DESC']],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active assignments' });
  }
}

// List all assignments
exports.listAssignments = async function listAssignments(req, res) {
  try {
    const list = await Assignment.findAll({
      include: [
        Customer,
        { model: User, as: 'Employee' },
        Service,
        { model: CustomerSession, include: [Customer] },
      ],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
}

// Delete assignment
exports.deleteAssignment = async function deleteAssignment(req, res) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    await assignment.destroy();
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
}
