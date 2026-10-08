import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    facilityId: { type: String, required: true, index: true },
    module: {
        type: String,
        enum: ['power', 'water', 'waste', 'air_quality'],
        required: true
    },
    zoneId: { type: String, required: true },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'acknowledged', 'resolved', 'false_alarm', 'auto_closed'],
        default: 'open'
    },
    title: { type: String, required: true },
    why: {
        metric: { type: String, default: '' },
        actualValue: { type: String, default: '' },
        baselineExpected: { type: String, default: '' },
        statisticalZScore: { type: Number, default: 0 },
        modelType: { type: String, default: '' },
        explanation: { type: String, default: '' }
    },
    impact: {
        kwh: { type: Number, default: 0 },
        rupees: { type: Number, default: 0 },
        co2e_kg: { type: Number, default: 0 },
        kl: { type: Number, default: 0 }
    },
    confidence: { type: Number, default: 0.90 },
    assumptions: [{ type: String }],
    assignedRole: { type: String, default: 'warden' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wardenNotes: { type: String, default: '' },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    escalatedAt: { type: Date }
}, { timestamps: true });

alertSchema.index({ facilityId: 1, status: 1, createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
