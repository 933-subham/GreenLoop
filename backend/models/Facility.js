import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
    facilityId: { type: String, required: true, unique: true }, // e.g. 'bput_college', 'district_hospital', 'industrial_estate', 'municipal_hq'
    name: { type: String, required: true },
    facilityType: {
        type: String,
        enum: ['engineering_college', 'government_hospital', 'industrial_estate', 'municipal_facility'],
        default: 'engineering_college'
    },
    location: {
        lat: { type: Number, default: 22.2604 },
        lng: { type: Number, default: 84.8536 },
        address: { type: String, default: 'BPUT Campus, Chhend Colony, Rourkela, Odisha' },
        city: { type: String, default: 'Rourkela' },
        state: { type: String, default: 'Odisha' }
    },
    tariffInr: { type: Number, default: 7.50 }, // ₹/kWh
    gridEmissionFactor: { type: Number, default: 0.71 }, // kg CO2e / kWh
    waterCostPerKl: { type: Number, default: 18.0 }, // ₹/kL
    sustainabilityScore: { type: Number, default: 78.5 },
    scoreWeights: {
        power: { type: Number, default: 0.35 },
        water: { type: Number, default: 0.25 },
        waste: { type: Number, default: 0.25 },
        air: { type: Number, default: 0.15 }
    },
    zones: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['hostel_floor', 'academic_block', 'canteen', 'water_tank', 'bin_area', 'icu_ward', 'machinery_bay', 'civic_center'] },
        parent: { type: String, default: '' }
    }],
    activeDemoFaults: {
        floor3Surge: { type: Boolean, default: true },
        tankALeak: { type: Boolean, default: true },
        bin4Overflow: { type: Boolean, default: true },
        cameraMiss: { type: Boolean, default: false }
    }
}, { timestamps: true });

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;
