import mongoose from 'mongoose';

const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS, 10) || 3;
const TTL_SECONDS = LOG_RETENTION_DAYS * 86400; // 3 days = 259200s

const sensorReadingSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        index: true,
        uppercase: true,
        trim: true
    },
    orgId: {
        type: String,
        required: true,
        index: true,
        default: 'bput_college'
    },
    buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        default: null
    },
    floor: {
        type: mongoose.Schema.Types.Mixed, // number or 'campus'
        default: 1
    },
    type: {
        type: String,
        enum: ['power', 'water'],
        required: true
    },
    zone: {
        type: String
    },
    kw: {
        type: Number
    },
    tank_level_pct: {
        type: Number
    },
    flow_lpm: {
        type: Number,
        default: 0
    },
    ts: {
        type: Date,
        required: true,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['seed', 'live-sim', 'live', 'simulated-fault'],
        default: 'seed',
        index: true
    },
    expected: {
        type: Number
    },

    // Legacy backwards-compatibility fields
    facilityId: { type: String, default: 'bput_college' },
    module: { type: String, enum: ['power', 'water'] },
    zoneId: { type: String },
    timestamp: { type: Date },
    value: { type: Number },
    pumpOn: { type: Boolean, default: false },
    isClassHours: { type: Boolean, default: false },
    isWeekend: { type: Boolean, default: false },
    temperature: { type: Number, default: 28.0 },
    qualityFlag: {
        type: String,
        enum: ['valid', 'injected_fault', 'interpolated'],
        default: 'valid'
    }
}, { timestamps: true });

// TTL Index for automatic log retention
sensorReadingSchema.index({ ts: 1 }, { expireAfterSeconds: TTL_SECONDS });

// Fast device queries
sensorReadingSchema.index({ deviceId: 1, ts: -1 });

// Fast hierarchical aggregation
sensorReadingSchema.index({ orgId: 1, buildingId: 1, floor: 1, ts: -1 });

sensorReadingSchema.pre('save', function () {
    // Ensure ts is an actual Date instance
    if (this.ts && !(this.ts instanceof Date)) {
        this.ts = new Date(this.ts);
    }
    if (!this.ts) {
        this.ts = new Date();
    }

    // Sync legacy fields
    if (!this.orgId && this.facilityId) this.orgId = this.facilityId;
    if (!this.facilityId && this.orgId) this.facilityId = this.orgId;
    if (!this.module && this.type) this.module = this.type;
    if (!this.type && this.module) this.type = this.module;
    if (!this.zoneId && this.zone) this.zoneId = this.zone;
    if (!this.zone && this.zoneId) this.zone = this.zoneId;
    if (!this.timestamp && this.ts) this.timestamp = this.ts;

    if (this.value == null) {
        if (this.kw != null) this.value = this.kw;
        else if (this.tank_level_pct != null) this.value = this.tank_level_pct;
    }
    if (this.kw == null && this.type === 'power' && this.value != null) {
        this.kw = this.value;
    }
    if (this.tank_level_pct == null && this.type === 'water' && this.value != null) {
        this.tank_level_pct = this.value;
    }
});

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);
export default SensorReading;
