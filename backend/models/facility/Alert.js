import mongoose from 'mongoose';
import facilityConnection from '../../config/facilityDb.js';

const alertSchema = new mongoose.Schema({
    orgId: { type: String, required: true, index: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', default: null, index: true },
    floor: { type: mongoose.Schema.Types.Mixed, default: 1 },
    deviceId: { type: String, required: true, uppercase: true, trim: true, index: true },
    type: { type: String, required: true, index: true }, // 'power' | 'power_surge' | 'water_leak' | 'low_tank'
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'warning'], default: 'warning' },
    value: { type: Number, required: true },
    expected: { type: Number, required: true },
    percentOver: { type: Number, default: 0 },
    confidence: { type: Number, default: 0.95 },
    whyText: { type: String, required: true },
    suggestedAction: { type: String, default: '' },
    impact: {
        kwh: { type: Number, default: 0 },
        rupees: { type: Number, default: 0 },
        co2e_kg: { type: Number, default: 0 },
        litres: { type: Number, default: 0 }
    },
    assumptions: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open', index: true },
    note: { type: String, default: '' },
    wardenNotes: { type: String, default: '' },
    acknowledgedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true }
});

const Alert = facilityConnection.model('Alert', alertSchema);
export default Alert;
