import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    agencyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    vehicleType: {
        type: String,
        enum: ['Tata Ace Mini-Truck', 'Compactor Truck', 'Hydraulic Tipper', 'Electric Waste Cart'],
        default: 'Tata Ace Mini-Truck'
    },
    zone: { type: String, required: true, default: 'Zone 1 - Chhend Colony & BPUT' },
    capacityKg: { type: Number, default: 1500 },
    currentLoadKg: { type: Number, default: 450 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    activeTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    currentLocation: {
        lat: { type: Number, default: 22.2585 },
        lng: { type: Number, default: 84.8480 }
    },
    driverLicense: { type: String, default: 'OD-14-2022-99881' },
    shiftRemainingMin: { type: Number, default: 240 },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: '' }
}, { timestamps: true });

partnerSchema.index({ status: 1, zone: 1 });

const Partner = mongoose.model('Partner', partnerSchema);
export default Partner;
