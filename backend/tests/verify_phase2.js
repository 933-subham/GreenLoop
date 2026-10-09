import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Device from '../models/Device.js';
import SensorReading from '../models/SensorReading.js';
import Alert from '../models/Alert.js';
import { ingestReadings } from '../controllers/readingController.js';
import { injectSimFault, resetSimFaults } from '../controllers/simController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocity_greenloop';

// Mock express req/res
const createMockRes = () => {
    const res = {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.data = payload; return this; }
    };
    return res;
};

const runPhase2Tests = async () => {
    console.log('--- RUNNING PHASE 2 VERIFICATION TESTS ---');
    await mongoose.connect(MONGO_URI);

    // 1. Test Ingest Unknown Device -> 400
    console.log('Test 1: Unknown deviceId validation...');
    const mockReqUnknown = {
        headers: { 'x-device-token': 'demo-token' },
        body: { deviceId: 'UNKNOWN-XYZ', kw: 10.5 }
    };
    const mockResUnknown = createMockRes();
    await ingestReadings(mockReqUnknown, mockResUnknown);

    if (mockResUnknown.statusCode !== 400 || !mockResUnknown.data.error.includes('Unregistered device')) {
        throw new Error(`Expected 400 Unregistered device, got: ${mockResUnknown.statusCode} ${JSON.stringify(mockResUnknown.data)}`);
    }
    console.log('✓ Unknown device returns 400 { error: "Unregistered device" }');

    // 2. Test Ingest Valid Normal Reading
    console.log('Test 2: Normal reading ingest...');
    const mockReqNormal = {
        headers: { 'x-device-token': 'demo-token' },
        body: { deviceId: 'PWR-HA-F4', kw: 7.1 }
    };
    const mockResNormal = createMockRes();
    await ingestReadings(mockReqNormal, mockResNormal);

    if (mockResNormal.statusCode !== 201 || !mockResNormal.data.success) {
        throw new Error(`Ingest failed: ${mockResNormal.statusCode} ${JSON.stringify(mockResNormal.data)}`);
    }
    const savedNormal = mockResNormal.data.readings[0];
    if (savedNormal.source !== 'live' || savedNormal.kw !== 7.1) {
        throw new Error(`Expected source: 'live' and kw: 7.1, got ${JSON.stringify(savedNormal)}`);
    }
    console.log('✓ Normal reading saved with source:"live", kw:7.1');

    // Check device lastSeen was updated
    const devAfter = await Device.findOne({ deviceId: 'PWR-HA-F4' });
    if (!devAfter.lastSeen || (Date.now() - new Date(devAfter.lastSeen).getTime()) > 5000) {
        throw new Error('Device lastSeen was not updated!');
    }
    console.log(`✓ Device PWR-HA-F4 lastSeen updated to: ${devAfter.lastSeen.toISOString()}`);

    // 3. Test Fault Injection on PWR-HA-F4
    console.log('Test 3: Power Fault Injection on PWR-HA-F4...');
    const mockReqFaultPower = {
        body: { deviceId: 'PWR-HA-F4', multiplier: 4.5, count: 3 }
    };
    const mockResFaultPower = createMockRes();
    await injectSimFault(mockReqFaultPower, mockResFaultPower);

    if (mockResFaultPower.statusCode !== 201 || !mockResFaultPower.data.success) {
        throw new Error(`Fault injection failed: ${JSON.stringify(mockResFaultPower.data)}`);
    }
    if (mockResFaultPower.data.alertsCreated.length === 0) {
        throw new Error('Power fault failed to generate an alert!');
    }
    const powerAlert = mockResFaultPower.data.alertsCreated[0];
    console.log(`✓ Power Surge Alert created: ${powerAlert.title}`);
    console.log(`  Sensor ID: ${powerAlert.deviceId}, Floor: ${powerAlert.floor}`);
    console.log(`  Why: ${powerAlert.whyText}`);
    console.log(`  Action: ${powerAlert.suggestedAction}`);

    if (!powerAlert.whyText.includes('PWR-HA-F4') || powerAlert.floor !== 4) {
        throw new Error('Alert whyText missing sensor ID or floor!');
    }

    // 4. Test Water Night Leak on WTR-HA-T1 with atHour: 2
    console.log('Test 4: Water Night Leak Injection on WTR-HA-T1 (atHour: 2)...');
    const mockReqFaultWater = {
        body: { deviceId: 'WTR-HA-T1', mode: 'night_leak', atHour: 2 }
    };
    const mockResFaultWater = createMockRes();
    await injectSimFault(mockReqFaultWater, mockResFaultWater);

    if (mockResFaultWater.statusCode !== 201 || !mockResFaultWater.data.success) {
        throw new Error(`Water fault failed: ${JSON.stringify(mockResFaultWater.data)}`);
    }
    const waterAlert = await Alert.findOne({ deviceId: 'WTR-HA-T1', status: 'open' });
    if (!waterAlert) {
        throw new Error('Water leak alert not found in MongoDB!');
    }
    console.log(`✓ Water Leak Alert created: ${waterAlert.title}`);
    console.log(`  Sensor ID: ${waterAlert.deviceId}, Severity: ${waterAlert.severity}`);
    console.log(`  Why: ${waterAlert.whyText}`);

    // 5. Test Reset Endpoint (/api/sim/reset)
    console.log('Test 5: Fault Reset (/api/sim/reset)...');
    const mockResReset = createMockRes();
    await resetSimFaults({}, mockResReset);

    const faultsLeft = await SensorReading.countDocuments({ source: 'simulated-fault' });
    const alertsLeft = await Alert.countDocuments({ status: 'open' });

    if (faultsLeft !== 0 || alertsLeft !== 0) {
        throw new Error(`Reset incomplete: ${faultsLeft} faults and ${alertsLeft} open alerts remaining!`);
    }
    console.log(`✓ Reset cleared all simulated-fault readings (${mockResReset.data.deletedReadingsCount}) and open alerts (${mockResReset.data.deletedAlertsCount})`);

    console.log('🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
    await mongoose.disconnect();
    process.exit(0);
};

runPhase2Tests().catch(err => {
    console.error('❌ Phase 2 test failed:', err);
    process.exit(1);
});
