/**
 * Admin Account Creator
 * Run: node utils/createAdmin.js
 * Creates or resets the admin account.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log(`ℹ️  Admin already exists: ${existingAdmin.email}`);
            console.log('   Delete it manually and re-run if you want a new one.');
            process.exit(0);
        }

        const admin = await User.create({
            name: 'Municipality Admin',
            email: process.env.ADMIN_EMAIL || 'admin@ecocity.gov',
            password: 'Admin@123', // Will be bcrypt hashed by the model
            role: 'admin',
            status: 'active',
        });

        console.log('🎉 Admin account created successfully!');
        console.log(`   Email   : ${admin.email}`);
        console.log(`   Password: Admin@123`);
        console.log('   ⚠️  Change the password after first login!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

createAdmin();
