import { User, Branch } from '../models/index.js';
import bcrypt from 'bcryptjs';

// List all users
export async function listUsers(req, res) {
  const { role, branchId, status } = req.query;
  const where = {};
  if (role) where.role = role;
  if (branchId) where.BranchId = branchId;
  if (status) where.status = status;
  const users = await User.findAll({ where, include: [Branch], attributes: { exclude: ['passwordHash'] } });
  res.json(users);
}

// Get current user
export async function getMe(req, res) {
  const me = await User.findByPk(req.user.id, { include: [Branch], attributes: { exclude: ['passwordHash'] } });
  res.json(me);
}

// Update user by ID
export async function updateUser(req, res) {
  const { id } = req.params;
    const { name, username, role, status, branchIds, commissionRate, phone, password } = req.body;
  
    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const updateData = { name, username, role, status, commissionRate, phone };
      if (branchIds && branchIds.length > 0) updateData.BranchId = branchIds[0];
  
      if (password && password.trim() !== '') {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
  
      await user.update(updateData);
      
      if (branchIds) {
        await user.setBranches(branchIds);
      }

      const updated = await User.findByPk(id, { include: [Branch], attributes: { exclude: ['passwordHash'] } });
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
