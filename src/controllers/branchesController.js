import { Branch } from '../models/index.js';

export async function createBranch(req, res) {
  try {
    const { name, type = 'both', location, status = 'active', phone, latitude, longitude } = req.body;
    const b = await Branch.create({ name, type, location, status, phone, latitude, longitude });
    res.json(b);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create branch' });
  }
}

export async function listBranches(req, res) {
  try {
    const list = await Branch.findAll();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list branches' });
  }
}

export async function updateBranch(req, res) {
  try {
    const { id } = req.params;
    const { name, type, location, status, phone, latitude, longitude } = req.body;
    const branch = await Branch.findByPk(id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    if (name !== undefined) branch.name = name;
    if (type !== undefined) branch.type = type;
    if (location !== undefined) branch.location = location;
    if (status !== undefined) branch.status = status;
    if (phone !== undefined) branch.phone = phone;
    if (latitude !== undefined) branch.latitude = latitude;
    if (longitude !== undefined) branch.longitude = longitude;

    await branch.save();
    res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update branch' });
  }
}

export async function deleteBranch(req, res) {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    await branch.destroy();
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
}
