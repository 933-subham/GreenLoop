import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShopItem from '../models/ShopItem.js';

dotenv.config();

const ITEMS = [
    { name: 'Free Tree Sapling 🌱', description: 'Receive a free tree sapling from the city nursery to plant at home or in your locality.', category: 'Nature', ecoCoinsRequired: 30, imageEmoji: '🌱', stock: -1 },
    { name: 'EcoCity Tote Bag ♻️', description: 'A reusable, eco-friendly jute bag with the EcoCity logo. Reduce plastic use!', category: 'Utility', ecoCoinsRequired: 50, imageEmoji: '♻️', stock: 200 },
    { name: '₹20 Grocery Voucher 🛒', description: 'Discount voucher worth ₹20 at partner grocery stores. Valid for 30 days.', category: 'Voucher', ecoCoinsRequired: 40, imageEmoji: '🛒', stock: -1 },
    { name: 'Water Bottle (Stainless) 💧', description: 'A premium stainless steel water bottle to help reduce single-use plastic bottle usage.', category: 'Utility', ecoCoinsRequired: 80, imageEmoji: '💧', stock: 100 },
    { name: 'Bus Pass (1 Day) 🚌', description: 'One day unlimited bus pass in your city as a reward for contributing to a cleaner city.', category: 'Voucher', ecoCoinsRequired: 25, imageEmoji: '🚌', stock: -1 },
    { name: 'Compost Kit 🌿', description: 'Home composting starter kit to turn kitchen waste into fertilizer. Includes bin and instructions.', category: 'Nature', ecoCoinsRequired: 60, imageEmoji: '🌿', stock: 50 },
    { name: 'EcoCity Certificate 🏅', description: 'Official digital certificate from the Municipality recognizing your environmental contribution.', category: 'Reward', ecoCoinsRequired: 100, imageEmoji: '🏅', stock: -1 },
    { name: 'Seed Packet (Kitchen Garden) 🥬', description: 'Packet of 5 vegetable seeds — tomato, spinach, coriander, chilli, and brinjal.', category: 'Nature', ecoCoinsRequired: 20, imageEmoji: '🥬', stock: -1 },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        let added = 0, skipped = 0;
        for (const item of ITEMS) {
            const exists = await ShopItem.findOne({ name: item.name });
            if (exists) { skipped++; continue; }
            await ShopItem.create(item);
            console.log(`  ✔ ${item.name}`);
            added++;
        }
        console.log(`\n🛍️ Shop seeded! Added: ${added}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('❌', err.message);
        process.exit(1);
    }
};
seed();
