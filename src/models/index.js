import { Sequelize, DataTypes } from 'sequelize';
import pg from 'pg';
import { dbConfig } from '../config/database.js';

if (!dbConfig.url) {
  throw new Error('DATABASE_URL is not set. Add your Neon connection string to .env');
}

export const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect,
  dialectModule: pg,
  logging: dbConfig.logging,
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
});

// ─── Models ──────────────────────────────────────────────────────────────────

export const Branch = sequelize.define('Branch', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'both' },
  location: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
}, { tableName: 'branches' });

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'employee' },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
  commissionEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  commissionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  phone: { type: DataTypes.STRING },
}, { tableName: 'users' });

export const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  checkInTime: { type: DataTypes.DATE },
  checkOutTime: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'active' }
}, { tableName: 'customers' });

export const ServiceCategory = sequelize.define('ServiceCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  parentId: { type: DataTypes.INTEGER, allowNull: true }, // null = super-category, set = sub-category
  icon: { type: DataTypes.STRING, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
}, { tableName: 'service_categories' });

export const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  gender: { type: DataTypes.STRING, allowNull: false, defaultValue: 'both' },
  estimatedDuration: { type: DataTypes.INTEGER, defaultValue: 30 },
  commissionEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  commissionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  code: { type: DataTypes.STRING, unique: true },
}, {
  tableName: 'services',
  hooks: {
    afterCreate: async (service, options) => {
      if (!service.code) {
        const prefix = service.name.substring(0, 3).toUpperCase();
        service.code = `${prefix}-${service.id}`;
        await service.save({ transaction: options.transaction });
      }
    }
  }
});

export const Assignment = sequelize.define('Assignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.STRING, defaultValue: 'assigned' },
  assignedAt: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  employeeId: { type: DataTypes.INTEGER, allowNull: true },
  completedAt: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'assignments' });

export const AssignmentService = sequelize.define('AssignmentService', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  priceAtTime: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'assigned' },
}, { tableName: 'assignment_service' });

export const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  paymentMethodSnapshot: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'invoices' });

export const PaymentMethod = sequelize.define('PaymentMethod', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'bank' },
  accountInfo: { type: DataTypes.STRING, allowNull: true },
  logo: { type: DataTypes.BLOB, allowNull: true },
  mimeType: { type: DataTypes.STRING, allowNull: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
}, { tableName: 'payment_methods' });

export const InvoiceItem = sequelize.define('InvoiceItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'invoice_items' });

export const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  checkInTime: { type: DataTypes.DATE },
  checkOutTime: { type: DataTypes.DATE },
  totalHours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  breakMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastBreakStartTime: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'present' },
  lat: { type: DataTypes.FLOAT },
  lng: { type: DataTypes.FLOAT },
  events: { type: DataTypes.JSONB },
  BranchId: { type: DataTypes.INTEGER, allowNull: true },
  UserId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'attendance' });

export const Commission = sequelize.define('Commission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'unpaid' }
}, { tableName: 'commissions' });

export const CustomerSession = sequelize.define(
  'CustomerSession',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    checkInTime: { type: DataTypes.DATE, allowNull: false },
    checkOutTime: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'checked_in' },
    BranchId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'customer_sessions' }
);

export const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  serviceIds: { type: DataTypes.JSONB, defaultValue: [] },
  preferredDate: { type: DataTypes.DATEONLY },
  preferredTime: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  convertedToSessionId: { type: DataTypes.INTEGER, allowNull: true },
  BranchId: { type: DataTypes.INTEGER, allowNull: true },
  EmployeeId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'bookings' });

export const GalleryImage = sequelize.define('GalleryImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  url: { type: DataTypes.STRING, allowNull: true },
  data: { type: DataTypes.BLOB, allowNull: true },
  mimeType: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
}, { tableName: 'gallery_images' });

export const UserBranch = sequelize.define('UserBranch', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'user_branches' });

export const UserCategory = sequelize.define('UserCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'user_categories' });

// ─── Relationships ────────────────────────────────────────────────────────────

// Many-to-many: User <-> Branch through UserBranch
User.belongsToMany(Branch, { through: UserBranch });
Branch.belongsToMany(User, { through: UserBranch });
User.belongsTo(Branch, { as: 'HomeBranch', foreignKey: 'BranchId' }); // Kept for backward compat/primary branch
Branch.hasMany(User, { foreignKey: 'BranchId' });

Branch.hasMany(Customer, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
Customer.belongsTo(Branch);

Branch.hasMany(Service, { foreignKey: { allowNull: true }, onDelete: 'SET NULL' });
Service.belongsTo(Branch);

// Service categories (two-level: super-category -> sub-category via self-reference)
ServiceCategory.belongsTo(ServiceCategory, { as: 'Parent', foreignKey: 'parentId' });
ServiceCategory.hasMany(ServiceCategory, { as: 'Children', foreignKey: 'parentId' });

ServiceCategory.hasMany(Service, { foreignKey: { name: 'categoryId', allowNull: true }, onDelete: 'SET NULL' });
Service.belongsTo(ServiceCategory, { as: 'Category', foreignKey: 'categoryId' });

// Employee specialties: User <-> ServiceCategory many-to-many
User.belongsToMany(ServiceCategory, { through: UserCategory, as: 'Specialties', foreignKey: 'UserId', otherKey: 'ServiceCategoryId' });
ServiceCategory.belongsToMany(User, { through: UserCategory, as: 'Specialists', foreignKey: 'ServiceCategoryId', otherKey: 'UserId' });

User.hasMany(Attendance, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'UserId' });

Branch.hasMany(Attendance, { foreignKey: 'BranchId', onDelete: 'SET NULL' });
Attendance.belongsTo(Branch, { foreignKey: 'BranchId' });

Customer.hasMany(Assignment, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
Assignment.belongsTo(Customer);

User.hasMany(Assignment, { as: 'EmployeeAssignments', foreignKey: 'employeeId', onDelete: 'CASCADE' });
Assignment.belongsTo(User, { as: 'Employee', foreignKey: 'employeeId' });

// Many-to-many: Assignment <-> Service through AssignmentService
Assignment.belongsToMany(Service, { through: AssignmentService });
Service.belongsToMany(Assignment, { through: AssignmentService });

// Invoices
Customer.hasMany(Invoice, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
Invoice.belongsTo(Customer);

PaymentMethod.hasMany(Invoice, { foreignKey: { allowNull: true }, onDelete: 'SET NULL' });
Invoice.belongsTo(PaymentMethod);

Invoice.hasMany(InvoiceItem, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice);

Assignment.hasMany(InvoiceItem, { foreignKey: { allowNull: true }, onDelete: 'SET NULL' });
InvoiceItem.belongsTo(Assignment);

Service.hasMany(InvoiceItem, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Service);

// Commissions
User.hasMany(Commission, { as: 'EmployeeCommissions', foreignKey: { name: 'employeeId', allowNull: false }, onDelete: 'CASCADE' });
Commission.belongsTo(User, { as: 'Employee', foreignKey: 'employeeId' });

Assignment.hasOne(Commission, { foreignKey: { name: 'assignmentId', allowNull: false }, onDelete: 'CASCADE' });
Commission.belongsTo(Assignment, { foreignKey: 'assignmentId' });

// CustomerSession
Customer.hasMany(CustomerSession, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
CustomerSession.belongsTo(Customer);

Assignment.belongsTo(CustomerSession, { foreignKey: { allowNull: true }, onDelete: 'CASCADE' });
CustomerSession.hasMany(Assignment);

Branch.hasMany(CustomerSession, { foreignKey: { allowNull: true }, onDelete: 'SET NULL' });
CustomerSession.belongsTo(Branch);

AssignmentService.belongsTo(Service, { foreignKey: 'ServiceId' });
Service.hasMany(AssignmentService, { foreignKey: 'ServiceId' });

AssignmentService.belongsTo(Assignment, { foreignKey: 'AssignmentId' });
Assignment.hasMany(AssignmentService, { foreignKey: 'AssignmentId' });

// Booking
Branch.hasMany(Booking, { foreignKey: { allowNull: true }, onDelete: 'SET NULL' });
Booking.belongsTo(Branch);

User.hasMany(Booking, { foreignKey: 'EmployeeId' });
Booking.belongsTo(User, { as: 'Specialist', foreignKey: 'EmployeeId' });

export default {
  sequelize, Branch, User, Customer, Service, ServiceCategory, Assignment, AssignmentService,
  Invoice, InvoiceItem, Attendance, Commission, CustomerSession, Booking, UserBranch, UserCategory,
  PaymentMethod, GalleryImage,
};
