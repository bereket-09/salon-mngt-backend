import { User, Branch, ServiceCategory, UserCategory } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';

const { Op } = Sequelize;

const specialtyInclude = { model: ServiceCategory, as: 'Specialties', through: { attributes: [] }, required: false };

// Given a category id, return the set of category ids that count as a match:
// the category itself, its parent (super), and its children (subs).
async function resolveCategoryMatchIds(categoryId) {
  const cat = await ServiceCategory.findByPk(categoryId);
  if (!cat) return [Number(categoryId)];
  const ids = new Set([cat.id]);
  if (cat.parentId) ids.add(cat.parentId);
  const children = await ServiceCategory.findAll({ where: { parentId: cat.id }, attributes: ['id'] });
  children.forEach((c) => ids.add(c.id));
  return [...ids];
}

// List all users
export async function listUsers(req, res) {
  const { role, branchId, status, categoryId } = req.query;
  const andClauses = [];
  if (role) andClauses.push({ role });
  if (status) andClauses.push({ status });
  if (branchId && branchId !== 'all') {
    // BranchId=null means "available in every branch"
    andClauses.push({ [Op.or]: [{ BranchId: branchId }, { BranchId: null }] });
  }

  // Filter to employees whose specialties match the service category (or its parent/children).
  if (categoryId && categoryId !== 'all') {
    const matchIds = await resolveCategoryMatchIds(categoryId);
    const links = await UserCategory.findAll({ where: { ServiceCategoryId: matchIds }, attributes: ['UserId'] });
    const userIds = [...new Set(links.map((l) => l.UserId))];
    andClauses.push({ id: userIds.length ? userIds : [-1] }); // [-1] => no matches
  }

  const where = andClauses.length ? { [Op.and]: andClauses } : {};
  const users = await User.findAll({
    where,
    include: [Branch, specialtyInclude],
    attributes: { exclude: ['passwordHash'] },
  });
  res.json(users);
}

// Public: list active specialists (employees) for the booking page.
// Minimal fields only. Optional branchId + categoryId filtering.
export async function listPublicSpecialists(req, res) {
  try {
    const { branchId, categoryId } = req.query;
    const andClauses = [{ role: 'employee' }, { status: 'active' }];
    if (branchId && branchId !== 'all') {
      andClauses.push({ [Op.or]: [{ BranchId: branchId }, { BranchId: null }] });
    }
    if (categoryId && categoryId !== 'all') {
      const matchIds = await resolveCategoryMatchIds(categoryId);
      const links = await UserCategory.findAll({ where: { ServiceCategoryId: matchIds }, attributes: ['UserId'] });
      const userIds = [...new Set(links.map((l) => l.UserId))];
      andClauses.push({ id: userIds.length ? userIds : [-1] });
    }
    const employees = await User.findAll({
      where: { [Op.and]: andClauses },
      attributes: ['id', 'name', 'BranchId'],
      include: [{ model: ServiceCategory, as: 'Specialties', through: { attributes: [] }, attributes: ['id', 'name', 'parentId'] }],
    });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch specialists' });
  }
}

// Get current user
export async function getMe(req, res) {
  const me = await User.findByPk(req.user.id, { include: [Branch, specialtyInclude], attributes: { exclude: ['passwordHash'] } });
  res.json(me);
}

// Update user by ID
export async function updateUser(req, res) {
  const { id } = req.params;
    const { name, username, role, status, branchIds, categoryIds, commissionEnabled, commissionRate, phone, password } = req.body;

    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const updateData = { name, username, role, status, phone };
      if (commissionEnabled !== undefined) updateData.commissionEnabled = !!commissionEnabled;
      if (commissionRate !== undefined && commissionRate !== '' && commissionRate !== null) {
        const r = Math.max(1, Math.min(99, Math.round(Number(commissionRate))));
        updateData.commissionRate = r;
      }
      if (branchIds && branchIds.length > 0) updateData.BranchId = branchIds[0];
      else if (branchIds && branchIds.length === 0) updateData.BranchId = null;

      if (password && password.trim() !== '') {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      await user.update(updateData);

      if (branchIds) {
        await user.setBranches(branchIds);
      }
      if (categoryIds) {
        await user.setSpecialties(categoryIds);
      }

      const updated = await User.findByPk(id, { include: [Branch, specialtyInclude], attributes: { exclude: ['passwordHash'] } });
      res.json({ ok: true, message: 'User updated successfully', user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
}

// Delete user
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ ok: true, message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
}
