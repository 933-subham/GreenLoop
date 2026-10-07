import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Compound unique — no duplicate city in same district/state
citySchema.index({ state: 1, district: 1, city: 1 }, { unique: true });

const City = mongoose.model('City', citySchema);
export default City;
