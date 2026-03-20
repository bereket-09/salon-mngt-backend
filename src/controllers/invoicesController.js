
import { sequelize, Invoice, InvoiceItem, Assignment, AssignmentService, Service, CustomerSession, Customer } from '../models/index.js';


export async function generateInvoiceForCustomer(req, res) {
  const { customerId } = req.params;
  const assignments = await Assignment.findAll({ where: { CustomerId: customerId }, include: [Service] });
  if (!assignments.length) return res.status(400).json({ error: 'No assignments for customer' });

  // Create invoice and items from assignment services
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.create({ CustomerId: customerId, totalAmount: 0, paidAmount: 0, status: 'pending' }, { transaction: t });
    let total = 0;
    for (const a of assignments) {
      const links = await AssignmentService.findAll({ where: { AssignmentId: a.id } });
      for (const link of links) {
        total += parseFloat(link.priceAtTime);
        await InvoiceItem.create({ InvoiceId: invoice.id, AssignmentId: a.id, ServiceId: link.ServiceId, price: link.priceAtTime }, { transaction: t });
      }
    }
    invoice.totalAmount = total.toFixed(2);
    await invoice.save({ transaction: t });
    await t.commit();
    const full = await Invoice.findByPk(invoice.id, { include: [InvoiceItem] });
    res.json(full);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
}

export async function markInvoicePaid(req, res) {
  const { id } = req.params;
  const invoice = await Invoice.findByPk(id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  invoice.paidAmount = invoice.totalAmount;
  invoice.status = 'paid';
  await invoice.save();
  res.json(invoice);
}

export async function listInvoices(req, res) {
  const list = await Invoice.findAll({
    include: [
      { model: InvoiceItem, include: [Service, Assignment] },
      { model: Customer }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json(list);
}



export async function generateInvoiceForSession(req, res) {
  const { sessionId } = req.params;

  // Fetch assignments for this session
  const assignments = await Assignment.findAll({
    where: { CustomerSessionId: sessionId },
    include: [Service]
  });

  if (!assignments.length) {
    return res.status(400).json({ error: 'No assignments for this session' });
  }

  // Start transaction
  const t = await sequelize.transaction();
  try {
    // Fetch session to get the customer ID
    const session = await CustomerSession.findByPk(sessionId);
    if (!session) throw new Error('Session not found');

    const invoice = await Invoice.create(
      { CustomerId: session.CustomerId, totalAmount: 0, paidAmount: 0, status: 'pending' },
      { transaction: t }
    );

    let total = 0;
    for (const a of assignments) {
      const links = await AssignmentService.findAll({ where: { AssignmentId: a.id } });
      for (const link of links) {
        total += parseFloat(link.priceAtTime);
        await InvoiceItem.create(
          { InvoiceId: invoice.id, AssignmentId: a.id, ServiceId: link.ServiceId, price: link.priceAtTime },
          { transaction: t }
        );
      }
    }

    invoice.totalAmount = total.toFixed(2);
    await invoice.save({ transaction: t });
    await t.commit();

    const fullInvoice = await Invoice.findByPk(invoice.id, { include: [InvoiceItem] });
    res.json(fullInvoice);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
}

export async function listInvoicesForCustomer(req, res) {
  const { customerId } = req.params;

  try {
    const invoices = await Invoice.findAll({
      where: { CustomerId: customerId },
      include: [
        { model: InvoiceItem, include: [Service, Assignment] }, // show services and assignments
        { model: Customer }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!invoices.length) {
      return res.status(404).json({ message: 'No invoices found for this customer' });
    }

    res.json(invoices);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}
