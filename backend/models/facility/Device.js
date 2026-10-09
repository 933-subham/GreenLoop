import mongoose from 'mongoose';
import facilityConnection from '../../config/facilityDb.js';

const deviceSchema = new mongoose.Schema({
    orgId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
    floor: { type: mongoose.Schema.Types.Mixed, default: 1 }, // number or 'campus'
    type: { type: String, enum: ['power', 'water_tank'], required: true, index: true },
    label: { type: String, default: '' },
    lastSeen: { type: Date, default: null },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    active: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now }
});

const Device = facilityConnection.model('Device', deviceSchema);
export default Device;
