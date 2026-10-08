import mongoose from 'mongoose';

const pickupRequestSchema = new mongoose.Schema({
    facilityId: { type: String, required: true },
    binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
    binCode: { type: String, default: '' },
    binName: { type: String, default: '' },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['predicted', 'verified', 'requested', 'assigned', 'en_route', 'collected', 'closed', 'rejected'],
        default: 'predicted'
    },
    fillPctAtRequest: { type: Number, default: 85.0 },
    predictedAt: { type: Date, default: Date.now },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    requestedAt: { type: Date },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDriverName: { type: String, default: '' },
    assignedReason: {
        distanceKm: { type: Number, default: 1.8 },
        loadRatio: { type: Number, default: 0.35 },
        driverName: { type: String, default: 'Driver Ramesh' },
        score: { type: Number, default: 2.85 },
        explanation: { type: String, default: 'Nearest vehicle with available 65% capacity and active shift.' }
    },
    acceptedAt: { type: Date },
    proofImageUrl: { type: String, default: '' },
    collectedAt: { type: Date },
    closedAt: { type: Date },
    notes: { type: String, default: '' }
}, { timestamps: true });

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);
export default PickupRequest;
