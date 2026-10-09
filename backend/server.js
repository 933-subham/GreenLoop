import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import cityRoutes from './routes/cityRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import binRoutes from './routes/binRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import readingRoutes from './routes/readingRoutes.js';
import simRoutes from './routes/simRoutes.js';
import { seedCampusHierarchy } from './services/campusSeeder.js';
import { startSimulator } from './services/simulatorService.js';

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean);
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/chatbot', chatbotRoutes);

// GreenLoop PS-4 Facility & Intelligence Routes
app.use('/api/facility', facilityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/demo', demoRoutes);

// Device Registry, Ingest & Real-Time Telemetry Routes
app.use('/api', readingRoutes);
app.use('/api/sim', simRoutes);

// Serve Dual Portals (Website 1 & Website 2)
const orgDist = fs.existsSync(path.join(__dirname, '../website1_org_webapp/dist'))
    ? path.join(__dirname, '../website1_org_webapp/dist')
    : path.join(__dirname, '../website1_org_portal');
const muniDist = fs.existsSync(path.join(__dirname, '../website2_municipal_webapp/dist'))
    ? path.join(__dirname, '../website2_municipal_webapp/dist')
    : path.join(__dirname, '../website2_municipal_portal');

app.use('/org', express.static(orgDist));
app.use('/municipal', express.static(muniDist));
app.get('/', (req, res) => res.redirect('/org'));

app.get('/api', (req, res) => res.json({ status: 'GreenLoop PS-4 Facility Intelligence API running 🌿', version: '2.5.0' }));


// Global error handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🌿 EcoCity Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    try {
        await seedCampusHierarchy('bput_college');
        if (process.env.SIM_AUTOSTART === 'true') {
            startSimulator();
        }
    } catch (e) {
        console.error('Initialization error:', e.message);
    }
});
