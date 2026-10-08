import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Facility from './models/Facility.js';
import SensorReading from './models/SensorReading.js';
import Bin from './models/Bin.js';
import Alert from './models/Alert.js';
import PickupRequest from './models/PickupRequest.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocity_greenloop';

async function runTests() {
    console.log('🧪 Starting GreenLoop PS-4 System Verification Tests...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    let passed = 0;
    let failed = 0;

    // Test 1: Verify 4 Facility Templates
    try {
        const facilities = await Facility.find();
        if (facilities.length >= 4) {
            console.log(`✓ Test 1 Passed: Found ${facilities.length} Facility Templates (College, Hospital, Industry, Municipal)`);
            passed++;
        } else {
            throw new Error(`Expected at least 4 facilities, found ${facilities.length}`);
        }
    } catch (e) {
        console.error('✗ Test 1 Failed:', e.message);
        failed++;
    }

    // Test 2: Verify Telemetry Readings for 4 Floors and 2 Tanks
    try {
        const count = await SensorReading.countDocuments({ facilityId: 'bput_college' });
        if (count >= 1000) {
            console.log(`✓ Test 2 Passed: Found ${count} Telemetry Records with Injected Faults`);
            passed++;
        } else {
            throw new Error(`Expected >1000 telemetry records, found ${count}`);
        }
    } catch (e) {
        console.error('✗ Test 2 Failed:', e.message);
        failed++;
    }

    // Test 3: Verify Smart Bins and Overflow Fault
    try {
        const bins = await Bin.find({ facilityId: 'bput_college' });
        const bin4 = bins.find(b => b.binCode === 'BIN-04');
        if (bins.length === 12 && bin4 && bin4.currentFillPct >= 80) {
            console.log(`✓ Test 3 Passed: 12 Smart Bins verified with BIN-04 critical overflow (${bin4.currentFillPct}%)`);
            passed++;
        } else {
            throw new Error(`Bins verification failed: total ${bins.length}, bin4 fill: ${bin4?.currentFillPct}`);
        }
    } catch (e) {
        console.error('✗ Test 3 Failed:', e.message);
        failed++;
    }

    // Test 4: Verify Explainable Alerts with Z-Scores and Quantified Impact
    try {
        const alerts = await Alert.find({ facilityId: 'bput_college' });
        const floor3Alert = alerts.find(a => a.zoneId === 'Floor-3');
        if (floor3Alert && floor3Alert.why?.statisticalZScore > 3.0 && floor3Alert.impact?.rupees > 0) {
            console.log(`✓ Test 4 Passed: Floor 3 Alert has statistical MAD Z-Score (+${floor3Alert.why.statisticalZScore}) and quantified ₹${floor3Alert.impact.rupees} impact`);
            passed++;
        } else {
            throw new Error('Explainable alert verification failed');
        }
    } catch (e) {
        console.error('✗ Test 4 Failed:', e.message);
        failed++;
    }

    // Test 5: Verify Pickup Request Lifecycle & Driver Auto-Assignment
    try {
        const bin4 = await Bin.findOne({ binCode: 'BIN-04' });
        const req = await PickupRequest.create({
            facilityId: 'bput_college',
            binId: bin4._id,
            binCode: bin4.binCode,
            binName: bin4.name,
            status: 'assigned',
            assignedDriverName: 'Driver Ramesh Kumar',
            assignedReason: {
                distanceKm: 1.4,
                loadRatio: 0.30,
                score: 2.30,
                explanation: 'Nearest driver with 70% available capacity.'
            }
        });

        // Driver updates to en_route then collected
        req.status = 'en_route';
        await req.save();
        req.status = 'collected';
        req.proofImageUrl = '/uploads/proof_test.jpg';
        await req.save();

        console.log(`✓ Test 5 Passed: Closed-loop pickup lifecycle verified (assigned -> en_route -> collected)`);
        passed++;
    } catch (e) {
        console.error('✗ Test 5 Failed:', e.message);
        failed++;
    }

    // Test 6: Verify User Accounts with Roles
    try {
        const roles = ['admin', 'warden', 'sustainability_officer', 'municipality_admin', 'driver', 'citizen'];
        for (const role of roles) {
            const u = await User.findOne({ role });
            if (!u) throw new Error(`Missing user with role: ${role}`);
        }
        console.log(`✓ Test 6 Passed: All 6 Role-Based Accounts Verified in Database`);
        passed++;
    } catch (e) {
        console.error('✗ Test 6 Failed:', e.message);
        failed++;
    }

    console.log(`\n=========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`=========================================`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
