const dotenv = require('dotenv')
dotenv.config();
const bcrypt = require('bcryptjs')
const { sequelize, Branch, User, Service, Customer } = require('../models/index')

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

  await Service.create({ name: 'Haircut', type: 'haircut', price: 100.00, status: 'active', BranchId: b2.id });
  await Service.create({ name: 'Beard Trim', type: 'beard', price: 60.00, status: 'active', BranchId: b2.id });
  await Service.create({ name: 'Facial', type: 'facial', price: 150.00, status: 'active', BranchId: b1.id });

  await Customer.create({ name: 'John Doe', phone: '0912345678', BranchId: b2.id, checkInTime: new Date() });

  console.log('Seeded. Log in with username=admin password=Admin@123');
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
