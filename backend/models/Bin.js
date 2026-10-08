import mongoose from 'mongoose';

const binSchema = new mongoose.Schema({
    facilityId: { type: String, required: true, index: true },
    binCode: { type: String, required: true },
    zoneId: { type: String, required: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    capacityL: { type: Number, default: 240 },
    wasteType: {
        type: String,
        enum: ['Organic', 'Recyclable', 'Hazardous', 'Mixed', 'Biomedical_Red', 'Biomedical_Yellow'],
        default: 'Mixed'
    },
    currentFillPct: { type: Number, default: 45.0 },
    fillRatePerHour: { type: Number, default: 2.5 },
    hoursToFull: { type: Number, default: 18.0 },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'critical'],
        default: 'low'
    },
    lastSnapshotUrl: { type: String, default: '' },
    cameraStatus: { type: String, enum: ['online', 'offline', 'degraded'], default: 'online' },
    modelMode: { type: String, enum: ['simulated', 'trained'], default: 'simulated' },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'verified', 'requested', 'assigned', 'collected'],
        default: 'unverified'
    }
}, { timestamps: true });

const Bin = mongoose.model('Bin', binSchema);
export default Bin;
