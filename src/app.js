import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import branchRoutes from './routes/branches.js';
import serviceRoutes from './routes/services.js';
import serviceCategoryRoutes from './routes/serviceCategories.js';
import customerRoutes from './routes/customers.js';
import assignmentRoutes from './routes/assignments.js';
import invoiceRoutes from './routes/invoices.js';
import attendanceRoutes from './routes/attendance.js';
import bookingRoutes from './routes/bookings.js';
import reportRoutes from './routes/reports.js';
import sessionRoutes from './routes/sessions.js';
import galleryRoutes from './routes/gallery.js';
import paymentMethodsRoutes from './routes/paymentMethods.js';

const app = express();
app.use(cors());
app.use(express.json());

// Multi-branch: the admin "All Branches" selector sends branchId=all to mean
// "aggregated / no branch filter". Normalize it once here so every controller
// treats it consistently as the absence of a branch filter.
app.use((req, res, next) => {
  if (req.query && req.query.branchId === 'all') delete req.query.branchId;
  next();
});

app.use((req, res, next) => {
  const isBinary = /^\/gallery\/\d+\/image$/.test(req.path) || /^\/payment-methods\/\d+\/logo$/.test(req.path);
  if (!isBinary) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

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
app.use('/service-categories', serviceCategoryRoutes);
app.use('/customers', customerRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/bookings', bookingRoutes);
app.use('/reports', reportRoutes);
app.use('/sessions', sessionRoutes);
app.use('/gallery', galleryRoutes);
app.use('/payment-methods', paymentMethodsRoutes);

if (process.env.RUN_SYNC === '1') {
  (async () => {
    await sequelize.sync({ alter: true });
    console.log('DB synced');
  })();
}

export default app;
