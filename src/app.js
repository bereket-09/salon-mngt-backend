import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import branchRoutes from './routes/branches.js';
import serviceRoutes from './routes/services.js';
import customerRoutes from './routes/customers.js';
import assignmentRoutes from './routes/assignments.js';
import invoiceRoutes from './routes/invoices.js';
import attendanceRoutes from './routes/attendance.js';
import bookingRoutes from './routes/bookings.js';
import reportRoutes from './routes/reports.js';
import sessionRoutes from './routes/sessions.js';
import galleryRoutes from './routes/gallery.js';

const app = express();
app.use(cors());
app.use(express.json());

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

export default app;
