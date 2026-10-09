import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const FACILITY_DB_URI = process.env.FACILITY_DB_URI || 'mongodb://127.0.0.1:27017/estateiq_facility';

// Separate mongoose connection for EstateIQ facility data
export const facilityConnection = mongoose.createConnection(FACILITY_DB_URI);

facilityConnection.on('connected', () => {
    console.log(`🌿 EstateIQ Facility Database Connected: ${FACILITY_DB_URI}`);
});

facilityConnection.on('error', (err) => {
    console.error(`EstateIQ Facility Database Connection Error: ${err.message}`);
});

export default facilityConnection;
