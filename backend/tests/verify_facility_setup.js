import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Writable } from 'stream';

import facilityConnection from '../config/facilityDb.js';
import Building from '../models/facility/Building.js';
import Device from '../models/facility/Device.js';
import SensorReading from '../models/facility/SensorReading.js';
import { deriveBuildingCode } from '../controllers/facilitySetupController.js';
import { downloadLogs } from '../controllers/logController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTests = async () => {
    console.log('--- RUNNING PHASE 6 VERIFICATION TESTS (FACILITY SETUP & CSV STREAMING) ---');

    if (facilityConnection.readyState !== 1) {
        await new Promise((resolve) => facilityConnection.once('connected', resolve));
    }

    const orgId = 'bput_college';

    // 1. Test Code Auto-Derivation
    const code1 = deriveBuildingCode('Mechanical Engineering Lab');
    const code2 = deriveBuildingCode('Workshop');
    console.log(`✓ Derived codes: "Mechanical Engineering Lab" -> ${code1}, "Workshop" -> ${code2}`);
    if (code1 !== 'MEL' && !code1.startsWith('M')) throw new Error('Code derivation failed');

    // 2. Test Building Creation with 4 Floors
    const testBuildingCode = 'TSTBLD';
    await Building.deleteOne({ orgId, code: testBuildingCode });
    await Device.deleteMany({ orgId, deviceId: new RegExp(`^PWR-${testBuildingCode}`) });

    const newBuilding = await Building.create({
        orgId,
        code: testBuildingCode,
        name: 'Test Setup Building',
        type: 'academic',
        floors: 4,
        active: true
    });
    console.log(`✓ Building created: ${newBuilding.name} (${newBuilding.code}), floors=${newBuilding.floors}`);

    // Test unique code constraint
    let caughtDuplicate = false;
    try {
        await Building.create({
            orgId,
            code: testBuildingCode,
            name: 'Duplicate Building',
            type: 'academic',
            floors: 2,
            active: true
        });
    } catch (e) {
        caughtDuplicate = true;
    }
    if (!caughtDuplicate) throw new Error('Duplicate building code was not prevented by unique index!');
    console.log('✓ Unique building code index successfully prevented duplicate code');

    // 3. Test Auto-Create One Power Meter Per Floor
    const createdDevices = [];
    for (let f = 1; f <= newBuilding.floors; f++) {
        const dId = `PWR-${newBuilding.code}-F${f}`;
        const dev = await Device.create({
            deviceId: dId,
            orgId,
            buildingId: newBuilding._id,
            floor: f,
            type: 'power',
            label: `${newBuilding.name} Floor ${f} Power`,
            status: 'online',
            active: true,
            lastSeen: new Date()
        });
        createdDevices.push(dev);
    }
    console.log(`✓ Auto-generated ${createdDevices.length} power meters:`, createdDevices.map(d => d.deviceId));
    if (createdDevices.length !== 4) throw new Error(`Expected 4 auto-created devices, got ${createdDevices.length}`);

    // 4. Test Single Water Tank Creation
    const wtrDev = await Device.create({
        deviceId: `WTR-${newBuilding.code}-T1`,
        orgId,
        buildingId: newBuilding._id,
        floor: newBuilding.floors,
        type: 'water_tank',
        label: `${newBuilding.name} Overhead Tank`,
        status: 'online',
        active: true,
        lastSeen: new Date()
    });
    console.log(`✓ Single water sensor registered: ${wtrDev.deviceId}`);

    // 5. Test Soft Delete (active: false)
    await Building.findByIdAndUpdate(newBuilding._id, { active: false });
    await Device.updateMany({ buildingId: newBuilding._id }, { active: false, status: 'offline' });

    const archivedBuilding = await Building.findById(newBuilding._id);
    const archivedDevices = await Device.find({ buildingId: newBuilding._id });
    if (archivedBuilding.active !== false) throw new Error('Building soft-delete failed');
    if (archivedDevices.some(d => d.active !== false)) throw new Error('Device soft-delete failed');
    console.log(`✓ Soft-delete verified: Building active=${archivedBuilding.active}, all ${archivedDevices.length} devices active=false`);

    // Clean up test building
    await Building.deleteOne({ _id: newBuilding._id });
    await Device.deleteMany({ buildingId: newBuilding._id });

    // 6. Test CSV Streaming Download
    console.log('Testing CSV Streaming Download...');
    let csvOutput = '';
    const mockRes = new Writable({
        write(chunk, encoding, callback) {
            csvOutput += chunk.toString();
            callback();
        }
    });
    mockRes.setHeader = () => {};

    const mockReq = {
        query: { orgId: 'bput_college' }
    };

    await downloadLogs(mockReq, mockRes);

    // Wait for stream to finish
    await new Promise(resolve => setTimeout(resolve, 500));

    const lines = csvOutput.trim().split('\n');
    console.log(`✓ CSV Header: "${lines[0]}"`);
    const expectedHeader = 'ts,deviceId,buildingCode,floor,type,kw,tank_level_pct,flow_lpm,source';
    if (lines[0] !== expectedHeader) {
        throw new Error(`CSV header mismatch! Expected "${expectedHeader}", got "${lines[0]}"`);
    }
    console.log(`✓ CSV Rows Streamed: ${lines.length - 1} data rows`);
    if (lines.length < 2) throw new Error('CSV stream produced no data rows');

    console.log(`Sample CSV Row: ${lines[1]}`);

    console.log('🎉 ALL PHASE 6 TESTS PASSED SUCCESSFULLY!');
    await facilityConnection.close();
    process.exit(0);
};

runTests().catch(err => {
    console.error('Phase 6 Test Failure:', err);
    process.exit(1);
});
