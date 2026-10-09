import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Building from '../models/Building.js';
import Device from '../models/Device.js';
import SensorReading from '../models/SensorReading.js';
import { addBuilding, addDevice } from '../controllers/facilitySetupController.js';
import { getPowerOverview } from '../controllers/overviewController.js';
import { ingestReadings } from '../controllers/readingController.js';
import { getLogStatus, downloadLogs } from '../controllers/logController.js';
import { appendLogCopy } from '../services/logCopyService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocity_greenloop';

const createMockRes = () => {
    let headers = {};
    let written = '';
    const res = {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.data = payload; return this; },
        setHeader(k, v) { headers[k] = v; },
        write(chunk) { written += chunk; },
        end(chunk) { if (chunk) written += chunk; this.body = written; this.headers = headers; }
    };
    return res;
};

const runPhase5Tests = async () => {
    console.log('--- RUNNING PHASE 5 VERIFICATION TESTS ---');
    await mongoose.connect(MONGO_URI);

    // 1. Add "Library" building with 2 floors
    console.log('Test 1: Adding "Library" building with 2 floors...');
    const bReq = { body: { name: 'Central Library', floors: 2, type: 'academic', orgId: 'bput_college' } };
    const bRes = createMockRes();
    await addBuilding(bReq, bRes);

    const libBuilding = bRes.data;
    if (!libBuilding || !libBuilding._id || !libBuilding.code) {
        throw new Error(`Failed to create library building: ${JSON.stringify(libBuilding)}`);
    }
    console.log(`✓ Created building: ${libBuilding.name} (Code: ${libBuilding.code})`);

    // 2. Add power sensor for Library Floor 1
    console.log('Test 2: Adding power sensor to Library Floor 1...');
    const dReq = { body: { buildingId: libBuilding._id.toString(), floor: 1, type: 'power', orgId: 'bput_college' } };
    const dRes = createMockRes();
    await addDevice(dReq, dRes);

    const newSensor = dRes.data;
    if (!newSensor?.success || !newSensor?.deviceId) {
        throw new Error(`Failed to create device: ${JSON.stringify(newSensor)}`);
    }
    console.log(`✓ Auto-generated sensor: ${newSensor.deviceId}`);
    console.log(`  Sample Postman body: ${JSON.stringify(newSensor.samplePostman.body)}`);

    // 3. Verify new building appears as a bar in Campus Power Overview
    console.log('Test 3: Checking if new building appears on Campus Overview chart...');
    const ovReq = { query: { level: 'campus', metric: 'kwh', orgId: 'bput_college' } };
    const ovRes = createMockRes();
    await getPowerOverview(ovReq, ovRes);

    const foundBar = ovRes.data.find(b => b.code === libBuilding.code);
    if (!foundBar) {
        throw new Error(`New building ${libBuilding.code} not found in campus overview bars: ${JSON.stringify(ovRes.data)}`);
    }
    console.log(`✓ New building appeared on campus overview: ${foundBar.label} (Code: ${foundBar.id})`);

    // 4. Ingest reading for new sensor
    console.log(`Test 4: Ingesting live reading for new sensor ${newSensor.deviceId}...`);
    const ingReq = {
        headers: { 'x-device-token': 'demo-token' },
        body: { deviceId: newSensor.deviceId, kw: 9.8 }
    };
    const ingRes = createMockRes();
    await ingestReadings(ingReq, ingRes);

    if (ingRes.statusCode !== 201) {
        throw new Error(`Ingest failed for new sensor: ${JSON.stringify(ingRes.data)}`);
    }
    console.log(`✓ Ingested reading for ${newSensor.deviceId}: kw=9.8`);

    // 5. Verify multi-tenancy: another organization CANNOT see this building or sensor
    console.log('Test 5: Verifying multi-tenancy isolation for another org (other_hospital)...');
    const otherReq = { query: { level: 'campus', metric: 'kwh', orgId: 'other_hospital' } };
    const otherRes = createMockRes();
    await getPowerOverview(otherReq, otherRes);

    const leak = otherRes.data.find(b => b.code === libBuilding.code);
    if (leak) {
        throw new Error(`Multi-tenancy violation! Other org can see building: ${JSON.stringify(leak)}`);
    }
    console.log('✓ Multi-tenancy isolation confirmed: other org sees 0 data from bput_college');

    // 6. Test CSV Logs Status and Streaming Download
    console.log('Test 6: Testing Logs Status & Streaming CSV Export...');
    const statRes = createMockRes();
    await getLogStatus({ query: { orgId: 'bput_college' } }, statRes);
    console.log(`✓ Log status: total=${statRes.data.count}, power=${statRes.data.powerCount}, water=${statRes.data.waterCount}`);

    // Download Power CSV
    const csvPowerRes = createMockRes();
    await downloadLogs({ query: { type: 'power', orgId: 'bput_college' } }, csvPowerRes);
    // Wait briefly for stream cursor to complete
    await new Promise(r => setTimeout(r, 600));

    if (!csvPowerRes.body || !csvPowerRes.body.startsWith('ts,deviceId,building,floor,zone,source,kw')) {
        throw new Error(`Invalid Power CSV header: ${csvPowerRes.body?.slice(0, 80)}`);
    }
    const lines = csvPowerRes.body.trim().split('\n');
    console.log(`✓ Power CSV generated with valid header and ${lines.length - 1} rows streamed`);

    // 7. Test LOG_COPY=true functionality
    console.log('Test 7: Testing optional LOG_COPY file append...');
    process.env.LOG_COPY = 'true';
    appendLogCopy({
        ts: new Date(),
        deviceId: 'TEST-LOG-COPY',
        type: 'power',
        buildingId: 'HA',
        floor: 1,
        zone: 'Test Zone',
        source: 'live',
        kw: 11.2
    });
    // Wait for file flush
    await new Promise(r => setTimeout(r, 200));
    const logFilePath = path.join(__dirname, '../data/logs/live_copy.csv');
    if (!fs.existsSync(logFilePath)) {
        throw new Error(`Expected live_copy.csv file at ${logFilePath}`);
    }
    const copyContent = fs.readFileSync(logFilePath, 'utf8');
    if (!copyContent.includes('TEST-LOG-COPY')) {
        throw new Error('TEST-LOG-COPY not found in live_copy.csv');
    }
    console.log('✓ LOG_COPY=true successfully wrote to data/logs/live_copy.csv');

    // Clean up temporary library building and sensor from test
    await Device.deleteMany({ deviceId: newSensor.deviceId });
    await Building.deleteOne({ _id: libBuilding._id });
    await SensorReading.deleteMany({ deviceId: newSensor.deviceId });

    console.log('🎉 ALL PHASE 5 TESTS PASSED SUCCESSFULLY!');
    await mongoose.disconnect();
};

runPhase5Tests().catch(err => {
    console.error('Phase 5 Test Failure:', err);
    process.exit(1);
});
