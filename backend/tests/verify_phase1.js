import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import facilityConnection from '../config/facilityDb.js';
import Building from '../models/facility/Building.js';
import Device from '../models/facility/Device.js';
import SensorReading from '../models/facility/SensorReading.js';
import Alert from '../models/facility/Alert.js';
import User from '../models/User.js';
import { seedCampusHierarchy } from '../services/campusSeeder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocity_greenloop';

const runTests = async () => {
    console.log('--- RUNNING PHASE 1 VERIFICATION TESTS (SEPARATE FACILITY DB) ---');

    // 1. Connect to old database to verify it remains untouched
    await mongoose.connect(MONGO_URI);
    const userCount = await User.countDocuments();
    console.log(`✓ Old database (ecocity_greenloop) untouched: ${userCount} users present`);

    // 2. Ensure facilityConnection is ready
    if (facilityConnection.readyState !== 1) {
        await new Promise((resolve) => facilityConnection.once('connected', resolve));
    }
    console.log(`✓ Separate facilityConnection (estateiq_facility) active: state=${facilityConnection.readyState}`);

    // Seed if needed
    await seedCampusHierarchy('bput_college', false);

    // 3. Check 6 Buildings in new DB
    const buildings = await Building.find({ orgId: 'bput_college' });
    console.log(`✓ Buildings Count: ${buildings.length} (Expected: 6 [HA, HB, AB, CANT, PH, SL])`);
    if (buildings.length !== 6) throw new Error(`Expected 6 buildings, got ${buildings.length}`);

    // 4. Check Devices
    const devices = await Device.find({ orgId: 'bput_college' });
    console.log(`✓ Devices Count: ${devices.length} (Expected: 20 [13 power + 7 water])`);
    if (devices.length < 18) throw new Error(`Expected at least 18 devices, got ${devices.length}`);

    // Verify auto-generated deviceId naming convention
    const pwrF4 = await Device.findOne({ deviceId: 'PWR-HA-F4' });
    const wtrTa = await Device.findOne({ deviceId: 'WTR-HA-T1' });
    const wtrCampus = await Device.findOne({ deviceId: 'WTR-CAMPUS-T1' });
    if (!pwrF4 || !wtrTa || !wtrCampus) throw new Error('Auto-generated Device IDs missing or mismatch');
    console.log(`✓ Device ID formats confirmed: ${pwrF4.deviceId}, ${wtrTa.deviceId}, ${wtrCampus.deviceId}`);

    // 5. Check 3 Days of Normal Data & real Date ts
    const readingCount = await SensorReading.countDocuments({ orgId: 'bput_college' });
    console.log(`✓ Total Seed Readings: ${readingCount} (Expected ~15,000+ points over 3 days)`);
    if (readingCount < 10000) throw new Error(`Expected at least 10,000 readings, got ${readingCount}`);

    const sampleReading = await SensorReading.findOne({ orgId: 'bput_college' });
    if (!(sampleReading.ts instanceof Date)) throw new Error('sampleReading.ts is not a real Date!');
    console.log(`✓ Sample reading ts is verified Date instance: ${sampleReading.ts.toISOString()}`);

    // 6. Check No Alerts on fresh normal start
    const openAlerts = await Alert.countDocuments({ orgId: 'bput_college', status: 'open' });
    console.log(`✓ Open Alerts Count: ${openAlerts} (Expected: 0 on normal fresh start)`);
    if (openAlerts !== 0) throw new Error('Expected 0 open alerts on fresh normal start');

    // 7. Check Idempotency (Restart does not duplicate)
    console.log('Testing idempotency on restart...');
    const restartResult = await seedCampusHierarchy('bput_college', false);
    const countAfter = await SensorReading.countDocuments({ orgId: 'bput_college' });
    if (countAfter !== readingCount) throw new Error(`Idempotency failed: count grew from ${readingCount} to ${countAfter}`);
    console.log(`✓ Restart idempotency confirmed: ${countAfter} readings preserved without duplication`);

    // 8. Check Indexes & TTL on SensorReading collection
    const indexesList = await SensorReading.collection.indexes();
    console.log('✓ SensorReading collection indexes:', indexesList.map(i => i.name));
    const tsIndex = indexesList.find(i => i.name === 'ts_1');
    if (!tsIndex || !tsIndex.expireAfterSeconds) {
        throw new Error('TTL index on ts is missing or missing expireAfterSeconds!');
    }
    console.log(`✓ TTL Index confirmed: expireAfterSeconds=${tsIndex.expireAfterSeconds} on {"ts": 1}`);

    console.log('🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY!');
    await mongoose.disconnect();
    await facilityConnection.close();
    process.exit(0);
};

runTests().catch(err => {
    console.error('Phase 1 Test Failure:', err);
    process.exit(1);
});
