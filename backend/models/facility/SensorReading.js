import mongoose from 'mongoose';
import facilityConnection from '../../config/facilityDb.js';

const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS, 10) || 3;
const expireSeconds = retentionDays * 86400; // 3 days in seconds

const sensorReadingSchema = new mongoose.Schema({
    orgId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, uppercase: true, trim: true, index: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', default: null, index: true },
    floor: { type: mongoose.Schema.Types.Mixed, default: 1 },
    type: { type: String, enum: ['power', 'water_tank', 'water'], required: true, index: true },
    zone: { type: String, default: '' },
    kw: { type: Number, default: null },
    tank_level_pct: { type: Number, default: null },
    flow_lpm: { type: Number, default: null },
    ts: { type: Date, required: true },
    source: {
        type: String,
        enum: ['seed', 'live-sim', 'live', 'simulated-fault'],
        default: 'live',
        index: true
    },
    expected: { type: Number, default: null }
});

// TTL index to automatically purge old logs
sensorReadingSchema.index({ ts: 1 }, { expireAfterSeconds: expireSeconds });

// Compound indexes for ultra-fast time-series filtering & drill-down aggregation
sensorReadingSchema.index({ orgId: 1, deviceId: 1, ts: -1 });
sensorReadingSchema.index({ orgId: 1, buildingId: 1, floor: 1, ts: -1 });

const SensorReading = facilityConnection.model('SensorReading', sensorReadingSchema);
export default SensorReading;
