const { Op } = require('sequelize')
const {
    sequelize,
    User,
    Customer,
    CustomerSession,
    Assignment,
    AssignmentService,
    Service,
    Invoice,
    InvoiceItem,
    Branch,
    Booking,
} = require('../models/index')

// GET /stats/overview — dashboard KPI snapshot
exports.getOverviewStats = async function getOverviewStats(req, res) {
    try {
        const { branchId } = req.query;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const currentBranchQuery = branchId ? { BranchId: branchId } : {};

        // Today's paid invoices total
        const todayInvoices = await Invoice.findAll({
            where: { status: 'paid', updatedAt: { [Op.between]: [todayStart, todayEnd] } },
            include: [{ model: Customer, where: currentBranchQuery }]
        });
        const todayRevenue = todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);

        // Active sessions (checked_in)
        const activeSessions = await CustomerSession.count({ where: { status: 'checked_in', ...currentBranchQuery } });

        // Pending bookings
        const pendingBookings = await Booking.count({ where: { status: 'pending', ...currentBranchQuery } });

        // Active staff (users with at least one active assignment today)
        // For staff we check users assigned to this branch
        let totalActiveStaff;
        if (branchId) {
            totalActiveStaff = await User.count({ 
                where: { status: 'active', role: 'employee' },
                include: [{ model: Branch, where: { id: branchId } }]
            });
        } else {
            totalActiveStaff = await User.count({ where: { status: 'active', role: 'employee' } });
        }

        // Assignments today
        const completedToday = await Assignment.count({
            where: {
                status: 'completed',
                completedAt: { [Op.between]: [todayStart, todayEnd] },
            },
            include: [{ model: CustomerSession, where: currentBranchQuery }]
        });

        // This week revenue
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekInvoices = await Invoice.findAll({
            where: { status: 'paid', updatedAt: { [Op.between]: [weekStart, todayEnd] } },
            include: [{ model: Customer, where: currentBranchQuery }]
        });
        const weekRevenue = weekInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);

        // This month revenue
        const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
        const monthInvoices = await Invoice.findAll({
            where: { status: 'paid', updatedAt: { [Op.between]: [monthStart, todayEnd] } },
            include: [{ model: Customer, where: currentBranchQuery }]
        });
        const monthRevenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);

        // Unpaid Bills (Invoices with 'pending' status)
        const openInvoices = await Invoice.count({ 
            where: { status: 'pending' },
            include: [{ model: Customer, where: currentBranchQuery }]
        });

        res.json({
            todayRevenue: parseFloat(todayRevenue).toFixed(2),
            weekRevenue: parseFloat(weekRevenue).toFixed(2),
            monthRevenue: parseFloat(monthRevenue).toFixed(2),
            activeSessions,
            pendingBookings,
            totalActiveStaff,
            completedToday,
            openInvoices,
        });
    } catch (err) {
        console.error('getOverviewStats error:', err);
        res.status(500).json({ error: 'Failed to fetch overview stats' });
    }
}

// GET /reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=
exports.getRevenueReport = async function getRevenueReport(req, res) {
    try {
        const { from, to, branchId } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        toDate.setHours(23, 59, 59, 999);

        const invoiceWhere = {
            status: 'paid',
            updatedAt: { [Op.between]: [fromDate, toDate] },
        };

        const customerWhere = {};
        if (branchId) customerWhere.BranchId = branchId;

        const invoices = await Invoice.findAll({
            where: invoiceWhere,
            include: [
                { model: Customer, where: Object.keys(customerWhere).length ? customerWhere : undefined, required: !!branchId },
                { model: InvoiceItem, include: [Service] },
            ],
            order: [['updatedAt', 'ASC']],
        });

        // Group by date
        const byDate = {};
        for (const inv of invoices) {
            const dateKey = inv.updatedAt.toISOString().slice(0, 10);
            if (!byDate[dateKey]) byDate[dateKey] = 0;
            byDate[dateKey] += parseFloat(inv.totalAmount || 0);
        }

        const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
        const dailyData = Object.entries(byDate).map(([date, amount]) => ({ date, amount: amount.toFixed(2) }));

        res.json({
            totalRevenue: totalRevenue.toFixed(2),
            totalInvoices: invoices.length,
            dateRange: { from: fromDate, to: toDate },
            daily: dailyData,
        });
    } catch (err) {
        console.error('getRevenueReport error:', err);
        res.status(500).json({ error: 'Failed to generate revenue report' });
    }
}

// GET /reports/performance?from=&to=
exports.getPerformanceReport = async function getPerformanceReport(req, res) {
    try {
        const { from, to, branchId } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const todayEnd = new Date();
        const toDate = to ? new Date(to) : todayEnd;
        toDate.setHours(23, 59, 59, 999);

        const employeeWhere = { role: 'employee' };
        if (branchId) {
             // To filter users by branch in Sequelize many-to-many
             // We can check if they have an association
        }

        const employees = await User.findAll({ 
            where: employeeWhere, 
            include: branchId ? [{ model: Branch, where: { id: branchId }, required: true }] : [Branch] 
        });

        const performance = await Promise.all(
            employees.map(async (emp) => {
                const assignments = await Assignment.findAll({
                    where: {
                        employeeId: emp.id,
                        status: 'completed',
                        completedAt: { [Op.between]: [fromDate, toDate] },
                    },
                });

                let totalRevenue = 0;
                let totalCommission = 0;
                for (const a of assignments) {
                    const assignmentServices = await AssignmentService.findAll({
                        where: { AssignmentId: a.id },
                        include: [Service]
                    });

                    for (const s of assignmentServices) {
                        const price = parseFloat(s.priceAtTime || 0);
                        totalRevenue += price;

                        if (s.Service?.commissionEnabled) {
                            const svcRate = s.Service.commissionRate;
                            const empRate = emp.commissionRate;
                            const effectiveRate = parseFloat(svcRate || empRate || process.env.DEFAULT_COMMISSION_RATE || 0.10);
                            totalCommission += price * effectiveRate;
                        }
                    }
                }

                return {
                    employeeId: emp.id,
                    name: emp.name,
                    branch: emp.Branch?.name || '—',
                    completedAssignments: assignments.length,
                    totalRevenue: totalRevenue.toFixed(2),
                    estimatedCommission: totalCommission.toFixed(2),
                };
            })
        );

        res.json({ performance, dateRange: { from: fromDate, to: toDate } });
    } catch (err) {
        console.error('getPerformanceReport error:', err);
        res.status(500).json({ error: 'Failed to generate performance report' });
    }
}

// GET /reports/services?from=&to=
exports.getServiceAnalytics = async function getServiceAnalytics(req, res) {
    try {
        const { from, to, branchId } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        toDate.setHours(23, 59, 59, 999);

        const services = await Service.findAll({ where: { status: 'active' } });
        const analytics = await Promise.all(
            services.map(async (svc) => {
                const assignmentWhere = {
                    status: 'completed',
                    completedAt: { [Op.between]: [fromDate, toDate] }
                };
                
                const sessionWhere = {};
                if (branchId) sessionWhere.BranchId = branchId;

                const count = await AssignmentService.count({
                    where: { ServiceId: svc.id },
                    include: [{
                        model: Assignment,
                        where: assignmentWhere,
                        required: true,
                        include: [{
                             model: CustomerSession,
                             where: sessionWhere,
                             required: true
                        }]
                    }]
                });
                const revenue = (count * parseFloat(svc.price)).toFixed(2);
                return { serviceId: svc.id, name: svc.name, gender: svc.gender, price: svc.price, timesBooked: count, revenue };
            })
        );
        analytics.sort((a, b) => b.timesBooked - a.timesBooked);
        res.json(analytics);
    } catch (err) {
        console.error('getServiceAnalytics error:', err);
        res.status(500).json({ error: 'Failed to generate service analytics' });
    }
}

// GET /reports/branches
exports.getBranchReport = async function getBranchReport(req, res) {
    try {
        const branches = await Branch.findAll({ where: { status: 'active' } });
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const report = await Promise.all(
            branches.map(async (branch) => {
                const activeCustomers = await CustomerSession.count({
                    where: {
                        BranchId: branch.id,
                        status: 'checked_in'
                    },
                });
                const staffCount = await User.count({ where: { BranchId: branch.id, role: 'employee', status: 'active' } });
                return { branchId: branch.id, name: branch.name, type: branch.type, location: branch.location, activeCustomers, staffCount };
            })
        );
        res.json(report);
    } catch (err) {
        console.error('getBranchReport error:', err);
        res.status(500).json({ error: 'Failed to generate branch report' });
    }
}
