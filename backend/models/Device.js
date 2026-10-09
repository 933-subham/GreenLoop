import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    orgId: {
        type: String,
        required: true,
        index: true
    },
    buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        default: null
    },
    buildingCode: {
        type: String,
        uppercase: true,
        trim: true
    },
    floor: {
        type: mongoose.Schema.Types.Mixed, // number or 'campus'
        required: true,
        default: 1
    },
    type: {
        type: String,
        enum: ['power', 'water'],
        required: true
    },
    label: {
        type: String,
        required: true
    },
    zone: {
        type: String
    },
    lastSeen: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

deviceSchema.index({ orgId: 1, type: 1 });
deviceSchema.index({ buildingId: 1, floor: 1 });

const Device = mongoose.model('Device', deviceSchema);
export default Device;
