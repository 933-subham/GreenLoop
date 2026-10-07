import mongoose from 'mongoose';

const shopItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['Voucher', 'Nature', 'Reward', 'Utility'],
        default: 'Reward'
    },
    ecoCoinsRequired: { type: Number, required: true, min: 1 },
    stock: { type: Number, default: -1 }, // -1 = unlimited
    imageEmoji: { type: String, default: '🎁' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ShopItem = mongoose.model('ShopItem', shopItemSchema);
export default ShopItem;
