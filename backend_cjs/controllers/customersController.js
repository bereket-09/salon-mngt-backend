const { Customer, Branch, Assignment, User, Service, CustomerSession } = require('../models/index')

exports.createCustomer = async function createCustomer(req, res) {
  try {
    const { name, phone, email = null, branchId, checkIn = false } = req.body;
    if (!branchId) return res.status(400).json({ error: 'branchId required' });
    const cust = await Customer.create({ name, phone, email, BranchId: branchId, status: checkIn ? 'checked_in' : 'active' });

    if (checkIn) {
      await CustomerSession.create({
        CustomerId: cust.id,
        checkInTime: new Date(),
        status: 'checked_in',
        BranchId: branchId
      });
    }

    res.json(cust);
  } catch (err) {
    console.error('createCustomer error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
}

exports.checkIn = async function checkIn(req, res) {
  try {
    const { id } = req.params; // customer id
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { branchId } = req.body;
    // Create a new session
    const session = await CustomerSession.create({
      CustomerId: customer.id,
      checkInTime: new Date(),
      status: 'checked_in',
      BranchId: branchId || customer.BranchId
    });

    // Update customer's status to indicate active session
    customer.status = 'checked_in';
    await customer.save();

    res.json(session);
  } catch (err) {
    console.error('checkIn error:', err);
    res.status(500).json({ error: 'Failed to check in' });
  }
}



exports.checkOut = async function checkOut(req, res) {
  try {
    const { customerId } = req.params;

    // Find the active session for this customer
    const session = await CustomerSession.findOne({
      where: { CustomerId: customerId, status: 'checked_in' },
    });

    if (!session) return res.status(404).json({ error: 'Active session not found for this customer' });

    session.checkOutTime = new Date();
    session.status = 'completed';
    await session.save();

    // Update customer status back to active
    const customer = await Customer.findByPk(customerId);
    if (customer) {
      customer.status = 'active';
      await customer.save();
    }

    res.json({ customer, session });
  } catch (err) {
    console.error('checkOut error:', err);
    res.status(500).json({ error: 'Failed to check out' });
  }
}



exports.listCustomerSessions = async function listCustomerSessions(req, res) {
  try {
    const { id } = req.params; // customer id
    const sessions = await CustomerSession.findAll({
      where: { CustomerId: id },
      include: [
        { model: Branch },
        { 
          model: Assignment, 
          include: [Service, { model: User, as: 'Employee' }] 
        }
      ],
      order: [['checkInTime', 'DESC']],
    });
    res.json(sessions);
  } catch (err) {
    console.error('listCustomerSessions error:', err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
}

// exports.checkIn = async function checkIn(req, res) {
//   const { id } = req.params;
//   const cust = await Customer.findByPk(id);
//   if (!cust) return res.status(404).json({ error: 'Not found' });
//   cust.checkInTime = new Date();
//   await cust.save();
//   res.json(cust);
// }

// exports.checkOut = async function checkOut(req, res) {
//   const { id } = req.params;
//   const cust = await Customer.findByPk(id);
//   if (!cust) return res.status(404).json({ error: 'Not found' });
//   cust.checkOutTime = new Date();
//   cust.status = 'completed';
//   await cust.save();
//   res.json(cust);
// }

exports.listCustomers = async function listCustomers(req, res) {
  try {
    const { status, branchId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (branchId) where.BranchId = branchId;
    
    const list = await Customer.findAll({
      where,
      include: [Branch]
    });
    res.json(list);
  } catch (err) {
    console.error('listCustomers error:', err);
    res.status(500).json({ error: 'Failed to list customers' });
  }
}
