import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
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

app.get('/api', (req, res) => res.json({ status: 'EcoCity API running 🌿', version: '2.0.0' }));

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌿 EcoCity Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
