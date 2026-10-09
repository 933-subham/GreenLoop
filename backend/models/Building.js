import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['hostel', 'academic', 'canteen', 'library', 'other'],
        required: true
    },
    floors: {
        type: Number,
        required: true,
        default: 1
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

buildingSchema.index({ orgId: 1, code: 1 }, { unique: true });

const Building = mongoose.model('Building', buildingSchema);
export default Building;
