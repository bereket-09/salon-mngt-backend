import { Op } from 'sequelize';
import {
    Assignment,
    AssignmentService,
    Customer,
    CustomerSession,
    Service,
    User, InvoiceItem
} from '../models/index.js';


const COMMISSION_RATE = parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0.02'); // 2%

// export async function getUserCommissionReport(req, res) {
//     try {
//         const { userId } = req.params; // expects route like /commission-report/:userId
//         const { days = 30 } = req.query;

//         // 1️⃣ Validate userId
//         if (!userId || isNaN(userId)) {
//             return res.status(400).json({ error: 'Valid userId is required' });
//         }

//         const sinceDate = new Date();
//         sinceDate.setDate(sinceDate.getDate() - Number(days));

//         // 2️⃣ Get completed assignments
//         const assignments = await Assignment.findAll({
//             where: {
//                 employeeId: userId,
//                 status: 'completed',
//                 completedAt: { [Op.gte]: sinceDate }
//             },
//             include: [
//                 { model: CustomerSession, include: [Customer] },
//                 { model: Service },
//                 { model: User, as: 'Employee' }
//             ],
//             order: [['completedAt', 'DESC']]
//         });

//         // 3️⃣ If no assignments → return friendly response
//         if (!assignments.length) {
//             return res.json({
//                 userId,
//                 message: 'No completed assignments found for this user in the given date range',
//                 dateRange: { from: sinceDate, to: new Date() },
//                 commissionRate: `${(COMMISSION_RATE * 100).toFixed(2)}%`,
//                 totalAssignments: 0,
//                 totalRevenue: 0,
//                 commissionAmount: 0,
//                 sessions: []
//             });
//         }

//         // 4️⃣ Build session & totals
//         let totalRevenue = 0;
//         let sessionMap = {};

//         for (const assignment of assignments) {
//             const sessionId = assignment.CustomerSession?.id || 'unknown';

//             const services = await AssignmentService.findAll({
//                 where: { AssignmentId: assignment.id },
//                 include: [Service]
//             });

//             const serviceDetails = services.map(s => ({
//                 serviceId: s.Service.id,
//                 serviceName: s.Service.name,
//                 price: parseFloat(s.priceAtTime)
//             }));

//             const assignmentTotal = serviceDetails.reduce((acc, s) => acc + s.price, 0);
//             totalRevenue += assignmentTotal;

//             if (!sessionMap[sessionId]) {
//                 sessionMap[sessionId] = {
//                     sessionId,
//                     customer: assignment.CustomerSession?.Customer?.name,
//                     checkIn: assignment.CustomerSession?.checkInTime,
//                     checkOut: assignment.CustomerSession?.checkOutTime,
//                     assignments: []
//                 };
//             }

//             sessionMap[sessionId].assignments.push({
//                 assignmentId: assignment.id,
//                 completedAt: assignment.completedAt,
//                 employee: assignment.Employee?.name,
//                 services: serviceDetails,
//                 total: assignmentTotal
//             });
//         }

//         const sessions = Object.values(sessionMap);
//         const commissionAmount = totalRevenue * COMMISSION_RATE;

//         return res.json({
//             userId,
//             userName: assignments[0]?.Employee?.name,
//             dateRange: { from: sinceDate, to: new Date() },
//             commissionRate: `${(COMMISSION_RATE * 100).toFixed(2)}%`,
//             totalAssignments: assignments.length,
//             totalSessions: sessions.length,
//             totalRevenue: totalRevenue.toFixed(2),
//             commissionAmount: commissionAmount.toFixed(2),
//             sessions
//         });

//     } catch (err) {
//         console.error('Error generating commission report:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

export async function getUserCommissionReport(req, res) {
    try {
        const { userId } = req.params;
        const { from, to } = req.query;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Valid userId is required' });
        }

        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : new Date();
        if (!fromDate || isNaN(fromDate)) {
            return res.status(400).json({ error: 'Valid "from" date is required' });
        }

        toDate.setHours(23, 59, 59, 999);

        const assignments = await Assignment.findAll({
            where: {
                employeeId: userId,
                status: 'completed',
                completedAt: { [Op.between]: [fromDate, toDate] }
            },
            include: [
                { model: CustomerSession, include: [Customer] },
                {
                    model: Service,
                    where: { commissionEnabled: true },
                    required: true
                },
                { model: User, as: 'Employee' }
            ],
            order: [['completedAt', 'DESC']]
        });

        if (!assignments.length) {
            return res.json({
                userId,
                message: 'No completed assignments found with commission enabled services in the given date range',
                dateRange: { from: fromDate, to: toDate },
                commissionRate: 'Service-Based',
                totalAssignments: 0,
                totalRevenue: 0,
                commissionAmount: '0.00',
                sessions: []
            });
        }

        let totalRevenue = 0;
        let totalCommission = 0;
        const sessionMap = {};

        for (const assignment of assignments) {
            const sessionId = assignment.CustomerSession?.id || 'unknown';

            // Re-fetch all services for the assignment to correctly build the full breakdown
            const assignmentServices = await AssignmentService.findAll({
                where: { AssignmentId: assignment.id },
                include: [Service]
            });

            let assignmentCommission = 0;
            const serviceDetails = assignmentServices.map(s => {
                const price = parseFloat(s.priceAtTime || 0);
                if (s.Service && s.Service.commissionEnabled) {
                    const sRate = parseFloat(s.Service.commissionRate || '0');
                    assignmentCommission += price * sRate;
                }
                return {
                    serviceId: s.Service?.id,
                    serviceName: s.Service?.name || 'Unknown',
                    price
                };
            });

            const assignmentTotal = serviceDetails.reduce((acc, s) => acc + s.price, 0);
            totalRevenue += assignmentTotal;
            totalCommission += assignmentCommission;

            if (!sessionMap[sessionId]) {
                sessionMap[sessionId] = {
                    sessionId,
                    customer: assignment.CustomerSession?.Customer?.name || 'Unknown',
                    checkIn: assignment.CustomerSession?.checkInTime,
                    checkOut: assignment.CustomerSession?.checkOutTime,
                    assignments: []
                };
            }

            sessionMap[sessionId].assignments.push({
                assignmentId: assignment.id,
                completedAt: assignment.completedAt,
                employee: assignment.Employee?.name,
                services: serviceDetails,
                total: assignmentTotal.toFixed(2),
                commission: assignmentCommission.toFixed(2)
            });
        }

        const sessions = Object.values(sessionMap);

        return res.json({
            userId,
            userName: assignments[0]?.Employee?.name,
            dateRange: { from: fromDate, to: toDate },
            commissionRate: 'Service-Based',
            totalAssignments: assignments.length,
            totalSessions: sessions.length,
            totalRevenue: totalRevenue.toFixed(2),
            commissionAmount: totalCommission.toFixed(2),
            sessions
        });

    } catch (err) {
        console.error('Error generating commission report:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}






export async function getCommissionSummary(req, res) {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ ok: false, message: 'Please provide both from and to dates' });
    }

    try {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        const users = await User.findAll();

        const summary = await Promise.all(
            users.map(async (user) => {
                // fetch completed assignments for this user in the date range
                const assignments = await Assignment.findAll({
                    where: {
                        employeeId: user.id,
                        status: 'completed',
                        completedAt: { [Op.between]: [fromDate, toDate] },
                    },
                    include: [
                        { model: CustomerSession, required: false },
                        {
                            model: Service,
                            where: { commissionEnabled: true },
                            required: true
                        }
                    ],
                });

                const totalAssignments = assignments.length;
                const totalSessions = new Set(assignments.map(a => a.CustomerSessionId).filter(Boolean)).size;

                // sum revenue and commission from AssignmentServices for those completed assignments
                let totalRevenue = 0;
                let totalCommission = 0;
                for (const assignment of assignments) {
                    const assignmentServices = await AssignmentService.findAll({
                        where: { AssignmentId: assignment.id },
                        include: [Service]
                    });
                    for (const as of assignmentServices) {
                        const price = parseFloat(as.priceAtTime || 0);
                        totalRevenue += price;
                        if (as.Service && as.Service.commissionEnabled) {
                            const sRate = parseFloat(as.Service.commissionRate || '0');
                            totalCommission += price * sRate;
                        }
                    }
                }

                const commissionAmount = totalCommission.toFixed(2);

                return {
                    userId: user.id,
                    userName: user.name,
                    dateRange: { from: fromDate.toISOString(), to: toDate.toISOString() },
                    commissionRate: 'Service-Based',
                    totalAssignments,
                    totalSessions,
                    totalRevenue: totalRevenue.toFixed(2),
                    commissionAmount,
                };
            })
        );

        res.json({ ok: true, summary });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: 'Failed to fetch commission summary', error: err.message });
    }
}

