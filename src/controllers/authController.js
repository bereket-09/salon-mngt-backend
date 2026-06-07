import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Branch } from '../models/index.js';

export async function register(req, res) {
  try {
    const { name, username, password, role='employee', branchIds=[], categoryIds=[], commissionEnabled = false, commissionRate, phone } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const hash = await bcrypt.hash(password, 10);
    let safeRate = null;
    if (commissionEnabled && commissionRate !== undefined && commissionRate !== '' && commissionRate !== null) {
      safeRate = Math.max(1, Math.min(99, Math.round(Number(commissionRate))));
    }
    const user = await User.create({
      name, username, passwordHash: hash, role,
      BranchId: branchIds[0] || null,
      commissionEnabled: !!commissionEnabled,
      commissionRate: safeRate,
      phone,
    });
    
    if (branchIds.length > 0) {
      await user.setBranches(branchIds);
    }
    if (categoryIds.length > 0) {
      await user.setSpecialties(categoryIds);
    }

    return res.json({ id: user.id, name: user.name, username: user.username, role: user.role });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Register failed' });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
      where: { username } ,
      include: [{ model: Branch }]
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, role: user.role, branches: user.Branches } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  }
}
