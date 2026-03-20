import { CustomerSession, Customer, Branch, Assignment, Service, User, Invoice, InvoiceItem, Commission, AssignmentService, sequelize } from '../models/index.js';

export async function listActiveSessions(req, res) {
    try {
        const { branchId } = req.query;
        const where = { status: 'checked_in' };
        if (branchId) where.BranchId = branchId;

        const sessions = await CustomerSession.findAll({
            where,
            include: [
                { model: Customer },
                {
                    model: Assignment,
                    include: [Service, { model: User, as: 'Employee' }]
                }
            ],
            order: [['checkInTime', 'DESC']],
        });
        res.json(sessions);
    } catch (err) {
        console.error('listActiveSessions error:', err);
        res.status(500).json({ error: 'Failed to fetch active sessions', details: err.message });
    }
}

export async function getCustomerSessions(req, res) {
    try {
        const { customerId } = req.params;
        const sessions = await CustomerSession.findAll({
            where: { CustomerId: customerId },
            include: [
                { model: Customer },
                {
                    model: Assignment,
                    include: [Service, { model: User, as: 'Employee' }]
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(sessions);
    } catch (err) {
        console.error('getCustomerSessions error:', err);
        res.status(500).json({ error: 'Failed to fetch sessions', details: err.message });
    }
}

export async function checkIn(req, res) {
    try {
        const { customerId, branchId } = req.body;
        if (!customerId) return res.status(400).json({ error: 'customerId required' });

        const customer = await Customer.findByPk(customerId);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const session = await CustomerSession.create({
            CustomerId: customer.id,
            BranchId: branchId || customer.BranchId,
            checkInTime: new Date(),
            status: 'checked_in',
        });

        customer.status = 'checked_in';
        await customer.save();

        res.json(session);
    } catch (err) {
        console.error('checkIn error:', err);
        res.status(500).json({ error: 'Failed to check in', details: err.message });
    }
}

export async function completeSession(req, res) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const session = await CustomerSession.findByPk(id, {
            include: [
                {
                    model: Assignment,
                    include: [Service, { model: User, as: 'Employee' }]
                }
            ],
            transaction: t
        });
        if (!session) {
            await t.rollback();
            return res.status(404).json({ error: 'Session not found' });
        }

        // 1. Mark session as completed
        session.checkOutTime = new Date();
        session.status = 'completed';
        await session.save({ transaction: t });

        const customer = await Customer.findByPk(session.CustomerId, { transaction: t });
        if (customer) {
            customer.status = 'active';
            await customer.save({ transaction: t });
        }

        // 2. Finalize all assignments and calculate total
        let totalAmount = 0;
        const assignments = session.Assignments || [];

        for (const assignment of assignments) {
            // Mark assignment as completed if not already
            if (assignment.status !== 'completed' && assignment.status !== 'rejected') {
                assignment.status = 'completed';
                assignment.completedAt = new Date();
                await assignment.save({ transaction: t });
            }

            // Calculate services and commission for this assignment
            const assignmentServices = await AssignmentService.findAll({
                where: { AssignmentId: assignment.id },
                include: [Service],
                transaction: t
            });

            let assignmentCommission = 0;
            for (const as of assignmentServices) {
                const price = parseFloat(as.priceAtTime || 0);
                totalAmount += price;

                // Commission logic
                if (as.Service && as.Service.commissionEnabled && assignment.Employee) {
                    const sRate = parseFloat(as.Service.commissionRate);
                    const eRate = parseFloat(assignment.Employee.commissionRate);
                    
                    // Priority: Service Rate > Employee Rate > Default 10%
                    const effectiveRate = (!isNaN(sRate) && sRate > 0) ? sRate : ((!isNaN(eRate) && eRate > 0) ? eRate : 10);
                    
                    assignmentCommission += price * (effectiveRate / 100);
                }
            }

            // Create Commission Record if not exists
            if (assignmentCommission > 0 && assignment.employeeId) {
                const existingComm = await Commission.findOne({ 
                    where: { assignmentId: assignment.id },
                    transaction: t 
                });
                if (!existingComm) {
                    await Commission.create({
                        assignmentId: assignment.id,
                        employeeId: assignment.employeeId,
                        amount: assignmentCommission.toFixed(2),
                        status: 'unpaid'
                    }, { transaction: t });
                }
            }
        }

        // 3. Create Official Invoice
        let createdInvoiceId = null;
        if (totalAmount > 0) {
            const invoice = await Invoice.create({
                CustomerId: session.CustomerId,
                totalAmount: totalAmount.toFixed(2),
                paidAmount: totalAmount.toFixed(2),
                status: 'paid'
            }, { transaction: t });
            createdInvoiceId = invoice.id;

            // Create Invoice Items
            for (const assignment of assignments) {
                const assignmentServices = await AssignmentService.findAll({
                    where: { AssignmentId: assignment.id },
                    transaction: t
                });
                for (const as of assignmentServices) {
                    await InvoiceItem.create({
                        InvoiceId: invoice.id,
                        AssignmentId: assignment.id,
                        ServiceId: as.ServiceId,
                        price: as.priceAtTime
                    }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ 
            message: 'Session completed and invoiced successfully', 
            session,
            invoiceId: createdInvoiceId
        });
    } catch (err) {
        if (t) await t.rollback();
        console.error('completeSession error:', err);
        res.status(500).json({ error: 'Failed to complete session', details: err.message });
    }
}

export async function deleteSession(req, res) {
    try {
        const { id } = req.params;
        const session = await CustomerSession.findByPk(id);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const customerId = session.CustomerId;
        await session.destroy();

        const customer = await Customer.findByPk(customerId);
        if (customer) {
            customer.status = 'active';
            await customer.save();
        }

        res.json({ message: 'Session deleted' });
    } catch (err) {
        console.error('deleteSession error:', err);
        res.status(500).json({ error: 'Failed to delete session', details: err.message });
    }
}
