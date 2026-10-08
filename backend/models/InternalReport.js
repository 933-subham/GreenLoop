import mongoose from 'mongoose';

const internalReportSchema = new mongoose.Schema({
    facilityId: { type: String, required: true, index: true },
    reporterName: { type: String, required: true, default: 'Student / Campus Member' },
    reporterRole: {
        type: String,
        enum: ['student', 'employee', 'faculty', 'visitor', 'janitorial_staff'],
        default: 'student'
    },
    locationName: { type: String, required: true },
    wasteType: {
        type: String,
        enum: ['Dry / Plastic Waste', 'Organic / Canteen Food Waste', 'Hazardous / Lab Waste', 'Mixed Garbage'],
        default: 'Mixed Garbage'
    },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'assigned_to_janitor', 'collected_to_main_bin'],
        default: 'pending'
    },
    assignedJanitorName: { type: String, default: '' },
    assignedAt: { type: Date },
    collectedAt: { type: Date },
    targetDumpBinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
    notes: { type: String, default: '' }
}, { timestamps: true });

internalReportSchema.index({ facilityId: 1, status: 1 });

const InternalReport = mongoose.model('InternalReport', internalReportSchema);
export default InternalReport;
