import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    orgId: { type: String, default: 'bput_college', index: true },
    facilityId: { type: String, default: 'bput_college', index: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', default: null },
    floor: { type: mongoose.Schema.Types.Mixed, default: 1 },
    deviceId: { type: String, index: true },
    zone: { type: String },
    type: {
        type: String,
        enum: ['power', 'water', 'waste', 'air_quality'],
        required: true
    },
    module: {
        type: String,
        enum: ['power', 'water', 'waste', 'air_quality']
    },
    zoneId: { type: String },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'acknowledged', 'resolved', 'false_alarm', 'auto_closed'],
        default: 'open',
        index: true
    },
    title: { type: String, required: true },
    value: { type: Number },
    expected: { type: Number },
    percentOver: { type: Number },
    confidence: { type: Number, default: 0.90 },
    whyText: { type: String },
    suggestedAction: { type: String },
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
    assumptions: [{ type: String }],
    assignedRole: { type: String, default: 'warden' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wardenNotes: { type: String, default: '' },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    escalatedAt: { type: Date }
}, { timestamps: true });

alertSchema.pre('save', function () {
    if (!this.orgId && this.facilityId) this.orgId = this.facilityId;
    if (!this.facilityId && this.orgId) this.facilityId = this.orgId;
    if (!this.module && this.type) this.module = this.type;
    if (!this.type && this.module) this.type = this.module;
    if (!this.zoneId && this.zone) this.zoneId = this.zone;
    if (!this.zone && this.zoneId) this.zone = this.zoneId;
});

alertSchema.index({ orgId: 1, status: 1, createdAt: -1 });
alertSchema.index({ deviceId: 1, type: 1, status: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
