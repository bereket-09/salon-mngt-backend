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
  // Initial super-categories
  const hairMale   = await ServiceCategory.create({ name: 'Hair - Male',   icon: 'mdi:face-man',    color: '#2563EB', order: 0 });
  const hairFemale = await ServiceCategory.create({ name: 'Hair - Female', icon: 'mdi:hair-dryer',   color: '#C8972A', order: 1 });
  const nails      = await ServiceCategory.create({ name: 'Nail',          icon: 'mdi:nail',         color: '#EC4899', order: 2 });
  const spa        = await ServiceCategory.create({ name: 'Spa',           icon: 'mdi:spa',          color: '#2DD4BF', order: 3 });

  // Sub-categories
  const menCut    = await ServiceCategory.create({ name: 'Haircut',          parentId: hairMale.id,   order: 0 });
  const beardCat  = await ServiceCategory.create({ name: 'Beard & Shave',    parentId: hairMale.id,   order: 1 });
  const womenCut  = await ServiceCategory.create({ name: 'Haircut',          parentId: hairFemale.id, order: 0 });
  const hairColor = await ServiceCategory.create({ name: 'Coloring',         parentId: hairFemale.id, order: 1 });
  const hairWash  = await ServiceCategory.create({ name: 'Wash & Treatment', parentId: hairFemale.id, order: 2 });
  const maniCat   = await ServiceCategory.create({ name: 'Manicure',         parentId: nails.id,      order: 0 });
  const pediCat   = await ServiceCategory.create({ name: 'Pedicure',         parentId: nails.id,      order: 1 });
  const facialCat = await ServiceCategory.create({ name: 'Facial',           parentId: spa.id,        order: 0 });

  await Service.create({ name: 'Haircut', type: 'haircut', price: 100.00, status: 'active', BranchId: b2.id, categoryId: menCut.id, gender: 'male' });
  await Service.create({ name: 'Beard Trim', type: 'beard', price: 60.00, status: 'active', BranchId: b2.id, categoryId: beardCat.id, gender: 'male' });
  await Service.create({ name: "Women's Haircut", type: 'haircut', price: 180.00, status: 'active', BranchId: b1.id, categoryId: womenCut.id, gender: 'female' });
  await Service.create({ name: 'Full Hair Color', type: 'color', price: 350.00, status: 'active', BranchId: b1.id, categoryId: hairColor.id, gender: 'female' });
  await Service.create({ name: 'Wash & Blow Dry', type: 'wash', price: 120.00, status: 'active', BranchId: b1.id, categoryId: hairWash.id, gender: 'female' });
  await Service.create({ name: 'Classic Manicure', type: 'manicure', price: 90.00, status: 'active', BranchId: b1.id, categoryId: maniCat.id, gender: 'female' });
  await Service.create({ name: 'Classic Pedicure', type: 'pedicure', price: 110.00, status: 'active', BranchId: b1.id, categoryId: pediCat.id, gender: 'female' });
  await Service.create({ name: 'Facial', type: 'facial', price: 150.00, status: 'active', BranchId: b1.id, categoryId: facialCat.id, gender: 'both' });

  // Employee specialties (super-category coverage cascades to its sub-categories at match time)
  await emp1.setSpecialties([hairMale.id]);                            // Barber One → all men's hair services
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
