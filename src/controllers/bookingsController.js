import { Booking, Branch, Customer, User, CustomerSession, Service, Assignment, AssignmentService } from '../models/index.js';

// Create a booking (public — no auth required, called from landing page)
export async function createBooking(req, res) {
    try {
        const { customerName, phone, email, branchId, serviceIds, preferredDate, preferredTime, notes, status, employeeId } = req.body;
        if (!customerName || !phone) {
            return res.status(400).json({ error: 'customerName and phone are required' });
        }
        const booking = await Booking.create({
            customerName,
            phone,
            email: email || null,
            BranchId: branchId || null,
            EmployeeId: employeeId || null,
            serviceIds: serviceIds || [],
            preferredDate: preferredDate || null,
            preferredTime: preferredTime || null,
            notes: notes || null,
            status: status || 'pending',
        });
        res.status(201).json(booking);
    } catch (err) {
        console.error('createBooking error:', err);
        res.status(500).json({ error: 'Failed to create booking' });
    }
}

// List all bookings with optional filters (admin/receptionist)
export async function listBookings(req, res) {
    try {
        const { status, branchId, date, employeeId } = req.query;
        const where = {};
        if (status && status !== 'all') where.status = status;
        if (branchId) where.BranchId = branchId;
        if (date) where.preferredDate = date;
        if (employeeId) where.EmployeeId = employeeId;

        const bookings = await Booking.findAll({
            where,
            include: [{ model: Branch }, { model: User, as: 'Specialist' }],
            order: [['createdAt', 'DESC']],
        });
        res.json(bookings);
    } catch (err) {
        console.error('listBookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

// Get a single booking
export async function getBooking(req, res) {
    try {
        const { id } = req.params;
        const booking = await Booking.findByPk(id, { include: [Branch] });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        console.error('getBooking error:', err);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
}

// Update booking status (confirm / cancel)
export async function updateBookingStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
        }
        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        booking.status = status;
        await booking.save();
        res.json(booking);
    } catch (err) {
        console.error('updateBookingStatus error:', err);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
}

// Convert booking into an active customer session
export async function convertBookingToSession(req, res) {
    try {
        const { id } = req.params;
        const { branchId } = req.body;

        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot convert a cancelled booking' });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({ error: 'Booking is already checked in' });
        }

        // Find or create customer by phone
        let customer = await Customer.findOne({ where: { phone: booking.phone } });
        if (!customer) {
            customer = await Customer.create({
                name: booking.customerName,
                phone: booking.phone,
                email: booking.email,
                BranchId: branchId || booking.BranchId || 1,
                status: 'checked_in',
                checkInTime: new Date(),
            });
        }

        // IMPORTANT: Check if customer already has an active session
        let session = await CustomerSession.findOne({
            where: { CustomerId: customer.id, status: 'checked_in' }
        });

        if (!session) {
            // Update customer status if they weren't checked in
            customer.status = 'checked_in';
            customer.checkInTime = new Date();
            customer.BranchId = branchId || booking.BranchId || customer.BranchId;
            await customer.save();

            // Create a new session
            session = await CustomerSession.create({
                CustomerId: customer.id,
                checkInTime: new Date(),
                status: 'checked_in',
                BranchId: customer.BranchId,
            });
        }

        // Create Assignment for services if they exist and aren't already assigned from this booking
        if (booking.serviceIds && Array.isArray(booking.serviceIds) && booking.serviceIds.length > 0) {
            const assignment = await Assignment.create({
                CustomerId: customer.id,
                CustomerSessionId: session.id, // Ensure this matches the model foreign key
                employeeId: booking.EmployeeId || null,
                status: 'assigned',
                assignedAt: new Date(),
            });

            const services = await Service.findAll({ where: { id: booking.serviceIds } });
            for (const s of services) {
                await AssignmentService.create({
                    AssignmentId: assignment.id,
                    ServiceId: s.id,
                    priceAtTime: s.price
                });
            }
        }

        // Update booking
        booking.status = 'completed';
        booking.convertedToSessionId = session.id;
        await booking.save();

        res.json({ booking, customer, session });
    } catch (err) {
        console.error('convertBookingToSession error:', err);
        res.status(500).json({ error: 'Failed to convert booking to session' });
    }
}

// Get booking stats summary
export async function getBookingStats(req, res) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const [pending, confirmed, cancelled, completed, todayTotal] = await Promise.all([
            Booking.count({ where: { status: 'pending' } }),
            Booking.count({ where: { status: 'confirmed' } }),
            Booking.count({ where: { status: 'cancelled' } }),
            Booking.count({ where: { status: 'completed' } }),
            Booking.count({ where: { preferredDate: today } }),
        ]);
        res.json({ pending, confirmed, cancelled, completed, todayTotal });
    } catch (err) {
        console.error('getBookingStats error:', err);
        res.status(500).json({ error: 'Failed to fetch booking stats' });
    }
}
