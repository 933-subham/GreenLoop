import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import facilityConnection from '../config/facilityDb.js';
import { allocateLargestRemainder } from '../controllers/overviewController.js';
import Building from '../models/facility/Building.js';
import Device from '../models/facility/Device.js';
import SensorReading from '../models/facility/SensorReading.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTests = async () => {
    console.log('--- RUNNING PHASE 4 VERIFICATION TESTS (MIX AGGREGATION & PROFILE APIS) ---');

    // 1. Unit Test Largest-Remainder Allocation Method
    const testItems = [
        { name: 'Hostel Block A', value: 333.33 },
        { name: 'Hostel Block B', value: 333.33 },
        { name: 'Academic Block', value: 333.34 }
    ];
    const allocated = allocateLargestRemainder(testItems, 100);
    const sumAllocated = allocated.reduce((acc, it) => acc + it.percent, 0);
    console.log('Allocated percentages:', allocated.map(i => `${i.name}: ${i.percent}%`));
    console.log(`✓ Sum of percentages: ${sumAllocated}% (Expected: exactly 100%)`);
    if (sumAllocated !== 100) throw new Error(`Percentages sum to ${sumAllocated}, not 100!`);

    // Tricky 7-item remainder test
    const trickyItems = [
        { name: 'A', value: 14.28 },
        { name: 'B', value: 14.28 },
        { name: 'C', value: 14.28 },
        { name: 'D', value: 14.28 },
        { name: 'E', value: 14.28 },
        { name: 'F', value: 14.28 },
        { name: 'G', value: 14.32 }
    ];
    const trickyAlloc = allocateLargestRemainder(trickyItems, 100);
    const sumTricky = trickyAlloc.reduce((acc, it) => acc + it.percent, 0);
    if (sumTricky !== 100) throw new Error(`Tricky percentages sum to ${sumTricky}, not 100!`);
    console.log(`✓ Tricky 7-slice remainder sum verified: ${sumTricky}%`);

    // 2. Test "Others" Grouping (< 3%)
    const itemsWithTiny = [
        { name: 'Large 1', value: 70 },
        { name: 'Large 2', value: 25 },
        { name: 'Tiny 1', value: 1.5 },
        { name: 'Tiny 2', value: 1.2 },
        { name: 'Tiny 3', value: 0.8 }
    ];
    const totalVal = itemsWithTiny.reduce((a, b) => a + b.value, 0);
    const filtered = [];
    let othersVal = 0;
    for (const it of itemsWithTiny) {
        if ((it.value / totalVal) * 100 < 3) {
            othersVal += it.value;
        } else {
            filtered.push(it);
        }
    }
    if (othersVal > 0) filtered.push({ name: 'Others', value: othersVal });
    const tinyAlloc = allocateLargestRemainder(filtered, 100);
    const sumTiny = tinyAlloc.reduce((a, b) => a + b.percent, 0);
    if (sumTiny !== 100) throw new Error('Others grouped percentages do not sum to 100');
    const othersSlice = tinyAlloc.find(i => i.name === 'Others');
    if (!othersSlice || othersSlice.percent <= 0) throw new Error('Others slice missing or zero');
    console.log(`✓ Others grouping works: grouped into ${othersSlice.name} with ${othersSlice.percent}%, total sum: ${sumTiny}%`);

    // 3. Test Database Data for 24h Profile & Mix Queries
    if (facilityConnection.readyState !== 1) {
        await new Promise((resolve) => facilityConnection.once('connected', resolve));
    }

    const orgId = 'bput_college';

    // Verify Power Profile query
    const samplePowerReadings = await SensorReading.find({
        orgId,
        deviceId: 'PWR-HA-F4'
    }).sort({ ts: 1 }).limit(24);

    if (samplePowerReadings.length === 0) throw new Error('No readings found for PWR-HA-F4');
    const samplePoint = samplePowerReadings[0];
    if (samplePoint.kw == null || samplePoint.expected == null) {
        throw new Error('Reading missing actual kw or expected baseline');
    }
    console.log(`✓ Power Profile data verified: ${samplePowerReadings.length} points tested, actual=${samplePoint.kw} kW, expected=${samplePoint.expected} kW`);

    // Verify Water Profile query
    const sampleWaterReadings = await SensorReading.find({
        orgId,
        deviceId: 'WTR-HA-T1'
    }).sort({ ts: 1 }).limit(24);
    if (sampleWaterReadings.length === 0) throw new Error('No readings found for WTR-HA-T1');
    const sampleWaterPoint = sampleWaterReadings[0];
    if (sampleWaterPoint.tank_level_pct == null || sampleWaterPoint.flow_lpm == null) {
        throw new Error('Water reading missing tank_level_pct or flow_lpm');
    }
    console.log(`✓ Water Profile data verified: tank_level_pct=${sampleWaterPoint.tank_level_pct}%, flow_lpm=${sampleWaterPoint.flow_lpm}`);

    console.log('🎉 ALL PHASE 4 TESTS PASSED SUCCESSFULLY!');
    await facilityConnection.close();
    process.exit(0);
};

runTests().catch(err => {
    console.error('Phase 4 Test Failure:', err);
    process.exit(1);
});
