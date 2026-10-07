import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopItem: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem', required: true },
    itemName: { type: String }, // snapshot at time of purchase
    ecoCoinsSpent: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Fulfilled', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
