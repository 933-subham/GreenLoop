import mongoose from 'mongoose';
import dotenv from 'dotenv';
import City from '../models/City.js';

dotenv.config();

const ODISHA_CITIES = [
    // Khordha District
    { state: 'Odisha', district: 'Khordha', city: 'Bhubaneswar' },
    { state: 'Odisha', district: 'Khordha', city: 'Jatni' },
    { state: 'Odisha', district: 'Khordha', city: 'Khordha' },
    // Sundargarh District
    { state: 'Odisha', district: 'Sundargarh', city: 'Rourkela' },
    { state: 'Odisha', district: 'Sundargarh', city: 'Rajgangpur' },
    { state: 'Odisha', district: 'Sundargarh', city: 'Biramitrapur' },
    // Cuttack District
    { state: 'Odisha', district: 'Cuttack', city: 'Cuttack' },
    { state: 'Odisha', district: 'Cuttack', city: 'Choudwar' },
    { state: 'Odisha', district: 'Cuttack', city: 'Salepur' },
    // Puri District
    { state: 'Odisha', district: 'Puri', city: 'Puri' },
    { state: 'Odisha', district: 'Puri', city: 'Pipili' },
    { state: 'Odisha', district: 'Puri', city: 'Konark' },
    // Sambalpur District
    { state: 'Odisha', district: 'Sambalpur', city: 'Sambalpur' },
    { state: 'Odisha', district: 'Sambalpur', city: 'Burla' },
    { state: 'Odisha', district: 'Sambalpur', city: 'Hirakud' },
];

const seedCities = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        let added = 0, skipped = 0;
        for (const entry of ODISHA_CITIES) {
            try {
                await City.create(entry);
                console.log(`  ✔ Added: ${entry.state} / ${entry.district} / ${entry.city}`);
                added++;
            } catch (e) {
                if (e.code === 11000) { skipped++; } // duplicate
                else console.error(`  ✗ Error: ${e.message}`);
            }
        }

        console.log(`\n🌿 Done! Added: ${added}, Already existed: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
};

seedCities();
