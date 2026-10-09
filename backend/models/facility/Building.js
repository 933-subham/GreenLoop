import mongoose from 'mongoose';
import facilityConnection from '../../config/facilityDb.js';

const buildingSchema = new mongoose.Schema({
    orgId: { type: String, required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: [
            'hostel', 'academic', 'canteen', 'library', 'administrative',
            'sports', 'pump_house', 'street_lighting', 'other'
        ],
        default: 'other'
    },
    floors: { type: Number, required: true, min: 1, max: 30, default: 1 },
    active: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now }
});

buildingSchema.index({ orgId: 1, code: 1 }, { unique: true });

const Building = facilityConnection.model('Building', buildingSchema);
export default Building;
