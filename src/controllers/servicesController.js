import { Service, Branch, ServiceCategory } from '../models/index.js';
import { Sequelize } from 'sequelize';

const { Op } = Sequelize;

const clampPercent = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.max(1, Math.min(99, Math.round(n)));
};

// Create a new service
export async function createService(req, res) {
  const {
    name, type, price, status = 'active', branchId = null,
    gender = 'both', estimatedDuration = 30, categoryId = null,
    commissionEnabled = false, commissionRate = null
  } = req.body;
  try {
    const svc = await Service.create({
      name,
      type,
      price,
      status,
      BranchId: branchId || null,
      categoryId: categoryId || null,
      gender,
      estimatedDuration,
      commissionEnabled,
      commissionRate: commissionEnabled ? clampPercent(commissionRate) : null,
    });
    const created = await Service.findByPk(svc.id, {
      include: [Branch, { model: ServiceCategory, as: 'Category', include: [{ model: ServiceCategory, as: 'Parent' }] }],
    });
    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service' });
  }
}

// List all services
export async function listServices(req, res) {
  try {
    const { gender, branchId, status, search, categoryId } = req.query;
    const andClauses = [];
    if (gender) andClauses.push({ gender });
    if (status) andClauses.push({ status });
    if (categoryId && categoryId !== 'all') andClauses.push({ categoryId });
    if (branchId && branchId !== 'all') {
      // Branch-scoped: include services tied to that branch AND services with no branch (=available everywhere)
      andClauses.push({ [Op.or]: [{ BranchId: branchId }, { BranchId: null }] });
    }
    if (search) {
      andClauses.push({
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    const where = andClauses.length ? { [Op.and]: andClauses } : {};

    const list = await Service.findAll({
      where,
      include: [Branch, { model: ServiceCategory, as: 'Category', include: [{ model: ServiceCategory, as: 'Parent' }] }],
    });
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
    name, type, price, status, branchId, categoryId,
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
    if (categoryId !== undefined) service.categoryId = categoryId || null;
    if (gender !== undefined) service.gender = gender;
    if (estimatedDuration !== undefined) service.estimatedDuration = parseInt(estimatedDuration, 10);
    if (commissionEnabled !== undefined) service.commissionEnabled = !!commissionEnabled;
    if (commissionRate !== undefined) service.commissionRate = service.commissionEnabled ? clampPercent(commissionRate) : null;

    await service.save();
    const updated = await Service.findByPk(service.id, {
      include: [Branch, { model: ServiceCategory, as: 'Category', include: [{ model: ServiceCategory, as: 'Parent' }] }],
    });
    res.json(updated);
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
