const express = require('express')
const cors = require('cors')
const { sequelize } = require('./models/index')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const branchRoutes = require('./routes/branches')
const serviceRoutes = require('./routes/services')
const customerRoutes = require('./routes/customers')
const assignmentRoutes = require('./routes/assignments')
const invoiceRoutes = require('./routes/invoices')
const attendanceRoutes = require('./routes/attendance')
const bookingRoutes = require('./routes/bookings')
const reportRoutes = require('./routes/reports')
const sessionRoutes = require('./routes/sessions')
const galleryRoutes = require('./routes/gallery')

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Tactical Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.get('/', (req, res) => res.json({ status: 'ok', service: 'salon-backend-erp' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/branches', branchRoutes);
app.use('/services', serviceRoutes);
app.use('/customers', customerRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/bookings', bookingRoutes);
app.use('/reports', reportRoutes);
app.use('/sessions', sessionRoutes);
app.use('/gallery', galleryRoutes);

(async () => {
  await sequelize.sync({ alter: true }); // alter: true to apply schema changes without dropping data
  console.log('DB synced');
})();

module.exports = app;
