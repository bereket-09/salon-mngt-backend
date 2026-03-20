import { Service, Branch } from '../models/index.js';
import { Sequelize } from 'sequelize';

const { Op } = Sequelize;

// Create a new service
export async function createService(req, res) {
  const {
    name, type, price, status = 'active', branchId = null,
    gender = 'both', estimatedDuration = 30,
    commissionEnabled = false, commissionRate = null
  } = req.body;
  try {
    const svc = await Service.create({
      name,
      type,
      price,
      status,
      BranchId: branchId || null,
      gender,
      estimatedDuration,
      commissionEnabled,
      commissionRate: commissionEnabled ? commissionRate : null,
    });
    res.json(svc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service' });
  }
}

// List all services
export async function listServices(req, res) {
  try {
    const { gender, branchId, status, search } = req.query;
    const where = {};
    if (gender) where.gender = gender;
    if (branchId) where.BranchId = branchId;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }

    const list = await Service.findAll({ where, include: [Branch] });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
}

// Update a service
export async function updateService(req, res) {
  const { id } = req.params;
  const {
    name, type, price, status, branchId,
    gender, estimatedDuration, commissionEnabled, commissionRate
  } = req.body;

  try {
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    if (name !== undefined) service.name = name;
    if (type !== undefined) service.type = type;
    if (price !== undefined) service.price = parseFloat(price);
    if (status !== undefined) service.status = status;
    if (branchId !== undefined) service.BranchId = branchId;
    if (req.body.BranchId !== undefined) service.BranchId = req.body.BranchId; // Support both casings
    if (gender !== undefined) service.gender = gender;
    if (estimatedDuration !== undefined) service.estimatedDuration = parseInt(estimatedDuration, 10);
    if (commissionEnabled !== undefined) service.commissionEnabled = commissionEnabled;
    if (commissionRate !== undefined) service.commissionRate = parseFloat(commissionRate);

    await service.save();
    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update service' });
  }
}

// Delete a service
export async function deleteService(req, res) {
  const { id } = req.params;
  try {
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await service.destroy();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
}
