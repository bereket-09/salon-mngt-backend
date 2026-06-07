import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { sequelize, Branch, User, Service, ServiceCategory, Customer, PaymentMethod } from '../models/index.js';

async function main() {
  await sequelize.sync({ force: true });
  console.log('DB reset');
  const b1 = await Branch.create({ name: 'Main Branch', type: 'both', location: 'City Center' });
  const b2 = await Branch.create({ name: 'Men Only', type: 'male', location: 'West Side' });

  const adminPass = await bcrypt.hash('Admin@123', 10);
  const recPass = await bcrypt.hash('Reception@123', 10);
  const empPass = await bcrypt.hash('Employee@123', 10);

  await User.create({ name: 'Admin', username: 'admin', passwordHash: adminPass, role: 'admin', BranchId: b1.id });
  await User.create({ name: 'Reception', username: 'reception', passwordHash: recPass, role: 'receptionist', BranchId: b1.id });
  const emp1 = await User.create({ name: 'Barber One', username: 'barber1', passwordHash: empPass, role: 'employee', BranchId: b2.id });
  const emp2 = await User.create({ name: 'Hana Stylist', username: 'hana', passwordHash: empPass, role: 'employee', BranchId: b1.id });

  // ─── Service categories (two-level: super → sub) ────────────────────────────
  const hair = await ServiceCategory.create({ name: 'Hair', icon: 'mdi:hair-dryer', color: '#C8972A', order: 0 });
  const nails = await ServiceCategory.create({ name: 'Nails', icon: 'mdi:nail', color: '#EC4899', order: 1 });
  const spa = await ServiceCategory.create({ name: 'Spa & Skin', icon: 'mdi:spa', color: '#2DD4BF', order: 2 });

  const hairCut = await ServiceCategory.create({ name: 'Haircut', parentId: hair.id, order: 0 });
  const hairColor = await ServiceCategory.create({ name: 'Coloring', parentId: hair.id, order: 1 });
  const hairWash = await ServiceCategory.create({ name: 'Wash & Treatment', parentId: hair.id, order: 2 });
  const facialCat = await ServiceCategory.create({ name: 'Facial', parentId: spa.id, order: 0 });
  const maniCat = await ServiceCategory.create({ name: 'Manicure', parentId: nails.id, order: 0 });

  await Service.create({ name: 'Haircut', type: 'haircut', price: 100.00, status: 'active', BranchId: b2.id, categoryId: hairCut.id, gender: 'both' });
  await Service.create({ name: 'Beard Trim', type: 'beard', price: 60.00, status: 'active', BranchId: b2.id, categoryId: hairCut.id, gender: 'male' });
  await Service.create({ name: 'Full Hair Color', type: 'color', price: 350.00, status: 'active', BranchId: b1.id, categoryId: hairColor.id, gender: 'female' });
  await Service.create({ name: 'Wash & Blow Dry', type: 'wash', price: 120.00, status: 'active', BranchId: b1.id, categoryId: hairWash.id, gender: 'female' });
  await Service.create({ name: 'Facial', type: 'facial', price: 150.00, status: 'active', BranchId: b1.id, categoryId: facialCat.id, gender: 'both' });
  await Service.create({ name: 'Classic Manicure', type: 'manicure', price: 90.00, status: 'active', BranchId: b1.id, categoryId: maniCat.id, gender: 'female' });

  // Employee specialties (super-category coverage cascades to its sub-categories at match time)
  await emp1.setSpecialties([hair.id]);          // Barber One → all Hair services
  await emp2.setSpecialties([hairColor.id, facialCat.id, maniCat.id]); // Hana → coloring, facial, manicure

  await Customer.create({ name: 'John Doe', phone: '0912345678', BranchId: b2.id, checkInTime: new Date() });

  await PaymentMethod.bulkCreate([
    { name: 'Cash', type: 'cash', status: 'active', order: 0 },
    { name: 'Commercial Bank of Ethiopia', type: 'bank', status: 'active', order: 1 },
    { name: 'Bank of Abyssinia', type: 'bank', status: 'active', order: 2 },
    { name: 'Telebirr', type: 'bank', status: 'active', order: 3 },
  ]);

  console.log('Seeded. Log in with username=admin password=Admin@123');
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
