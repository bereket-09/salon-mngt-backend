import multer from 'multer';
import { PaymentMethod } from '../models/index.js';

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const toPublic = (m) => {
  const json = m.toJSON();
  delete json.logo;
  json.logoUrl = m.logo ? `/payment-methods/${m.id}/logo` : null;
  return json;
};

export async function listPaymentMethods(req, res) {
  try {
    const { activeOnly } = req.query;
    const where = activeOnly === '1' ? { status: 'active' } : {};
    const methods = await PaymentMethod.findAll({
      where,
      order: [['order', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: ['logo'] },
    });
    res.json(methods.map(toPublic));
  } catch (err) {
    console.error('listPaymentMethods error:', err);
    res.status(500).json({ error: 'Failed to list payment methods' });
  }
}

export async function getPaymentMethodLogo(req, res) {
  try {
    const { id } = req.params;
    const m = await PaymentMethod.findByPk(id, { attributes: ['id', 'logo', 'mimeType'] });
    if (!m || !m.logo) return res.status(404).json({ error: 'Logo not found' });
    res.set('Content-Type', m.mimeType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(m.logo);
  } catch (err) {
    console.error('getPaymentMethodLogo error:', err);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
}

export async function createPaymentMethod(req, res) {
  try {
    const { name, type = 'bank', accountInfo, status = 'active', order = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const payload = { name, type, accountInfo, status, order: parseInt(order, 10) || 0 };
    if (req.file) {
      payload.logo = req.file.buffer;
      payload.mimeType = req.file.mimetype;
    }
    const method = await PaymentMethod.create(payload);
    res.status(201).json(toPublic(method));
  } catch (err) {
    console.error('createPaymentMethod error:', err);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
}

export async function updatePaymentMethod(req, res) {
  try {
    const { id } = req.params;
    const method = await PaymentMethod.findByPk(id);
    if (!method) return res.status(404).json({ error: 'Payment method not found' });
    const { name, type, accountInfo, status, order } = req.body;
    if (name !== undefined) method.name = name;
    if (type !== undefined) method.type = type;
    if (accountInfo !== undefined) method.accountInfo = accountInfo;
    if (status !== undefined) method.status = status;
    if (order !== undefined) method.order = parseInt(order, 10) || 0;
    if (req.file) {
      method.logo = req.file.buffer;
      method.mimeType = req.file.mimetype;
    }
    await method.save();
    res.json(toPublic(method));
  } catch (err) {
    console.error('updatePaymentMethod error:', err);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
}

export async function deletePaymentMethod(req, res) {
  try {
    const { id } = req.params;
    const method = await PaymentMethod.findByPk(id);
    if (!method) return res.status(404).json({ error: 'Payment method not found' });
    await method.destroy();
    res.json({ message: 'Payment method deleted' });
  } catch (err) {
    console.error('deletePaymentMethod error:', err);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
}
