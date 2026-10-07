import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    citizen: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    cityName: { type: String, default: '' },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String, default: '' }
    },
    // GeoJSON point for geo-spatial queries (duplicate detection, hotspot)
    geoLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    wasteType: {
        type: String,
        enum: ['Wet Waste', 'Dry Waste', 'Plastic Waste', 'Hazardous Waste', 'E-Waste', 'Organic', 'Recyclable', 'Mixed'],
        required: true,
        default: 'Mixed'
    },
    wasteInstructions: { type: String, default: '' },
    garbageIntensity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    proofImageUrl: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Submitted', 'Assigned', 'Cleaning', 'Completed', 'FalseReported'],
        default: 'Submitted'
    },
    coinsAwarded: { type: Number, default: 0 },
    // False report tracking
    falseReportFlag: { type: Boolean, default: false },
    falseReportReason: { type: String, default: '' },
    falseEvidenceUrl: { type: String, default: '' },
    falseReportLocation: { lat: { type: Number }, lng: { type: Number } },
    adminDecision: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

// Index for fast city-scoped queries
reportSchema.index({ city: 1, status: 1 });
reportSchema.index({ citizen: 1 });
reportSchema.index({ partner: 1 });
// 2dsphere index for geospatial queries
reportSchema.index({ geoLocation: '2dsphere' });

const Report = mongoose.model('Report', reportSchema);
export default Report;
