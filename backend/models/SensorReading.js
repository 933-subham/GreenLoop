import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
    facilityId: { type: String, required: true, index: true },
    module: { type: String, enum: ['power', 'water'], required: true },
    zoneId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    value: { type: Number, required: true }, // kW for power, level_pct for water
    pumpOn: { type: Boolean, default: false }, // for water tanks
    isClassHours: { type: Boolean, default: false },
    isWeekend: { type: Boolean, default: false },
    temperature: { type: Number, default: 28.0 },
    qualityFlag: {
        type: String,
        enum: ['valid', 'injected_fault', 'interpolated'],
        default: 'valid'
    }
}, { timestamps: true });

sensorReadingSchema.index({ facilityId: 1, module: 1, zoneId: 1, timestamp: -1 });

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);
export default SensorReading;
