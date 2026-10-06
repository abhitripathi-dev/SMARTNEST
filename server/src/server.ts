import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth';
import flatsRoutes from './routes/flats';
import residentsRoutes from './routes/residents';
import billsRoutes from './routes/bills';
import complaintsRoutes from './routes/complaints';
import visitorsRoutes from './routes/visitors';
import facilitiesRoutes from './routes/facilities';
import notificationsRoutes from './routes/notifications';
import membersRoutes from './routes/members';
import dashboardRoutes from './routes/dashboard';
import leadsRoutes from './routes/leads';
import societiesRoutes from './routes/societies';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MySQL',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Register all modular REST routes
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatsRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/visitors', visitorsRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/societies', societiesRoutes);

import fs from 'fs';

// Serve frontend static build if dist directory exists
const distPath = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// Catch-all for 404s on API endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` SmartNest MySQL REST API Server running on port ${PORT}`);
    console.log(` URL: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

startServer();

export default app;
